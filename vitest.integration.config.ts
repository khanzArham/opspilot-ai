import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Integration tests talk to the hosted Supabase DEV project. The three variables they
// need are read from the local, git-ignored .env.local by this config only (never
// printed, never committed). If they are missing the suites skip with a clear reason.
const fileEnv = loadEnv("test", process.cwd(), "");
const needed = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
] as const;

const env: Record<string, string> = {};
for (const name of needed) {
  // `||` (not `??`): an empty value exported in the shell must not mask the file.
  const value = process.env[name] || fileEnv[name];
  if (value) env[name] = value;
}

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    env,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
