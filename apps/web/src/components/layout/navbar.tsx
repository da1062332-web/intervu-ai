'use client';

import { useRouter }
  from 'next/navigation';

import { authApi }
  from '@/services/api/auth.api';
import { notifySuccess }
  from '@/services/notifications/toast';
import { useAuthStore }
  from '@/store/auth.store';
import { Button }
  from '@/components/ui/button';

export function Navbar() {
  const router = useRouter();
  const user = useAuthStore(
    (state) => state.user,
  );

  const handleLogout = async () => {
    await authApi.logout();
    notifySuccess(
      'You have been logged out.',
    );
    router.replace('/login');
  };

  return (
    <header
      className="
        h-16
        border-b
        flex
        items-center
        justify-between
        px-4
      "
    >
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {user?.email ?? 'User'}
      </span>

      <Button
        variant="outline"
        onClick={() => {
          void handleLogout();
        }}
      >
        Logout
      </Button>
    </header>
  );
}
