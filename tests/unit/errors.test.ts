import { describe, expect, it, vi } from "vitest";
import {
  AppError,
  ERROR_CODES,
  isAppError,
  type ErrorCode,
} from "@/lib/errors/app-error";
import { jsonOk, toErrorResponse } from "@/lib/errors/http";

describe("AppError", () => {
  it.each<[ErrorCode, number]>([
    ["VALIDATION_ERROR", 422],
    ["UNAUTHENTICATED", 401],
    ["FORBIDDEN", 403],
    ["ENTITY_NOT_FOUND", 404],
    ["EVENT_ID_PAYLOAD_MISMATCH", 409],
    ["CLIENT_IDENTITY_CONFLICT", 409],
    ["DIAGNOSIS_ALREADY_DECIDED", 409],
    ["INTERNAL_ERROR", 500],
  ])("maps %s to HTTP %i", (code, status) => {
    expect(new AppError(code).httpStatus).toBe(status);
  });

  it("has a safe default message and HTTP status for every stable code", () => {
    for (const code of ERROR_CODES) {
      const error = new AppError(code);
      expect(error.message.length).toBeGreaterThan(0);
      expect(error.httpStatus).toBeGreaterThanOrEqual(400);
    }
  });

  it("is recognised by isAppError but plain errors are not", () => {
    expect(isAppError(new AppError("FORBIDDEN"))).toBe(true);
    expect(isAppError(new Error("x"))).toBe(false);
  });
});

describe("toErrorResponse", () => {
  it("returns the contract failure envelope with the correlation id", async () => {
    const res = toErrorResponse(new AppError("FORBIDDEN"), "corr-1");
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action.",
      },
      meta: { correlationId: "corr-1" },
    });
  });

  it("hides the details of unexpected errors behind INTERNAL_ERROR", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const secretish = new Error("connection string postgres://user:pw@host failed");
    const res = toErrorResponse(secretish, "corr-2");
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toContain("postgres://");
    expect(JSON.stringify(spy.mock.calls)).not.toContain("postgres://");
    spy.mockRestore();
  });
});

describe("jsonOk", () => {
  it("returns the success envelope", async () => {
    const res = jsonOk({ a: 1 }, { status: 201, correlationId: "corr-3" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      ok: true,
      data: { a: 1 },
      meta: { correlationId: "corr-3" },
    });
  });
});
