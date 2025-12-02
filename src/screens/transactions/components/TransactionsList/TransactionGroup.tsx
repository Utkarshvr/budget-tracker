import { Text, View } from "react-native";
import { Transaction } from "@/types/transaction";
import { type ThemeColors } from "@/constants/theme";
import { type TransactionTypeMeta } from "../../utils/typeMeta";
import { formatDateHeader } from "../../utils/formatting";
import { TransactionItem } from "./TransactionItem";

type TransactionGroupProps = {
  group: {
    date: string;
    transactions: Transaction[];
  };
  colors: ThemeColors;
  typeMeta: {
    DEFAULT_TYPE_META: TransactionTypeMeta;
    TRANSACTION_TYPE_META: Record<string, TransactionTypeMeta>;
  };
  isLastGroup: boolean;
  onTransactionPress?: (transaction: Transaction) => void;
};

export function TransactionGroup({
  group,
  colors,
  typeMeta,
  isLastGroup,
  onTransactionPress,
}: TransactionGroupProps) {
  return (
    <View>
      {/* Date Header */}
      <View className="px-4 py-2">
        <Text
          className="text-base font-bold text-left"
          style={{ color: colors.muted.foreground }}
        >
          {formatDateHeader(group.date)}
        </Text>
      </View>
      {/* Transactions for this date */}
      {group.transactions.map((transaction, index) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          isLastInGroup={index === group.transactions.length - 1}
          colors={colors}
          DEFAULT_TYPE_META={typeMeta.DEFAULT_TYPE_META}
          TRANSACTION_TYPE_META={typeMeta.TRANSACTION_TYPE_META}
          onPress={onTransactionPress}
        />
      ))}
      {/* Separator between date groups */}
      {!isLastGroup && <View className="h-2" />}
    </View>
  );
}

