# AI Operations Intelligence & Manufacturing Copilot

## 1. Overview
The Manufacturing Copilot is an intelligent overlay on top of the Vorynex platform. Unlike a generic chatbot, it operates via a restricted set of internal `Tools` hooked directly to deterministic analytics services.

## 2. Architecture
```text
User 
  → Copilot Chat UI 
  → Copilot API
  → Intent Recognition 
  → Tool Registry (Zod Validated) 
  → Analytics Service (Requires tenantId) 
  → Database (Prisma)
```

## 3. Tool Safety and Permissions
The AI is completely denied access to the raw Prisma Client. It may only call functions exported from `CopilotToolsRegistry`.
- Before executing any tool, `OperationsAnalyticsService` enforces `tenantId` checking to prevent Prisma `undefined` cross-tenant bleed.
- Tool responses are natively shaped into `structuredData` objects attached to `Message` rows, which the UI visualizes cleanly.

## 4. State Management
- `Conversation`: Roots a session in a `tenantId`, `userId`, and optional `contextType` (e.g. tracking that this chat was opened while viewing Supplier 123).
- `Message`: Contains role, text content, citations (evidence markers), and structured operational findings.

## 5. Extensibility
To add new operational metrics to the Copilot:
1. Add a deterministic metric fetcher in `OperationsAnalyticsService`.
2. Register the wrapper in `CopilotToolsRegistry` with a distinct `schema`.
3. The Copilot engine will automatically map intents to the new tool.
