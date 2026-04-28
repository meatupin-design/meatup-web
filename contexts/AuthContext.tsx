import createContextHook from '@nkzw/create-context-hook';
import {
    Auth,
    onAuthStateChanged,
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    ConfirmationResult
} from 'firebase/auth';
import { useState, useEffect } from 'react';
import { auth } from '@/config/firebaseConfig';
import { Alert } from 'react-native';
import { UserService } from '@/services/UserService';
import { UserProfile } from '@/types';

interface AuthState {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, pass: string, silent?: boolean) => Promise<void>;
    signUp: (email: string, pass: string, name: string, phone: string, address: string, silent?: boolean) => Promise<void>;
    signInWithPhone: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
    confirmCode: (confirmationResult: ConfirmationResult, code: string, userData?: Partial<UserProfile>) => Promise<void>;
    createProfile: (uid: string, userData: Partial<UserProfile>) => Promise<UserProfile>;
    logout: (silent?: boolean) => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen for authentication state changes
        const unsubscribe = onAuthStateChanged(auth, async (usr) => {
            console.log("[AuthContext] User state changed:", usr ? usr.uid : "No user");
            setUser(usr);
            if (usr) {
                const profile = await UserService.getUser(usr.uid);
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signIn = async (email: string, pass: string, silent: boolean = false) => {
        try {
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            console.error("[AuthContext] SignIn Error:", error);
            if (!silent) {
                let msg = "Failed to sign in.";
                if (error.code === 'auth/invalid-credential') msg = "Invalid email or password.";
                if (error.code === 'auth/invalid-email') msg = "Invalid email address.";
                Alert.alert("Login Error", msg);
            }
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, pass: string, name: string, phone: string, address: string, silent: boolean = false) => {
        try {
            setLoading(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);

            // Update display name
            if (userCredential.user) {
                await updateProfile(userCredential.user, {
                    displayName: name
                });

                // Create User Profile in Firestore
                const newProfile = await UserService.createUser(userCredential.user.uid, {
                    name: name,
                    email: email,
                    phone: phone,
                    address: address,
                    is_first_order_completed: false,
                    wallet_points: 0
                });

                // Force refresh user to get display name
                setUser({ ...userCredential.user, displayName: name });
                setUserProfile(newProfile);
            }
        } catch (error: any) {
            console.error("[AuthContext] SignUp Error:", error);
            if (!silent) {
                let msg = "Failed to sign up.";
                if (error.code === 'auth/email-already-in-use') msg = "Email already in use.";
                if (error.code === 'auth/weak-password') msg = "Password is too weak.";
                Alert.alert("Signup Error", msg);
            }
            throw error;
        } finally {
            setLoading(false);
        }
    };



    const signInWithPhone = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
        try {
            setLoading(true);
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
            return confirmationResult;
        } catch (error: any) {
            console.error("[AuthContext] Phone SignIn Error:", error);
            let msg = "Failed to send OTP.";
            if (error.code === 'auth/invalid-phone-number') msg = "Invalid phone number.";
            if (error.code === 'auth/too-many-requests') msg = "Too many requests. Try again later.";
            Alert.alert("Error", msg);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const confirmCode = async (confirmationResult: ConfirmationResult, code: string, userData?: Partial<UserProfile>) => {
        try {
            setLoading(true);
            const result = await confirmationResult.confirm(code);
            const usr = result.user;

            if (usr) {
                // Check if user profile exists
                let profile = await UserService.getUser(usr.uid);
                
                if (!profile && userData) {
                    // Create new profile for first-time phone user
                    profile = await UserService.createUser(usr.uid, {
                        name: userData.name || 'User',
                        phone: usr.phoneNumber || userData.phone || '',
                        email: userData.email || '',
                        address: userData.address || '',
                        is_first_order_completed: false,
                        wallet_points: 0,
                        created_at: Date.now()
                    });
                }
                
                setUser(usr);
                setUserProfile(profile);
            }
        } catch (error: any) {
            console.error("[AuthContext] OTP Verification Error:", error);
            let msg = "Invalid verification code.";
            if (error.code === 'auth/code-expired') msg = "Verification code has expired.";
            Alert.alert("Verification Error", msg);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const createProfile = async (uid: string, userData: Partial<UserProfile>) => {
        try {
            setLoading(true);
            const profile = await UserService.createUser(uid, {
                name: userData.name || 'User',
                phone: userData.phone || '',
                email: userData.email || '',
                address: userData.address || '',
                is_first_order_completed: false,
                wallet_points: 0,
                created_at: Date.now(),
                ...userData
            });
            setUserProfile(profile);
            return profile;
        } catch (error) {
            console.error("[AuthContext] Create Profile Error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async (silent: boolean = false) => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("[AuthContext] SignOut Error:", error);
            if (!silent) {
                Alert.alert("Logout Error", "Failed to sign out.");
            }
        }
    };

    return {
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signInWithPhone,
        confirmCode,
        createProfile,
        logout,
    };
});
