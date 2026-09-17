# Integration Architecture Overview

## Concept
The Vorynex Integration Hub abstracts the complexities of third-party platforms (OAuth, Webhooks, Polling, REST mappings) away from the core Workflow and Automation Engine.

### 1. Provider Registry
The core of the framework is the `ProviderRegistry` which holds statically registered `ConnectorContract` implementations.
Each connector declares its `authMethod` (OAuth, API Key, Basic) and supported `capabilities` (e.g. `EMAIL_READ`, `INVOICE_CREATE`).

### 2. Tenant Isolation
Integration objects in the database belong strictly to a single `tenantId`.
A user connects an integration -> An `Integration` DB row is created -> Tokens are mapped to `IntegrationCredential` (encrypted).

### 3. Execution Pipeline
When the automation engine invokes an integration (via `ConnectorAction`), the flow is:
1. `IntegrationService` looks up the `Integration` by ID.
2. Credentials are decrypted natively.
3. The `Connector.executeAction()` method is called passing the standard credentials.
4. The Connector performs native HTTP operations (e.g., using `axios` or `fetch`) and formats a unified response.

### 4. Sync Engine
For structured data (e.g., syncing Customers from an ERP), the `SyncEngine` handles the abstraction. It utilizes `ExternalSyncRecord` to map Vorynex `internalId`s directly to provider `externalId`s, preventing duplicates and ensuring idempotent upserts.
