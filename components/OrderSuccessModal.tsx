import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Animated, Dimensions, useWindowDimensions, Linking, Alert } from 'react-native';
import { CheckCircle, ArrowRight, ShoppingBag, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';

interface OrderSuccessModalProps {
    visible: boolean;
    orderId: string;
    onTrackOrder: () => void;
    onContinueShopping: () => void;
}

const { width } = Dimensions.get('window');

export default function OrderSuccessModal({ visible, orderId, onTrackOrder, onContinueShopping }: OrderSuccessModalProps) {
    const { width: windowWidth } = useWindowDimensions();
    const isLargeScreen = windowWidth >= 768;
    const scaleValue = useRef(new Animated.Value(0)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    friction: 5,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleValue.setValue(0);
            opacityValue.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.overlay}>
                <Animated.View style={[
                    styles.container,
                    { opacity: opacityValue, transform: [{ scale: scaleValue }] },
                    isLargeScreen && styles.largeContainer
                ]}>

                    {/* Icon Circle */}
                    <View style={styles.iconCircle}>
                        <CheckCircle size={48} color={Colors.white} />
                    </View>

                    <Text style={styles.title}>Order Placed!</Text>
                    <Text style={styles.subtitle}>
                        Your order <Text style={styles.highlight}>#{orderId}</Text> has been successfully placed.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.primaryButton} onPress={onTrackOrder}>
                            <Text style={styles.primaryButtonText}>Track Order</Text>
                            <ArrowRight size={18} color={Colors.white} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={onContinueShopping}>
                            <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
                        </TouchableOpacity>
                    </View>

                </Animated.View>
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
        padding: 20,
    },
    container: {
        width: width - 60,
        backgroundColor: Colors.white,
        borderRadius: 30,
        padding: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    largeContainer: {
        maxWidth: 500,
        width: '90%',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.deepTeal,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        marginTop: -10,
        shadowColor: Colors.deepTeal,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.charcoal,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    highlight: {
        color: Colors.deepTeal,
        fontWeight: '700',
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    primaryButton: {
        backgroundColor: Colors.deepTeal,
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: Colors.deepTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.deepTeal,
    },
    secondaryButtonText: {
        color: Colors.charcoal,
        fontSize: 16,
        fontWeight: '600',
    },
});

