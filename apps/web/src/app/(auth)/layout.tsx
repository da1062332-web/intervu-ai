import { PublicRoute } from '@/components/auth/public-route';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicRoute>
      {children}
      <script
        src="https://accounts.google.com/gsi/client"
        async
        defer
      />
    </PublicRoute>
  );
}
