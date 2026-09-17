# Stage 20: Workflow Architecture

## Design Overview
The Vorynex Automation platform uses an asynchronous Directed Acyclic Graph (DAG) workflow engine. 
It relies on a modular `ActionRegistry` and `TriggerRegistry`.

### 1. Extensibility
Actions are separated into domain boundaries:
- `transaction-actions.ts`: Interacts directly with Stage 19 financial models (`InvoiceEngine`, `PaymentEngine`).
- `ai-actions.ts`: Wraps AI inference inside deterministic validation logic.

### 2. Execution Loop
The `ExecutionEngine` processes one `WorkflowTask` at a time. It stores the intermediate result into `context.variables` (the workflow context state), logs the result in `WorkflowTask`, and enqueues the next task.
If a task returns `Waiting` (such as an Approval step), the engine gracefully exits and leaves the `WorkflowRun` in the `Waiting` state until an external Webhook or API call resumes it.

### 3. Tenant Safety
Every `WorkflowRun` is permanently bound to a `tenantId`. Variables cannot leak across runs. Nested executions are restricted via `EXECUTION_LIMITS.MAX_EXECUTION_DEPTH`.
