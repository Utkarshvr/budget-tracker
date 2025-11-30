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
};

export function TransactionsList({
  grouped,
  colors,
  typeMeta,
}: TransactionsListProps) {
  return (
    <View className="mb-6 -mx-4">
      {grouped.map((group, groupIndex) => (
        <TransactionGroup
          key={group.date}
          group={group}
          colors={colors}
          typeMeta={typeMeta}
          isLastGroup={groupIndex === grouped.length - 1}
        />
      ))}
    </View>
  );
}

