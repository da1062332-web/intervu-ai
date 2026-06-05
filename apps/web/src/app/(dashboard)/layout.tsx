import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
