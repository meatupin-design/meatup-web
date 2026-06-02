import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    Linking,
    Alert,
    useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Package,
    MapPin,
    Clock,
    FileText,
    CheckCircle,
    Scissors,
    Box,
    Truck,
    CreditCard,
    Banknote,
    Headset,
    Phone,
    MessageCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { OrderStatus } from '@/types';
import SupportChatModal from '@/components/SupportChatModal';

const SUPPORT_PHONE = '+918281626692';

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: any; color: string; bgColor: string }> = {
    pending: { label: 'Order Pending', icon: Clock, color: Colors.orange, bgColor: '#FFF4E6' },
    confirmed: { label: 'Confirmed', icon: CheckCircle, color: Colors.tealBlue, bgColor: '#F5E6E6' },
    received: { label: 'Received', icon: Package, color: Colors.tealBlue, bgColor: '#F5E6E6' },
    cutting: { label: 'Cutting', icon: Scissors, color: Colors.orange, bgColor: '#FFF4E6' },
    packing: { label: 'Packing', icon: Box, color: Colors.orange, bgColor: '#FFF4E6' },
    out_for_delivery: { label: 'Out for Delivery', icon: Truck, color: Colors.priceUp, bgColor: '#E6F5EA' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: Colors.priceUp, bgColor: '#E6F5EA' },
    cancelled: { label: 'Cancelled', icon: Box, color: Colors.priceDown, bgColor: '#FEE2E2' },
};

const TIMELINE_STEPS: { key: OrderStatus; label: string; shortLabel: string; icon: any }[] = [
    { key: 'received', label: 'Order Received', shortLabel: 'Received', icon: Package },
    { key: 'cutting', label: 'Cutting', shortLabel: 'Cutting', icon: Scissors },
    { key: 'packing', label: 'Packing', shortLabel: 'Packing', icon: Box },
    { key: 'out_for_delivery', label: 'Out for Delivery', shortLabel: 'On Way', icon: Truck },
    { key: 'delivered', label: 'Delivered', shortLabel: 'Delivered', icon: CheckCircle },
];

const ALL_STATUSES: OrderStatus[] = [
    'pending', 'received', 'confirmed', 'cutting', 'packing', 'out_for_delivery', 'delivered',
];

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { width: windowWidth } = useWindowDimensions();
    const isDesktop = windowWidth >= 1024;
    const contentMaxWidth = 1100;

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { orders } = useApp();
    const [chatVisible, setChatVisible] = useState(false);

    const order = orders.find((o) => o.id === id);

    if (!order) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <Package size={48} color={Colors.deepTeal} />
                <Text style={{ marginTop: 16, fontSize: 16, color: Colors.charcoal }}>Order not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
                    <Text style={{ color: Colors.deepTeal, fontWeight: '700' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const config = STATUS_CONFIG[order.status];
    const StatusIcon = config.icon;
    const currentStatusIndex = ALL_STATUSES.indexOf(order.status);
    const hasPaymentId = !!order.payment_id || !!order.razorpay_order_id;
    const isOnline = order.payment_mode === 'online' || (order.payment_mode === undefined && hasPaymentId);
    const isCOD = order.payment_mode === 'cod' || (order.payment_mode === undefined && !hasPaymentId);

    const taxAmount = order.tax_amount ?? 0;
    const platformFee = order.platform_fee ?? 0;
    const deliveryCharge = order.delivery_charge ?? 0;

    const handleCallSupport = () => {
        Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() =>
            Alert.alert('Unable to open dialler', 'Please call ' + SUPPORT_PHONE)
        );
    };

    const handleWhatsApp = () => {
        const msg = encodeURIComponent(`Hi, I need help with my order ${order.display_id || order.id.slice(-6).toUpperCase()}`);
        Linking.openURL(`https://wa.me/${SUPPORT_PHONE.replace('+', '')}?text=${msg}`).catch(() =>
            Alert.alert('Unable to open WhatsApp')
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View style={[styles.headerContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ChevronLeft size={26} color={Colors.cream} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>
                            {order.display_id || `ORDER #${order.id.slice(-6).toUpperCase()}`}
                        </Text>
                        <Text style={styles.headerSub}>
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            })}
                        </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: config.bgColor }]}>
                        <StatusIcon size={12} color={config.color} />
                        <Text style={[styles.statusPillText, { color: config.color }]}>{config.label}</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={isDesktop ? styles.rowLayout : null}>
                    <View style={isDesktop ? styles.leftColumn : null}>
                        {/* ── Order Progress (horizontal stepper) ── */}
                        {order.status !== 'cancelled' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Order Progress</Text>
                                <View style={styles.stepperCard}>
                                    {/* Connector bar behind dots */}
                                    <View style={styles.stepperTrack} />

                                    <View style={styles.stepperRow}>
                                        {TIMELINE_STEPS.map((step, index) => {
                                            const stepIndex = ALL_STATUSES.indexOf(step.key);
                                            const isDone = currentStatusIndex > stepIndex;
                                            const isActive = currentStatusIndex === stepIndex;
                                            const StepIcon = step.icon;

                                            return (
                                                <View key={step.key} style={styles.stepItem}>
                                                    {/* Filled connector left side */}
                                                    {index > 0 && (
                                                        <View style={[
                                                            styles.stepConnectorLeft,
                                                            (isDone || isActive) && styles.stepConnectorFilled,
                                                        ]} />
                                                    )}
                                                    {/* Filled connector right side */}
                                                    {index < TIMELINE_STEPS.length - 1 && (
                                                        <View style={[
                                                            styles.stepConnectorRight,
                                                            isDone && styles.stepConnectorFilled,
                                                        ]} />
                                                    )}

                                                    {/* Dot */}
                                                    <View style={[
                                                        styles.stepDot,
                                                        isDone && styles.stepDotDone,
                                                        isActive && styles.stepDotActive,
                                                    ]}>
                                                        {isDone
                                                            ? <CheckCircle size={14} color={Colors.white} />
                                                            : <StepIcon size={14} color={isActive ? Colors.white : '#CCC'} />
                                                        }
                                                    </View>

                                                    {/* Label */}
                                                    <Text style={[
                                                        styles.stepLabel,
                                                        isDone && styles.stepLabelDone,
                                                        isActive && styles.stepLabelActive,
                                                    ]} numberOfLines={1}>
                                                        {step.shortLabel}
                                                    </Text>

                                                    {isActive && (
                                                        <View style={styles.activePulse} />
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>

                                    {/* Current status description */}
                                    <View style={styles.stepperStatus}>
                                        <View style={[styles.stepperStatusDot, { backgroundColor: config.color }]} />
                                        <Text style={[styles.stepperStatusText, { color: config.color }]}>
                                            {config.label}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* ── Cancelled Banner ── */}
                        {order.status === 'cancelled' && (
                            <View style={styles.cancelledBanner}>
                                <Box size={20} color={Colors.priceDown} />
                                <Text style={styles.cancelledText}>This order has been cancelled.</Text>
                            </View>
                        )}

                        {/* ── Items Ordered ── */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Items Ordered</Text>
                            <View style={styles.card}>
                                {order.items.map((item, index) => (
                                    <View key={index}>
                                        <View style={styles.itemRow}>
                                            <View style={styles.itemQtyBadge}>
                                                <Text style={styles.itemQtyText}>{item.quantity}x</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                                <Text style={styles.itemMeta}>
                                                    {item.weight}{item.name.toLowerCase().includes('egg') || item.unit?.toLowerCase() === 'pc' || item.unit?.toLowerCase() === 'pack' ? 'PC' : 'kg'}{item.cuttingType ? ` • ${item.cuttingType}` : ''}
                                                </Text>
                                            </View>
                                            <Text style={styles.itemPrice}>
                                                ₹{((item as any).price_per_selection 
                                                    ? item.price * item.quantity 
                                                    : item.price * item.weight * item.quantity).toFixed(2)}
                                            </Text>
                                        </View>
                                        {index < order.items.length - 1 && <View style={styles.itemDivider} />}
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* ── Delivery Details ── */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Delivery Details</Text>
                            <View style={styles.card}>
                                <View style={styles.infoRow}>
                                    <View style={styles.infoIcon}><MapPin size={16} color={Colors.deepTeal} /></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoLabel}>Delivery Address</Text>
                                        <Text style={styles.infoValue}>{order.address}</Text>
                                    </View>
                                </View>

                                {order.delivery_slot && (
                                    <>
                                        <View style={styles.rowDivider} />
                                        <View style={styles.infoRow}>
                                            <View style={styles.infoIcon}><Clock size={16} color={Colors.deepTeal} /></View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.infoLabel}>Delivery Slot</Text>
                                                <Text style={styles.infoValue}>{order.delivery_slot}</Text>
                                            </View>
                                        </View>
                                    </>
                                )}

                                {order.note && (
                                    <>
                                        <View style={styles.rowDivider} />
                                        <View style={styles.infoRow}>
                                            <View style={styles.infoIcon}><FileText size={16} color={Colors.deepTeal} /></View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.infoLabel}>Order Note</Text>
                                                <Text style={styles.infoValue}>{order.note}</Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={isDesktop ? styles.rightColumn : null}>
                        {/* ── Payment Summary ── */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Payment Summary</Text>
                            <View style={styles.card}>
                                {/* Payment method row */}
                                <View style={styles.infoRow}>
                                    <View style={styles.infoIcon}>
                                        {isOnline
                                            ? <CreditCard size={16} color={Colors.deepTeal} />
                                            : <Banknote size={16} color={Colors.deepTeal} />
                                        }
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoLabel}>Payment Method</Text>
                                        <Text style={styles.infoValue}>
                                            {isOnline ? 'Online Payment (UPI)' : 'Cash on Delivery'}
                                        </Text>
                                    </View>
                                    <View style={[styles.paidBadge, { backgroundColor: isOnline ? '#E6F5EA' : '#FFF4E6' }]}>
                                        <Text style={[styles.paidBadgeText, { color: isOnline ? Colors.priceUp : Colors.orange }]}>
                                            {isOnline ? 'Paid' : 'COD'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.rowDivider} />

                                {/* Bill rows */}
                                <View style={styles.billRow}>
                                    <Text style={styles.billLabel}>Subtotal</Text>
                                    <Text style={styles.billValue}>₹{order.total_amount.toFixed(2)}</Text>
                                </View>

                                <View style={styles.billRow}>
                                    <Text style={styles.billLabel}>Delivery Charge</Text>
                                    <Text style={deliveryCharge === 0 ? styles.billValueFree : styles.billValue}>
                                        {deliveryCharge === 0 ? 'Free' : `+₹${deliveryCharge.toFixed(2)}`}
                                    </Text>
                                </View>

                                <View style={styles.billRow}>
                                    <Text style={styles.billLabel}>Tax</Text>
                                    <Text style={taxAmount === 0 ? styles.billValueFree : styles.billValue}>
                                        {taxAmount === 0 ? '₹0.00' : `+₹${taxAmount.toFixed(2)}`}
                                    </Text>
                                </View>

                                <View style={styles.billRow}>
                                    <Text style={styles.billLabel}>Platform Fee</Text>
                                    <Text style={platformFee === 0 ? styles.billValueFree : styles.billValue}>
                                        {platformFee === 0 ? '₹0.00' : `+₹${platformFee.toFixed(2)}`}
                                    </Text>
                                </View>

                                {order.discount > 0 && (
                                    <View style={styles.billRow}>
                                        <Text style={[styles.billLabel, { color: Colors.priceUp }]}>Discount</Text>
                                        <Text style={[styles.billValue, { color: Colors.priceUp }]}>
                                            -₹{order.discount.toFixed(2)}
                                        </Text>
                                    </View>
                                )}

                                {order.wallet_used > 0 && (
                                    <View style={styles.billRow}>
                                        <Text style={[styles.billLabel, { color: Colors.orange }]}>Meat Points Redeemed</Text>
                                        <Text style={[styles.billValue, { color: Colors.orange }]}>
                                            -₹{order.wallet_used.toFixed(2)}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.totalDivider} />

                                <View style={styles.billRow}>
                                    <Text style={styles.totalLabel}>Total Paid</Text>
                                    <Text style={styles.totalValue}>₹{order.final_amount.toFixed(2)}</Text>
                                </View>

                                {/* Points earned */}
                                {order.status === 'delivered' && order.earned_points > 0 && (
                                    <View style={styles.earnedPointsRow}>
                                        <Image
                                            source={require('../../assets/images/cp-profile.png')}
                                            style={{ width: 18, height: 18 }}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.earnedPointsText}>
                                            +{order.earned_points} Meat Points earned on this order
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* ── Need Help ── */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Need Help?</Text>
                            <View style={styles.card}>
                                <View style={styles.helpHeader}>
                                    <View style={styles.helpIconBg}>
                                        <Headset size={22} color={Colors.deepTeal} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.helpTitle}>Contact Support</Text>
                                        <Text style={styles.helpSub}>
                                            We're available to assist you with your order.
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.rowDivider} />

                                <View style={styles.helpBtns}>
                                    <TouchableOpacity style={styles.helpBtn} onPress={handleCallSupport}>
                                        <Phone size={18} color={Colors.deepTeal} />
                                        <Text style={styles.helpBtnText}>Call</Text>
                                    </TouchableOpacity>

                                    <View style={styles.helpBtnDivider} />

                                    <TouchableOpacity style={styles.helpBtn} onPress={handleWhatsApp}>
                                        <MessageCircle size={18} color={Colors.priceUp} />
                                        <Text style={[styles.helpBtnText, { color: Colors.priceUp }]}>WhatsApp</Text>
                                    </TouchableOpacity>

                                    <View style={styles.helpBtnDivider} />

                                    <TouchableOpacity style={styles.helpBtn} onPress={() => setChatVisible(true)}>
                                        <Headset size={18} color={Colors.orange} />
                                        <Text style={[styles.helpBtnText, { color: Colors.orange }]}>Chat</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <SupportChatModal
                visible={chatVisible}
                onClose={() => setChatVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.cream,
    },
    header: {
        backgroundColor: Colors.deepTeal,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: -20,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.cream,
        letterSpacing: 0.5,
    },
    headerSub: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.65)',
        marginTop: 2,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
        gap: 5,
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    rowLayout: {
        flexDirection: 'row',
        gap: 24,
    },
    leftColumn: {
        flex: 1.6,
    },
    rightColumn: {
        flex: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.charcoal,
        marginBottom: 12,
        marginLeft: 2,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 20,
        shadowColor: Colors.deepTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 3,
    },

    // ── Horizontal Stepper ──
    stepperCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        paddingTop: 28,
        paddingBottom: 16,
        paddingHorizontal: 16,
        shadowColor: Colors.deepTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 3,
        overflow: 'hidden',
    },
    stepperTrack: {
        position: 'absolute',
        top: 42,
        left: 40,
        right: 40,
        height: 3,
        backgroundColor: '#EFEFEF',
        borderRadius: 2,
    },
    stepperRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    stepItem: {
        flex: 1,
        alignItems: 'center',
        position: 'relative',
    },
    stepConnectorLeft: {
        position: 'absolute',
        top: 13,
        left: 0,
        width: '50%',
        height: 3,
        backgroundColor: '#EFEFEF',
        zIndex: 0,
    },
    stepConnectorRight: {
        position: 'absolute',
        top: 13,
        right: 0,
        width: '50%',
        height: 3,
        backgroundColor: '#EFEFEF',
        zIndex: 0,
    },
    stepConnectorFilled: {
        backgroundColor: Colors.deepTeal,
    },
    stepDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#EFEFEF',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        borderWidth: 2,
        borderColor: Colors.white,
    },
    stepDotActive: {
        backgroundColor: Colors.orange,
        shadowColor: Colors.orange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    stepDotDone: {
        backgroundColor: Colors.deepTeal,
    },
    activePulse: {
        position: 'absolute',
        top: -4,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.orange,
        opacity: 0.15,
        zIndex: 1,
    },
    stepLabel: {
        marginTop: 8,
        fontSize: 10,
        color: '#BDBDBD',
        fontWeight: '500',
        textAlign: 'center',
    },
    stepLabelActive: {
        color: Colors.orange,
        fontWeight: '700',
    },
    stepLabelDone: {
        color: Colors.charcoal,
        fontWeight: '600',
    },
    stepperStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    stepperStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    stepperStatusText: {
        fontSize: 13,
        fontWeight: '700',
    },

    // ── Cancelled ──
    cancelledBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FEE2E2',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    cancelledText: {
        color: Colors.priceDown,
        fontWeight: '600',
        fontSize: 14,
    },

    // ── Items ──
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemQtyBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemQtyText: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.deepTeal,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.charcoal,
    },
    itemMeta: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.charcoal,
    },
    itemDivider: {
        height: 1,
        backgroundColor: '#F5F5F5',
        marginVertical: 12,
    },

    // ── Info rows ──
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    infoIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.charcoal,
        lineHeight: 20,
    },
    rowDivider: {
        height: 1,
        backgroundColor: '#F5F5F5',
        marginVertical: 14,
    },

    // ── Payment ──
    paidBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    paidBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    billLabel: {
        fontSize: 14,
        color: '#888',
    },
    billValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.charcoal,
    },
    billValueFree: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.priceUp,
    },
    totalDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.charcoal,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.deepTeal,
    },
    earnedPointsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F5F5E6',
        padding: 12,
        borderRadius: 12,
        marginTop: 12,
    },
    earnedPointsText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.charcoal,
        flex: 1,
    },

    // ── Help ──
    helpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    helpIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: Colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
    },
    helpTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.charcoal,
        marginBottom: 2,
    },
    helpSub: {
        fontSize: 12,
        color: '#888',
        lineHeight: 16,
    },
    helpBtns: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    helpBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    helpBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.deepTeal,
    },
    helpBtnDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#F0F0F0',
    },
});
