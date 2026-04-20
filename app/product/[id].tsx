import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { TrendingUp, TrendingDown, Minus, Plus, ChevronLeft, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import CuttingModal from '@/components/CuttingModal';
import { getNextAvailableDay, isProductAvailableToday } from '@/utils/getNextAvailableDay';
import { Star, MessageSquare } from 'lucide-react-native';
import { ReviewService } from '@/services/ReviewService';
import ReviewModal from '@/components/ReviewModal';
import { Review } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, addToCart } = useApp();
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;
  const contentMaxWidth = 1100;

  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const product = products.find((p) => p.id === id);

  React.useEffect(() => {
    if (id) {
      const unsubscribe = ReviewService.subscribeToProductReviews(id as string, (updatedReviews) => {
        setReviews(updatedReviews);
      });
      return () => unsubscribe();
    }
  }, [id]);

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }


  const priceColor =
    product.price_direction === 'up'
      ? Colors.priceUp
      : product.price_direction === 'down'
        ? Colors.priceDown
        : Colors.priceNeutral;

  const Icon = product.price_direction === 'up' ? TrendingUp : TrendingDown;
  const isPcUnit = product.unit?.toLowerCase() === 'pc' || product.unit?.toLowerCase() === 'pack' || product.name.toLowerCase().includes('egg');
  const isEgg = product.name.toLowerCase().includes('egg');
  const weightOptions = isEgg ? [6, 12, 30] : isPcUnit ? [15, 30] : [0.5, 1, 2, 3, 4];
  const defaultWeight = weightOptions[0];
  const effectiveWeight = selectedWeight ?? defaultWeight;
  const availableToday = isProductAvailableToday(product);

  const cartWeight = effectiveWeight; // Weight options are already the actual counts (6, 12, 30, etc.)
  const totalPrice = product.current_price * cartWeight * quantity;
  const earnPoints = isPcUnit ? 0 : Math.floor(effectiveWeight * quantity);

  const handleAddToCartRequest = () => {
    if (product.variants && product.variants.length > 0) {
      setModalVisible(true);
    } else if (product.cutting_types && product.cutting_types.length > 0) {
      setModalVisible(true);
    } else {
      for (let i = 0; i < quantity; i++) {
        addToCart(product.id, 1, cartWeight);
      }
      router.back();
    }
  };

  const handleCuttingTypeSelect = (cuttingType: string) => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product.id, 1, cartWeight, cuttingType);
    }
    setModalVisible(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false, // Hide default header for custom look
        }}
      />

      {/* Custom Header for Back Button */}
      <SafeAreaView style={styles.customHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={28} color={Colors.white} />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={isLargeScreen && styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={isLargeScreen ? styles.rowLayout : null}>
          {/* Left Column: Image */}
          <View style={isLargeScreen ? styles.leftColumn : null}>
            <View style={[styles.imageContainer, isLargeScreen && styles.largeImageContainer]}>
              <Image source={{ uri: product.image }} style={[styles.productImage, !availableToday && { opacity: 0.45 }]} resizeMode="cover" />
              <View style={styles.imageOverlay} />
              {!availableToday && (
                <View style={styles.outOfStockOverlay}>
                  <View style={styles.outOfStockBadge}>
                    <Text style={styles.outOfStockBadgeText}>Out of Stock</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Right Column: Details */}
          <View style={isLargeScreen ? styles.rightColumn : null}>
            <View style={[styles.contentContainer, isLargeScreen && styles.largeContentContainer]}>
              {/* Drag handle only for mobile overlap look */}
              {!isLargeScreen && <View style={styles.dragHandle} />}

              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{product.category}</Text>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <View style={styles.priceWrapper}>
                    <Text style={styles.currency}>₹</Text>
                    <Text style={styles.currentPrice}>{product.current_price}</Text>
                    <Text style={styles.unit}>/{isPcUnit ? 'PC' : product.unit}</Text>
                  </View>

                  {product.price_direction !== 'neutral' && (
                    <View style={[styles.priceChange, { backgroundColor: priceColor }]}>
                      <Icon size={14} color={Colors.white} />
                      <Text style={styles.priceChangeText}>
                        {product.price_direction === 'up' ? '+' : ''}
                        {product.price_change_percentage}%
                      </Text>
                    </View>
                  )}

                  <View style={styles.ratingOverview}>
                    <Star size={16} fill={Colors.orange} color={Colors.orange} />
                    <Text style={styles.ratingValue}>{product.rating || 'New'}</Text>
                    {product.num_reviews ? (
                      <Text style={styles.ratingCount}>({product.num_reviews} reviews)</Text>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{product.description}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select {isEgg ? 'Pack Size' : isPcUnit ? 'Quantity' : 'Weight'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weightOptions}>
                  {weightOptions.map((weight) => (
                    <TouchableOpacity
                      key={weight}
                      style={[
                        styles.weightOption,
                        effectiveWeight === weight && styles.weightOptionActive,
                        !availableToday && styles.weightOptionDisabled,
                      ]}
                      onPress={() => setSelectedWeight(weight)}
                      disabled={!availableToday}
                    >
                      <Text
                        style={[
                          styles.weightOptionText,
                          effectiveWeight === weight && styles.weightOptionTextActive,
                        ]}
                      >
                        {weight} {isPcUnit ? 'PC' : 'kg'}
                      </Text>
                      {effectiveWeight === weight && <View style={styles.activeDot} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.section}>
                <View style={styles.quantityRow}>
                  <Text style={styles.sectionTitle}>Quantity</Text>
                  <View style={styles.quantitySelector}>
                    <TouchableOpacity
                      style={[styles.quantityButton, quantity === 1 && styles.quantityButtonDisabled]}
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity === 1}
                    >
                      <Minus size={18} color={quantity === 1 ? '#AAA' : Colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(quantity + 1)}
                    >
                      <Plus size={18} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {earnPoints > 0 && (
                <View style={styles.rewardCard}>
                  <View style={styles.rewardIconContainer}>
                    <Image source={require('../../assets/images/cp.png')} style={styles.rewardIcon} resizeMode="contain" />
                  </View>
                  <View>
                    <Text style={styles.rewardTitle}>Premium Rewards</Text>
                    <Text style={styles.rewardText}>
                      Earn <Text style={{ fontWeight: 'bold', color: Colors.white }}>{earnPoints} Meat Points</Text>
                    </Text>
                  </View>
                </View>
              )}

              {/* Reviews Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Customer Reviews</Text>
                  <TouchableOpacity 
                    style={styles.reviewBtn}
                    onPress={() => user ? setReviewModalVisible(true) : alert('Please log in to leave a review')}
                  >
                    <MessageSquare size={16} color={Colors.tealBlue} />
                    <Text style={styles.reviewBtnText}>Write a Review</Text>
                  </TouchableOpacity>
                </View>

                {reviews.length === 0 ? (
                  <View style={styles.emptyReviews}>
                    <Text style={styles.emptyReviewsText}>No reviews yet. Be the first to share your thoughts!</Text>
                  </View>
                ) : (
                  <View style={styles.reviewsList}>
                    {reviews.map((review) => (
                      <View key={review.id} style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                          <Text style={styles.reviewerName}>{review.user_name}</Text>
                          <View style={styles.reviewStars}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                fill={i < review.rating ? Colors.orange : 'transparent'}
                                color={i < review.rating ? Colors.orange : '#CCC'}
                              />
                            ))}
                          </View>
                        </View>
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(review.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={{ height: 100 }} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={[styles.footerContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
          {availableToday ? (
            <>
              <View>
                <Text style={styles.footerLabel}>Total Amount</Text>
                <Text style={styles.footerPrice}>₹{totalPrice.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCartRequest}>
                <Text style={styles.addToCartText}>Add to Cart</Text>
                <ArrowRight size={20} color={Colors.white} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.nextAvailableFooter}>
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
          )}
        </View>
      </View>

      <CuttingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleCuttingTypeSelect}
        options={product.cutting_types}
        variants={product.variants}
        weight={cartWeight}
        title={product.variants && product.variants.length > 0 ? "Select Type" : "Select Cutting Type"}
      />

      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        productId={product.id}
        userId={user?.uid || ''}
        userName={user?.displayName || 'Customer'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepTeal,
  },
  customHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1100,
    paddingTop: 40,
  },
  rowLayout: {
    flexDirection: 'row',
    gap: 40,
    paddingHorizontal: 24,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  imageContainer: {
    height: 480,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  largeImageContainer: {
    borderRadius: 24,
    height: 600,
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.deepTeal,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  outOfStockBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  weightOptionDisabled: {
    opacity: 0.4,
  },
  nextAvailableFooter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nextAvailableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    fontSize: 20,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  contentContainer: {
    marginTop: -40,
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: 500,
  },
  largeContentContainer: {
    marginTop: 0,
    paddingHorizontal: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    backgroundColor: 'transparent',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.charcoal,
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.5,
  },
  categoryBadge: {
    backgroundColor: Colors.tealBlue.substring(0, 7) + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.tealBlue.substring(0, 7) + '30',
  },
  categoryText: {
    fontSize: 12,
    color: Colors.tealBlue,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.orange,
    marginRight: 2,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.orange,
    letterSpacing: -1,
  },
  unit: {
    fontSize: 16,
    color: Colors.charcoal.substring(0, 7) + '90',
    fontWeight: '500' as const,
    marginLeft: 2,
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priceChangeText: {
    fontSize: 13,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.charcoal,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: Colors.charcoal.substring(0, 7) + 'CC',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 18,
    color: Colors.cream,
    textAlign: 'center',
    marginTop: 40,
  },
  weightOptions: {
    paddingRight: 20,
    gap: 12,
  },
  weightOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  weightOptionActive: {
    backgroundColor: Colors.tealBlue,
    borderColor: Colors.tealBlue,
    shadowColor: Colors.tealBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  weightOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.charcoal,
  },
  weightOptionTextActive: {
    color: Colors.white,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tealBlue,
    position: 'absolute',
    bottom: 6,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.tealBlue.substring(0, 7) + '20', // Light teal border
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    maxWidth: 160,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: Colors.tealBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.tealBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  quantityButtonDisabled: {
    backgroundColor: '#F0F0F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.tealBlue,
    minWidth: 32,
    textAlign: 'center',
  },
  rewardCard: {
    backgroundColor: Colors.deepTealDark, // Premium dark background
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rewardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  rewardIcon: {
    width: 25,
    height: 25,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.cream, // Light text for dark bg
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  rewardText: {
    fontSize: 13,
    color: Colors.creamLight,
    opacity: 0.9,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  footerLabel: {
    fontSize: 13,
    color: Colors.charcoal.substring(0, 7) + '80',
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.charcoal,
    letterSpacing: -0.5,
  },
  addToCartButton: {
    backgroundColor: Colors.orange,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.orange,
  },
  ratingCount: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.tealBlue.substring(0, 7) + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.tealBlue.substring(0, 7) + '20',
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.tealBlue,
  },
  emptyReviews: {
    padding: 24,
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CCC',
  },
  emptyReviewsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 11,
    color: '#AAA',
    fontWeight: '600',
  },
});
