import { Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";

export function AccountsEmptyState() {
  return (
    <View className="items-center justify-center py-12">
      <MaterialIcons
        name="account-balance-wallet"
        size={64}
        color={theme.colors.muted.foreground}
      />
      <Text className="text-muted-foreground text-lg mt-4 text-center">
        No accounts yet
      </Text>
      <Text className="text-muted-foreground text-sm mt-2 text-center">
        Add your first account to get started
      </Text>
    </View>
  );
}

