import { type ComponentProps } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { TransactionType } from "@/types/transaction";
import { type ThemeColors } from "@/constants/theme";

export type TransactionTypeMeta = {
  icon: ComponentProps<typeof MaterialIcons>["name"];
  badgeBg: string;
  badgeIconColor: string;
  amountColor: string; // Tailwind class name
  amountPrefix: string;
};

export function buildTypeMeta(colors: ThemeColors): {
  DEFAULT_TYPE_META: TransactionTypeMeta;
  TRANSACTION_TYPE_META: Record<TransactionType, TransactionTypeMeta>;
} {
  const DEFAULT_TYPE_META: TransactionTypeMeta = {
    icon: "receipt-long",
    badgeBg: colors.background.subtle,
    badgeIconColor: colors.foreground,
    amountColor: "text-foreground",
    amountPrefix: "",
  };

  const TRANSACTION_TYPE_META: Record<TransactionType, TransactionTypeMeta> = {
    expense: {
      icon: "arrow-downward",
      badgeBg: colors.transaction.expense.badgeBg,
      badgeIconColor: colors.transaction.expense.badgeIcon,
      amountColor: colors.transaction.expense.amountClass,
      amountPrefix: "-",
    },
    income: {
      icon: "arrow-upward",
      badgeBg: colors.transaction.income.badgeBg,
      badgeIconColor: colors.transaction.income.badgeIcon,
      amountColor: colors.transaction.income.amountClass,
      amountPrefix: "+",
    },
    transfer: {
      icon: "swap-horiz",
      badgeBg: colors.transaction.transfer.badgeBg,
      badgeIconColor: colors.transaction.transfer.badgeIcon,
      amountColor: colors.transaction.transfer.amountClass,
      amountPrefix: "",
    },
    goal: {
      icon: "savings",
      badgeBg: colors.transaction.goal.badgeBg,
      badgeIconColor: colors.transaction.goal.badgeIcon,
      amountColor: colors.transaction.goal.amountClass,
      amountPrefix: "-",
    },
    goal_withdraw: {
      icon: "undo",
      badgeBg: colors.transaction.goalWithdraw.badgeBg,
      badgeIconColor: colors.transaction.goalWithdraw.badgeIcon,
      amountColor: colors.transaction.goalWithdraw.amountClass,
      amountPrefix: "+",
    },
  };

  return { DEFAULT_TYPE_META, TRANSACTION_TYPE_META };
}

