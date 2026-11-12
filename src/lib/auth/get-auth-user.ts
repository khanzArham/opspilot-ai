import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string | null;
};

/**
 * Return the signed-in user, or null. Uses `auth.getUser()`, which validates the
 * session token with Supabase Auth on every call (unlike reading the cookie
 * alone, which can be forged). Role lookup and 401/403 mapping are layered on
 * top of this in `require-user.ts` / `require-role.ts`.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}
