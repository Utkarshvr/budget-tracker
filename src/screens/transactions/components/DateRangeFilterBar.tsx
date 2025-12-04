import { Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { type ThemeColors } from "@/constants/theme";
import { type DateRangeFilter } from "../utils/dateRange";
import { formatDateRange } from "../utils/dateRange";
import { type Transaction } from "@/types/transaction";
import { formatAmount } from "../utils/formatting";

type DateRangeFilterBarProps = {
  filterType: DateRangeFilter;
  currentDateRange: { start: Date; end: Date };
  onPrev: () => void;
  onNext: () => void;
  filteredTransactions: Transaction[];
  colors: ThemeColors;
};

export function DateRangeFilterBar({
  filterType,
  currentDateRange,
  onPrev,
  onNext,
  filteredTransactions,
  colors,
}: DateRangeFilterBarProps) {
  // Calculate income and expense totals
  const { incomeTotal, expenseTotal, currency } = useMemo(() => {
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
      currency: defaultCurrency,
    };
  }, [filteredTransactions]);

  return (
    <View className="flex-row items-center justify-between gap-2">
      <View className="flex-row items-center gap-1">
        <TouchableOpacity
          onPress={onPrev}
          className="p-1"
          // hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons
            name="chevron-left"
            size={28}
            color={colors.primary.DEFAULT}
          />
        </TouchableOpacity>
        <Text
          className="text-base font-semibold text-center"
          style={{ color: colors.foreground }}
        >
          {formatDateRange(
            currentDateRange.start,
            currentDateRange.end,
            filterType
          )}
        </Text>
        <TouchableOpacity
          onPress={onNext}
          className="p-1"
          // hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons
            name="chevron-right"
            size={28}
            color={colors.primary.DEFAULT}
          />
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center bg-background-subtle px-2 py-1 rounded-md">
        <Text className="text-sm" style={{ color: colors.muted.foreground }}>
          <Text
            className={`${colors.transaction.income.amountClass} font-semibold`}
          >
            {formatAmount(incomeTotal, currency)}
          </Text>
          {" | "}
          <Text
            className={`${colors.transaction.expense.amountClass} font-semibold`}
          >
            {formatAmount(expenseTotal, currency)}
          </Text>
        </Text>
      </View>
    </View>
  );
}
