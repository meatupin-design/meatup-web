import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RazorpayGatewayProps {
    amount: number;
    orderId: string;
    name: string;
    email: string;
    contact: string;
    onSuccess: (data: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
    onClose: () => void;
    onError?: (errorMsg: string) => void;
}

export default function RazorpayCheckoutGatewayWeb({
    amount,
    orderId,
    name,
    email,
    contact,
    onSuccess,
    onClose,
    onError
}: RazorpayGatewayProps) {
    const insets = useSafeAreaInsets();
    const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';

    useEffect(() => {
        const loadRazorpayScript = () => {
            return new Promise((resolve, reject) => {
                if ((window as any).Razorpay) {
                    resolve(true);
                    return;
                }
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => resolve(true);
                script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
                document.body.appendChild(script);
            });
        };

        const initPayment = async () => {
            try {
                await loadRazorpayScript();
                const options = {
                    key: RAZORPAY_KEY,
                    amount: Math.round(amount * 100), // amount in paise
                    currency: 'INR',
                    name: 'Meat UP',
                    description: 'Secure Payment',
                    order_id: orderId,
                    handler: function (response: any) {
                        onSuccess({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        });
                    },
                    prefill: {
                        name: name,
                        email: email,
                        contact: contact
                    },
                    theme: {
                        color: Colors.deepTeal,
                        hide_topbar: false,
                        backdrop_color: 'rgba(0,0,0,0.6)'
                    },
                    config: {
                        display: {
                            blocks: {
                                upi: {
                                    name: "Pay via UPI",
                                    instruments: [
                                        {
                                            method: "upi"
                                        }
                                    ]
                                }
                            },
                            sequence: ["block.upi"],
                            preferences: {
                                show_default_blocks: false
                            }
                        }
                    },
                    modal: {
                        ondismiss: function() {
                            onClose();
                        }
                    }
                };
                const rzp1 = new (window as any).Razorpay(options);
                rzp1.on('payment.failed', function (response: any) {
                    if (onError) onError(response.error.description || 'Payment failed');
                });
                rzp1.open();
            } catch (error: any) {
                console.error("Razorpay Error:", error);
                if (onError) onError(error.message || 'Failed to initialize payment');
                onClose();
            }
        };

        initPayment();

        // No cleanup needed for the script, it's safe to leave in document
        return () => {
            // Close any open modals if unmounted unexpectedly
            const razorpayContainer = document.querySelector('.razorpay-container');
            if (razorpayContainer) {
                (razorpayContainer as HTMLElement).style.display = 'none';
            }
        };
    }, [amount, orderId, name, email, contact, RAZORPAY_KEY, onSuccess, onClose, onError]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
             <View style={styles.loader}>
                 <ActivityIndicator size="large" color={Colors.deepTeal} />
             </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loader: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    }
});
