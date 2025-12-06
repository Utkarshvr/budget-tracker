import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, View, Text } from "react-native";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackScreen() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔗 [AUTH CALLBACK SCREEN] Component mounted, waiting for session...');
    
    // Since the root layout handles the deep link and sets the session,
    // we just need to wait for the auth state to change
    let timeoutId: any;
    let subscription: any;
    let isMounted = true;

    const handleSession = (session: any) => {
      if (!isMounted) return;
      
      console.log('🔗 [AUTH CALLBACK SCREEN] Session detected, navigating...');
      // Check if user has completed profile
      const hasName = Boolean(session.user?.user_metadata?.full_name);
      
      if (hasName) {
        router.replace("/(auth)/(tabs)");
      } else {
        router.replace("/(public)/complete-profile");
      }
    };

    // Check current session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      if (session) {
        console.log('🔗 [AUTH CALLBACK SCREEN] Session already exists, navigating...');
        handleSession(session);
        return;
      }

      // If no session, wait for auth state change (root layout will set it)
      console.log('🔗 [AUTH CALLBACK SCREEN] No session yet, listening for auth state change...');
      
      // Set a timeout in case something goes wrong
      timeoutId = setTimeout(() => {
        if (isMounted) {
          console.error('🔗 [AUTH CALLBACK SCREEN] Timeout waiting for session');
          setError("Verification timed out. Please try again or sign in manually.");
          setLoading(false);
        }
      }, 10000); // 10 second timeout

      // Listen for auth state changes
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        
        console.log('🔗 [AUTH CALLBACK SCREEN] Auth state changed:', event, session ? 'session exists' : 'no session');
        
        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          clearTimeout(timeoutId);
          handleSession(session);
        }
      });

      subscription = authSubscription;
    });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-4 text-neutral-600 dark:text-neutral-400">
          Verifying your email...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950 px-6">
        <Text className="text-center text-lg font-semibold text-rose-600 dark:text-rose-400">
          Verification Failed
        </Text>
        <Text className="mt-2 text-center text-neutral-600 dark:text-neutral-400">
          {error}
        </Text>
        <Text
          className="mt-6 text-blue-500 dark:text-blue-400"
          onPress={() => router.replace("/(public)/sign-in")}
        >
          Go to Sign In
        </Text>
      </View>
    );
  }

  return null;
}

