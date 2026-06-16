import { DashboardLayout } from '@/components/admin/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function CandidateDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['CANDIDATE']}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
