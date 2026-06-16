import { DashboardLayout } from '@/components/admin/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
