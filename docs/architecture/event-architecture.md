# Event Architecture

The platform heavily relies on Event-Driven Architecture (EDA) to decouple modules and handle side effects (like triggering an automation when a user is created).

## Domain Events
- Modules communicate state changes by publishing **Domain Events** (e.g., `UserCreated`, `CampaignSent`).
- Other modules can subscribe to these events and react accordingly.

## In-Process Pub/Sub (Stage 1 Foundation)
- **Current Status**: To minimize infrastructure complexity during Stage 1, the Pub/Sub system is implemented as an **in-process, memory-based event bus** (e.g., using Node.js `EventEmitter` or a lightweight custom bus).
- This allows us to establish the correct architectural boundaries, define event schemas, and write event handlers exactly as they will look in production.

## Transition to Production
Because the publishers and subscribers interact strictly through an interface (`IEventBus`), upgrading this system in Stage 2 or 3 involves simply swapping the dependency injection binding from the in-memory bus to an external broker adapter (like Redis Streams, RabbitMQ, or AWS EventBridge), with zero changes required in the domain logic.
