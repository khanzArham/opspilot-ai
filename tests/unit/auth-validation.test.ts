import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { loginSchema } from "@/lib/validation/auth";

describe("safeRedirectPath", () => {
  it("defaults to /dashboard for missing or non-string input", () => {
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
    expect(safeRedirectPath(["/dashboard"])).toBe("/dashboard");
  });

  it("keeps dashboard paths and their query string", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/dashboard/jobs?status=dead_letter")).toBe(
      "/dashboard/jobs?status=dead_letter",
    );
  });

  it.each([
    "https://evil.example/dashboard",
    "//evil.example/dashboard",
    "/\\evil.example",
    "/dashboardx",
    "/api/internal/jobs/process",
    "/login",
    "javascript:alert(1)",
    "/dashboard/../login",
  ])("rejects unsafe target %s", (target) => {
    expect(safeRedirectPath(target)).toBe("/dashboard");
  });
});

describe("loginSchema", () => {
  it("trims and lowercases the email", () => {
    const parsed = loginSchema.parse({
      email: "  Admin@GrowthFlow.example ",
      password: "x",
    });
    expect(parsed.email).toBe("admin@growthflow.example");
  });

  it("rejects an invalid email", () => {
    expect(
      loginSchema.safeParse({ email: "not-an-email", password: "x" }).success,
    ).toBe(false);
  });

  it("rejects empty and oversized passwords", () => {
    const email = "a@growthflow.example";
    expect(loginSchema.safeParse({ email, password: "" }).success).toBe(false);
    expect(
      loginSchema.safeParse({ email, password: "p".repeat(257) }).success,
    ).toBe(false);
  });

  it("rejects missing fields (FormData.get returns null)", () => {
    expect(loginSchema.safeParse({ email: null, password: null }).success).toBe(
      false,
    );
  });
});
