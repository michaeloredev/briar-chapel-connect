'use client';

import { useRole } from './RoleProvider';
import type { AppRole } from '@/lib/auth/roles';

interface RoleGateProps {
  minimum: AppRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client-side gate that only renders children when
 * the current user's role meets the minimum threshold.
 */
export default function RoleGate({ minimum, children, fallback = null }: RoleGateProps) {
  const { hasRole, loading } = useRole();
  if (loading) return null;
  return hasRole(minimum) ? <>{children}</> : <>{fallback}</>;
}
