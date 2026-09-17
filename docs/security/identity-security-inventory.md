# Identity & Security Inventory

> Stage 3 — Security Audit & Baseline

## Current State (Prior to Stage 3 Implementation)

### 1. Authentication Method
- **Current**: None implemented. The UI contains static HTML forms (`/login`, `/register`) with no backend API integration.
- **Required**: Implementation of secure credentials-based authentication with properly hashed passwords and standardized login flows.

### 2. Session/Token Strategy
- **Current**: None. No cookies or local storage tokens are being managed.
- **Required**: Secure, HttpOnly, SameSite=Strict cookies containing cryptographically signed stateless tokens (JWT) or secure opaque session IDs.

### 3. Password Handling
- **Current**: No password fields exist in the database schema.
- **Required**: Add `passwordHash` to the `User` model. Implement `bcrypt` for secure, salted password hashing.

### 4. Tenant Strategy
- **Current**: Database enforces tenant isolation via the `tenantId` foreign key and `BaseRepository` application logic.
- **Required**: Inject the resolved `tenantId` securely from the authenticated session context into the `BaseRepository` initialization.

### 5. Role Strategy
- **Current**: Database supports `Role` mapping to `Membership` (Tenant scoped) or System-level roles (`isSystem = true`).
- **Required**: Implement middleware and route guards to enforce role verification before accessing tenant resources.

### 6. Permission Strategy
- **Current**: The `hasPermission` utility exists in `src/lib/auth/rbac.ts` but isn't wired to any API endpoints.
- **Required**: Centralized authorization middleware/decorators to block unauthorized access at the API layer.

### 7. Existing Vulnerabilities
- **Missing Auth**: APIs are completely exposed without authentication checks.
- **No Rate Limiting**: The platform is vulnerable to credential stuffing/brute force on the planned login endpoints.
- **No CSRF Protection**: While APIs rely on CORS, cookie-based sessions will require CSRF considerations (SameSite attributes).

### 8. Existing Protections
- **Database Architecture**: `BaseRepository` heavily mitigates cross-tenant data leaks.
- **Audit System**: `AuditRepository` successfully captures structured events (ready to log authentication events).
- **Mass Assignment**: Repositories strictly define updatable fields, ignoring arbitrary payload data.

### 9. Required Improvements
- Integrate `bcrypt` for password hashing.
- Integrate `jose` for secure JWT generation/validation.
- Create `/api/v1/auth/login`, `/api/v1/auth/logout`, `/api/v1/auth/register` endpoints.
- Create edge middleware (`middleware.ts`) for route protection and session resolution.
- Ensure authentication events are pushed to the `AuditService`.
