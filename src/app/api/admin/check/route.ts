import { requireRole } from "@/lib/auth/require-role";
import { jsonOk, newCorrelationId, toErrorResponse } from "@/lib/errors/http";

/**
 * TEMPORARY admin-only probe (Day 3 Step 5). It exists only so the auth stack can be
 * exercised over HTTP before real admin endpoints exist. It mutates nothing.
 * REMOVE once `POST /api/jobs/{id}/diagnose` (admin only) is implemented, and move the
 * assertions in tests/**\/admin-check* onto that endpoint.
 *
 * Route handlers stay thin: auth -> (validate) -> domain -> HTTP mapping. The caller's
 * role is never read from the request; it comes from the validated session + profiles.
 */
// The request is deliberately unused: authorization must not depend on any request input.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: Request) {
  const correlationId = newCorrelationId();
  try {
    const { role } = await requireRole("admin");
    return jsonOk({ authorized: true, role }, { correlationId });
  } catch (error) {
    return toErrorResponse(error, correlationId);
  }
}
