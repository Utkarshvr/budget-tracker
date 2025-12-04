import { View } from "react-native";
import { Transaction } from "@/types/transaction";
import { type ThemeColors } from "@/constants/theme";
import { type TransactionTypeMeta } from "../../utils/typeMeta";
import { TransactionGroup } from "./TransactionGroup";

type TransactionsListProps = {
  grouped: {
    date: string;
    transactions: Transaction[];
  }[];
  colors: ThemeColors;
  typeMeta: {
    DEFAULT_TYPE_META: TransactionTypeMeta;
    TRANSACTION_TYPE_META: Record<string, TransactionTypeMeta>;
  };
  onTransactionPress?: (transaction: Transaction) => void;
};

export function TransactionsList({
  grouped,
  colors,
  typeMeta,
  onTransactionPress,
}: TransactionsListProps) {
  return (
    <View className="px-2 mb-6 -mx-4">
      {grouped.map((group, groupIndex) => (
        <TransactionGroup
          key={group.date}
          group={group}
          colors={colors}
          typeMeta={typeMeta}
          isLastGroup={groupIndex === grouped.length - 1}
          onTransactionPress={onTransactionPress}
        />
      ))}
    </View>
  );
}

