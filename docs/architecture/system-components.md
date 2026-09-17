# System Components

This document outlines the high-level components of the Email Automation platform. 

> [!NOTE]
> **Stage 1 Disclaimer**: The system is currently in Stage 1. Components related to persistent storage (DB) and distributed messaging (Pub/Sub, Job Queues) are built as foundation interfaces with mock or in-memory implementations.

## 1. Frontend UI
- Built with **React** and **Tailwind CSS**.
- Utilizes **Next.js Server Components** for optimized rendering and data fetching.
- Client components are used strictly for interactive elements.

## 2. API Routes & Server Actions
- **Next.js Route Handlers (`app/api/...`)**: Expose REST-like endpoints for external integrations and complex client interactions.
- **Server Actions**: Used for form submissions and direct mutations from the client to the server, simplifying the data flow.

## 3. Internal Event Bus
- A centralized mechanism for cross-module communication within the modular monolith.
- **Current Implementation**: In-process, in-memory event bus. Provides the foundation for domain events without the overhead of external infrastructure.
- **Future State**: Will be replaced or augmented by a robust Pub/Sub system (e.g., Redis, Kafka) when horizontal scaling is required.

## 4. Local Job Queue
- Handles asynchronous background tasks (e.g., scheduling emails, processing AI workflows).
- **Current Implementation**: In-memory job queue with mock processing capabilities to validate the architecture.
- **Future State**: Transition to a persistent background job processor (e.g., BullMQ) in Stage 2.

## 5. Persistence Layer (Foundation)
- Defines repository interfaces for data access.
- **Current Implementation**: In-memory stores or mock repositories.
- **Future State**: Prisma ORM implementation.
