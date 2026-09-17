# Stage 17 Test Matrix

This matrix verifies the security and isolation behaviors of the Integration Framework.

| Scenario | Component | Expected Result | Actual Result |
|----------|-----------|-----------------|---------------|
| Connect Integration Flow | `OAuthService` | Requires valid Session & state parameter | **PASS** |
| CSRF attempt on callback | `OAuthService` | Rejected (Invalid state token) | **PASS** |
| Cross-tenant integration access | `IntegrationService` | HTTP 404 Not Found / Context rejected | **PASS** |
| Outbound Webhook to `http://localhost` | `OutboundWebhookService` | Rejected (SSRF Protection) | **PASS** |
| Inbound Webhook Replay | `WebhookFramework` | Ignored (Idempotency Key exists in DB) | **PASS** |
| Sync Engine duplicates | `SyncEngine` | Ignored (ExternalSyncRecord exists) | **PASS** |
| Connector execution failure | `JobWorker` | Job transitions to `Retrying` based on backoff | **PASS** |
| Database Push Validation | `Prisma` | Schema validated, tables strictly mapped | **PASS** |
