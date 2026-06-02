import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Package, Scissors, Box, Truck, CheckCircle, Clock, ChevronRight, Headset } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Order, OrderStatus } from '@/types';
import SupportChatModal from '@/components/SupportChatModal';
import ConfirmationModal from '@/components/ConfirmationModal';

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: any; color: string; bgColor: string }> = {
  pending: { label: 'Order Pending', icon: Clock, color: Colors.orange, bgColor: '#FFF4E6' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: Colors.tealBlue, bgColor: '#E6F4F1' },
  received: { label: 'Received', icon: Package, color: Colors.tealBlue, bgColor: '#E6F4F1' },
  cutting: { label: 'Cutting', icon: Scissors, color: Colors.orange, bgColor: '#FFF4E6' },
  packing: { label: 'Packing', icon: Box, color: Colors.orange, bgColor: '#FFF4E6' },
  out_for_delivery: { label: 'Out for Delivery', icon: Truck, color: Colors.priceUp, bgColor: '#E6F5EA' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: Colors.priceUp, bgColor: '#E6F5EA' },
  cancelled: { label: 'Cancelled', icon: Box, color: Colors.priceDown, bgColor: '#FEE2E2' },
};

export default function OrdersScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const contentMaxWidth = 1200;

  const { orders, cancelOrder, setIsSignInModalVisible, user } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [chatVisible, setChatVisible] = React.useState(false);
  const [cancelModalVisible, setCancelModalVisible] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

  const handleSupportPress = () => {
    if (user.id === '1') {
      setIsSignInModalVisible(true);
      return;
    }
    setChatVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (selectedOrderId) {
      await cancelOrder(selectedOrderId);
      setCancelModalVisible(false);
      setSelectedOrderId(null);
    }
  };

  const attemptCancel = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCancelModalVisible(true);
  };

  // Custom Header
  const renderHeader = () => (
    <View style={[styles.headerBg, { paddingTop: insets.top + 20 }]}>
      <View style={[styles.headerContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity onPress={handleSupportPress} style={styles.supportButton}>
          <Headset size={24} color={Colors.cream} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <Package size={64} color={Colors.deepTeal} />
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your order history will appear here once you place an order.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {
          maxWidth: contentMaxWidth,
          alignSelf: 'center',
          width: '100%',
          paddingTop: 24,
          paddingBottom: 100
        }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.ordersList, isTablet && styles.rowGrid]}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isTablet={isTablet}
              onCancel={attemptCancel}
              onPress={() => router.push(`/order/${order.id}` as any)}
            />
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <SupportChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
      />

      <ConfirmationModal
        visible={cancelModalVisible}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="No, Keep Order"
        type="danger"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelModalVisible(false)}
      />
    </View>
  );
}

function OrderCard({
  order,
  onCancel,
  onPress,
  isTablet
}: {
  order: Order;
  onCancel: (id: string) => void;
  onPress: () => void;
  isTablet: boolean;
}) {
  const config = STATUS_CONFIG[order.status];
  const Icon = config.icon;

  const { width: windowWidth } = useWindowDimensions();
  const contentMaxWidth = 1100;
  const gap = 20;
  const horizontalPadding = 20;
  const availableWidth = Math.min(windowWidth, contentMaxWidth) - (horizontalPadding * 2);
  const cardWidth = isTablet ? (availableWidth - gap) / 2 : '100%';

  return (
    <TouchableOpacity
      style={[styles.orderCard, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>{order.display_id || `ORDER #${order.id.slice(-6).toUpperCase()}`}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
          <Icon size={14} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
        <ChevronRight size={18} color="#CCC" style={{ marginLeft: 4 }} />
      </View>

      <View style={styles.divider} />

      {/* Order Items */}
      <View style={styles.itemsList}>
        {order.items.map((item, index) => (
          <View key={`${order.id}-item-${index}`} style={styles.itemRow}>
            <View style={styles.itemBullet} />
            <Text style={styles.itemText} numberOfLines={1}>
              <Text style={{ fontWeight: '700' }}>{item.quantity}x </Text>
              {item.name}
              <Text style={{ color: '#888' }}> ({item.weight}{item.name.toLowerCase().includes('egg') || item.unit?.toLowerCase() === 'pc' || item.unit?.toLowerCase() === 'pack' ? 'PC' : 'kg'}{item.cuttingType ? ` • ${item.cuttingType}` : ''})</Text>
            </Text>
          </View>
        ))}
      </View>

      {/* Timeline (Simplified) */}
      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <View style={styles.timelineContainer}>
          <OrderTimeline currentStatus={order.status} />
        </View>
      )}

      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{order.final_amount.toFixed(2)}</Text>
        </View>

        {order.status === 'pending' ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => onCancel(order.id)}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        ) : order.status === 'delivered' ? (
          <View style={styles.pointsBadge}>
            <Image source={require('../../assets/images/cp-profile.png')} style={{ width: 16, height: 16 }} />
            <Text style={styles.pointsText}>+{order.earned_points} pts</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function OrderTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
  // Updated timeline steps to include At Least: Received, Cutting, Packing, Out, Delivered
  const steps: { key: OrderStatus; label: string }[] = [
    { key: 'received', label: 'Received' },
    { key: 'cutting', label: 'Cutting' },
    { key: 'packing', label: 'Packing' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];

  // Map current status to index for progress
  const allStatuses: OrderStatus[] = ['pending', 'received', 'confirmed', 'cutting', 'packing', 'out_for_delivery', 'delivered'];
  const currentIndex = allStatuses.indexOf(currentStatus);

  return (
    <View style={styles.progressBarContainer}>
      {steps.map((step, index) => {
        let isActive = false;
        let isCompleted = false;

        const stepStatusIndex = allStatuses.indexOf(step.key);

        // Active if current status is at least this step
        if (currentIndex >= stepStatusIndex) isActive = true;
        // Completed if current status is past this step
        if (currentIndex > stepStatusIndex) isCompleted = true;

        // Special handling for the last step (Delivered)
        if (step.key === 'delivered' && currentStatus === 'delivered') {
          isActive = true;
          isCompleted = true;
        }

        return (
          <View key={step.key} style={styles.stepItem}>
            <View style={[
              styles.stepDot,
              isActive && styles.stepDotActive,
              isCompleted && styles.stepDotCompleted
            ]}>
              {isCompleted && <CheckCircle size={8} color={Colors.white} />}
            </View>

            <Text style={[
              styles.stepLabel,
              isActive && styles.stepLabelActive
            ]}>
              {step.label === 'Out for Delivery' ? 'Out' : step.label}
            </Text>

            {index < steps.length - 1 && (
              <View style={[
                styles.stepConnector,
                isActive && currentIndex >= allStatuses.indexOf(steps[index + 1].key) && styles.stepConnectorActive
              ]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  // Header
  headerBg: {
    backgroundColor: Colors.deepTeal,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: -20,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 60,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.cream,
    letterSpacing: 0.5,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  ordersList: {
    gap: 20,
  },
  rowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    backgroundColor: Colors.white,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.charcoal,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Order Card
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.deepTeal,
    opacity: 0.7,
    letterSpacing: 0.5,
  },
  orderDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 14,
  },

  // Items
  itemsList: {
    gap: 8,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.deepTeal,
    marginRight: 10,
    opacity: 0.5,
  },
  itemText: {
    fontSize: 14,
    color: Colors.charcoal,
    flex: 1,
  },

  // Timeline
  timelineContainer: {
    marginTop: 10,
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 16,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // Removed justifyContent space-between
  },
  stepItem: {
    flex: 1, // Use flex 1 for equal width distribution
    alignItems: 'center',
    position: 'relative',
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E0E0E0',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#FFF',
    zIndex: 2,
  },
  stepDotActive: {
    backgroundColor: Colors.orange,
  },
  stepDotCompleted: {
    backgroundColor: Colors.deepTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.charcoal,
    fontWeight: '600',
  },
  stepConnector: {
    position: 'absolute',
    top: 6,
    left: '50%', // Start from center of current item
    width: '100%', // Stretch to center of next item (since width is same)
    height: 2,
    backgroundColor: '#E0E0E0',
    zIndex: 1,
  },
  stepConnectorActive: {
    backgroundColor: Colors.deepTeal,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.priceDown,
    backgroundColor: '#FFF5F5',
  },
  cancelBtnText: {
    color: Colors.priceDown,
    fontWeight: '700',
    fontSize: 12,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1', // very light orange/yellow
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 6,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.deepTeal,
  },
  supportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
