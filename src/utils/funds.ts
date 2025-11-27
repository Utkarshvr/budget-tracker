import { Category } from "@/types/category";

export function computeAccountFundTotals(categories: Category[]) {
  return categories.reduce<Record<string, number>>((acc, category) => {
    if (
      category.category_type === "fund" &&
      category.fund_account_id &&
      typeof category.fund_balance === "number"
    ) {
      acc[category.fund_account_id] =
        (acc[category.fund_account_id] || 0) + category.fund_balance;
    }
    return acc;
  }, {});
}

