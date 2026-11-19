import { describe, expect, it } from 'vitest';
import { hasRole, type AppRole } from '@/lib/auth/roles';

describe('hasRole', () => {
  // [user's role, required role, allowed]
  const cases: [AppRole, AppRole, boolean][] = [
    ['superadmin', 'superadmin', true],
    ['superadmin', 'admin', true],
    ['superadmin', 'client', true],
    ['admin', 'superadmin', false],
    ['admin', 'admin', true],
    ['admin', 'client', true],
    ['client', 'superadmin', false],
    ['client', 'admin', false],
    ['client', 'client', true],
  ];

  it.each(cases)('%s meets %s: %s', (role, required, allowed) => {
    expect(hasRole(role, required)).toBe(allowed);
  });
});
