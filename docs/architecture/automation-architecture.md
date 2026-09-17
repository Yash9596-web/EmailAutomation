# Automation Architecture

Automation is the core of the platform, enabling users to build complex email sequences and AI-driven agents.

## Workflow and Agent Foundations
Currently in Stage 1, the automation engine is built on abstractions that define how workflows and agents operate, without the heavy lifting of a distributed execution environment.

### 1. Workflow Abstraction
- Defines a workflow as a Directed Acyclic Graph (DAG) of **Steps** or **Nodes**.
- **Nodes** can represent actions (e.g., "Send Email"), conditions ("If Opened"), or AI operations.
- **Stage 1 Status**: Workflows can be constructed and validated in memory. Execution is simulated to test state transitions.

### 2. Agent Foundation
- Agents are autonomous entities that can evaluate context and decide on the next best action.
- The architecture defines the `Agent` interface, which includes state management, tool access (capabilities), and evaluation loops.
- **Stage 1 Status**: Agents operate using mock AI providers and simulated tool execution.

## Execution Model (Future State)
While currently simulated in-process, the foundational design prepares for Stage 2, where:
- Workflows and Agents will be dispatched to a distributed **Job Queue**.
- Execution will be highly available and capable of pausing/resuming state (e.g., waiting for a user to open an email over 3 days).
