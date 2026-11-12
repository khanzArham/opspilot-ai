import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * Integration-test helper: build a REAL Supabase session for a seeded user without
 * knowing or storing any password. An admin-generated magic-link token is exchanged
 * for a session through the same @supabase/ssr cookie machinery the app uses, so the
 * resulting cookie jar is exactly what a signed-in browser would send.
 *
 * Nothing here logs tokens, keys or cookie values.
 */

export type CookieJar = Map<string, string>;

export type TestSession = {
  userId: string;
  jar: CookieJar;
};

export const integrationEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  secretKey: process.env.SUPABASE_SECRET_KEY,
};

/** Names (never values) of required variables that are not available to this run. */
export const missingIntegrationEnv: string[] = [
  ["NEXT_PUBLIC_SUPABASE_URL", integrationEnv.url],
  ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", integrationEnv.publishableKey],
  ["SUPABASE_SECRET_KEY", integrationEnv.secretKey],
].flatMap(([name, value]) => (value ? [] : [name as string]));

export const hasIntegrationEnv = missingIntegrationEnv.length === 0;

if (!hasIntegrationEnv) {
  console.warn(
    `[integration] Skipping: missing environment variable(s): ${missingIntegrationEnv.join(", ")}. ` +
      "Define them in .env.local (see .env.example).",
  );
}

export function jarToCookieList(jar: CookieJar) {
  return [...jar].map(([name, value]) => ({ name, value }));
}

/** Apply Set-Cookie style writes (a removal arrives as an empty value / maxAge 0). */
export function applyCookie(
  jar: CookieJar,
  name: string,
  value: string,
  options?: { maxAge?: number },
) {
  if (!value || options?.maxAge === 0) jar.delete(name);
  else jar.set(name, value);
}

export async function createSessionFor(email: string): Promise<TestSession> {
  const url = integrationEnv.url!;
  const admin = createClient(url, integrationEnv.secretKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash || !data?.user?.id) {
    throw new Error(`Could not create a test session for ${email}.`);
  }

  const jar: CookieJar = new Map();
  const ssr = createServerClient(url, integrationEnv.publishableKey!, {
    cookies: {
      getAll: () => jarToCookieList(jar),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          applyCookie(jar, name, value, options);
        }
      },
    },
  });

  const { error: verifyError } = await ssr.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });
  if (verifyError) {
    throw new Error(`Could not establish a test session for ${email}.`);
  }

  return { userId: data.user.id, jar };
}

/** Name of the auth cookie @supabase/ssr uses for this project. */
export function authCookieName(): string {
  const ref = new URL(integrationEnv.url!).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}
