import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  StatusBar,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, TicketPercent, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function CartScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 1024;
  const contentMaxWidth = 1200;

  const router = useRouter();
  const { cart, addToCart, removeFromCart, cartTotal, user, setIsSignInModalVisible } = useApp();
  const insets = useSafeAreaInsets();

  const finalTotal = cartTotal;
  const earnedPoints = Math.floor(cart.reduce((sum, item) => {
    const isPcUnit = item.product.unit?.toLowerCase() === 'pc' || item.product.unit?.toLowerCase() === 'pack' || item.product.name.toLowerCase().includes('egg');
    if (isPcUnit) return sum; // Do not calculate points for piece items
    return sum + item.weight * item.quantity;
  }, 0));

  const handleCheckout = () => {
    if (user.id === '1') {
      setIsSignInModalVisible(true);
      return;
    }
    router.push('/checkout');
  };

  // Custom Header Component
  const renderHeader = () => (
    <View style={[styles.headerBg, { paddingTop: insets.top + 20 }]}>
      <View style={[styles.headerContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{cart.length} items</Text>
        </View>
      </View>
    </View>
  );

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <ShoppingBag size={64} color={Colors.deepTeal} />
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added any fresh cuts yet.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.emptyButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={isDesktop ? styles.rowLayout : null}>
          <View style={isDesktop ? styles.leftColumn : null}>

            <View style={styles.cartList}>
              {cart.map((item, index) => {
                let itemPrice = item.product.current_price;
                if (item.product.variants && item.cuttingType) {
                  const variant = item.product.variants.find(v => v.name === item.cuttingType);
                  if (variant) itemPrice = variant.price;
                }

                return (
                  <View key={`${item.product.id}-${item.weight}-${index}`} style={styles.cartCard}>
                    <Image source={{ uri: item.product.image }} style={styles.itemImage} />

                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
                        <Text style={styles.itemVariant}>
                          {item.product.unit?.toUpperCase() === 'PC' || item.product.unit?.toLowerCase() === 'pack' || item.product.name.toLowerCase().includes('egg')
                            ? `${item.weight}PC`
                            : `${item.weight}${item.product.unit}`} {item.cuttingType ? `• ${item.cuttingType}` : ''}
                        </Text>
                      <Text style={styles.itemPrice}>
                        ₹{(itemPrice * item.weight * item.quantity).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.controls}>
                      <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={() => removeFromCart(item.product.id, item.weight, item.cuttingType)}
                      >
                        {item.quantity === 1 ? (
                          <Trash2 size={16} color={Colors.priceDown} />
                        ) : (
                          <Minus size={16} color={Colors.charcoal} />
                        )}
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={() => addToCart(item.product.id, 1, item.weight, item.cuttingType!)}
                      >
                        <Plus size={16} color={Colors.charcoal} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={isDesktop ? styles.rightColumn : null}>
            <View style={[styles.summaryCard, isDesktop && Platform.OS === 'web' && styles.stickySummary]}>
              <Text style={styles.summaryTitle}>Bill Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
              </View>


              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
              </View>

              {earnedPoints > 0 && (
                <View style={styles.pointsBadge}>
                  <Image source={require('../../assets/images/cp-profile.png')} style={styles.pointsIcon} resizeMode="contain" />
                  <Text style={styles.pointsText}>
                    You'll earn <Text style={{ fontWeight: 'bold' }}>{earnedPoints}</Text> Meat Points
                  </Text>
                </View>
              )}

              {isDesktop && (
                <TouchableOpacity
                  style={[styles.checkoutBtn, { marginTop: 24 }]}
                  onPress={handleCheckout}
                >
                  <Text style={styles.checkoutBtnText}>Checkout</Text>
                  <ArrowRight size={20} color={Colors.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {!isDesktop && (
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.footerLabel}>Total</Text>
              <Text style={styles.footerTotal}>₹{finalTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutBtnText}>Checkout</Text>
              <ArrowRight size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    fontSize: 24,
    fontWeight: '800',
    color: Colors.cream,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerBadgeText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },

  // Empty State
  emptyContainer: {
    flex: 1, // fill remaining space
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60, // visual push down
  },
  emptyIconBg: {
    width: 120,
    height: 120,
    backgroundColor: Colors.white,
    borderRadius: 60,
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
    fontWeight: 'bold',
    color: Colors.charcoal,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 40,
  },
  emptyButton: {
    backgroundColor: Colors.orange,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40, // push down for header overlap
  },

  // Discount Banner
  discountBanner: {
    backgroundColor: Colors.deepTealDark,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  discountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  discountContent: {
    flex: 1,
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  discountSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },

  // Cart Items
  cartList: {
    gap: 16,
    marginBottom: 24,
  },
  cartCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: Colors.creamLight,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.orange,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.creamLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  controlBtn: {
    width: 28,
    height: 28,
    backgroundColor: Colors.white,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoal,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  discountLabel: {
    color: Colors.priceUp,
  },
  discountValue: {
    color: Colors.priceUp,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.deepTeal,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.creamLight, // or orange tint
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  pointsIcon: {
    width: 20,
    height: 20,
  },
  pointsText: {
    fontSize: 13,
    color: Colors.deepTeal,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16, // Extra padding for rounded corners/iPhone home bar
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  footerTotal: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  checkoutBtn: {
    backgroundColor: Colors.deepTeal,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  checkoutBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  rowLayout: {
    flexDirection: 'row',
    gap: 24,
  },
  leftColumn: {
    flex: 2,
  },
  rightColumn: {
    flex: 1.2,
  },
  stickySummary: {
    // @ts-ignore
    position: 'sticky',
    top: 20,
  },
});
