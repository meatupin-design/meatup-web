import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/config/firebaseConfig';
import { deleteUser } from 'firebase/auth';

export default function AccountDeleteScreen() {
    const { user, userProfile, logout } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleDelete = async () => {
        if (!user) {
            Alert.alert("Error", "You must be logged in to delete your account.");
            return;
        }

        const confirmMessage = "Are you sure you want to permanently delete your account? This action cannot be undone.";
        
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(confirmMessage);
            if (!confirmed) return;
        }

        const proceedWithDeletion = async () => {
            setIsLoading(true);
            try {
                const identifier = userProfile?.phone || userProfile?.email || user.email || user.phoneNumber || user.uid;
                
                // Call the cloud function to notify admin
                const functions = getFunctions(app);
                const requestDeletion = httpsCallable(functions, 'requestAccountDeletion');
                await requestDeletion({ identifier });

                // Attempt to delete the user auth object directly
                try {
                    await deleteUser(user);
                } catch (authErr: any) {
                    console.warn("Direct auth deletion failed (might require re-login), but request sent.", authErr);
                    // We still requested it, so we can just log them out
                    await logout(true);
                }

                setIsSubmitted(true);
                
                setTimeout(() => {
                    router.replace('/');
                }, 3000);

            } catch (error) {
                console.error('Failed to submit deletion request', error);
                const msg = 'Failed to process deletion. Please try again later.';
                if (Platform.OS === 'web') {
                    window.alert(msg);
                } else {
                    Alert.alert('Error', msg);
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (Platform.OS !== 'web') {
            Alert.alert(
                "Delete Account",
                confirmMessage,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: proceedWithDeletion }
                ]
            );
        } else {
            proceedWithDeletion();
        }
    };

    if (!user) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <Text style={styles.header}>Not Logged In</Text>
                    <Text style={styles.paragraph}>You must be logged in to access this page.</Text>
                    <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/login')}>
                        <Text style={styles.loginButtonText}>Go to Login</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.header}>Delete My Account</Text>
                
                {isSubmitted ? (
                    <View style={styles.successContainer}>
                        <Text style={styles.successText}>
                            Your account has been queued for deletion and you have been logged out.
                            Redirecting...
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.warningContainer}>
                            <Text style={styles.warningHeader}>⚠️ Warning: Permanent Action</Text>
                            <Text style={styles.warningText}>
                                Deleting your account is irreversible. You will lose access to:
                            </Text>
                            <View style={styles.list}>
                                <Text style={styles.listItem}>• Your MeatUp profile and preferences</Text>
                                <Text style={styles.listItem}>• Order history and active orders</Text>
                                <Text style={styles.listItem}>• Saved delivery addresses</Text>
                                <Text style={styles.listItem}>• Accumulated wallet points</Text>
                            </View>
                            <Text style={styles.warningText}>
                                If you have any active orders, please cancel them or wait for delivery before deleting your account.
                            </Text>
                        </View>

                        <View style={styles.profileInfo}>
                            <Text style={styles.profileLabel}>Account to delete:</Text>
                            <Text style={styles.profileValue}>{userProfile?.name || 'User'}</Text>
                            <Text style={styles.profileValue}>{userProfile?.phone || user.phoneNumber || user.email}</Text>
                        </View>

                        <TouchableOpacity 
                            style={[styles.deleteButton, isLoading && { opacity: 0.7 }]} 
                            onPress={handleDelete}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.deleteButtonText}>Permanently Delete Account</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.cancelButton} 
                            onPress={() => {
                                if (router.canGoBack()) {
                                    router.back();
                                } else {
                                    router.replace('/');
                                }
                            }}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel & Go Back</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    container: {
        padding: 24,
        ...(Platform.OS === 'web' && {
            maxWidth: 600,
            alignSelf: 'center',
            width: '100%',
        }),
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.charcoal,
        marginBottom: 24,
    },
    paragraph: {
        fontSize: 16,
        color: Colors.charcoal,
        marginBottom: 24,
        textAlign: 'center',
    },
    loginButton: {
        backgroundColor: Colors.deepTeal,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    loginButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    warningContainer: {
        backgroundColor: '#FFF5F5',
        borderWidth: 1,
        borderColor: '#FED7D7',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
    },
    warningHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.extrared,
        marginBottom: 12,
    },
    warningText: {
        fontSize: 15,
        color: Colors.charcoal,
        lineHeight: 22,
        marginBottom: 12,
    },
    list: {
        marginBottom: 12,
    },
    listItem: {
        fontSize: 15,
        color: Colors.charcoal,
        lineHeight: 24,
        marginLeft: 8,
    },
    profileInfo: {
        backgroundColor: Colors.creamLight,
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
    },
    profileLabel: {
        fontSize: 14,
        color: Colors.charcoal,
        opacity: 0.6,
        marginBottom: 4,
    },
    profileValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.charcoal,
        marginBottom: 2,
    },
    deleteButton: {
        backgroundColor: Colors.extrared,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.charcoal,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.charcoal,
    },
    successContainer: {
        backgroundColor: Colors.creamLight,
        padding: 24,
        borderRadius: 12,
        marginTop: 16,
    },
    successText: {
        fontSize: 16,
        color: Colors.deepTeal,
        lineHeight: 24,
        textAlign: 'center',
        fontWeight: '500',
    },
});
