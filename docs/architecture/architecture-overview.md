# Architecture Overview

## Current State: Stage 1 (Foundation)

The Email Automation platform is currently in **Stage 1** of its development. At this stage, the system is designed as a **Modular Monolith** using **Next.js (App Router)**. This foundation establishes the core boundaries and abstractions, but many backend components (such as the database and production messaging queues) are currently backed by mock implementations or in-memory foundations.

## Core Architectural Patterns

- **Modular Monolith**: The application is structured into distinct, isolated modules (domains) that run within a single Next.js process. This allows for rapid iteration while maintaining strict boundaries, enabling easy extraction into microservices in the future if required.
- **Next.js App Router**: Serves as the primary framework for both the React frontend and the server-side API routes. It handles routing, server-side rendering (SSR), and server components.
- **Server-Side APIs**: Backend logic is encapsulated within Next.js Route Handlers and Server Actions, providing a clean boundary between the client UI and business logic.

## Future Evolution (Stage 2 and Beyond)

- **Database**: Currently using foundational structures and mock data. Future stages will introduce **Prisma ORM** coupled with a robust relational database (e.g., PostgreSQL).
- **Messaging/Events**: Currently relying on in-process/mock event buses. This will evolve to use external message brokers (like Redis or RabbitMQ) for distributed event handling and job processing.
