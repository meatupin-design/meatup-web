import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import StatusBanner from '@/components/StatusBanner';
export default function LoginScreen() {
    const { width: windowWidth } = useWindowDimensions();
    const isLargeScreen = windowWidth >= 768;

    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Banner State
    const [bannerVisible, setBannerVisible] = useState(false);
    const [bannerType, setBannerType] = useState<'success' | 'error'>('success');
    const [bannerMessage, setBannerMessage] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            showBanner('error', 'Please enter both email and password.');
            return;
        }
        setIsLoading(true);
        try {
            await signIn(email, password, true); // Silent sign-in
            showBanner('success', 'Logged in successfully');

            // Delay navigation slightly to let user see the success banner
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 1500);
        } catch (e: any) {
            let msg = "Failed to sign in.";
            if (e.code === 'auth/invalid-credential') msg = "Invalid email or password.";
            if (e.code === 'auth/invalid-email') msg = "Invalid email address.";
            showBanner('error', msg);
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
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={[styles.content, isLargeScreen && { maxWidth: 450, alignSelf: 'center', width: '100%', paddingVertical: 40 }]}>
                    <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
                    <Text style={styles.tagline}>Fresh Meat, Delivered.</Text>

                    <View style={styles.form}>
                        <Text style={styles.header}>Welcome Back</Text>

                        <View style={styles.inputContainer}>
                            <Mail size={20} color={Colors.extrared} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                placeholderTextColor={Colors.extrared}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Lock size={20} color={Colors.extrared} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={Colors.extrared}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <>
                                    <Text style={styles.loginButtonText}>Sign In</Text>
                                    <ArrowRight size={20} color={Colors.white} />
                                </>
                            )}
                        </TouchableOpacity>

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
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.creamLight,
    },
    dividerText: {
        fontSize: 14,
        color: Colors.extrared,
        fontWeight: 'bold',
    },
    socialButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.white,
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
