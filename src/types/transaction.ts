import { Account } from "./account";

export type TransactionType = "expense" | "income" | "transfer" | "goal" | "goal_withdraw";

export interface Transaction {
  id: string;
  user_id: string;
  note: string;
  type: TransactionType;
  amount: number; // stored in smallest currency unit (paise/cents)
  from_account_id: string | null;
  to_account_id: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
  // Relations (optional, populated when needed)
  from_account?: Account;
  to_account?: Account;
}

export interface TransactionFormData {
  note: string;
  type: TransactionType;
  amount: string; // string for input, will be converted to number
  from_account_id: string | null;
  to_account_id: string | null;
}

