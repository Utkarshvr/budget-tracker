import { Currency } from "./account";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number; // stored in smallest currency unit
  saved_amount: number; // stored in smallest currency unit
  currency: Currency;
  created_at: string;
  updated_at: string;
}

export interface GoalFormData {
  title: string;
  target_amount: string;
}

export type GoalActionType = "deposit" | "withdraw";


