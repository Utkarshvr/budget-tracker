import { useEffect } from "react";
import { Stack } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export default function RootLayout() {
  useEffect(() => {
    const handleAuthCallback = async (url: string, source: string) => {
      try {
        console.log('🔗 [DEEP LINK] Received URL:', {
          source,
          fullUrl: url,
          scheme: url.split('://')[0],
          includesAuthCallback: url.includes('auth-callback'),
          includesSupabase: url.includes('supabase.co'),
        });

        // Check if this is a Supabase verification URL that was intercepted
        if (url.includes('supabase.co/auth/v1/verify')) {
          console.log('🔗 [DEEP LINK] Detected Supabase verification URL');
          try {
            const urlObj = new URL(url);
            const token = urlObj.searchParams.get('token');
            const type = urlObj.searchParams.get('type');
            const redirectTo = urlObj.searchParams.get('redirect_to');
            
            console.log('🔗 [DEEP LINK] Extracted from Supabase URL:', {
              hasToken: !!token,
              tokenPreview: token ? token.substring(0, 20) + '...' : null,
              type,
              redirectTo,
            });
            
            if (token && type === 'signup') {
              console.log('🔗 [DEEP LINK] Verifying token with Supabase...');
              // Verify the token using verifyOtp
              const { data, error } = await supabase.auth.verifyOtp({
                token: token,
                type: 'signup',
              });

              if (error) {
                console.error('🔗 [DEEP LINK] Verify OTP error:', error);
              } else if (data.session) {
                console.log('🔗 [DEEP LINK] Session created successfully from Supabase URL');
                // Session created successfully, navigation will be handled by auth state
                return;
              }
            }
          } catch (urlError) {
            console.error('🔗 [DEEP LINK] Error parsing Supabase URL:', urlError);
          }
        }
        
        // Handle both exp:// and budgetwise:// schemes for auth-callback
        // For exp:// URLs, we need to manually parse since URL constructor might not work
        // Supabase uses hash fragments (#) instead of query strings (?) for security
        if (url.includes('auth-callback')) {
          console.log('🔗 [DEEP LINK] Detected auth-callback URL');
          // Extract tokens from URL - check both query string (?) and hash fragment (#)
          let fragmentOrQuery = '';
          
          // Try hash fragment first (Supabase uses this)
          if (url.includes('#')) {
            const hashParts = url.split('#');
            if (hashParts.length > 1) {
              fragmentOrQuery = hashParts[1];
              console.log('🔗 [DEEP LINK] Found hash fragment');
            }
          }
          // Fallback to query string
          else if (url.includes('?')) {
            const queryParts = url.split('?');
            if (queryParts.length > 1) {
              fragmentOrQuery = queryParts[1];
              console.log('🔗 [DEEP LINK] Found query string');
            }
          }
          
          if (fragmentOrQuery) {
            const params = new URLSearchParams(fragmentOrQuery);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const token = params.get('token');
            const type = params.get('type');
            
            console.log('🔗 [DEEP LINK] Extracted parameters:', {
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              hasToken: !!token,
              type,
              allParams: Array.from(params.keys()),
            });
            
            if (accessToken && refreshToken) {
              console.log('🔗 [DEEP LINK] Setting session with access_token and refresh_token...');
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                console.error('🔗 [DEEP LINK] Session error:', sessionError);
              } else {
                console.log('🔗 [DEEP LINK] Session set successfully');
                // Navigation will be handled by auth state change
                // The useSupabaseSession hook will detect the new session
              }
            } else if (token) {
              console.log('🔗 [DEEP LINK] Found token parameter, will be handled by auth-callback screen');
            } else {
              console.warn('🔗 [DEEP LINK] No tokens found in auth-callback URL');
            }
          } else {
            console.warn('🔗 [DEEP LINK] No query string or hash fragment in auth-callback URL');
          }
        } else {
          console.log('🔗 [DEEP LINK] URL does not match auth-callback or Supabase verify pattern');
        }
      } catch (err) {
        console.error('🔗 [DEEP LINK] Error handling auth callback:', err);
      }
    };

    // Handle initial URL (when app is opened from a link)
    const handleInitialURL = async () => {
      console.log('🔗 [DEEP LINK] Checking for initial URL...');
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('🔗 [DEEP LINK] Found initial URL');
        await handleAuthCallback(initialUrl, 'initial');
      } else {
        console.log('🔗 [DEEP LINK] No initial URL found');
      }
    };

    handleInitialURL();

    // Handle deep links when app is already running
    console.log('🔗 [DEEP LINK] Setting up deep link listener...');
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔗 [DEEP LINK] Deep link event received');
      handleAuthCallback(event.url, 'event');
    });

    return () => {
      console.log('🔗 [DEEP LINK] Cleaning up deep link listener');
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
