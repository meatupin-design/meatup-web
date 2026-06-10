import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Platform, Alert, ActivityIndicator } from 'react-native';
import Colors from '@/constants/colors';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/config/firebaseConfig';

export default function AccountDeleteRequestScreen() {
    const [identifier, setIdentifier] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!identifier.trim()) {
            if (Platform.OS === 'web') {
                window.alert('Please enter your registered phone number or email.');
            } else {
                Alert.alert('Error', 'Please enter your registered phone number or email.');
            }
            return;
        }

        setIsLoading(true);
        try {
            const functions = getFunctions(app);
            const requestDeletion = httpsCallable(functions, 'requestAccountDeletion');
            await requestDeletion({ identifier });
            setIsSubmitted(true);
        } catch (error) {
            console.error('Failed to submit deletion request', error);
            if (Platform.OS === 'web') {
                window.alert('Failed to send request. Please try again or email meatup.in@gmail.com directly.');
            } else {
                Alert.alert('Error', 'Failed to send request. Please try again or email meatup.in@gmail.com directly.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.header}>Account Deletion Request</Text>
                
                {isSubmitted ? (
                    <View style={styles.successContainer}>
                        <Text style={styles.successText}>
                            Your request to delete your account has been received. 
                            We will process it and remove all associated data within 14 days. 
                            You will receive a confirmation once the deletion is complete.
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.paragraph}>
                            In accordance with Google Play Store data safety guidelines, you may request the deletion of your MeatUp account and all associated personal data.
                        </Text>

                        <Text style={styles.sectionTitle}>What will be deleted?</Text>
                        <View style={styles.list}>
                            <Text style={styles.listItem}>• Your profile information (name, phone number, email)</Text>
                            <Text style={styles.listItem}>• Saved delivery addresses</Text>
                            <Text style={styles.listItem}>• Order history and preferences</Text>
                        </View>

                        <Text style={styles.paragraph}>
                            Please enter your registered phone number or email address below to initiate the account deletion process.
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number or Email"
                            placeholderTextColor={Colors.extrared}
                            value={identifier}
                            onChangeText={setIdentifier}
                            autoCapitalize="none"
                        />

                        <TouchableOpacity 
                            style={[styles.submitButton, isLoading && { opacity: 0.7 }]} 
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.submitButtonText}>Request Deletion</Text>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.note}>
                            Note: Once your account is deleted, it cannot be recovered. Any active orders must be completed or canceled before the deletion process can finish.
                        </Text>
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
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.charcoal,
        marginBottom: 16,
    },
    paragraph: {
        fontSize: 16,
        color: Colors.charcoal,
        lineHeight: 24,
        marginBottom: 16,
        opacity: 0.8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.charcoal,
        marginTop: 8,
        marginBottom: 8,
    },
    list: {
        marginBottom: 24,
    },
    listItem: {
        fontSize: 16,
        color: Colors.charcoal,
        lineHeight: 24,
        opacity: 0.8,
        marginLeft: 8,
    },
    input: {
        backgroundColor: Colors.creamLight,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        fontSize: 16,
        color: Colors.charcoal,
        marginBottom: 24,
        ...(Platform.OS === 'web' && {
            outlineStyle: 'none',
        }),
    } as any,
    submitButton: {
        backgroundColor: Colors.extrared, // Red color for destructive action
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
    },
    note: {
        fontSize: 14,
        color: Colors.charcoal,
        opacity: 0.6,
        fontStyle: 'italic',
        lineHeight: 20,
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
