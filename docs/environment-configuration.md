# Environment Configuration Strategy

This document outlines the required environment variables to run the application in production. 

*DO NOT store actual values in this document or in source control.*

## 1. Secrets (Server Only)
*Must be securely injected via a secrets manager (e.g., AWS Secrets Manager, GitHub Secrets).*

| Variable | Purpose | Rotation |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Manual / On Compromise |
| `JWT_SECRET` | 32+ char cryptographic key for signing user sessions | Every 90 days |
| `ENCRYPTION_KEY` | 32+ char AES-256-GCM key for encrypting integration credentials at rest | Strictly Controlled (Requires data migration) |

## 2. Server Configuration (Server Only)
*Application routing and structural variables.*

| Variable | Purpose | Default |
|----------|---------|---------|
| `NODE_ENV` | Must be `production` | `production` |
| `PORT` | The port the container listens on | `3000` |
| `NEXT_PUBLIC_APP_URL` | The fully qualified domain of the platform (used for CORS and OAuth redirects) | None (Required) |
| `NEXT_PHASE` | Used internally to bypass strict secret checks during the Docker build phase | `undefined` |

## 3. Public Configuration (Frontend Exposed)
*Safe to be bundled into the client React code.*

*None currently exist in this monolithic phase. If tracking IDs or public telemetry keys are added, they must be prefixed with `NEXT_PUBLIC_`.*
