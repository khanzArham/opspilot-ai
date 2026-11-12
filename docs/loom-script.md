# OpsPilot AI — Final Loom Script

**Read on Day 14 only, unless explicitly preparing the demo earlier.**

# 31. Locked Loom Demo Script

Target duration: **2:40–3:00**

## 0:00–0:20 — Introduction
Show dashboard.

Say:
> OpsPilot AI is an internal operations autopilot for a fictional agency. The backend and Postgres own state, n8n is an orchestration layer, and AI is constrained by structured output, deterministic fallbacks, and human approval.

## 0:20–0:45 — New Deal
Click **Send New Deal**.
Show:
- client created
- four tasks
- queued notification job
- workflow run

## 0:45–1:00 — Exact Replay
Click **Replay Same Event**.
Show:
- `eventReplay=true`
- client/task/job counts unchanged

## 1:00–1:15 — Business Duplicate
Click **Same Client, New Event ID**.
Show:
- new processed event
- same canonical client
- `businessDuplicate=true`

## 1:15–1:40 — Failure Handling
Trigger temporary failure and permanent failure.
Show:
- retry attempt history
- next retry
- dead-letter state

## 1:40–2:10 — AI Diagnosis + Human Approval
Open dead-letter job.
Click diagnose.
Show:
- root cause
- allowed action
- confidence
- expected impact
- rollback plan

Approve.
Show deterministic result and audit record.

## 2:10–2:30 — Ticket AI + Fallback Safety
Open/create ticket.
Show deterministic category/priority and AI summary/suggested reply.
Explicitly mention it is never auto-sent.

## 2:30–2:42 — Daily Report
Generate report.
Show metrics.

## 2:42–2:55 — Claude Code Evidence
Show `CLAUDE.md`, a genuine implementation/fix diff and passing test.

## 2:55–3:00 — Close
Show repo/deployment link and say:
> The project focuses on reliable AI-native operations: durable state, safe automation, bounded retries, auditable AI recommendations, and human-controlled remediation.

---
