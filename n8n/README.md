# n8n workflows

n8n Community Edition runs **locally in Docker only**. It is an orchestration and demo layer: it calls approved OpsPilot HTTP endpoints and never owns business rules, retries, authorization or canonical state. The public demo must work with n8n offline.

Planned exports (committed once built):

- `deal-won-orchestrator.json`
- `daily-report-messenger.json`

Rules for anything committed here:

- Export workflows without credentials. Never commit n8n credentials, encryption keys or the local database (`.n8n/` and `n8n-data/` are git-ignored).
- The shared secret is sent in the `X-OpsPilot-N8N-Secret` header and comes from an n8n credential, never from the workflow JSON.
- Use synthetic `.example` data only.
