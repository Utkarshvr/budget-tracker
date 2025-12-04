import { Text, View } from "react-native";
import { useMemo } from "react";
import { type ThemeColors } from "@/constants/theme";
import { type Transaction } from "@/types/transaction";
import { formatAmount } from "../utils/formatting";

type SummarySectionProps = {
  filteredTransactions: Transaction[];
  colors: ThemeColors;
};

export function SummarySection({
  filteredTransactions,
  colors,
}: SummarySectionProps) {
  // Calculate income and expense totals
  const { incomeTotal, expenseTotal, currency, total } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let defaultCurrency = "INR";

    filteredTransactions.forEach((transaction) => {
      if (transaction.type === "income") {
        income += transaction.amount;
        if (defaultCurrency === "INR" && transaction.currency) {
          defaultCurrency = transaction.currency;
        }
      } else if (transaction.type === "expense") {
        expense += transaction.amount;
        if (defaultCurrency === "INR" && transaction.currency) {
          defaultCurrency = transaction.currency;
        }
      }
    });

    return {
      incomeTotal: income,
      expenseTotal: expense,
      total: income - expense,
      currency: defaultCurrency,
    };
  }, [filteredTransactions]);

  return (
    <View className="py-2 bg-background-subtle flex-row items-center justify-center mb-2">
      <View className="flex-1">
        <Text
          className="text-center text-sm mb-1"
          style={{ color: colors.muted.foreground }}
        >
          Income
        </Text>
        <Text
          className={`text-center text-base font-semibold ${colors.transaction.income.amountClass}`}
        >
          {formatAmount(incomeTotal, currency)}
        </Text>
      </View>
      <View className="flex-1">
        <Text
          className="text-center text-sm mb-1"
          style={{ color: colors.muted.foreground }}
        >
          Expenses
        </Text>
        <Text
          className={`text-center text-base font-semibold ${colors.transaction.expense.amountClass}`}
        >
          {formatAmount(expenseTotal, currency)}
        </Text>
      </View>
      <View className="flex-1">
        <Text
          className="text-center text-sm mb-1"
          style={{ color: colors.muted.foreground }}
        >
          Total
        </Text>
        <Text
          className="text-center text-base font-semibold"
          style={{
            color: total >= 0 ? colors.transaction.income.badgeIcon : colors.transaction.expense.badgeIcon,
          }}
        >
          {formatAmount(total, currency)}
        </Text>
      </View>
    </View>
  );
}

