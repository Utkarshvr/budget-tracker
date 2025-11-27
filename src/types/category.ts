export type CategoryType = "income" | "expense";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  background_color: string;
  category_type: CategoryType;
  // Legacy fund fields (keeping for backward compatibility, but not used in new system)
  fund_balance?: number;
  fund_currency?: string | null;
  fund_account_id?: string | null;
  fund_target_amount?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  emoji: string;
  background_color: string;
  category_type: CategoryType;
}

// New type for category reservations (replaces the fund system)
export interface CategoryReservation {
  id: string;
  user_id: string;
  category_id: string;
  account_id: string;
  reserved_amount: number; // in smallest currency unit
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryReservationFormData {
  category_id: string;
  account_id: string;
  reserved_amount: string; // string for input
}

