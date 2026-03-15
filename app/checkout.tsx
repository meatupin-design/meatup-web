import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MapPin, Clock, Wallet, Navigation, FileText, ChevronLeft, CheckCircle2, Truck, TicketPercent, Sparkles } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { calculateDistance, calculateDeliveryTime, STORE_LOCATION } from '@/utils/locationUtils';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import RazorpayCheckoutGateway from '@/components/RazorpayCheckoutGateway';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/config/firebaseConfig';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 1024;
  const { cart, cartTotal, user, placeOrder } = useApp();
  const [address, setAddress] = useState(user.address || '');
  const [useWalletPoints, setUseWalletPoints] = useState(false);
  const [note, setNote] = useState('');
  const [orderSuccessVisible, setOrderSuccessVisible] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('cod');
  const [showRazorpayGateway, setShowRazorpayGateway] = useState(false);
  const [currentRazorpayOrderId, setCurrentRazorpayOrderId] = useState('');

  const [locationLoading, setLocationLoading] = useState(false);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [deliveryTime, setDeliveryTime] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const firstOrderDiscount = !user.is_first_order_completed ? cartTotal * 0.1 : 0;

  // Tax Calculation
  const taxRate = 0.05; // 5% for now
  const taxAmount = cartTotal * taxRate;

  // Platform Fee Calculation
  const platformFeeRate = 0.03; // 3%
  const platformFeeAmount = cartTotal * platformFeeRate;

  // Delivery Charge Calculation
  const freeDistance = 7;
  const ratePerKm = 5;
  let deliveryCharge = 0;

  if (deliveryDistance && deliveryDistance > freeDistance) {
    deliveryCharge = Math.ceil((deliveryDistance - freeDistance) * ratePerKm);
  }

  const maxWalletRedemption = Math.min(user.wallet_points, cartTotal - firstOrderDiscount + taxAmount + platformFeeAmount + deliveryCharge);
  const walletDeduction = useWalletPoints ? maxWalletRedemption : 0;

  const finalTotal = Math.max(0, cartTotal + taxAmount + platformFeeAmount + deliveryCharge - firstOrderDiscount - walletDeduction);

  useEffect(() => {
    // Attempt to get location on mount if address is empty or just to check
    getCurrentLocation();
  }, []);

  // Auto-calculate delivery when address changes
  useEffect(() => {
    if (!address.trim()) return;

    const timer = setTimeout(() => {
      calculateFromAddress();
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [address]);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        setLocationLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;

      const dist = calculateDistance(
        latitude,
        longitude,
        STORE_LOCATION.latitude,
        STORE_LOCATION.longitude
      );

      if (dist > 20) {
        setDeliveryDistance(null);
        setDeliveryTime(null);
        setLocationError('Delivery is currently unavailable in your area (Max 20km).');
      } else {
        setDeliveryDistance(parseFloat(dist.toFixed(1)));
        setDeliveryTime(calculateDeliveryTime(dist));
      }

      if (!address) {
        let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          const formattedAddress = `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim();
          setAddress(formattedAddress);
        }
      }

    } catch (error) {
      setLocationError('Could not fetch location');
      console.error(error);
    } finally {
      setLocationLoading(false);
    }
  };

  const calculateFromAddress = async () => {
    if (!address.trim()) return;

    setLocationLoading(true);
    setLocationError(null);

    const tryGeocode = async (addr: string) => {
      try {
        const result = await Location.geocodeAsync(addr);
        if (result.length > 0) return { lat: result[0].latitude, lon: result[0].longitude };
      } catch (e) { }

      try {
        const encoded = encodeURIComponent(addr);
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}`, {
          headers: { 'User-Agent': 'MeatUPApp/1.0' }
        });
        const data = await resp.json();
        if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      } catch (e) { }

      return null;
    };

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }

      let coords = null;
      const pincodeMatch = address.match(/\b\d{6}\b/);

      // 1. Try Geocoding with Pin Code first if present (User's source of truth)
      if (pincodeMatch) {
        coords = await tryGeocode(pincodeMatch[0]);
      }

      // 2. Fallback to Full Address
      if (!coords) {
        coords = await tryGeocode(address);
      }

      // 3. Fallback to Simplified Address if full address fails
      if (!coords) {
        const parts = address.split(',').map((p: string) => p.trim());
        if (parts.length > 2) {
          const simpleAddress = parts.slice(-3).join(', ');
          coords = await tryGeocode(simpleAddress);
        }
      }

      if (!coords) {
        setLocationError('Could not find location. Please ensure "City, State - Pincode" is correct.');
        return;
      }

      const { lat, lon } = coords;
      const dist = calculateDistance(
        lat,
        lon,
        STORE_LOCATION.latitude,
        STORE_LOCATION.longitude
      );

      if (dist > 20) {
        setDeliveryDistance(null);
        setDeliveryTime(null);
        setLocationError('Delivery is currently unavailable in your area (Max 20km).');
      } else {
        setDeliveryDistance(parseFloat(dist.toFixed(1)));
        setDeliveryTime(calculateDeliveryTime(dist));
      }

    } catch (error) {
      setLocationError('Error calculating distance');
      console.error(error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter delivery address');
      return;
    }

    const slotString = deliveryTime
      ? `Within ${deliveryTime} mins`
      : 'Standard Delivery';

    if (paymentMethod === 'cod') {
      try {
        const result = await placeOrder(address, slotString, walletDeduction, note, deliveryCharge);
        if (!result) throw new Error("Order placement failed");

        const { display_id } = result;
        setPlacedOrderId(display_id);
        setOrderSuccessVisible(true);
      } catch (error) {
        Alert.alert('Error', 'Failed to place order. Please try again.');
        console.error(error);
      }
    } else {
      // Razorpay Online Payment Flow - Via Vercel Serverless Function
      try {
        const response = await fetch('/api/createRazorpayOrder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: finalTotal,
            currency: 'INR'
          })
        });

        let responseData;
        const rawText = await response.text();
        
        try {
           responseData = JSON.parse(rawText);
        } catch (e) {
           throw new Error(`Server returned non-JSON response: ${rawText.substring(0, 100)}`);
        }

        if (!response.ok || responseData.error) {
           throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
        }

        const razorpayOrderId = responseData.id;

        // 2. Open WebView Gateway
        setCurrentRazorpayOrderId(razorpayOrderId);
        setShowRazorpayGateway(true);

      } catch (error: any) {
        Alert.alert('Payment Initialization Failed', error.message || 'An unknown error occurred.');
        console.error("Razorpay Error:", error);
      }
    }
  };

  const handleRazorpaySuccess = async (data: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
    setShowRazorpayGateway(false);

    // Create actual order in Firebase now that payment succeeded
    const slotString = deliveryTime
      ? `Within ${deliveryTime} mins`
      : 'Standard Delivery';

    try {
      const paymentDetails = {
        payment_id: data.razorpay_payment_id,
        razorpay_order_id: data.razorpay_order_id,
        signature: data.razorpay_signature // can be saved if needed
      };

      const result = await placeOrder(address, slotString, walletDeduction, note, deliveryCharge, paymentDetails);
      if (!result) throw new Error("Order placement failed");

      const { display_id } = result;
      setPlacedOrderId(display_id);
      setOrderSuccessVisible(true);
    } catch (error) {
      Alert.alert('Payment Verified but Order Failed', 'Please contact support with your Payment ID.');
      console.error(error);
    }
  };

  const handleTrackOrder = () => {
    setOrderSuccessVisible(false);
    router.replace('/orders');
  };

  const handleContinueShopping = () => {
    setOrderSuccessVisible(false);
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 1. Custom Header matching Profile.tsx */}
      <View style={[styles.headerBg, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color={Colors.cream} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Checkout</Text>
          <View style={{ width: 28 }} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.scrollContent,
          isLargeScreen && styles.largeScreenContent
        ]}>
          {/* Header/Banner Section */}
          <View style={isLargeScreen ? { marginBottom: 24 } : null}>
            {/* First Order Discount Banner */}
            {firstOrderDiscount > 0 && (
              <View style={styles.discountBanner}>
                <View style={styles.discountIconContainer}>
                  <TicketPercent size={24} color={Colors.white} />
                </View>
                <View style={styles.discountContent}>
                  <Text style={styles.discountTitle}>First Order Offer Applied!</Text>
                  <Text style={styles.discountSubtitle}>
                    You'll save 10% on this order as a welcome gift.
                  </Text>
                </View>
                <Sparkles size={24} color={Colors.cream} style={{ opacity: 0.8 }} />
              </View>
            )}
          </View>

          <View style={[
            styles.mainLayout,
            isLargeScreen && styles.rowLayout
          ]}>
            {/* Left Column: Details & Preferences */}
            <View style={[
              styles.leftColumn,
              isLargeScreen && styles.largeLeftColumn
            ]}>
              {/* 2. Unified Delivery Card */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Delivery Details</Text>
                <View style={styles.card}>
                  {/* Address Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <MapPin size={14} color={Colors.deepTeal} style={{ marginRight: 6 }} />
                      <Text style={styles.label}>Address</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="House No, Building, Landmark, City..."
                      placeholderTextColor="#999"
                      multiline
                    />
                    <TouchableOpacity
                      style={styles.locateButton}
                      onPress={getCurrentLocation}
                      disabled={locationLoading}
                    >
                      {locationLoading ? (
                        <ActivityIndicator size="small" color={Colors.deepTeal} />
                      ) : (
                        <>
                          <Navigation size={14} color={Colors.deepTeal} />
                          <Text style={styles.locateText}>Use Current Location</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    {locationError && <Text style={styles.errorText}>{locationError}</Text>}
                  </View>

                  {/* Delivery Estimate Badge */}
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <View style={styles.iconCircle}>
                      <Clock size={20} color={Colors.deepTeal} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Estimated Arrival</Text>
                      <Text style={styles.infoValue}>
                        {deliveryTime ? `${deliveryTime} mins` : 'Calculating...'}
                      </Text>
                    </View>
                    {deliveryDistance && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{deliveryDistance} km</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* 3. Order Preferences */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.card}>
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <FileText size={14} color={Colors.deepTeal} style={{ marginRight: 6 }} />
                      <Text style={styles.label}>Order Note</Text>
                    </View>
                    <TextInput
                      style={[styles.input, { minHeight: 60, height: 'auto' }]}
                      value={note}
                      onChangeText={setNote}
                      placeholder="e.g. Leave at door, Ring bell..."
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </View>

              {/* 4. Wallet (Matching Card Style) */}
              {user.wallet_points > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Offers & Wallet</Text>
                  <View style={styles.card}>
                    <View style={styles.walletHeader}>
                      <View>
                        <Text style={styles.cardLabel}>Meat Points</Text>
                        <Text style={styles.walletPoints}>{user.wallet_points}</Text>
                        <Text style={styles.walletSub}>Available Balance</Text>
                      </View>
                      <View style={styles.walletIconContainer}>
                        <Image source={require('../assets/images/cp-profile.png')} style={styles.walletIcon} resizeMode="contain" />
                      </View>
                    </View>

                    <View style={styles.walletAction}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.walletSaveText}>
                          Save <Text style={{ fontWeight: 'bold', color: Colors.orange }}>₹{maxWalletRedemption.toFixed(0)}</Text> on this order
                        </Text>
                      </View>
                      <Switch
                        trackColor={{ false: Colors.cream.substring(0, 7), true: Colors.deepTeal.substring(0, 7) }}
                        thumbColor={useWalletPoints ? Colors.cream.substring(0, 7) : Colors.deepTeal.substring(0, 7)}
                        ios_backgroundColor={Colors.cream.substring(0, 7)}
                        onValueChange={setUseWalletPoints}
                        value={useWalletPoints}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Right Column: Summary & Payment */}
            <View style={[
              styles.rightColumn,
              isLargeScreen && styles.largeRightColumn
            ]}>
              {/* 5. Bill Summary */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Payment Summary</Text>
                <View style={styles.card}>
                  {cart.map((item, index) => {
                    let itemPrice = item.product.current_price;
                    if (item.product.variants && item.cuttingType) {
                      const variant = item.product.variants.find(v => v.name === item.cuttingType);
                      if (variant) itemPrice = variant.price;
                    }

                    return (
                      <View key={`${item.product.id}-${index}`} style={styles.billItemRow}>
                        <Text style={styles.billItemQty}>{item.quantity}x</Text>
                        <View style={{ flex: 1, paddingHorizontal: 10 }}>
                          <Text style={styles.billItemName}>{item.product.name}</Text>
                          <Text style={styles.billItemMeta}>
                            {item.product.unit === 'PC' || item.product.unit === 'pack'
                              ? `${item.weight * (item.product.price_quantity || 1)}pc`
                              : `${item.weight}${item.product.unit}`} {item.cuttingType ? `• ${item.cuttingType}` : ''}
                          </Text>
                        </View>
                        <Text style={styles.billItemPrice}>
                          ₹{(itemPrice * item.quantity * item.weight).toFixed(2)}
                        </Text>
                      </View>
                    );
                  })}

                  <View style={styles.dashedLine} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax ({(taxRate * 100).toFixed(0)}%)</Text>
                    <Text style={styles.summaryValue}>+₹{taxAmount.toFixed(2)}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Platform Fee ({(platformFeeRate * 100).toFixed(0)}%)</Text>
                    <Text style={styles.summaryValue}>+₹{platformFeeAmount.toFixed(2)}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Charge</Text>
                    <Text style={[styles.summaryValue, deliveryCharge === 0 && { color: Colors.priceUp }]}>
                      {deliveryCharge === 0 ? 'Free' : `+₹${deliveryCharge.toFixed(2)}`}
                    </Text>
                  </View>

                  {firstOrderDiscount > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: Colors.priceUp }]}>New User Discount</Text>
                      <Text style={[styles.summaryValue, { color: Colors.priceUp }]}>-₹{firstOrderDiscount.toFixed(2)}</Text>
                    </View>
                  )}

                  {useWalletPoints && walletDeduction > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: Colors.orange }]}>Points Redeemed</Text>
                      <Text style={[styles.summaryValue, { color: Colors.orange }]}>-₹{walletDeduction.toFixed(2)}</Text>
                    </View>
                  )}

                  <View style={styles.totalDivider} />

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
                  </View>

                  <View style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.charcoal, marginBottom: 12 }}>Pay Via</Text>

                    <TouchableOpacity
                      style={[
                        styles.paymentMethodCard,
                        paymentMethod === 'online' && styles.paymentMethodCardActive
                      ]}
                      onPress={() => setPaymentMethod('online')}
                    >
                      <View style={[styles.radioCircle, paymentMethod === 'online' && styles.radioCircleActive]}>
                        {paymentMethod === 'online' && <View style={styles.radioInner} />}
                      </View>
                      <Wallet size={20} color={paymentMethod === 'online' ? Colors.deepTeal : '#888'} />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={[styles.pmTitle, paymentMethod === 'online' && styles.pmTitleActive]}>Pay via UPI</Text>
                        <Text style={styles.pmSub}>Google Pay, PhonePe, Paytm, etc. (Secure)</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentMethodCard,
                        paymentMethod === 'cod' && styles.paymentMethodCardActive,
                        { marginTop: 12 }
                      ]}
                      onPress={() => setPaymentMethod('cod')}
                    >
                      <View style={[styles.radioCircle, paymentMethod === 'cod' && styles.radioCircleActive]}>
                        {paymentMethod === 'cod' && <View style={styles.radioInner} />}
                      </View>
                      <CheckCircle2 size={20} color={paymentMethod === 'cod' ? Colors.deepTeal : '#888'} />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={[styles.pmTitle, paymentMethod === 'cod' && styles.pmTitleActive]}>Cash on Delivery</Text>
                        <Text style={styles.pmSub}>Pay cash at the time of delivery</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Desktop PLACE ORDER button */}
                  {isLargeScreen && (
                    <TouchableOpacity
                      style={[styles.checkoutBtn, { marginTop: 24 }]}
                      onPress={handlePlaceOrder}
                    >
                      <View style={styles.btnContent}>
                        <Text style={styles.btnText}>PLACE ORDER</Text>
                        <View style={styles.btnDivider} />
                        <Text style={styles.btnPrice}>₹{finalTotal.toFixed(2)}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: isLargeScreen ? 60 : 100 }} />
      </ScrollView>

      {/* Floating Footer - Only on Mobile */}
      {!isLargeScreen && (
        <View style={styles.floatFooter}>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handlePlaceOrder}>
            <View style={styles.btnContent}>
              <Text style={styles.btnText}>PLACE ORDER</Text>
              <View style={styles.btnDivider} />
              <Text style={styles.btnPrice}>₹{finalTotal.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <OrderSuccessModal
        visible={orderSuccessVisible}
        orderId={placedOrderId}
        onTrackOrder={handleTrackOrder}
        onContinueShopping={handleContinueShopping}
      />

      {showRazorpayGateway && (
        <RazorpayCheckoutGateway
          amount={finalTotal}
          orderId={currentRazorpayOrderId}
          name={user.name || 'Meat UP Customer'}
          email={user.email || 'customer@meatup.com'}
          contact={user.phone || '9999999999'}
          onSuccess={handleRazorpaySuccess}
          onClose={() => setShowRazorpayGateway(false)}
          onError={(errorMsg) => {
            setShowRazorpayGateway(false);
            Alert.alert('Payment Initialization Failed', errorMsg || 'An unknown error occurred with Razorpay.');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  // Replicated Header Styles
  headerBg: {
    backgroundColor: Colors.deepTeal,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: -20, // Negative margin to allow content overlap overlap if needed, but we use scrollContent padding here
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.cream,
    letterSpacing: 0.5,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  largeScreenContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  mainLayout: {
    flexDirection: 'column',
  },
  rowLayout: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
  },
  largeLeftColumn: {
    flex: 1.6, // Allocate more space to details
  },
  rightColumn: {
    flex: 1,
  },
  largeRightColumn: {
    position: Platform.OS === 'web' ? 'sticky' : 'relative' as any,
    top: 20,
  },

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

  // Section Styles
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // Input Styles matching Profile
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    textAlignVertical: 'top',
  },
  locateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.deepTeal.substring(0, 7) + '10',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  locateText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.deepTeal,
  },
  errorText: {
    color: Colors.priceDown,
    fontSize: 12,
    marginTop: 4,
  },

  // Delivery Info
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.deepTeal.substring(0, 7) + '10', // Light tint
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  badge: {
    backgroundColor: Colors.orange,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },

  // Wallet
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.deepTeal,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
    marginBottom: 4,
  },
  walletPoints: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.deepTeal,
  },
  walletSub: {
    fontSize: 13,
    color: '#888',
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.orange.substring(0, 7) + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIcon: {
    width: 28,
    height: 28,
  },
  walletAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 16,
    justifyContent: 'space-between',
  },
  walletSaveText: {
    fontSize: 13,
    color: Colors.charcoal,
  },

  // Bill & Footer
  billItemRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  billItemQty: {
    fontWeight: '700',
    color: Colors.deepTeal,
    fontSize: 14,
    width: 24,
  },
  billItemName: {
    fontSize: 14,
    color: Colors.charcoal,
    fontWeight: '600',
  },
  billItemMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  billItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
    borderRadius: 1,
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#888',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.deepTeal,
  },
  codBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4', // Light green
    padding: 8,
    borderRadius: 12,
    marginTop: 16,
    gap: 6,
  },
  codText: {
    fontSize: 12,
    color: Colors.deepTeal,
    fontWeight: '600',
  },

  // Footer
  floatFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  checkoutBtn: {
    backgroundColor: Colors.deepTeal,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: Colors.deepTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  btnDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  btnPrice: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#eee',
    borderRadius: 16,
    backgroundColor: Colors.white,
  },
  paymentMethodCardActive: {
    borderColor: Colors.deepTeal,
    backgroundColor: Colors.deepTeal.substring(0, 7) + '08',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleActive: {
    borderColor: Colors.deepTeal,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.deepTeal,
  },
  pmTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  pmTitleActive: {
    color: Colors.deepTeal,
  },
  pmSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  }
});
