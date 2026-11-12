import { beforeEach, describe, expect, it, vi } from "vitest";
import { isAppRole } from "@/lib/auth/roles";

vi.mock("server-only", () => ({}));

const getAuthUser = vi.fn();
vi.mock("@/lib/auth/get-auth-user", () => ({ getAuthUser }));

// Fluent stub for the SESSION-SCOPED client:
//   supabase.from("profiles").select("role").eq("id", id).maybeSingle()
const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ from })),
}));

// The privileged client bypasses RLS; role lookup must never touch it.
const createSupabaseAdminClient = vi.fn(() => {
  throw new Error("admin client must not be used for role lookup");
});
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient }));

beforeEach(() => {
  vi.clearAllMocks();
});

function signedInAs(role: unknown) {
  getAuthUser.mockResolvedValue({ id: "user-1", email: "u@growthflow.example" });
  maybeSingle.mockResolvedValue({ data: { role }, error: null });
}

describe("isAppRole", () => {
  it("accepts only admin and operator", () => {
    expect(isAppRole("admin")).toBe(true);
    expect(isAppRole("operator")).toBe(true);
    expect(isAppRole("superuser")).toBe(false);
    expect(isAppRole(undefined)).toBe(false);
  });
});

describe("requireUser", () => {
  it("throws UNAUTHENTICATED (401) when there is no session", async () => {
    getAuthUser.mockResolvedValue(null);
    const { requireUser } = await import("@/lib/auth/require-user");
    await expect(requireUser()).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
      httpStatus: 401,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("loads the role from profiles using the session's user id", async () => {
    signedInAs("admin");
    const { requireUser } = await import("@/lib/auth/require-user");
    await expect(requireUser()).resolves.toEqual({
      userId: "user-1",
      email: "u@growthflow.example",
      role: "admin",
    });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("uses the session-scoped client, never the RLS-bypassing admin client", async () => {
    signedInAs("operator");
    const { requireUser } = await import("@/lib/auth/require-user");
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    await requireUser();
    expect(createSupabaseServerClient).toHaveBeenCalled();
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("throws FORBIDDEN (403) when RLS hides the profile (no row returned)", async () => {
    getAuthUser.mockResolvedValue({ id: "user-2", email: null });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const { requireUser } = await import("@/lib/auth/require-user");
    await expect(requireUser()).rejects.toMatchObject({
      code: "FORBIDDEN",
      httpStatus: 403,
    });
  });

  it("throws FORBIDDEN (403) when the stored role is not a known role", async () => {
    signedInAs("superuser");
    const { requireUser } = await import("@/lib/auth/require-user");
    await expect(requireUser()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("maps a database failure to INTERNAL_ERROR without leaking details", async () => {
    getAuthUser.mockResolvedValue({ id: "user-1", email: null });
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "relation profiles does not exist" },
    });
    const { requireUser } = await import("@/lib/auth/require-user");
    const error = await requireUser().catch((e: unknown) => e);
    expect(error).toMatchObject({ code: "INTERNAL_ERROR", httpStatus: 500 });
    expect((error as Error).message).not.toContain("relation");
  });
});

describe("requireRole", () => {
  it("lets an admin through an admin-only guard", async () => {
    signedInAs("admin");
    const { requireRole } = await import("@/lib/auth/require-role");
    await expect(requireRole("admin")).resolves.toMatchObject({ role: "admin" });
  });

  it("denies an operator on an admin-only guard with 403", async () => {
    signedInAs("operator");
    const { requireRole } = await import("@/lib/auth/require-role");
    await expect(requireRole("admin")).rejects.toMatchObject({
      code: "FORBIDDEN",
      httpStatus: 403,
    });
  });

  it("allows any listed role", async () => {
    signedInAs("operator");
    const { requireRole } = await import("@/lib/auth/require-role");
    await expect(requireRole("admin", "operator")).resolves.toMatchObject({
      role: "operator",
    });
  });

  it("returns 401 (not 403) when nobody is signed in", async () => {
    getAuthUser.mockResolvedValue(null);
    const { requireRole } = await import("@/lib/auth/require-role");
    await expect(requireRole("admin")).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
      httpStatus: 401,
    });
  });
});
