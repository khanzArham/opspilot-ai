import { NextResponse } from "next/server";
import { AppError, isAppError } from "./app-error";

/** Response envelopes from docs/api-contracts.md section 12. */

export function newCorrelationId(): string {
  return crypto.randomUUID();
}

export function jsonOk<T>(
  data: T,
  options: { status?: number; correlationId?: string } = {},
) {
  return NextResponse.json(
    {
      ok: true as const,
      data,
      meta: { correlationId: options.correlationId ?? newCorrelationId() },
    },
    { status: options.status ?? 200 },
  );
}

/**
 * Map ANY thrown value to the failure envelope. AppErrors expose their stable
 * code and safe message; everything else becomes INTERNAL_ERROR with a generic
 * message. Stack traces, provider payloads and raw error text never reach the
 * browser (they are logged server-side with the correlation id only).
 */
export function toErrorResponse(
  error: unknown,
  correlationId: string = newCorrelationId(),
) {
  let safe: AppError;
  if (isAppError(error)) {
    safe = error;
  } else {
    safe = new AppError("INTERNAL_ERROR");
    console.error("[api] unexpected error", {
      correlationId,
      name: error instanceof Error ? error.name : typeof error,
    });
  }

  return NextResponse.json(
    {
      ok: false as const,
      error: { code: safe.code, message: safe.message },
      meta: { correlationId },
    },
    { status: safe.httpStatus },
  );
}
