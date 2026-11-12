import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `server-only` throws outside a React Server environment by design; neutralise
// it so the server modules can be unit tested.
vi.mock("server-only", () => ({}));

const cookieJar = {
  getAll: vi.fn(() => [] as { name: string; value: string }[]),
  set: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieJar),
}));

// Fake, non-secret values. Never read the real .env.local in tests.
const FAKE_URL = "https://example-project.supabase.co";
const FAKE_PUBLISHABLE = "sb_publishable_fake_for_tests";
const FAKE_SECRET = "sb_secret_fake_for_tests";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", FAKE_URL);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", FAKE_PUBLISHABLE);
  vi.stubEnv("SUPABASE_SECRET_KEY", FAKE_SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("requireEnv", () => {
  it("names the missing variable but never echoes a value", async () => {
    const { requireEnv } = await import("@/lib/utils/require-env");
    expect(() => requireEnv("SOME_VAR", undefined)).toThrow(/SOME_VAR/);
    expect(requireEnv("SOME_VAR", "abc")).toBe("abc");
  });
});

describe("createSupabaseBrowserClient", () => {
  it("creates a client from the public env vars", async () => {
    const { createSupabaseBrowserClient } = await import(
      "@/lib/supabase/browser"
    );
    expect(typeof createSupabaseBrowserClient().from).toBe("function");
  });

  it("throws a clear error when the publishable key is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    const { createSupabaseBrowserClient } = await import(
      "@/lib/supabase/browser"
    );
    expect(() => createSupabaseBrowserClient()).toThrow(
      /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    );
  });
});

describe("createSupabaseServerClient", () => {
  it("creates a per-request client backed by the cookie store", async () => {
    const { createSupabaseServerClient } = await import(
      "@/lib/supabase/server"
    );
    const client = await createSupabaseServerClient();
    expect(typeof client.auth.getUser).toBe("function");
  });
});

describe("createSupabaseAdminClient", () => {
  it("creates a privileged client from the secret key", async () => {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    expect(typeof createSupabaseAdminClient().from).toBe("function");
  });

  it("refuses to start without the secret key", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    expect(() => createSupabaseAdminClient()).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it("never reads the secret key through a NEXT_PUBLIC variable", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/lib/supabase/admin.ts", "utf8");
    expect(src).toContain('import "server-only"');
    expect(src).not.toMatch(/NEXT_PUBLIC_[A-Z_]*SECRET/);
  });
});

describe("browser client isolation", () => {
  it("does not reference the secret key or the admin module", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/lib/supabase/browser.ts", "utf8");
    expect(src).not.toContain("SUPABASE_SECRET_KEY");
    expect(src).not.toContain("supabase/admin");
  });
});
