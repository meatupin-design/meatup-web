import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useRef } from 'react';
import { CartItem, User, Order, WalletTransaction, OrderStatus } from '@/types';
import { ProductService } from '@/services/ProductService';
import { OrderService } from '@/services/OrderService';
import { UserService } from '@/services/UserService';
import { useAuth } from './AuthContext';

export const [AppProvider, useApp] = createContextHook(() => {
  const { user: authUser } = useAuth();


  const [user, setUser] = useState<User>({
    id: '1',
    name: 'Guest User',
    phone: '',
    email: '',
    is_first_order_completed: false,
    wallet_points: 150,
    created_at: Date.now(),
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const ordersRef = useRef<Order[]>([]); // Ref to track orders for interval without stale closures
  const [walletHistory, setWalletHistory] = useState<WalletTransaction[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Keep ref in sync
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Sync with Firebase Auth
  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;
    let simulationInterval: ReturnType<typeof setInterval> | undefined;
    let isMounted = true;

    const initUser = () => {
      if (authUser) {
        // Real-time user profile subscription
        const unsubscribeUser = UserService.subscribeToUser(authUser.uid, (profile) => {
          if (isMounted && profile) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              phone: profile.phone || '',
              address: profile.address || '',
              is_first_order_completed: profile.is_first_order_completed,
              wallet_points: profile.wallet_points,
              created_at: profile.created_at,
            });
          }
        });

        // Real-time order updates
        unsubscribeOrders = OrderService.subscribeToUserOrders(authUser.uid, (userOrders) => {
          if (isMounted) {
            setOrders(userOrders);
          }
        });

        return unsubscribeUser;

      } else {
        // Reset to guest
        setUser({
          id: '1',
          name: 'Guest User',
          phone: '',
          email: '',
          address: '',
          is_first_order_completed: false,
          wallet_points: 0,
          created_at: Date.now(),
        });
        setOrders([]);
      }
    };

    const userUnsubscribe = initUser();

    return () => {
      isMounted = false;
      if (unsubscribeOrders) unsubscribeOrders();
      if (userUnsubscribe && typeof userUnsubscribe === 'function') userUnsubscribe();
    };
  }, [authUser]);

  useEffect(() => {

    // Real-time subscription
    const unsubscribe = ProductService.subscribeToProducts((updatedProducts) => {
      setProducts(updatedProducts);
    });

    return () => unsubscribe();
  }, []);

  // Reactive point crediting
  // If the Admin Portal updates status to 'delivered' but doesn't credit points, this client will do it.
  useEffect(() => {
    orders.forEach(async (order) => {
      if (order.status === 'delivered' && !order.points_credited && (order.earned_points || 0) > 0) {
        console.log(`[AppContext] Detected delivered order ${order.id} needing points. Triggering credit.`);
        await OrderService.ensurePointsCredited(order.id);
      }
    });
  }, [orders]);

  const addToCart = (productId: string, quantity: number, weight: number, cuttingType?: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev: CartItem[]) => {
      const existing = prev.find((item) => item.product.id === productId && item.weight === weight && item.cuttingType === cuttingType);
      if (existing) {
        return prev.map((item) =>
          item.product.id === productId && item.weight === weight && item.cuttingType === cuttingType
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, weight, cuttingType }];
    });
  };

  const removeFromCart = (productId: string, weight: number, cuttingType?: string) => {
    setCart((prev: CartItem[]) => {
      const existing = prev.find((item) => item.product.id === productId && item.weight === weight && item.cuttingType === cuttingType);
      if (!existing) return prev;

      if (existing.quantity === 1) {
        return prev.filter((item) => !(item.product.id === productId && item.weight === weight && item.cuttingType === cuttingType));
      }

      return prev.map((item) =>
        item.product.id === productId && item.weight === weight && item.cuttingType === cuttingType
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const updateCartItemPrice = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev: CartItem[]) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, product }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      let price = item.product.current_price;
      if (item.product.variants && item.cuttingType) {
        const variant = item.product.variants.find(v => v.name === item.cuttingType);
        if (variant) {
          price = variant.price;
        }
      }
      
      const isPcUnit = item.product.unit?.toLowerCase() === 'pc' || item.product.unit?.toLowerCase() === 'pack';
      const weightMultiplier = isPcUnit ? item.weight : item.weight; // Item.weight for PC unit is the PC count 
      
      return total + (price * item.quantity * weightMultiplier);
    }, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const placeOrder = async (
    address: string,
    deliverySlot: string,
    paymentMode: 'online' | 'cod',
    walletUsed: number = 0,
    note?: string,
    deliveryCharge: number = 0,
    paymentDetails?: { payment_id: string; razorpay_order_id: string },
    taxAmount: number = 0,
    platformFee: number = 0,
    discount: number = 0
  ) => {
    if (!user.id) return;
    if (walletUsed > user.wallet_points) {
      throw new Error("Insufficient wallet points");
    }

    try {
      const subtotal = cartTotal;
      const finalAmount = subtotal + taxAmount + platformFee + deliveryCharge - discount - walletUsed;

      // Chicken Points: 1 point per 1 kg (total weight)
      // ... existing code ...

      const orderPayload = {
        user_id: user.id,
        items: cart.map(item => {
          // Use variant price if a variant/cuttingType is selected (e.g. Brown Egg vs White Egg)
          let itemPrice = item.product.current_price;
          if (item.product.variants && item.cuttingType) {
            const variant = item.product.variants.find(v => v.name === item.cuttingType);
            if (variant) itemPrice = variant.price;
          }

          const isKgUnit = item.product.unit?.toLowerCase() === 'kg';
          const effectivePrice = isKgUnit ? itemPrice * item.weight : itemPrice;

          return {
            product_id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            weight: item.weight,
            price: effectivePrice, // Now stores price for the selected weight
            unit: item.product.unit,
            price_per_selection: true, // Flag for backward compatibility
            ...(item.cuttingType ? { cuttingType: item.cuttingType } : {}),
          };
        }),
        total_amount: subtotal,
        discount,
        tax_amount: taxAmount,
        platform_fee: platformFee,
        delivery_charge: deliveryCharge, // Added field
        wallet_used: walletUsed,
        final_amount: finalAmount,
        earned_points: Math.floor(cart.reduce((sum, item) => {
          const isPcUnit = item.product.unit?.toLowerCase() === 'pc' || item.product.unit?.toLowerCase() === 'pack' || item.product.name.toLowerCase().includes('egg');
          if (isPcUnit) return sum;
          return sum + item.weight * item.quantity;
        }, 0)),
        address,
        delivery_slot: deliverySlot,
        payment_mode: paymentMode,
        note,
        ...(paymentDetails ? {
          payment_id: paymentDetails.payment_id,
          razorpay_order_id: paymentDetails.razorpay_order_id
        } : {})
      };

      const result = await OrderService.createOrder(orderPayload);

      // Update address if it's new/changed
      if (address && address !== user.address) {
        await UserService.updateUser(user.id, { address });
        // Optimistic update
        setUser((prev: User) => ({ ...prev, address }));
      }

      clearCart();
      return result;
    } catch (e) {
      console.error("Order Failed", e);
      throw e;
    }
  };

  return {
    user,
    cart,
    orders,
    walletHistory,
    products,
    cartTotal,
    cartItemCount,
    addToCart,
    removeFromCart,
    updateCartItemPrice,
    clearCart,
    placeOrder,
    updateUserProfile: async (data: Partial<User>) => {
      if (!user.id) return;
      await UserService.updateUser(user.id, data);
      setUser((prev: User) => ({ ...prev, ...data }));
    },
    cancelOrder: async (orderId: string) => {
      const order = orders.find(o => o.id === orderId);
      if (!order || order.status !== 'pending') return;

      try {
        await OrderService.updateOrderStatus(orderId, 'cancelled');

        if (order.wallet_used > 0) {
          const newPoints = user.wallet_points + order.wallet_used;
          await UserService.updateWallet(user.id, newPoints);
          setUser((prev: User) => ({ ...prev, wallet_points: newPoints }));
        }

        // Update local order state
        setOrders((prev: Order[]) => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));

      } catch (error) {
        console.error("Failed to cancel order", error);
        throw error;
      }
    }
  };
});