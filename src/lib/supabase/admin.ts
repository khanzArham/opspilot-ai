import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/utils/require-env";

/**
 * PRIVILEGED Supabase client using the secret key. It BYPASSES RLS.
 *
 * - Server-only: the `server-only` import makes any Client Component import a
 *   build error, so the secret key can never reach a browser bundle.
 * - Use only for genuinely privileged server operations (business mutations in domain
 *   services, the job worker, seeding) AFTER authorization has been enforced on the
 *   server. Do NOT use it for reads that RLS can enforce for the signed-in user (e.g.
 *   the role lookup in `requireUser`); use `createSupabaseServerClient()` for those.
 *   Never hand it request-derived input unvalidated.
 * - No session is persisted; every call is stateless.
 */
export function createSupabaseAdminClient() {
  return createClient(
    requireEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    requireEnv("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
