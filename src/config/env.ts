import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

export const SUPABASE_URL = extra.SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = extra.SUPABASE_PUBLISHABLE_KEY;
