import "server-only";
import { AppError } from "@/lib/errors/app-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "./get-auth-user";
import { isAppRole, type AppRole } from "./roles";

export type AuthContext = {
  userId: string;
  email: string | null;
  role: AppRole;
};

/**
 * Authenticate the caller for a protected server route.
 *
 * - The user comes from the validated Supabase session (`auth.getUser()`).
 * - The role is loaded from `profiles` by that user id. It is NEVER read from the
 *   request body, headers, query string or any browser-supplied value.
 * - The lookup uses the SESSION-SCOPED client (the caller's own JWT), so PostgreSQL
 *   enforces the `profiles_select_own` RLS policy: the database itself guarantees a
 *   user can only ever read their own profile row. The admin client is deliberately
 *   not used here (it bypasses RLS and is reserved for privileged server operations).
 *
 * Throws AppError: UNAUTHENTICATED (401) when not signed in, FORBIDDEN (403) when
 * signed in but without a readable profile/valid role, INTERNAL_ERROR (500) on lookup failure.
 */
export async function requireUser(): Promise<AuthContext> {
  const user = await getAuthUser();
  if (!user) throw new AppError("UNAUTHENTICATED");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new AppError("INTERNAL_ERROR");
  if (!data || !isAppRole(data.role)) throw new AppError("FORBIDDEN");

  return { userId: user.id, email: user.email, role: data.role };
}
