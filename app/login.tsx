import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    useWindowDimensions,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, ArrowRight, Smartphone, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import StatusBanner from '@/components/StatusBanner';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import OTPInput from '@/components/OTPInput';

export default function LoginScreen() {
    const { width: windowWidth } = useWindowDimensions();
    const isLargeScreen = windowWidth >= 768;

    const router = useRouter();
    const { signInWithPhone, confirmCode } = useAuth();
    
    const [phoneNumber, setPhoneNumber] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

    // Banner State
    const [bannerVisible, setBannerVisible] = useState(false);
    const [bannerType, setBannerType] = useState<'success' | 'error'>('success');
    const [bannerMessage, setBannerMessage] = useState('');

    useEffect(() => {
        if (Platform.OS === 'web') {
            // Workaround for reCAPTCHA state issues on live websites: force a reload every time the user visits
            const hasReloaded = sessionStorage.getItem('login_reloaded');
            if (!hasReloaded) {
                sessionStorage.setItem('login_reloaded', 'true');
                window.location.reload();
                return;
            }

            const initRecaptcha = () => {
                try {
                    console.log("[Login] Initializing RecaptchaVerifier on 'recaptcha-container'...");
                    if (!recaptchaVerifier.current) {
                        recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                            size: 'normal',
                            callback: () => {
                                console.log("[Login] Recaptcha solved!");
                            }
                        });
                        recaptchaVerifier.current.render();
                    }
                } catch (e) {
                    console.error("[Login] Recaptcha Error:", e);
                }
            };

            // Delay to ensure the container is in the DOM
            const timer = setTimeout(initRecaptcha, 1000);
            return () => {
                clearTimeout(timer);
                sessionStorage.removeItem('login_reloaded');
            };
        }
    }, []);

    const handleSendOTP = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            showBanner('error', 'Please enter a valid 10-digit phone number.');
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = `+91${phoneNumber}`;
            
            if (!recaptchaVerifier.current && Platform.OS === 'web') {
                showBanner('error', 'Authentication system is still loading. Please wait a second.');
                setIsLoading(false);
                return;
            }

            const result = await signInWithPhone(formattedPhone, recaptchaVerifier.current!);
            setConfirmationResult(result);
            setStep('otp');
            showBanner('success', 'OTP sent to your phone.');
        } catch (e: any) {
            console.error(e);
            if (e.message?.includes('recaptcha')) {
                showBanner('error', 'Please solve the Recaptcha first.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (otpCode: string) => {
        if (!confirmationResult) return;

        setIsLoading(true);
        try {
            await confirmCode(confirmationResult, otpCode);
            showBanner('success', 'Logged in successfully!');
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 1500);
        } catch (e: any) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const showBanner = (type: 'success' | 'error', message: string) => {
        setBannerType(type);
        setBannerMessage(message);
        setBannerVisible(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBanner
                visible={bannerVisible}
                type={bannerType}
                message={bannerMessage}
                onClose={() => setBannerVisible(false)}
            />
            
            {/* Recaptcha container is now managed dynamically in document.body */}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={[styles.content, isLargeScreen && { maxWidth: 450, alignSelf: 'center', width: '100%', paddingVertical: 40 }]}>
                    <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
                    <Text style={styles.tagline}>Fresh Meat, Delivered.</Text>

                    <View style={styles.form}>
                        {step === 'phone' ? (
                            <>
                                <Text style={styles.header}>Welcome Back</Text>
                                <Text style={styles.subheader}>Enter your phone number to continue</Text>

                                {/* RECAPTCHA CONTAINER */}
                                {Platform.OS === 'web' && (
                                    <View 
                                        nativeID="recaptcha-container" 
                                        style={{ minHeight: 80, marginVertical: 10, alignItems: 'center', justifyContent: 'center' }} 
                                    />
                                )}

                                <View style={styles.inputContainer}>
                                    <Text style={styles.countryCode}>+91</Text>
                                    <View style={styles.verticalDivider} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Phone Number"
                                        placeholderTextColor={Colors.extrared}
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        autoFocus
                                    />
                                </View>

                                <TouchableOpacity
                                    style={styles.loginButton}
                                    onPress={handleSendOTP}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={Colors.white} />
                                    ) : (
                                        <>
                                            <Text style={styles.loginButtonText}>Send OTP</Text>
                                            <ArrowRight size={20} color={Colors.white} />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.backButton} onPress={() => setStep('phone')}>
                                    <ChevronLeft size={20} color={Colors.charcoal} />
                                    <Text style={styles.backText}>Back</Text>
                                </TouchableOpacity>

                                <Text style={styles.header}>Verify Phone</Text>
                                <Text style={styles.subheader}>Enter the 6-digit code sent to +91 {phoneNumber}</Text>

                                <OTPInput 
                                    length={6} 
                                    onComplete={handleVerifyOTP} 
                                    isLoading={isLoading} 
                                />

                                {isLoading && <ActivityIndicator color={Colors.orange} style={{ marginTop: 10 }} />}

                                <TouchableOpacity 
                                    style={styles.resendButton} 
                                    onPress={handleSendOTP}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.resendText}>Didn't receive the code? <Text style={styles.resendLink}>Resend</Text></Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account?</Text>
                            <TouchableOpacity onPress={() => router.push('/signup')}>
                                <Text style={styles.linkText}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.deepTeal,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    logo: {
        width: 180,
        height: 100,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: 20,
        marginTop: 20,
    },
    tagline: {
        fontSize: 16,
        color: Colors.creamLight,
        textAlign: 'center',
        marginBottom: 48,
    },
    form: {
        backgroundColor: Colors.white,
        padding: 24,
        borderRadius: 24,
        gap: 16,
        shadowColor: Colors.charcoal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.charcoal,
    },
    subheader: {
        fontSize: 14,
        color: Colors.charcoal,
        opacity: 0.6,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.creamLight,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        gap: 12,
    },
    countryCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.charcoal,
    },
    verticalDivider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.charcoal,
        opacity: 0.1,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.charcoal,
        // @ts-ignore - outlineStyle is a web-only property
        outlineStyle: 'none',
    } as any,
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.orange,
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        marginTop: 8,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    backText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.charcoal,
    },
    resendButton: {
        alignItems: 'center',
        marginTop: 8,
    },
    resendText: {
        fontSize: 14,
        color: Colors.charcoal,
        opacity: 0.7,
    },
    resendLink: {
        color: Colors.orange,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: 8,
    },
    footerText: {
        fontSize: 14,
        color: Colors.extrared,
    },
    linkText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.orange,
    },
});
