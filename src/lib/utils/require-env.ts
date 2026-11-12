/**
 * Fail fast with a clear message when a required environment variable is missing.
 *
 * The value is passed in (not looked up by name) because Next.js only inlines
 * `process.env.NEXT_PUBLIC_*` into browser bundles when the reference is a
 * static property access. The error names the variable but never prints a value.
 */
export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    );
  }
  return value;
}
