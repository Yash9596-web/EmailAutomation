// ============================================================================
// Seed Script — Deterministic development/test data
// ============================================================================
// Run with: npx prisma db seed
// or:       npx tsx prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. System Roles (isSystem = true, no tenantId)
  const adminRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: null as unknown as string, name: 'Admin' } },
    update: {},
    create: {
      name: 'Admin',
      description: 'Full system administrator',
      isSystem: true,
      permissions: {
        create: [
          { action: '*', resource: '*' },
        ],
      },
    },
  });

  const memberRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: null as unknown as string, name: 'Member' } },
    update: {},
    create: {
      name: 'Member',
      description: 'Standard tenant member',
      isSystem: true,
      permissions: {
        create: [
          { action: 'read', resource: '*' },
          { action: 'write', resource: 'workflows' },
          { action: 'execute', resource: 'workflows' },
        ],
      },
    },
  });

  console.log('  ✓ System roles created');

  // 2. Demo Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      status: 'Active',
    },
  });

  console.log(`  ✓ Demo tenant: ${tenant.name} (${tenant.id})`);

  // 3. Demo User (NO real credentials — this is seed data)
  const user = await prisma.user.upsert({
    where: { email: 'admin@demo.local' },
    update: {},
    create: {
      email: 'admin@demo.local',
      name: 'Demo Admin',
      status: 'ACTIVE',
    },
  });

  console.log(`  ✓ Demo user: ${user.email} (${user.id})`);

  // 4. Membership
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: {},
    create: {
      userId: user.id,
      tenantId: tenant.id,
      roleId: adminRole.id,
      status: 'Active',
    },
  });

  console.log('  ✓ Membership created');

  // 5. System Settings
  await prisma.systemSetting.upsert({
    where: { key: 'platform.version' },
    update: { value: '0.2.0' },
    create: {
      key: 'platform.version',
      value: '"0.2.0"',
      category: 'general',
    },
  });

  console.log('  ✓ System settings created');

  // 6. Tenant Settings
  await prisma.tenantSetting.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: 'timezone' } },
    update: {},
    create: {
      tenantId: tenant.id,
      key: 'timezone',
      value: '"UTC"',
    },
  });

  await prisma.tenantSetting.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: 'locale' } },
    update: {},
    create: {
      tenantId: tenant.id,
      key: 'locale',
      value: '"en-US"',
    },
  });

  console.log('  ✓ Tenant settings created');

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
