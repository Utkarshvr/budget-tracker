import { supabase } from "@/lib/supabase";

type CreateFundOptions = {
  categoryId: string;
  accountId: string;
  accountCurrency: string;
  initialAmount: number; // smallest currency unit
  targetAmount?: number | null;
};

type AdjustFundOptions = {
  categoryId: string;
  amountDelta: number; // positive to allocate, negative to withdraw (smallest unit)
  accountId?: string;
};

type UpdateFundMetaOptions = {
  categoryId: string;
  targetAmount: number | null;
};

export async function createCategoryFund({
  categoryId,
  accountId,
  accountCurrency,
  initialAmount,
  targetAmount = null,
}: CreateFundOptions) {
  const { error } = await supabase
    .from("categories")
    .update({
      category_type: "fund",
      fund_account_id: accountId,
      fund_currency: accountCurrency,
      fund_balance: 0,
      fund_target_amount: targetAmount,
    })
    .eq("id", categoryId);

  if (error) {
    throw error;
  }

  if (initialAmount > 0) {
    const { error: rpcError } = await supabase.rpc(
      "adjust_category_fund_balance",
      {
        p_category_id: categoryId,
        p_amount_delta: initialAmount,
        p_account_id: accountId,
      }
    );

    if (rpcError) {
      throw rpcError;
    }
  }
}

export async function adjustCategoryFundBalance({
  categoryId,
  amountDelta,
  accountId,
}: AdjustFundOptions) {
  const { error: rpcError } = await supabase.rpc(
    "adjust_category_fund_balance",
    {
      p_category_id: categoryId,
      p_amount_delta: amountDelta,
      p_account_id: accountId ?? null,
    }
  );

  if (rpcError) {
    throw rpcError;
  }
}

export async function deleteCategoryFund(categoryId: string) {
  const { error } = await supabase
    .from("categories")
    .update({
      category_type: "regular",
      fund_account_id: null,
      fund_currency: null,
      fund_balance: 0,
      fund_target_amount: null,
    })
    .eq("id", categoryId);

  if (error) {
    throw error;
  }
}

export async function updateCategoryFundMeta({
  categoryId,
  targetAmount,
}: UpdateFundMetaOptions) {
  const { error } = await supabase
    .from("categories")
    .update({
      fund_target_amount: targetAmount,
    })
    .eq("id", categoryId);

  if (error) {
    throw error;
  }
}

