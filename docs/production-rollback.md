# Production Release & Rollback Checklist

## 1. Release Candidate Preparation
- [ ] Code is merged into `main` and all CI workflows are green.
- [ ] `npm test` passes 100% locally/in CI.
- [ ] Database migration script (`prisma migrate deploy`) has been tested against staging data.
- [ ] Expected downtime (if any) is communicated.

## 2. Deployment Sequence
1. **Infrastructure**: CI builds the new Docker Image `vorynex-automation:<version>`.
2. **Pre-Flight**: Database is backed up automatically via RDS/Cloud provider snapshot.
3. **Migration**: Run `npx prisma migrate deploy` in a temporary task against the production DB.
4. **App Rollout**: Trigger a rolling update of the Next.js containers. Old containers drain connections while new ones spin up.
5. **Validation**: Run automated smoke tests. Check `/api/v1/health` and `/api/v1/ready`.

---

# Rollback Procedure

If the deployment causes high error rates (SEV-1/SEV-2):

## A. Application-Only Rollback (No DB Changes)
If the deployment did not include schema migrations:
1. Re-deploy the previous Docker image tag from the container registry.
2. Wait for containers to cycle.
3. Verify metrics return to baseline.

## B. Application + Database Rollback (Complex)
If the deployment included a schema migration that breaks backward compatibility:
*Note: Prisma does not support native "down" migrations cleanly out of the box in production.*
1. **Immediate Stop**: Stop all active background workers and web traffic (maintenance mode).
2. **Database Restore**: Restore the database from the pre-flight snapshot taken before the migration.
3. **Image Rollback**: Revert the Docker image tag to the previous version.
4. **Restart**: Bring traffic back online.
5. **Data Recovery**: Any data created between the migration and the rollback must be manually recovered from the broken DB state using an external script. This is why non-destructive database migrations are mandatory.
