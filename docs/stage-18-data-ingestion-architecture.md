# Stage 18 Data Ingestion Architecture

The Data Ingestion Architecture represents the boundary layer separating untrusted external data (email, webhooks, generic API payloads) from the trusted domain of the Vorynex automation platform.

## 1. The `IngestionRecord`
All data enters the system through `IngestionService.ingest`. This service creates an `IngestionRecord` which acts as the source of truth for idempotency, traceability, and correlation.

## 2. Abstraction Benefits
- **Idempotency**: An API caller sending the exact same payload with the same `idempotencyKey` receives a `200 OK` but processing halts immediately, preventing duplicate invoices.
- **Malware Prevention**: Buffer size limits (`50MB`) and extension blocklists (`.exe`, etc.) prevent system exhaustion.
- **Fan-Out**: A single `IngestionRecord` (e.g. an email) can spawn multiple `Document` records (one per attachment) cleanly.

## 3. Flow
1. External System -> `/api/v1/documents/upload`
2. `IngestionService.ingest()` -> Validates & Stores to Object Storage
3. `IngestionRecord` + `Document` created
4. `DataIngested` event emitted
5. `JobWorker` queues the `document-pipeline` logic for asynchronous processing
