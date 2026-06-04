import { redirect } from 'next/navigation';

/**
 * (protected) route group layout.
 *
 * This layout acts as an alias for the (dashboard) protected layout.
 * All routes under (protected)/ are redirected to their canonical equivalents.
 * Extend this group for any future server-side protected pages.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
