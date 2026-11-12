# OpsPilot AI — API Contracts & Stable Errors

**Single source of truth for HTTP endpoints, response envelopes, status behavior, and stable error codes.**

# 12. API Contract — FINAL

All API responses use JSON.

Common success envelope:

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "correlationId": "..."
  }
}
```

Common failure envelope:

```json
{
  "ok": false,
  "error": {
    "code": "STABLE_ERROR_CODE",
    "message": "Safe human-readable message"
  },
  "meta": {
    "correlationId": "..."
  }
}
```

Do not return stack traces to the browser.

## 12.1 `POST /api/events/deal-won`

Auth:
- signed-in admin/operator OR machine-auth n8n route forwarding to the same service

Input:

```json
{
  "schemaVersion": 1,
  "eventId": "evt_demo_001",
  "eventType": "deal.won",
  "occurredAt": "2026-11-11T10:00:00Z",
  "client": {
    "externalClientId": "crm_1001",
    "name": "Northstar Labs",
    "email": "ops@northstar.example",
    "company": "Northstar Labs"
  }
}
```

Output fields:
- `eventId`
- `clientId`
- `eventReplay`
- `businessDuplicate`
- `createdTaskCount`
- `existingTaskCount`
- `notificationJobId`
- `workflowRunId`

Status:
- `201` first successful processing
- `200` idempotent replay
- `409` same event ID with different payload hash
- `422` validation failure
- `401/403` auth failure

## 12.2 `POST /api/tickets`

Input:
- subject
- body
- optional clientId
- optional externalTicketId

Output:
- ticket
- deterministic category
- deterministic priority
- AI status
- AI summary if valid
- AI suggested reply if valid
- review status always `requires_review`

## 12.3 `POST /api/jobs/{id}/diagnose`

Admin only.

Precondition:
- job status must equal `dead_letter`

Output:
- diagnosis record
- recommended action
- confidence
- expected impact
- rollback plan
- `pending_approval`

## 12.4 `POST /api/diagnoses/{id}/decision`

Admin only.

Input:
```json
{
  "decision": "approved",
  "comment": "Validated provider is healthy; safe to retry."
}
```

Behavior:
- reject second decision with `409`
- re-read diagnosis and job
- verify diagnosis still applicable
- execute only the deterministic mapping defined later
- audit decision and execution

## 12.5 `GET /api/reports/daily?date=YYYY-MM-DD`

Authenticated admin/operator.

Return:
- deal events processed
- unique new clients
- event replays
- business duplicate matches
- tickets created
- AI ticket enrichments succeeded
- AI fallbacks/errors
- jobs succeeded
- retries scheduled
- dead-letter count
- pending diagnoses
- approved remediations
- top failure codes
- attention items

## 12.6 `POST /api/internal/jobs/process`

Machine only.

Auth:
- HMAC signature from Supabase Cron.

Request body:
```json
{
  "source": "supabase_cron"
}
```

Response:
- claimed count
- succeeded count
- retry scheduled count
- dead-letter count
- compact per-job results

Batch size is **10 jobs**.

## 12.7 `POST /api/integrations/n8n/deal-won`

Machine only.

Auth:
- exact `X-OpsPilot-N8N-Secret` match
- no browser access

Behavior:
- validate machine secret
- validate same DealWon schema
- call the same onboarding service as the UI/API
- return normalized result

## 12.8 `POST /api/integrations/n8n/daily-report`

Machine only.

Auth:
- exact `X-OpsPilot-N8N-Secret` match
- constant-time comparison
- no browser access

Input:
```json
{
  "date": "2026-11-11"
}
```

Behavior:
- validate machine secret
- validate the UTC date
- call the exact same deterministic report service used by `/api/reports/daily`
- return the report metrics in a compact machine-friendly response
- never create a second implementation of report calculations inside n8n

---

---

# 24. Error Taxonomy

Create typed domain errors.

Stable codes:

- `VALIDATION_ERROR`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `EVENT_ID_PAYLOAD_MISMATCH`
- `BUSINESS_DUPLICATE`
- `CLIENT_IDENTITY_CONFLICT`
- `ENTITY_NOT_FOUND`
- `INVALID_JOB_STATE`
- `UNSUPPORTED_JOB_TYPE`
- `PROVIDER_TIMEOUT`
- `PROVIDER_RATE_LIMIT`
- `PROVIDER_TEMPORARY_UNAVAILABLE`
- `INVALID_UPSTREAM_DATA`
- `AI_INVALID_OUTPUT`
- `AI_PROVIDER_ERROR`
- `DIAGNOSIS_NOT_ALLOWED`
- `DIAGNOSIS_ALREADY_DECIDED`
- `REMEDIATION_STATE_CHANGED`
- `INTERNAL_ERROR`

HTTP mapping:
- validation -> 422
- unauthenticated -> 401
- forbidden -> 403
- not found -> 404
- state/conflict -> 409
- unexpected -> 500 with safe message

---
