# Stage 21: Enterprise Exception Management

## 1. Overview
The Vorynex platform intercepts pipeline failures (e.g. low OCR confidence, Stage 19 financial mismatch, API rate limits) and routes them into the central `ExceptionCase` database table.

## 2. Models
- `ExceptionCase`: Core representation of a problem. Includes priority, status, AI triage, and deadlines.
- `ExceptionComment`: Internal audit conversations.
- `ExceptionHistory`: Immutable log of priority, status, and resolution updates.

## 3. Workflow (Human-in-the-Loop)
When the `ResolutionEngine` successfully processes a human decision, it triggers the `WORKFLOW_RESUMED` resolution code. This automatically finds the blocked `WorkflowTask` mapped to this exception case via `workflowRunId` and prompts the Stage 20 ExecutionEngine to wake back up.

## 4. Priority Engine
Priority is inferred based on source categories:
- **SYSTEM**: Critical priority.
- **FINANCIAL ($100k+)**: Critical priority.
- **WORKFLOW**: High priority.
- **DOCUMENT**: Medium priority.

## 5. Security & Idempotency
- No API mutation can occur without a matching `tenantId`.
- Resolution endpoints use Postgres Transactions (`$transaction`) and verify status states (`!== RESOLVED`) before committing changes, preventing duplicate remediation effects.
