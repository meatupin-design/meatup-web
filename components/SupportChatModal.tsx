import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Linking,
    KeyboardAvoidingView,
    Platform,
    Image,
    useWindowDimensions,
    Animated,
} from 'react-native';
import { X, Send, Phone, MessageCircle, ChevronLeft, Sparkles, Headset } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface SupportChatModalProps {
    visible: boolean;
    onClose: () => void;
}

interface Message {
    id: string;
    text: string;
    sender: 'bot' | 'user';
    type: 'text' | 'options';
    options?: { label: string; value: string }[];
}

const INITIAL_OPTIONS = [
    { label: "Where is my order?", value: "order_status" },
    { label: "Issue with items", value: "item_issue" },
    { label: "Refund/Cancellation", value: "refund" },
    { label: "Payment Issue", value: "payment" },
    { label: "Contact Support", value: "escalate" },
];

export default function SupportChatModal({ visible, onClose }: SupportChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const { width: windowWidth } = useWindowDimensions();
    const isLargeScreen = windowWidth >= 768;

    // Animation for online dot
    const dotOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            // Reset chat when opened
            setMessages([
                {
                    id: '1',
                    text: "Hi! I'm Meat Up, your support assistant. How can I help you today?",
                    sender: 'bot',
                    type: 'options',
                    options: INITIAL_OPTIONS,
                },
            ]);

            // Start dot animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dotOpacity, {
                        toValue: 0.3,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dotOpacity, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [visible]);

    const handleOptionSelect = (option: { label: string; value: string }) => {
        // Add user message
        const userMsg: Message = {
            id: Date.now().toString(),
            text: option.label,
            sender: 'user',
            type: 'text',
        };

        setMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);

        // Simulate bot response
        setTimeout(() => {
            setIsTyping(false);
            let botResponse: Message;

            switch (option.value) {
                case 'order_status':
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "You can track your live order status directly on the 'My Orders' card. Just tap the order to see details.",
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: "That helped, thanks!", value: "resolved" },
                            { label: "Still need help", value: "escalate" }
                        ]
                    };
                    break;
                case 'item_issue':
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "I'm sorry to hear that. For quality issues, please take a photo and contact our support team directly.",
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: "Call Support", value: "call_action" },
                            { label: "Cancel", value: "resolved" }
                        ]
                    };
                    break;
                case 'refund':
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "Refunds for cancelled orders are processed automatically within 24-48 hours to your original payment method.",
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: "Okay, got it", value: "resolved" },
                            { label: "Payment not received", value: "escalate" }
                        ]
                    };
                    break;
                case 'payment':
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "If a payment failed but money was deducted, it will be auto-refunded by your bank within 3-5 business days.",
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: "Okay, thanks", value: "resolved" },
                            { label: "It's been longer", value: "escalate" }
                        ]
                    };
                    break;
                case 'escalate':
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "I understand. Would you like to speak with a support agent directly?",
                        sender: 'bot',
                        type: 'options',
                        options: [
                            { label: "Yes, Call Support", value: "call_action" },
                            { label: "No, I'm good", value: "resolved" }
                        ]
                    };
                    break;
                case 'call_action':
                    Linking.openURL('tel:+918281626692');
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "Calling support...",
                        sender: 'bot',
                        type: 'text'
                    };
                    break;
                case 'resolved':
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "Glad I could help! Have a great day.",
                        sender: 'bot',
                        type: 'text',
                    };
                    break;
                default:
                    botResponse = {
                        id: (Date.now() + 1).toString(),
                        text: "I didn't quite catch that. Please select an option.",
                        sender: 'bot',
                        type: 'options',
                        options: INITIAL_OPTIONS
                    };
            }
            setMessages((prev) => [...prev, botResponse]);
        }, 1200);
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" transparent={isLargeScreen} onRequestClose={onClose}>
            <View style={[styles.modalWrapper, isLargeScreen && styles.modalOverlay]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.container, isLargeScreen && styles.largeContainer]}
                >
                    <SafeAreaView style={styles.safeArea}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.headerSide}>
                                <View style={styles.backButtonCircle}>
                                    <ChevronLeft size={24} color={Colors.deepTeal} />
                                </View>
                            </TouchableOpacity>
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.headerTitle}>Meat UP Support</Text>
                                <View style={styles.onlineStatus}>
                                    <Animated.View style={[styles.onlineDot, { opacity: dotOpacity }]} />
                                    <Text style={styles.onlineText}>Support is Online</Text>
                                </View>
                            </View>
                            <View style={styles.headerSide}>
                                <TouchableOpacity style={styles.headerIconBtn} onPress={() => Linking.openURL('tel:+918281626692')}>
                                    <Phone size={20} color={Colors.deepTeal} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Chat Area */}
                        <ScrollView
                            ref={scrollViewRef}
                            style={styles.chatContainer}
                            contentContainerStyle={styles.chatContent}
                            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                            showsVerticalScrollIndicator={false}
                        >
                            {messages.map((msg, index) => (
                                <View key={msg.id} style={[
                                    styles.messageWrapper,
                                    msg.sender === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper
                                ]}>
                                    {msg.sender === 'bot' && (
                                        <View style={styles.botAvatar}>
                                            <Headset size={16} color={Colors.white} />
                                        </View>
                                    )}

                                    <View style={styles.messageContent}>
                                        <View style={[
                                            styles.messageBubble,
                                            msg.sender === 'user' ? styles.userBubble : styles.botBubble,
                                            // Subtle radius adjustments for consecutive messages would go here
                                        ]}>
                                            <Text style={[
                                                styles.messageText,
                                                msg.sender === 'user' ? styles.userText : styles.botText
                                            ]}>
                                                {msg.text}
                                            </Text>
                                        </View>

                                        {/* Options */}
                                        {msg.type === 'options' && msg.options && (
                                            <View style={styles.optionsContainer}>
                                                {msg.options.map((option, idx) => (
                                                    <TouchableOpacity
                                                        key={idx}
                                                        style={[
                                                            styles.optionButton,
                                                            messages[messages.length - 1].id !== msg.id && styles.optionButtonDisabled
                                                        ]}
                                                        onPress={() => handleOptionSelect(option)}
                                                        disabled={messages[messages.length - 1].id !== msg.id}
                                                    >
                                                        <Text style={[
                                                            styles.optionText,
                                                            messages[messages.length - 1].id !== msg.id && styles.optionTextDisabled
                                                        ]}>
                                                            {option.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}

                            {isTyping && (
                                <View style={styles.botMessageWrapper}>
                                    <View style={styles.botAvatar}>
                                        <Headset size={16} color={Colors.white} />
                                    </View>
                                    <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
                                        <Text style={styles.typingText}>Meat Up is typing...</Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.cream, // Premium background
    },
    modalWrapper: {
        flex: 1,
    },
    modalOverlay: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: {
        flex: 1,
    },
    largeContainer: {
        maxWidth: 500,
        maxHeight: '85%',
        width: '95%',
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: Colors.cream,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        zIndex: 10,
    },
    headerSide: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.deepTeal,
        letterSpacing: 0.3,
    },
    onlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
        marginRight: 6,
    },
    onlineText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    chatContainer: {
        flex: 1,
    },
    chatContent: {
        padding: 20,
        gap: 20,
        paddingBottom: 40,
    },
    messageWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
        maxWidth: '90%',
    },
    messageContent: {
        flexShrink: 1,
    },
    userMessageWrapper: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    botMessageWrapper: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-end',
        maxWidth: '90%',
    },
    botAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.deepTeal,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.deepTeal,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    messageBubble: {
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    userBubble: {
        backgroundColor: Colors.deepTeal,
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    typingBubble: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingVertical: 10,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    userText: {
        color: Colors.white,
    },
    botText: {
        color: Colors.charcoal,
    },
    typingText: {
        fontSize: 13,
        color: '#888',
        fontStyle: 'italic',
    },
    optionsContainer: {
        marginTop: 12,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        backgroundColor: Colors.white,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: Colors.deepTeal,
        shadowColor: Colors.deepTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    optionButtonDisabled: {
        borderColor: '#EEE',
        backgroundColor: '#F5F5F5',
        shadowOpacity: 0,
        elevation: 0,
    },
    optionText: {
        color: Colors.deepTeal,
        fontSize: 14,
        fontWeight: '700',
    },
    optionTextDisabled: {
        color: '#AAA',
    },
});
