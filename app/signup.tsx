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
    ScrollView,
    Image,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, ArrowRight, Phone, MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import StatusBanner from '@/components/StatusBanner';

export default function SignupScreen() {
    const { width: windowWidth } = useWindowDimensions();
    const isLargeScreen = windowWidth >= 768;

    const router = useRouter();
    const { signUp } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    // Split Address Fields
    const [houseDetails, setHouseDetails] = useState('');
    const [landmark, setLandmark] = useState('');
    const [place, setPlace] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('Kerala'); // Default state
    const [pincode, setPincode] = useState('');

    // const [address, setAddress] = useState(''); // Removed simple address state
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Banner State
    const [bannerVisible, setBannerVisible] = useState(false);
    const [bannerType, setBannerType] = useState<'success' | 'error'>('success');
    const [bannerMessage, setBannerMessage] = useState('');

    const handleSignup = async () => {
        if (!name || !email || !password || !phone || !houseDetails || !landmark || !place || !city || !pincode) {
            showBanner('error', 'Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            showBanner('error', 'Passwords do not match.');
            return;
        }

        setIsLoading(true);
        // Combine address fields
        const formattedAddress = `${houseDetails}, ${landmark}, ${place}, ${city}, ${state} - ${pincode}`;

        try {
            await signUp(email, password, name, phone, formattedAddress, true); // Silent sign-up
            showBanner('success', 'Account created successfully!');
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 1500);
        } catch (e: any) {
            let msg = "Failed to sign up.";
            if (e.code === 'auth/email-already-in-use') msg = "Email already in use.";
            if (e.code === 'auth/weak-password') msg = "Password is too weak.";
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
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        isLargeScreen && { maxWidth: 450, alignSelf: 'center', width: '100%', paddingVertical: 40 }
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
                    <Text style={styles.tagline}>Create Your Account</Text>

                    <View style={styles.form}>
                        <Text style={styles.header}>Sign Up</Text>

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
                            <Phone size={20} color={Colors.extrared} />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                placeholderTextColor={Colors.extrared}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Split Address Inputs */}
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

                        <View style={styles.inputContainer}>
                            <Lock size={20} color={Colors.extrared} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                placeholderTextColor={Colors.extrared}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>


                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleSignup}
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
