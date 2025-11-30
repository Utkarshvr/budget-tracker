import { AccountType } from "@/types/account";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  cash: "attach-money",
  checking: "account-balance",
  savings: "savings",
  credit_card: "credit-card",
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  cash: "bg-green-500",
  checking: "bg-blue-500",
  savings: "bg-purple-500",
  credit_card: "bg-orange-500",
};

