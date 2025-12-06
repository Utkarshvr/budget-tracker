import Constants from "expo-constants";
import * as Linking from "expo-linking";

/**
 * Gets the correct auth redirect URL based on the environment
 * Dynamically detects IP and PORT in Expo Go
 */
export async function getAuthRedirectUrl(): Promise<string> {
  // Check if running in Expo Go
  const isExpoGo = Constants.executionEnvironment === "storeClient";
  
  if (isExpoGo) {
    // Method 1: Try to get from hostUri (includes IP:PORT like "192.168.29.190:8082")
    const hostUri = Constants.expoConfig?.hostUri;
    
    if (hostUri) {
      // hostUri format: "192.168.29.190:8082" (includes port!)
      return `exp://${hostUri}/--/auth-callback`;
    }
    
    // Method 2: Fallback - try to extract from initial URL
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && initialUrl.startsWith('exp://')) {
        // Extract base URL (e.g., exp://192.168.29.190:8082)
        const url = new URL(initialUrl);
        return `${url.protocol}//${url.host}/--/auth-callback`;
      }
    } catch (e) {
      console.warn('Could not parse initial URL:', e);
    }
    
    // Method 3: Last resort - try debuggerHost (older API, might not have port)
    const debuggerHost = (Constants.expoConfig as any)?.debuggerHost;
    if (debuggerHost) {
      // debuggerHost might be "192.168.29.190:8082" or just "192.168.29.190"
      const hasPort = debuggerHost.includes(':');
      if (hasPort) {
        return `exp://${debuggerHost}/--/auth-callback`;
      } else {
        // Default to 8081 if no port specified (but this shouldn't happen)
        return `exp://${debuggerHost}:8081/--/auth-callback`;
      }
    }
    
    // If all else fails, log a warning
    console.error('Could not detect Expo Go URL. Please check your network connection.');
    throw new Error('Could not determine Expo Go URL. Make sure you are connected to the Expo development server.');
  }
  
  // Production or development build - use custom scheme
  return 'budgetwise://auth-callback';
}

