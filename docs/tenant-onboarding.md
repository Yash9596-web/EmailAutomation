# Tenant Onboarding Runbook

## Phase 1: Creation & Activation
1. **User Sign Up**: User completes the `/api/v1/auth/register` flow.
2. **Resource Allocation**: The system provisions the `Tenant`, the `User`, and the initial `Membership` simultaneously in a database transaction to prevent orphaned users.
3. **Defaults Seeding**: 
   - A default workflow rule (e.g. "Process Invoices") is provisioned.
   - Core notification settings are initialized.

## Phase 2: Configuration (Admin Steps)
1. **Connect Integrations**: Admin initiates OAuth connection (e.g. connecting a shared Manufacturing Inbox).
2. **Invite Users**: Admin invites additional users (e.g. 'Approvers' or 'Finance Ops').
3. **AI Configuration**: (If required) Set specific LLM parameters or custom RAG vector namespaces (ensuring the vector namespace strictly uses the `tenantId`).

## Phase 3: Go-Live Validation
1. **Smoke Test Execution**: Send a test email to the inbound webhook route.
2. **Trace Verification**: Confirm the email creates a Document, traces through OCR, and triggers a JobQueue item assigned to the correct `tenantId`.
