'use client';

import * as React from 'react';
import { useUser } from '@clerk/nextjs';
import type { AppRole } from '@/lib/auth/roles';

type RoleContextValue = {
  role: AppRole;
  loading: boolean;
  hasRole: (required: AppRole) => boolean;
};

const ROLE_HIERARCHY: Record<AppRole, number> = {
  superadmin: 3,
  admin: 2,
  client: 1,
};

const RoleContext = React.createContext<RoleContextValue>({
  role: 'client',
  loading: true,
  hasRole: () => false,
});

export function useRole() {
  return React.useContext(RoleContext);
}

export default function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [role, setRole] = React.useState<AppRole>('client');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setRole('client');
      setLoading(false);
      return;
    }

    fetch('/api/me/role')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.role) setRole(data.role);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, isLoaded]);

  const hasRoleFn = React.useCallback(
    (required: AppRole) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[required],
    [role],
  );

  const value = React.useMemo(
    () => ({ role, loading, hasRole: hasRoleFn }),
    [role, loading, hasRoleFn],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
