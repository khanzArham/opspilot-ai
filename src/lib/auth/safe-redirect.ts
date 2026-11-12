const DEFAULT_PATH = "/dashboard";

/**
 * Resolve a user-supplied post-login target to a safe same-origin path.
 * Only `/dashboard` and its sub-paths are allowed; anything else (absolute URLs,
 * protocol-relative `//host`, other app paths, garbage) falls back to the default.
 * This prevents open-redirect abuse of the `?next=` parameter.
 */
export function safeRedirectPath(next: unknown): string {
  if (typeof next !== "string" || next.length === 0 || next.length > 512) {
    return DEFAULT_PATH;
  }
  // Backslashes are treated as slashes by some browsers ("/\evil.example").
  if (next.includes("\\")) return DEFAULT_PATH;

  let url: URL;
  try {
    url = new URL(next, "http://opspilot.invalid");
  } catch {
    return DEFAULT_PATH;
  }

  if (url.origin !== "http://opspilot.invalid") return DEFAULT_PATH;
  const { pathname } = url;
  if (pathname !== "/dashboard" && !pathname.startsWith("/dashboard/")) {
    return DEFAULT_PATH;
  }
  return `${pathname}${url.search}`;
}
