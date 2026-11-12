import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: { getUser } })),
}));

// Fake, non-secret values only.
beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example-project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_fake");
  getUser.mockReset();
});

async function run(path: string) {
  const { proxy } = await import("@/proxy");
  return proxy(new NextRequest(`http://localhost:3000${path}`));
}

describe("proxy", () => {
  it("redirects a logged-out visitor from /dashboard to /login with next", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await run("/dashboard/jobs?status=dead_letter");
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe(
      "/dashboard/jobs?status=dead_letter",
    );
  });

  it("lets a signed-in user through to /dashboard", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await run("/dashboard");
    expect(res.headers.get("location")).toBeNull();
    expect(res.status).toBe(200);
  });

  it("sends a signed-in user away from /login to /dashboard", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await run("/login");
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/dashboard");
  });

  it("lets a logged-out visitor see /login", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await run("/login");
    expect(res.headers.get("location")).toBeNull();
  });

  it("only matches the dashboard and login routes", async () => {
    const { config } = await import("@/proxy");
    expect(config.matcher).toEqual(["/dashboard/:path*", "/login"]);
  });
});
