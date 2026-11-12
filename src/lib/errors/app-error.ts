/**
 * Typed domain errors with the stable codes from docs/api-contracts.md section 24.
 * Messages are SAFE for browsers: never put stack traces, SQL, provider payloads
 * or secrets into an AppError message.
 */

export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "EVENT_ID_PAYLOAD_MISMATCH",
  "BUSINESS_DUPLICATE",
  "CLIENT_IDENTITY_CONFLICT",
  "ENTITY_NOT_FOUND",
  "INVALID_JOB_STATE",
  "UNSUPPORTED_JOB_TYPE",
  "PROVIDER_TIMEOUT",
  "PROVIDER_RATE_LIMIT",
  "PROVIDER_TEMPORARY_UNAVAILABLE",
  "INVALID_UPSTREAM_DATA",
  "AI_INVALID_OUTPUT",
  "AI_PROVIDER_ERROR",
  "DIAGNOSIS_NOT_ALLOWED",
  "DIAGNOSIS_ALREADY_DECIDED",
  "REMEDIATION_STATE_CHANGED",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/**
 * HTTP mapping per the contract: validation 422, unauthenticated 401, forbidden
 * 403, not found 404, state/conflict 409, unexpected 500.
 *
 * Provider/AI/upstream/unsupported-job codes are job-level failure codes that are
 * persisted on jobs and attempts; they are not specified as HTTP responses, so
 * if one ever escapes to an HTTP boundary it is treated as unexpected (500).
 */
const HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  ENTITY_NOT_FOUND: 404,
  EVENT_ID_PAYLOAD_MISMATCH: 409,
  BUSINESS_DUPLICATE: 409,
  CLIENT_IDENTITY_CONFLICT: 409,
  INVALID_JOB_STATE: 409,
  DIAGNOSIS_NOT_ALLOWED: 409,
  DIAGNOSIS_ALREADY_DECIDED: 409,
  REMEDIATION_STATE_CHANGED: 409,
  UNSUPPORTED_JOB_TYPE: 500,
  PROVIDER_TIMEOUT: 500,
  PROVIDER_RATE_LIMIT: 500,
  PROVIDER_TEMPORARY_UNAVAILABLE: 500,
  INVALID_UPSTREAM_DATA: 500,
  AI_INVALID_OUTPUT: 500,
  AI_PROVIDER_ERROR: 500,
  INTERNAL_ERROR: 500,
};

const DEFAULT_MESSAGE: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "The request is invalid.",
  UNAUTHENTICATED: "Authentication is required.",
  FORBIDDEN: "You do not have permission to perform this action.",
  EVENT_ID_PAYLOAD_MISMATCH:
    "This event ID was already used with a different payload.",
  BUSINESS_DUPLICATE: "A matching business record already exists.",
  CLIENT_IDENTITY_CONFLICT:
    "The external ID and email belong to different existing clients.",
  ENTITY_NOT_FOUND: "The requested record was not found.",
  INVALID_JOB_STATE: "The job is not in a state that allows this action.",
  UNSUPPORTED_JOB_TYPE: "This job type is not supported.",
  PROVIDER_TIMEOUT: "An external provider timed out.",
  PROVIDER_RATE_LIMIT: "An external provider rate limit was reached.",
  PROVIDER_TEMPORARY_UNAVAILABLE: "An external provider is temporarily unavailable.",
  INVALID_UPSTREAM_DATA: "Upstream data was invalid.",
  AI_INVALID_OUTPUT: "The AI output did not pass validation.",
  AI_PROVIDER_ERROR: "The AI provider returned an error.",
  DIAGNOSIS_NOT_ALLOWED: "A diagnosis is not allowed for this record.",
  DIAGNOSIS_ALREADY_DECIDED: "This diagnosis already has a final decision.",
  REMEDIATION_STATE_CHANGED: "The record changed since the diagnosis was made.",
  INTERNAL_ERROR: "An unexpected error occurred.",
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;

  constructor(code: ErrorCode, message?: string) {
    super(message ?? DEFAULT_MESSAGE[code]);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = HTTP_STATUS[code];
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
