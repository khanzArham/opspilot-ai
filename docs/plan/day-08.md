# OpsPilot AI — Day 08 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/workflows.md`
- `docs/security-testing.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 8 — Gemini Ticket Enrichment with Structured Output and Safe Fallback

### 1. Create AI provider interface

Define provider methods for ticket enrichment and failure diagnosis. Domain services depend on the interface, not directly on Google SDK.

**Primary files/artifacts:**
- `src/lib/providers/ai/ai-provider.ts`

### 2. Implement Gemini 3.8 Flash provider

Use `@google/genai` and the Interactions API. Use `store=false`. Request structured JSON output. Set an application-level timeout. Never pass secrets to the prompt.

**Primary files/artifacts:**
- `src/lib/providers/ai/gemini-provider.ts`

### 3. Implement AI response schemas

Create exact Zod schemas for ticket enrichment and failure diagnosis. Parse JSON and validate values after the provider returns.

**Primary files/artifacts:**
- `src/lib/providers/ai/schemas.ts`

### 4. Add fake AI provider

Implement deterministic fake responses and deterministic failure modes for tests. This provider is required for tests; it is not an alternate production stack.

**Primary files/artifacts:**
- `src/lib/providers/ai/fake-ai-provider.ts`

### 5. Integrate ticket enrichment after baseline persistence

Persist ticket first, then call AI, then update AI fields. Invalid/provider failure must update fallback state but still return a successful ticket response.

**Primary files/artifacts:**
- `src/lib/domain/tickets/ticket-service.ts`

### 6. Test AI fallback thoroughly

Test valid output, malformed output, timeout/provider error, and overlong values. Confirm no provider failure removes or invalidates the deterministic ticket.

**Primary files/artifacts:**
- `tests/unit/ai-ticket*`
- `tests/integration/tickets*`

### End-of-day acceptance

- [ ] Valid AI output is schema-validated and stored.
- [ ] Invalid output produces deterministic fallback.
- [ ] Provider outage does not break ticket creation.
- [ ] AI-generated reply is still review-only.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.
