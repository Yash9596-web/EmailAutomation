# Security Architecture

Security is built into the foundation of the platform, even during Stage 1. The architecture is designed to support multi-tenancy and robust access control.

## 1. Middleware Boundary
- **Next.js Middleware** acts as the first line of defense.
- It intercepts all incoming requests to perform early authentication checks, session validation, and basic routing protection before the request reaches any application logic.

## 2. Role-Based Access Control (RBAC) Foundation
- Access to resources and actions is governed by roles and permissions.
- **Stage 1 Implementation**: The RBAC system is currently built on foundational abstractions. Permissions are verified against mock user profiles and session data.
- It establishes the interface for defining roles (e.g., `Admin`, `Editor`, `Viewer`) and checking capabilities (`canCreateCampaign`, `canViewAnalytics`).

## 3. Tenant Isolation
- Designed from the ground up for a multi-tenant environment (B2B SaaS model).
- Every request context must be associated with a specific Tenant ID.
- Data access layers (even the current mock implementations) strictly enforce tenant isolation, ensuring that one tenant cannot query or modify another tenant's data.
- **Future State**: When Prisma is integrated, tenant isolation will be enforced at the database query level (e.g., mandatory `tenantId` filtering).

## 4. Input Validation
- All external inputs (from APIs or Server Actions) are strictly validated using Zod schemas at the very edge of the API layer to prevent injection and payload attacks.
