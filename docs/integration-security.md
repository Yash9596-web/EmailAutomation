# Integration Security Standards

## 1. OAuth State Protection (CSRF)
The OAuth2 flow requires a cryptographically strong `state` parameter generated during `startOAuthFlow`. This `state` is stored in the database tied securely to the user's `session.tenantId`. When the callback resolves, the tokens are applied *only* to that tenant, preventing Cross-Site Request Forgery and Cross-Tenant linkage.

## 2. Server-Side Request Forgery (SSRF) Protection
Connectors such as `RestConnector` and the `OutboundWebhookService` permit user-provided URLs.
These inputs are strictly validated:
- Must begin with `https://`.
- DNS resolution checks reject `localhost`, `127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, and `192.168.0.0/16`.

## 3. Credential Encryption at Rest
API Keys and OAuth tokens are never stored in plaintext. `IntegrationCredential.encryptedToken` utilizes the framework's `CryptoService` (AES-256-GCM) with the environment `ENCRYPTION_KEY`. Decryption happens only inside the Node.js memory space at the exact moment a `Connector.executeAction` triggers.

## 4. API & UI Masking
Integration API endpoints (`/api/v1/integrations`) explicitly `select` or `omit` credential payloads. The frontend React interface *never* receives raw tokens or API keys, ensuring no leakage to browser developer tools.
