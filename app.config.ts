import { ExpoConfig } from "expo/config";

export default ({ config }: { config: ExpoConfig }) => ({
  ...config,
  extra: {
    ...config.extra,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  },
});
