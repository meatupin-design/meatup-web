import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  TextInput,
  Platform,
  StatusBar,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, TrendingUp, TrendingDown, ShoppingCart, ArrowRight, ShoppingBag, Plus, Minus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Product } from '@/types';
import CuttingModal from '@/components/CuttingModal';
import { getNextAvailableDay, isProductAvailableToday } from '@/utils/getNextAvailableDay';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const isDesktop = windowWidth >= 1024;
  const isUltraWide = windowWidth >= 1440;
  const numColumns = isUltraWide ? 4 : isDesktop ? 3 : isTablet ? 2 : 1;
  const contentMaxWidth = 1400;

  const router = useRouter();
  const { products, addToCart, cartItemCount, cart, removeFromCart, cartTotal } = useApp();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const tickerPosition = useRef(new Animated.Value(0)).current;

  // Ticker Animation
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(tickerPosition, {
          toValue: -100,
          duration: 15000,
          useNativeDriver: true,
        }),
        Animated.timing(tickerPosition, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [tickerPosition]);


  // Data Fix for Eggs to revert ghost prices in DB
  useEffect(() => {
    const eggProduct = products.find(p => p.name.toLowerCase().includes('egg'));
    if (eggProduct && eggProduct.variants && eggProduct.variants.some((v: any) => v.price > 10)) {
      import('@/services/ProductService').then(({ ProductService }) => {
        ProductService.updateProduct(eggProduct.id, {
          price_quantity: 1,
          unit: 'PC',
          variants: [
            { name: 'White Egg', price: 6 },
            { name: 'Brown Egg', price: 7 }
          ]
        });
      });
    }
  }, [products]);

  const filteredProducts = (searchQuery
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products
  ).sort((a, b) => {
    const aAvail = isProductAvailableToday(a);
    const bAvail = isProductAvailableToday(b);
    // Out-of-stock always last
    if (aAvail !== bAvail) return aAvail ? -1 : 1;
    // Both same availability → sort by display_order (undefined = Infinity)
    const orderA = a.display_order ?? Infinity;
    const orderB = b.display_order ?? Infinity;
    return orderA - orderB;
  });

  const topProducts = products.slice(0, 5); // Show top 5 in ticker

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState<{ id: string; weight: number; cuttingTypes?: string[]; variants?: any[] } | null>(null);

  const handleAddToCartRequest = (product: Product, weight: number) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProductData({ id: product.id, weight, variants: product.variants });
      setModalVisible(true);
    } else if (product.cutting_types && product.cutting_types.length > 0) {
      setSelectedProductData({ id: product.id, weight, cuttingTypes: product.cutting_types });
      setModalVisible(true);
    } else {
      addToCart(product.id, 1, weight);
    }
  };

  const handleRemoveFromCart = (productId: string, weight: number) => {
    const itemToRemove = cart.find(
      (item) => item.product.id === productId && item.weight === weight
    );
    if (itemToRemove) {
      removeFromCart(productId, weight, itemToRemove.cuttingType);
    }
  };

  const handleCuttingTypeSelect = (cuttingType: string) => {
    if (selectedProductData) {
      addToCart(selectedProductData.id, 1, selectedProductData.weight, cuttingType);
      setModalVisible(false);
      setSelectedProductData(null);
    }
  };

  const getProductQuantityInCart = (productId: string, weight: number) => {
    return cart
      .filter((item) => item.product.id === productId && item.weight === weight)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <View style={styles.container}>
      {/* 1. Custom Header with Search */}
      <View style={[styles.headerBg, { paddingTop: insets.top + 20 }]}>
        <View style={{ maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
          <View style={styles.headerTopRow}>
            <Text style={styles.logo}>Meat Up</Text>
            <TouchableOpacity
              style={styles.cartBtn}
              onPress={() => router.push('/cart')}
            >
              <ShoppingCart size={24} color={Colors.cream} />
              {cartItemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartItemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.searchBarContainer}>
            <Search size={18} color={Colors.deepTeal.substring(0, 7) + '90'} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for fresh cuts..."
              placeholderTextColor={Colors.deepTeal.substring(0, 7) + '70'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
      >

        {/* 2. Live Ticker */}
        {topProducts.length > 0 && (
          <View style={styles.tickerSection}>
            <View style={styles.tickerHeader}>
              <View style={styles.liveDot} />
              <Text style={styles.tickerTitle}>LIVE MARKET</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {topProducts.map(product => (
                <TickerItem key={product.id} product={product} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* 3. Products Grid */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Fresh Products</Text>
          <View style={[styles.grid, numColumns > 1 && styles.rowGrid]}>
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                numColumns={numColumns}
                onPress={() => router.push(`/product/${product.id}`)}
                onAddToCart={(w) => handleAddToCartRequest(product, w)}
                onRemoveFromCart={(w) => handleRemoveFromCart(product.id, w)}
                quantityInCart={(w) => getProductQuantityInCart(product.id, w)}
              />
            ))}
          </View>
        </View>

        {/* Space for floating cart */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <CuttingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleCuttingTypeSelect}
        options={selectedProductData?.cuttingTypes}
        variants={selectedProductData?.variants}
        weight={selectedProductData?.weight}
        title={selectedProductData?.variants ? "Select Type" : "Select Cutting Type"}
      />

      {/* 4. Floating Cart Banner */}
      {cartItemCount > 0 && (
        <View style={[
          styles.floatCartContainer,
          {
            bottom: isTablet ? 95 : 15, // Adjust to float closely above the footer
          }
        ]}>
          <TouchableOpacity
            style={[
              styles.floatCartBtn,
              {
                width: '100%',
                maxWidth: isUltraWide ? 1000 : isDesktop ? 800 : isTablet ? 600 : '100%'
              }
            ]}
            onPress={() => router.push('/cart')}
          >
            <View style={styles.floatCartLeft}>
              <View style={styles.floatIconBg}>
                <ShoppingBag size={20} color={Colors.deepTeal} />
                <View style={styles.floatBadge}>
                  <Text style={styles.floatBadgeText}>{cartItemCount}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.floatCartLabel}>Total</Text>
                <Text style={styles.floatCartValue}>₹{cartTotal.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.floatCartRight}>
              <Text style={styles.viewCartText}>View Cart</Text>
              <ArrowRight size={18} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Subcomponents

function TickerItem({ product }: { product: Product }) {
  const isUp = product.price_direction === 'up';
  const isDown = product.price_direction === 'down';
  const color = isUp ? Colors.priceUp : isDown ? Colors.priceDown : Colors.priceNeutral;
  const Icon = isUp ? TrendingUp : TrendingDown;
  const priceQty = product.price_quantity || 1;

  return (
    <View style={styles.tickerItem}>
      <Text style={styles.tickerName}>{product.name}</Text>
      <View style={styles.tickerRow}>
        <Text style={styles.tickerPrice}>₹{product.current_price}</Text>
        {product.price_direction !== 'neutral' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Icon size={12} color={color} />
            <Text style={[styles.tickerChange, { color }]}>{Math.abs(product.price_change_percentage)}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ProductCard({
  product,
  onPress,
  onAddToCart,
  onRemoveFromCart,
  quantityInCart,
  numColumns = 1,
}: {
  product: Product;
  onPress: () => void;
  onAddToCart: (weight: number) => void;
  onRemoveFromCart: (weight: number) => void;
  quantityInCart: (weight: number) => number;
  numColumns?: number;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const contentMaxWidth = 1400;
  const gap = 20;
  const horizontalPadding = 20;
  const availableWidth = Math.min(windowWidth, contentMaxWidth) - (horizontalPadding * 2);
  const cardWidth = numColumns > 1 ? (availableWidth - (gap * (numColumns - 1))) / numColumns : '100%';

  const priceQty = product.price_quantity || 1;
  const isPcUnit = product.unit?.toLowerCase() === 'pc' || product.unit?.toLowerCase() === 'pack' || product.name.toLowerCase().includes('egg');

  const getDefaultWeight = () => {
    if (product.name.toLowerCase().includes('egg')) return 6;
    if (product.unit?.toLowerCase() === 'kg') return 0.5;
    if (product.unit?.toLowerCase() === 'g') return 250;
    if (isPcUnit) return 1 * priceQty;
    return 1;
  };

  const [selectedWeight, setSelectedWeight] = useState(getDefaultWeight());

  // Convert display weight to cart weight
  const cartWeight = selectedWeight; 
  const quantity = quantityInCart(cartWeight);

  const getOptions = () => {
    if (product.name.toLowerCase().includes('egg')) return [6, 12, 30];
    if (product.unit?.toUpperCase() === 'KG') return [0.5, 1, 2];
    if (product.unit?.toUpperCase() === 'G') return [250, 500, 1000];
    if (isPcUnit) return [1 * priceQty, 2 * priceQty];
    return [0.5, 1, 2];
  };

  const options = getOptions();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        !isProductAvailableToday(product) && styles.cardOutOfStock,
        { width: cardWidth }
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View>
        <Image source={{ uri: product.image }} style={[styles.cardImage, !isProductAvailableToday(product) && { opacity: 0.45 }]} resizeMode="cover" />
        {!isProductAvailableToday(product) && (
          <View style={styles.outOfStockOverlay}>
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockBadgeText}>Out of Stock</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{product.name}</Text>
          <View style={styles.priceTag}>
            <Text style={styles.priceTagText}>₹{product.current_price}</Text>
            <Text style={styles.priceUnit}>/{isPcUnit ? 'PC' : product.unit}</Text>
          </View>
        </View>

        <Text style={styles.cardDesc} numberOfLines={1}>{product.description}</Text>

        {/* Variant Selector */}
        <View style={styles.variantContainer}>
          {options.map((opt) => {
            const label = isPcUnit
              ? `${opt} PC`
              : `${opt} ${product.unit}`;
            const isSelected = selectedWeight === opt;

            return (
              <TouchableOpacity
                key={opt}
                style={[styles.variantChip, isSelected && styles.variantChipActive]}
                onPress={() => setSelectedWeight(opt)}
              >
                <Text style={[styles.variantText, isSelected && styles.variantTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add Button or Out of Stock Message */}
        {!isProductAvailableToday(product) ? (
          <View style={styles.nextAvailableContainer}>
            <View style={styles.nextAvailableRow}>
              <View style={styles.nextAvailableDot} />
              <Text style={styles.nextAvailableLabel}>Next Available</Text>
            </View>
            <Text style={styles.nextAvailableValue}>
              {product.available_days && product.available_days.length > 0
                ? getNextAvailableDay(product.available_days)
                : product.next_available || 'Check back soon'}
            </Text>
          </View>
        ) : quantity === 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => onAddToCart(cartWeight)}>
            <Text style={styles.addBtnText}>ADD</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyContainer}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => onRemoveFromCart(cartWeight)}>
              <Minus size={16} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => onAddToCart(cartWeight)}>
              <Plus size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 10,
    marginBottom: -24, // Overlap effect
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    height: 50,
  },
  logo: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.cream,
    letterSpacing: 0.5,
  },
  cartBtn: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.orange,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.deepTeal,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 10,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.deepTeal,
    fontWeight: '500',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  } as any,

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 40, // Space for header overlap
    paddingBottom: 120,
    alignSelf: 'center',
    width: '100%',
  },

  // Ticker
  tickerSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  tickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.extrared,
  },
  tickerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.deepTeal,
    letterSpacing: 1,
  },
  tickerItem: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 16,
    marginRight: 12,
    minWidth: 130,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tickerName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  tickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tickerPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  tickerChange: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Products
  productsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.charcoal,
    marginBottom: 16,
    marginLeft: 4,
  },
  grid: {
    gap: 20,
  },
  rowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Product Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.creamLight,
  },
  cardOutOfStock: {
    opacity: 0.85,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  outOfStockBadgeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nextAvailableContainer: {
    backgroundColor: '#FFFBF5',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E0C4',
  },
  nextAvailableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  nextAvailableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.orange,
  },
  nextAvailableLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.orange,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nextAvailableValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  cardContent: {
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.charcoal,
    flex: 1,
    marginRight: 8,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceTagText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.orange,
  },
  priceUnit: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
    marginBottom: 16,
  },
  variantContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  variantChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.creamLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantChipActive: {
    backgroundColor: Colors.deepTeal,
  },
  variantText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  variantTextActive: {
    color: Colors.white,
  },

  // Add Button / Qty
  addBtn: {
    backgroundColor: Colors.deepTeal,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.deepTeal,
    borderRadius: 16,
    padding: 6,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Floating Cart
  floatCartContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  floatCartBtn: {
    backgroundColor: Colors.orange,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  floatCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatIconBg: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.deepTeal,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  floatCartLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  floatCartValue: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: '800',
  },
  floatCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  viewCartText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});