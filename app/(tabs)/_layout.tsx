import { Tabs } from "expo-router";
import { Image, useWindowDimensions } from "react-native";
import { Home, ShoppingCart, Package, User } from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.priceNeutral,
        tabBarInactiveTintColor: Colors.white,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.deepTeal,
          borderTopColor: Colors.deepTealDark,
          borderTopWidth: isLargeScreen ? 0 : 1,
          height: isLargeScreen ? 60 : 75,
          paddingBottom: isLargeScreen ? 10 : 16,
          paddingTop: isLargeScreen ? 0 : 10,
          position: isLargeScreen ? 'absolute' : 'relative',
          bottom: isLargeScreen ? 20 : 0,
          left: isLargeScreen ? (width - Math.min(width * 0.9, 500)) / 2 : 0,
          width: isLargeScreen ? Math.min(width * 0.9, 500) : '100%',
          borderRadius: isLargeScreen ? 30 : 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("../../assets/images/splash-icon.png")}
              style={{
                width: 24, height: 24
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => <Package size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
