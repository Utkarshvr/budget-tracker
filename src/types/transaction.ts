import { Account } from "./account";
import { Category } from "./category";

export type TransactionType = "expense" | "income" | "transfer" | "goal" | "goal_withdraw" | "fund_expense";

export interface Transaction {
  id: string;
  user_id: string;
  note: string;
  type: TransactionType;
  amount: number; // stored in smallest currency unit (paise/cents)
  from_account_id: string | null;
  to_account_id: string | null;
  category_id: string | null;
  fund_id: string | null; // For fund_expense type
  currency: string;
  created_at: string;
  updated_at: string;
  // Relations (optional, populated when needed)
  from_account?: Account;
  to_account?: Account;
  category?: Category;
}

export interface TransactionFormData {
  note: string;
  type: TransactionType;
  amount: string; // string for input, will be converted to number
  from_account_id: string | null;
  to_account_id: string | null;
  fund_id: string | null; // For fund_expense type
  category_id: string | null;
}

