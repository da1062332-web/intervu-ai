import { PublicRoute } from '@/components/auth/public-route';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <PublicRoute>{children}</PublicRoute>;
}
