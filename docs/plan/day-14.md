# OpsPilot AI — Day 14 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/loom-script.md`
- `docs/reference.md`
- `docs/security-testing.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 14 — Portfolio Polish, README, Claude Evidence, Loom and Final Definition of Done

### 1. Finalize README

Document project problem, architecture, locked stack, setup, environment variables, database migrations, n8n setup, test commands, deployment, screenshots, limitations and responsible-AI boundaries.

**Primary files/artifacts:**
- `README.md`

### 2. Finalize architecture/security docs

Make sure diagrams and descriptions match the actual code, not the original intention. Update this CLAUDE.md only if the implementation legitimately required a documented change.

**Primary files/artifacts:**
- `docs/architecture.md`
- `docs/security.md`

### 3. Prepare Claude Code evidence

Choose one authentic example where Claude helped implement or fix a real issue. The evidence must show the task, code change, and test result. Do not stage fake AI usage.

**Primary files/artifacts:**
- `docs/build-log.md`

### 4. Rehearse the 2–3 minute Loom

Follow the locked script in Section 31. Keep demo data reset and deterministic. Hide secrets and unrelated browser tabs.

**Primary files/artifacts:**
- `docs/loom-script.md`

### 5. Final clean deployment check

Run all quality commands, deploy the final commit, run public smoke flow, verify Supabase Cron is active, verify no debug/admin development shortcuts remain.

**Primary files/artifacts:**
- `Final deployment`

### 6. Tag the portfolio release

Create Git tag `v1.0.0-portfolio`. Save final screenshots and repository/deployment links for the application.

**Primary files/artifacts:**
- `GitHub release/tag`

### End-of-day acceptance

- [ ] Definition of Done is fully checked.
- [ ] Public deployment works.
- [ ] Repo is understandable to a reviewer.
- [ ] Loom is 2–3 minutes and demonstrates real behavior.
- [ ] No unsupported production/adoption claims are made.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.


---
