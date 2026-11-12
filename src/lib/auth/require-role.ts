import "server-only";
import { AppError } from "@/lib/errors/app-error";
import { requireUser, type AuthContext } from "./require-user";
import type { AppRole } from "./roles";

/**
 * Like `requireUser()`, but also requires one of the allowed roles.
 * `requireRole("admin")` guards diagnosis, approval and remediation actions.
 * Throws UNAUTHENTICATED (401) or FORBIDDEN (403).
 */
export async function requireRole(
  ...allowed: [AppRole, ...AppRole[]]
): Promise<AuthContext> {
  const context = await requireUser();
  if (!allowed.includes(context.role)) throw new AppError("FORBIDDEN");
  return context;
}
