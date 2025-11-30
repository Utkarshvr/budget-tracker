import { Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { type ThemeColors } from "@/constants/theme";

type EmptyStateProps = {
  colors: ThemeColors;
};

export function EmptyState({ colors }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-12">
      <MaterialIcons
        name="receipt-long"
        size={64}
        color={colors.muted.foreground}
      />
      <Text
        className="text-lg mt-4 text-center"
        style={{ color: colors.muted.foreground }}
      >
        No transactions yet
      </Text>
      <Text
        className="text-sm mt-2 text-center"
        style={{ color: colors.muted.foreground }}
      >
        Add your first transaction to get started
      </Text>
    </View>
  );
}

