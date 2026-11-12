import { createBrowserClient } from "@supabase/ssr";
import { requireEnv } from "@/lib/utils/require-env";

/**
 * Supabase client for Client Components. Uses only the PUBLISHABLE key, which is
 * safe in the browser because RLS (not the key) protects data. Never import the
 * admin client here.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    requireEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    requireEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  );
}
