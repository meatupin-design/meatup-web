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
    ScrollView,
    Image,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, ArrowRight, Phone, MapPin, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import StatusBanner from '@/components/StatusBanner';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import OTPInput from '@/components/OTPInput';

export default function SignupScreen() {
    const { width: windowWidth } = useWindowDimensions();
    const isLargeScreen = windowWidth >= 768;

    const router = useRouter();
    const { user, signInWithPhone, createProfile } = useAuth();
    
    // Auth Flow State
    const [step, setStep] = useState<'phone' | 'otp' | 'details'>('phone');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

    // Profile State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    
    // Address Fields
    const [houseDetails, setHouseDetails] = useState('');
    const [landmark, setLandmark] = useState('');
    const [place, setPlace] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('Kerala');
    const [pincode, setPincode] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    // Banner State
    const [bannerVisible, setBannerVisible] = useState(false);
    const [bannerType, setBannerType] = useState<'success' | 'error'>('success');
    const [bannerMessage, setBannerMessage] = useState('');

    useEffect(() => {
        if (Platform.OS === 'web') {
            // Workaround for reCAPTCHA state issues on live websites: force a one-time reload
            const hasReloaded = sessionStorage.getItem('signup_reloaded');
            if (!hasReloaded) {
                sessionStorage.setItem('signup_reloaded', 'true');
                window.location.reload();
                return;
            }

            const initRecaptcha = () => {
                try {
                    const container = document.getElementById('recaptcha-container');
                    if (!container) {
                        // DOM not ready yet, retry in a bit
                        setTimeout(initRecaptcha, 200);
                        return;
                    }

                    if (!recaptchaVerifier.current) {
                        console.log("[Signup] Initializing RecaptchaVerifier...");
                        recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                            size: 'normal',
                        });
                        recaptchaVerifier.current.render();
                    }
                } catch (e) {
                    console.error("Recaptcha Init Error", e);
                }
            };

            const timer = setTimeout(initRecaptcha, 500);
            return () => {
                clearTimeout(timer);
                // Clear the flag when the user navigates away, so it reloads again next time they visit
                sessionStorage.removeItem('signup_reloaded');
            };
        }
    }, []);

    const handleSendOTP = async () => {
        if (!phone || phone.length < 10) {
            showBanner('error', 'Please enter a valid 10-digit phone number.');
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = `+91${phone}`;
            
            if (!recaptchaVerifier.current && Platform.OS === 'web') {
                showBanner('error', 'System loading. Please wait.');
                setIsLoading(false);
                return;
            }

            const result = await signInWithPhone(formattedPhone, recaptchaVerifier.current!);
            setConfirmationResult(result);
            setStep('otp');
            showBanner('success', 'OTP sent to your phone.');
        } catch (e: any) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (otpCode: string) => {
        if (!confirmationResult) return;

        setIsLoading(true);
        try {
            const result = await confirmationResult.confirm(otpCode);
            if (result.user) {
                // Phone verified.
                setStep('details');
                showBanner('success', 'Phone verified! Please complete your profile.');
            }
        } catch (e: any) {
            showBanner('error', 'Invalid verification code.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteSignup = async () => {
        if (!name || !houseDetails || !landmark || !place || !city || !pincode) {
            showBanner('error', 'Please fill in all required fields.');
            return;
        }

        if (!user) return;

        setIsLoading(true);
        const formattedAddress = `${houseDetails}, ${landmark}, ${place}, ${city}, ${state} - ${pincode}`;

        try {
            await createProfile(user.uid, {
                name,
                email,
                phone: user.phoneNumber || `+91${phone}`,
                address: formattedAddress
            });
            showBanner('success', 'Account created successfully!');
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 1500);
        } catch (e: any) {
            console.error(e);
            showBanner('error', 'Failed to create profile.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Actually, I'll update AuthContext.tsx to allow separate verification and profile creation.
    // But for now, let's just make the UI work.

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
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        isLargeScreen && { maxWidth: 450, alignSelf: 'center', width: '100%', paddingVertical: 40 }
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
                    
                    <View style={styles.form}>
                        {step === 'phone' && (
                            <>
                                <Text style={styles.header}>Sign Up</Text>
                                <Text style={styles.subheader}>Enter your phone number to start</Text>

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
                                        value={phone}
                                        onChangeText={setPhone}
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
                        )}

                        {step === 'otp' && (
                            <>
                                <TouchableOpacity style={styles.backButton} onPress={() => setStep('phone')}>
                                    <ChevronLeft size={20} color={Colors.charcoal} />
                                    <Text style={styles.backText}>Back</Text>
                                </TouchableOpacity>

                                <Text style={styles.header}>Verify Phone</Text>
                                <Text style={styles.subheader}>Enter the 6-digit code sent to +91 {phone}</Text>

                                <OTPInput 
                                    length={6} 
                                    onComplete={handleVerifyOTP} 
                                    isLoading={isLoading} 
                                />

                                {isLoading && <ActivityIndicator color={Colors.orange} style={{ marginTop: 10 }} />}
                            </>
                        )}

                        {step === 'details' && (
                            <>
                                <Text style={styles.header}>Complete Profile</Text>
                                <Text style={styles.subheader}>Just a few more details to get started</Text>

                                <View style={styles.inputContainer}>
                                    <User size={20} color={Colors.extrared} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Full Name"
                                        placeholderTextColor={Colors.extrared}
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Mail size={20} color={Colors.extrared} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email Address (Optional)"
                                        placeholderTextColor={Colors.extrared}
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>

                                <Text style={styles.sectionHeader}>Address Details</Text>

                                <View style={styles.inputContainer}>
                                    <MapPin size={20} color={Colors.extrared} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="House No. & Name"
                                        placeholderTextColor={Colors.extrared}
                                        value={houseDetails}
                                        onChangeText={setHouseDetails}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <MapPin size={20} color={Colors.extrared} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Landmark"
                                        placeholderTextColor={Colors.extrared}
                                        value={landmark}
                                        onChangeText={setLandmark}
                                    />
                                </View>

                                <View style={styles.rowContainer}>
                                    <View style={[styles.inputContainer, { flex: 1 }]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Place/Area"
                                            placeholderTextColor={Colors.extrared}
                                            value={place}
                                            onChangeText={setPlace}
                                        />
                                    </View>
                                    <View style={[styles.inputContainer, { flex: 1 }]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="City"
                                            placeholderTextColor={Colors.extrared}
                                            value={city}
                                            onChangeText={setCity}
                                        />
                                    </View>
                                </View>

                                <View style={styles.rowContainer}>
                                    <View style={[styles.inputContainer, { flex: 1 }]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="State"
                                            placeholderTextColor={Colors.extrared}
                                            value={state}
                                            onChangeText={setState}
                                        />
                                    </View>
                                    <View style={[styles.inputContainer, { flex: 1 }]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Pincode"
                                            placeholderTextColor={Colors.extrared}
                                            value={pincode}
                                            onChangeText={setPincode}
                                            keyboardType="numeric"
                                            maxLength={6}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.loginButton}
                                    onPress={handleCompleteSignup}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={Colors.white} />
                                    ) : (
                                        <>
                                            <Text style={styles.loginButtonText}>Create Account</Text>
                                            <ArrowRight size={20} color={Colors.white} />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account?</Text>
                            <TouchableOpacity onPress={() => router.push('/login')}>
                                <Text style={styles.linkText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView >
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
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    logo: {
        width: 180,
        height: 100,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: 20,
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
    rowContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.charcoal,
        marginTop: 8,
        marginBottom: 4,
    },
});
