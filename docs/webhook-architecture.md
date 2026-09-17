# Integration Webhook Architecture

## Inbound Webhooks
The Vorynex system standardizes inbound provider events (e.g., a new email from Gmail, a payment from Stripe) through the `WebhookFramework`.

### Security Checkpoints
1. **Signature Validation**: Connectors individually validate the payload HMAC/Signature before parsing.
2. **Idempotency**: Using `IdempotencyRecord`, webhooks are hashed against `providerId` and `externalId`. If an identical request arrives within 7 days, it is instantly discarded.
3. **Event Normalization**: Provider events are unified into the standard `IntegrationEvent` shape.
4. **Event Bus**: Validated webhooks trigger a standard `ExternalWebhookReceived` event on the in-memory bus, unblocking the HTTP layer instantly.

## Outbound Webhooks
Tenants can define `IntegrationWebhook` endpoints to notify their internal servers.

### Dispatch Flow
1. **Event Trigger**: When a core event happens (e.g., Invoice Approved), `OutboundWebhookService.dispatchEvent()` triggers.
2. **Background Queue**: A `JobRecord` is queued for `webhook-delivery`.
3. **Delivery Worker**: 
   - Checks endpoint for SSRF (rejects local/internal IPs).
   - Generates an `X-Vorynex-Signature` using the Tenant's secret.
   - Enforces a 10s `AbortController` timeout on the fetch.
   - Persists the result into `IntegrationWebhookDelivery` for logging and retries.
