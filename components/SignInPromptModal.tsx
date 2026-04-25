import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
    Image,
} from 'react-native';
import { LogIn, X, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

interface SignInPromptModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function SignInPromptModal({ visible, onClose }: SignInPromptModalProps) {
    const { width: windowWidth } = useWindowDimensions();
    const isLargeScreen = windowWidth >= 768;
    const router = useRouter();

    const handleSignIn = () => {
        onClose();
        router.push('/login');
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, isLargeScreen && styles.largeContainer]}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <X size={20} color="#999" />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <View style={styles.iconBg}>
                            <Image 
                                source={require('@/assets/images/icon.png')} 
                                style={styles.promoIcon}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.title}>Sign In Required</Text>
                        <Text style={styles.message}>
                            To access support, place orders, and earn Meat Points, please sign in to your account.
                        </Text>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.signInBtn} onPress={handleSignIn}>
                            <LogIn size={20} color={Colors.white} />
                            <Text style={styles.signInBtnText}>Sign In Now</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelBtnText}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    largeContainer: {
        maxWidth: 400,
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    iconContainer: {
        marginBottom: 20,
        marginTop: 8,
    },
    iconBg: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.deepTeal,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.deepTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
        overflow: 'hidden',
    },
    promoIcon: {
        width: '100%',
        height: '100%',
    },
    content: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.charcoal,
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    footer: {
        width: '100%',
        gap: 12,
    },
    signInBtn: {
        backgroundColor: Colors.deepTeal,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 10,
    },
    signInBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    cancelBtn: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#999',
        fontSize: 15,
        fontWeight: '600',
    },
});
