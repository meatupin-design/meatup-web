import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Platform } from 'react-native';
import Colors from '@/constants/colors';

export default function PrivacyPolicyScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.header}>Privacy Policy</Text>

                <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</Text>

                <Text style={styles.sectionTitle}>1. Introduction</Text>
                <Text style={styles.paragraph}>
                    Welcome to MeatUp. We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our mobile application.
                </Text>

                <Text style={styles.sectionTitle}>2. Information We Collect</Text>
                <Text style={styles.paragraph}>
                    We may collect personal information that you provide to us, such as your name, email address, phone number, and delivery address. We also collect payment information when you make a purchase.
                </Text>

                <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
                <Text style={styles.paragraph}>
                    We use your information to process orders, deliver products, communicate with you, improve our services, and send promotional materials if you have opted in.
                </Text>

                <Text style={styles.sectionTitle}>4. Data Security</Text>
                <Text style={styles.paragraph}>
                    We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the internet or method of electronic storage is 100% secure.
                </Text>

                <Text style={styles.sectionTitle}>5. Sharing of Information</Text>
                <Text style={styles.paragraph}>
                    We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except to trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.
                </Text>

                <Text style={styles.sectionTitle}>6. Contact Us</Text>
                <Text style={styles.paragraph}>
                    If you have any questions about this Privacy Policy, please contact us at meatup.in@gmail.com.
                </Text>

                {/* Add some bottom padding */}
                <View style={{ height: 40 }} />
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
            maxWidth: 800,
            alignSelf: 'center',
            width: '100%',
        }),
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.charcoal,
        marginBottom: 8,
    },
    lastUpdated: {
        fontSize: 14,
        color: Colors.charcoal,
        opacity: 0.6,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.charcoal,
        marginTop: 24,
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 16,
        color: Colors.charcoal,
        lineHeight: 24,
        opacity: 0.8,
    },
});
