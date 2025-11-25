import { Currency } from "./account";

export interface Fund {
  id: string;
  user_id: string;
  account_id: string;
  name: string;
  emoji: string;
  background_color: string;
  balance: number; // stored in smallest currency unit
  currency: Currency;
  created_at: string;
  updated_at: string;
}

export interface FundFormData {
  name: string;
  emoji: string;
  background_color: string;
  account_id: string | null;
  initial_allocation: string;
}


