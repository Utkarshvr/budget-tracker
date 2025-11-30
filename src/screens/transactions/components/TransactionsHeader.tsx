import { Text, View } from "react-native";
import { type ThemeColors } from "@/constants/theme";

type TransactionsHeaderProps = {
  totalCount: number;
  colors: ThemeColors;
};

export function TransactionsHeader({ totalCount, colors }: TransactionsHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-6">
      <Text
        className="text-3xl font-bold"
        style={{ color: colors.foreground }}
      >
        Transactions
      </Text>
      <Text className="text-sm" style={{ color: colors.muted.foreground }}>
        {totalCount} transaction{totalCount !== 1 ? "s" : ""}
      </Text>
    </View>
  );
}

