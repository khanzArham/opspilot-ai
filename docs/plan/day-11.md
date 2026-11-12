# OpsPilot AI — Day 11 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/workflows.md`
- `docs/api-contracts.md`
- `docs/database.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 11 — Daily Report, Operations Dashboard and Demo Control Panel

### 1. Implement report query/service

Calculate metrics from persisted records for a UTC date range. Use SQL aggregation where it makes the query simpler and faster. AI is not required.

**Primary files/artifacts:**
- `src/lib/domain/reports/report-service.ts`

### 2. Implement report API

Create authenticated `GET /api/reports/daily?date=...`. Validate date, return exact metric object and attention items.

**Primary files/artifacts:**
- `src/app/api/reports/daily/route.ts`

### 3. Build KPI dashboard

Add KPI cards, queue health, dead-letter count, recent workflow runs, recent tickets, and status badges. Use Recharts only for one or two useful operations charts.

**Primary files/artifacts:**
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/*`

### 4. Build Demo Control Panel

Implement all 13 locked scenario buttons from Section 22. Each button must call backend endpoints and refresh real state. Do not fake success in client state.

**Primary files/artifacts:**
- `src/components/demo-control/*`
- `src/app/api/demo/scenarios/[scenario]/route.ts`

### 5. Implement synthetic reset

Admin-only reset deletes only records tagged/identified as demo synthetic records. It must never use `TRUNCATE` against tables that could later contain non-demo data.

**Primary files/artifacts:**
- `src/lib/domain/demo/reset.ts`

### 6. Add report tests

Seed known fixture counts and verify the report exactly matches. Test invalid date and unauthorized access.

**Primary files/artifacts:**
- `tests/unit/reports*`
- `tests/integration/reports*`

### End-of-day acceptance

- [ ] Dashboard tells the operational story without reading console logs.
- [ ] All demo buttons use real backend logic.
- [ ] Report metrics match fixtures.
- [ ] Reset is limited to synthetic demo records.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.
