export type CategoryType = "regular" | "fund";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  background_color: string;
  category_type: CategoryType;
  fund_balance: number;
  fund_currency: string | null;
  fund_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  emoji: string;
  background_color: string;
}

