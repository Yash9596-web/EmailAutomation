# Secret Rotation Procedures

Follow these procedures when rotating keys either as part of compliance or due to a suspected compromise.

## 1. JWT_SECRET
**Impact**: Rotating this key will immediately invalidate **all** active user sessions. Users will be forced to log in again.
**Procedure**:
1. Generate a new secure 32+ character random string.
2. Update the `JWT_SECRET` in the infrastructure secrets manager.
3. Trigger a rolling restart of the application containers.
4. (Optional) Run `UPDATE "Session" SET "isRevoked" = true;` in the database to formally purge legacy session state.

## 2. ENCRYPTION_KEY (Integration Credentials)
**Impact**: Critical. This key encrypts external OAuth tokens and API keys in the `IntegrationCredential` table using AES-256-GCM. Changing it without migrating data will irreversibly break all customer integrations.
**Procedure**:
1. **Downtime Required**: Place the application in maintenance mode.
2. Inject `NEW_ENCRYPTION_KEY` alongside the current `ENCRYPTION_KEY`.
3. Run a custom migration script that:
   - Selects all rows from `IntegrationCredential`.
   - Decrypts `encryptedToken` using the old key.
   - Re-encrypts `encryptedToken` using the new key.
   - Saves back to the database.
4. Remove `ENCRYPTION_KEY`, rename `NEW_ENCRYPTION_KEY` to `ENCRYPTION_KEY`.
5. Restart application.

## 3. DATABASE_URL
**Impact**: Application cannot connect to DB if misconfigured.
**Procedure**:
1. Create a new DB credential in PostgreSQL.
2. Update the environment variable in the secrets manager.
3. Perform a rolling deployment.
4. Verify application stability.
5. Revoke/delete the old DB credential.
