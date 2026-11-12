# OpsPilot AI — Day 03 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/architecture.md`
- `docs/database.md`
- `docs/security-testing.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 3 — Supabase Auth, Server Sessions, Roles, RLS and Protected Routes

### 1. Implement Supabase browser/server/admin clients

Use `@supabase/ssr` for cookie-based Next.js sessions. Create a browser client, server request client, and a server-only privileged client. The privileged client file must never be imported by client components.

**Primary files/artifacts:**
- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`

### 2. Build login/logout

Create email/password login. Protect `/dashboard/**`. Logged-out visitors must be redirected to login. Add logout from the authenticated navigation.

**Primary files/artifacts:**
- `src/app/(auth)/login/page.tsx`
- `src/components/layout/*`

### 3. Implement role helpers

Implement `requireUser()` and `requireRole('admin')`. Load role from `profiles`, never from request body. Return stable 401/403 API errors.

**Primary files/artifacts:**
- `src/lib/auth/require-user.ts`
- `src/lib/auth/require-role.ts`
- `src/lib/auth/roles.ts`

### 4. Create RLS migration

Enable RLS on all public application tables. Allow authenticated reads required for the dashboard. Prevent browser-side core mutations. Profile self-read is allowed. Admin/worker mutations still go through server endpoints and server credentials.

**Primary files/artifacts:**
- `supabase/migrations/004_rls.sql`

### 5. Add auth tests

Test unauthenticated access, operator denial on an admin-only route, and admin success. Add a temporary admin-check endpoint only if needed for test development, then remove it once real admin endpoints exist.

**Primary files/artifacts:**
- `tests/unit/auth*`
- `tests/integration/auth*`

### End-of-day acceptance

- [ ] Logged-out dashboard access is blocked.
- [ ] Operator cannot perform admin action by manually crafting an HTTP request.
- [ ] Admin server authorization works.
- [ ] RLS is enabled and documented.
- [ ] Secret Supabase key is absent from client bundle.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.
