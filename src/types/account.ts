export type AccountType = "cash" | "checking" | "savings" | "credit_card";
export type Currency = "INR" | "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number; // stored in smallest currency unit (paise/cents)
  created_at: string;
  updated_at: string;
}

export interface AccountFormData {
  name: string;
  type: AccountType;
  currency: Currency;
  balance: string; // string for input, will be converted to number
}

