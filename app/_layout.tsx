// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import SignInPromptModal from "@/components/SignInPromptModal";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isSignInModalVisible, setIsSignInModalVisible } = useApp();

  return (
    <>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ title: "Product Details" }} />
      <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="phone-login" options={{ headerShown: false }} />
    </Stack>
    <SignInPromptModal 
      visible={isSignInModalVisible} 
      onClose={() => setIsSignInModalVisible(false)} 
    />
    </>
  );
}

export default function RootLayout() {
  // Debug: Track render cycle
  console.log("[RootLayout] Rendering...");

  useEffect(() => {
    console.log("[RootLayout] Mounted. Attempting to hide splash screen...");

    // Safety timeout: Ensure splash screen hides even if promise hangs
    const timeout = setTimeout(async () => {
      console.log("[RootLayout] Safety timeout triggered. Hiding splash screen forcibly.");
      await SplashScreen.hideAsync();
    }, 5000);

    SplashScreen.hideAsync()
      .then(() => {
        console.log("[RootLayout] Splash screen hidden successfully via Promise.");
        clearTimeout(timeout);
      })
      .catch((e) => {
        console.warn("[RootLayout] Failed to hide splash screen:", e);
      });

    return () => clearTimeout(timeout);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <GestureHandlerRootView>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
