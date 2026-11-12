import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getAuthUser = vi.fn();
vi.mock("@/lib/auth/get-auth-user", () => ({ getAuthUser }));

// Session-scoped client stub: supabase.from("profiles").select("role").eq("id", id).maybeSingle()
const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
const createSupabaseServerClient = vi.fn(async () => ({ from }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

// The privileged client bypasses RLS. Nothing on the auth path may touch it.
const createSupabaseAdminClient = vi.fn(() => {
  throw new Error("admin client must not be used on the auth path");
});
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient }));

beforeEach(() => {
  vi.clearAllMocks();
});

function craftedRequest() {
  // A caller trying to talk their way into admin: spoofed headers, query and body.
  return new Request("http://localhost:3000/api/admin/check?role=admin&admin=true", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-role": "admin",
      "x-user-role": "admin",
      authorization: "Bearer forged",
    },
    body: JSON.stringify({ role: "admin", isAdmin: true }),
  });
}

async function call(request: Request = craftedRequest()) {
  const { POST } = await import("@/app/api/admin/check/route");
  const response = await POST(request);
  return { status: response.status, body: await response.json() };
}

describe("POST /api/admin/check (temporary admin-only probe)", () => {
  it("rejects an unauthenticated caller with 401 UNAUTHENTICATED", async () => {
    getAuthUser.mockResolvedValue(null);
    const { status, body } = await call();
    expect(status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "UNAUTHENTICATED" },
    });
    expect(typeof body.meta.correlationId).toBe("string");
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("rejects an operator with 403 FORBIDDEN, even with a crafted admin request", async () => {
    getAuthUser.mockResolvedValue({ id: "op-1", email: "operator@growthflow.example" });
    maybeSingle.mockResolvedValue({ data: { role: "operator" }, error: null });
    const { status, body } = await call();
    expect(status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
    expect(body.ok).toBe(false);
  });

  it("looks the role up by the SESSION user id, never by request input", async () => {
    getAuthUser.mockResolvedValue({ id: "op-1", email: null });
    maybeSingle.mockResolvedValue({ data: { role: "operator" }, error: null });
    await call();
    expect(eq).toHaveBeenCalledWith("id", "op-1");
  });

  it("authorizes an admin with 200", async () => {
    getAuthUser.mockResolvedValue({ id: "admin-1", email: "admin@growthflow.example" });
    maybeSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
    const { status, body } = await call();
    expect(status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      data: { authorized: true, role: "admin" },
    });
  });

  it("returns 403 for a signed-in user whose profile is hidden or missing", async () => {
    getAuthUser.mockResolvedValue({ id: "stray-1", email: null });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const { status, body } = await call();
    expect(status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns a safe 500 when the profile lookup fails", async () => {
    getAuthUser.mockResolvedValue({ id: "admin-1", email: null });
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "password authentication failed for user postgres" },
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { status, body } = await call();
    spy.mockRestore();
    expect(status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toContain("password");
  });

  it("uses the session-scoped client and never the admin client (all outcomes)", async () => {
    getAuthUser.mockResolvedValue({ id: "admin-1", email: null });
    maybeSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
    await call();
    maybeSingle.mockResolvedValue({ data: { role: "operator" }, error: null });
    await call();
    getAuthUser.mockResolvedValue(null);
    await call();

    expect(createSupabaseServerClient).toHaveBeenCalled();
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });
});
