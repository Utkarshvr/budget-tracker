import { Currency } from "./account";

export type FundType = "target_goal" | "emergency_fund" | "budget_fund";
export type FundStatus = "active" | "completed";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number; // stored in smallest currency unit
  saved_amount: number; // stored in smallest currency unit
  currency: Currency;
  fund_type: FundType;
  status: FundStatus;
  created_at: string;
  updated_at: string;
}

export interface GoalFormData {
  title: string;
  target_amount: string;
  fund_type: FundType;
}

export type GoalActionType = "deposit" | "withdraw";

export const FUND_TYPE_CONFIG = {
  target_goal: {
    label: "Target Goal",
    description: "Save for a specific purchase or milestone",
    icon: "flag",
    emoji: "🎯",
    examples: "MacBook, Vacation, Car",
  },
  emergency_fund: {
    label: "Emergency Fund",
    description: "Build a safety net for unexpected expenses",
    icon: "shield",
    emoji: "🛡️",
    examples: "Medical, Job Loss, Repairs",
  },
  budget_fund: {
    label: "Budget Fund",
    description: "Allocate money for planned spending over time",
    icon: "shopping-bag",
    emoji: "📦",
    examples: "Clothing, Groceries, Entertainment",
  },
} as const;


