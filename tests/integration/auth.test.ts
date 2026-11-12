import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  authCookieName,
  createSessionFor,
  hasIntegrationEnv,
  type CookieJar,
  type TestSession,
} from "./helpers/session";

/**
 * Integration tests: the REAL auth stack (getAuthUser, requireUser, requireRole, the
 * route handler, the session-scoped client) against the hosted Supabase DEV project,
 * with real sessions for the two seeded users. Only `next/headers` (the cookie jar of
 * the "current request") and `server-only` are replaced.
 *
 * The privileged admin client is replaced with a spy that THROWS: if any of these code
 * paths ever reached for it, the test would fail. So every pass below proves the role
 * lookup is authorized by PostgreSQL RLS (profiles_select_own) via the caller's JWT.
 */

vi.mock("server-only", () => ({}));

const state = vi.hoisted(() => ({ jar: new Map<string, string>() as CookieJar }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [...state.jar].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string, options?: { maxAge?: number }) => {
      if (!value || options?.maxAge === 0) state.jar.delete(name);
      else state.jar.set(name, value);
    },
  }),
}));

const adminClientSpy = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("admin client must not be used on the auth path");
  }),
);
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: adminClientSpy,
}));

const ADMIN_EMAIL = "admin@growthflow.example";
const OPERATOR_EMAIL = "operator@growthflow.example";

let admin: TestSession;
let operator: TestSession;

/** Act as a browser holding these cookies (or none). */
function asBrowser(jar: CookieJar | null) {
  state.jar = new Map(jar ?? []);
}

describe.skipIf(!hasIntegrationEnv)("auth stack against hosted Supabase (dev)", () => {
  beforeAll(async () => {
    [admin, operator] = await Promise.all([
      createSessionFor(ADMIN_EMAIL),
      createSessionFor(OPERATOR_EMAIL),
    ]);
  });

  afterEach(() => {
    state.jar = new Map();
    adminClientSpy.mockClear();
  });

  describe("unauthenticated", () => {
    it("requireUser rejects a request with no cookies (401)", async () => {
      asBrowser(null);
      const { requireUser } = await import("@/lib/auth/require-user");
      await expect(requireUser()).rejects.toMatchObject({
        code: "UNAUTHENTICATED",
        httpStatus: 401,
      });
    });

    it("rejects a FORGED session cookie (401)", async () => {
      const forged = Buffer.from(
        JSON.stringify({
          access_token: "forged.jwt.token",
          refresh_token: "forged",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: { id: admin.userId },
        }),
      ).toString("base64url");
      asBrowser(new Map([[authCookieName(), `base64-${forged}`]]));
      const { requireUser } = await import("@/lib/auth/require-user");
      await expect(requireUser()).rejects.toMatchObject({
        code: "UNAUTHENTICATED",
        httpStatus: 401,
      });
    });

    it("the admin route answers 401 with the failure envelope", async () => {
      asBrowser(null);
      const { POST } = await import("@/app/api/admin/check/route");
      const res = await POST(new Request("http://localhost:3000/api/admin/check", { method: "POST" }));
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({
        ok: false,
        error: { code: "UNAUTHENTICATED" },
      });
    });
  });

  describe("operator", () => {
    it("requireUser resolves the operator role through RLS self-read", async () => {
      asBrowser(operator.jar);
      const { requireUser } = await import("@/lib/auth/require-user");
      await expect(requireUser()).resolves.toMatchObject({
        userId: operator.userId,
        email: OPERATOR_EMAIL,
        role: "operator",
      });
      expect(adminClientSpy).not.toHaveBeenCalled();
    });

    it("the session-scoped client cannot read another user's profile (RLS)", async () => {
      asBrowser(operator.jar);
      const { createSupabaseServerClient } = await import("@/lib/supabase/server");
      const supabase = await createSupabaseServerClient();

      const other = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", admin.userId)
        .maybeSingle();
      expect(other.error).toBeNull();
      expect(other.data).toBeNull(); // the admin's row is invisible, not an error

      const all = await supabase.from("profiles").select("id");
      expect(all.data).toHaveLength(1); // only their own row
      expect(all.data?.[0]?.id).toBe(operator.userId);
    });

    it("requireRole('admin') rejects the operator (403)", async () => {
      asBrowser(operator.jar);
      const { requireRole } = await import("@/lib/auth/require-role");
      await expect(requireRole("admin")).rejects.toMatchObject({
        code: "FORBIDDEN",
        httpStatus: 403,
      });
      expect(adminClientSpy).not.toHaveBeenCalled();
    });

    it("the admin route answers 403 even for a crafted request claiming admin", async () => {
      asBrowser(operator.jar);
      const { POST } = await import("@/app/api/admin/check/route");
      const res = await POST(
        new Request("http://localhost:3000/api/admin/check?role=admin", {
          method: "POST",
          headers: { "x-role": "admin", "content-type": "application/json" },
          body: JSON.stringify({ role: "admin" }),
        }),
      );
      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({
        ok: false,
        error: { code: "FORBIDDEN" },
      });
      expect(adminClientSpy).not.toHaveBeenCalled();
    });

    it("direct database mutations with the operator's JWT are denied by PostgreSQL", async () => {
      asBrowser(operator.jar);
      const { createSupabaseServerClient } = await import("@/lib/supabase/server");
      const supabase = await createSupabaseServerClient();

      const insert = await supabase.from("clients").insert({
        external_client_id: "zz-int-1",
        name: "zz",
        email: "zz@zz.example",
        normalized_email: "zz@zz.example",
      });
      expect(insert.error?.code).toBe("42501");

      const promote = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", operator.userId);
      expect(promote.error?.code).toBe("42501");

      const del = await supabase.from("jobs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      expect(del.error?.code).toBe("42501");

      const serverOnly = await supabase.from("failure_diagnoses").select("id");
      expect(serverOnly.error?.code).toBe("42501");
    });
  });

  describe("admin", () => {
    it("requireUser resolves the admin role through RLS self-read", async () => {
      asBrowser(admin.jar);
      const { requireUser } = await import("@/lib/auth/require-user");
      await expect(requireUser()).resolves.toMatchObject({
        userId: admin.userId,
        email: ADMIN_EMAIL,
        role: "admin",
      });
      expect(adminClientSpy).not.toHaveBeenCalled();
    });

    it("requireRole('admin') succeeds", async () => {
      asBrowser(admin.jar);
      const { requireRole } = await import("@/lib/auth/require-role");
      await expect(requireRole("admin")).resolves.toMatchObject({ role: "admin" });
      expect(adminClientSpy).not.toHaveBeenCalled();
    });

    it("the admin route answers 200", async () => {
      asBrowser(admin.jar);
      const { POST } = await import("@/app/api/admin/check/route");
      const res = await POST(new Request("http://localhost:3000/api/admin/check", { method: "POST" }));
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({
        ok: true,
        data: { authorized: true, role: "admin" },
      });
      expect(adminClientSpy).not.toHaveBeenCalled();
    });

    it("reads only their own profile and still cannot mutate from the browser", async () => {
      asBrowser(admin.jar);
      const { createSupabaseServerClient } = await import("@/lib/supabase/server");
      const supabase = await createSupabaseServerClient();

      const all = await supabase.from("profiles").select("id");
      expect(all.data).toHaveLength(1);

      const insert = await supabase.from("jobs").insert({
        job_type: "DEMO_TRANSIENT_FAILURE",
        payload: {},
      });
      expect(insert.error?.code).toBe("42501");
    });
  });

  describe("anonymous database access", () => {
    it("the publishable key without a session cannot read operational tables", async () => {
      asBrowser(null);
      const { createSupabaseServerClient } = await import("@/lib/supabase/server");
      const supabase = await createSupabaseServerClient();

      const clients = await supabase.from("clients").select("id");
      expect(clients.error?.code).toBe("42501");
      const profiles = await supabase.from("profiles").select("id");
      expect(profiles.error?.code).toBe("42501");
    });
  });
});
