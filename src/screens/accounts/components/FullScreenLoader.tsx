import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";

export function FullScreenLoader() {
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
    </SafeAreaView>
  );
}

