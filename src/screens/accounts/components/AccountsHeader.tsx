import { Text, View } from "react-native";

type AccountsHeaderProps = {
  count: number;
};

export function AccountsHeader({ count }: AccountsHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-6">
      <Text className="text-3xl font-bold text-foreground">Accounts</Text>
      <Text className="text-muted-foreground text-sm">
        {count} account{count !== 1 ? "s" : ""}
      </Text>
    </View>
  );
}

