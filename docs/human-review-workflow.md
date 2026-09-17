# Human Review Workflow

The Human Review Workflow bridges the gap between probabilistic AI extraction and deterministic enterprise data mapping.

## Why is it needed?
AI models occasionally hallucinate tax amounts, misinterpret supplier identities, or mistake a 1 for an l. When the pipeline calculates that `Subtotal + Tax != Total`, it cannot blindly generate an Invoice.

## The Review Queue
1. **Trigger**: `DocumentValidator` fails OR `Extractor` confidence `< 0.8`.
2. **State Transition**: `Document.status` becomes `REVIEW_REQUIRED`.
3. **Task Generation**: A `ReviewTask` is spawned for the Tenant.
4. **UI**: Users access `/documents/[id]` to visualize the document alongside the extracted fields.
5. **Correction**: The user fixes the fields and approves.
6. **Audit**: The changes are recorded immutably in `HumanCorrectionRecord` specifying the `fieldPath`, `originalValue`, and `correctedValue`.
7. **Resumption**: The document transitions to `COMPLETED` and the `DocumentCompleted` event fires to resume workflows.
