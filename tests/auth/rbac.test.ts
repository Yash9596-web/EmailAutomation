import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasPermission, hasSystemRole } from '@/lib/auth/rbac';

describe('RBAC Logic', () => {
  const adminUser = {
    id: '1',
    roles: [{
      name: 'Admin',
      isSystem: true,
      permissions: [
        { action: 'read', resource: 'document' },
        { action: 'write', resource: 'document' }
      ]
    }]
  };

  const readOnlyUser = {
    id: '2',
    roles: [{
      name: 'Viewer',
      isSystem: false,
      permissions: [
        { action: 'read', resource: 'document' }
      ]
    }]
  };

  it('correctly identifies system roles', () => {
    expect(hasSystemRole(adminUser.roles as any)).toBe(true);
    expect(hasSystemRole(readOnlyUser.roles as any)).toBe(false);
  });

  it('correctly checks specific permissions', () => {
    expect(hasPermission(adminUser.roles as any, 'write', 'document')).toBe(true);
    expect(hasPermission(readOnlyUser.roles as any, 'write', 'document')).toBe(false);
    expect(hasPermission(readOnlyUser.roles as any, 'read', 'document')).toBe(true);
  });

  it('handles users with no roles', () => {
    const emptyUser = { id: '3', roles: [] };
    expect(hasPermission(emptyUser.roles as any, 'read', 'document')).toBe(false);
    expect(hasSystemRole(emptyUser.roles as any)).toBe(false);
  });
});
