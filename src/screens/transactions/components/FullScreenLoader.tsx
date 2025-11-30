import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type ThemeColors } from "@/constants/theme";

type FullScreenLoaderProps = {
  colors: ThemeColors;
};

export function FullScreenLoader({ colors }: FullScreenLoaderProps) {
  return (
    <SafeAreaView
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: colors.background.DEFAULT }}
    >
      <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
    </SafeAreaView>
  );
}

