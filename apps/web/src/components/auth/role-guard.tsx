'use client';

import { useAuth } from '@/hooks/use-auth';

interface RoleGuardProps {
  children: React.ReactNode;
  roles: string[];
}

export function RoleGuard({ children, roles }: RoleGuardProps) {
  const { role, isHydrated, isAuthenticated } = useAuth();

  if (!isHydrated || !isAuthenticated) {
    return null;
  }

  if (role && roles.includes(role)) {
    return <>{children}</>;
  }

  return null;
}
