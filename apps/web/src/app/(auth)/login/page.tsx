'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { authApi } from '@/services/api/auth.api';
import { normalizeApiError } from '@/services/api/error';
import { notifySuccess } from '@/services/notifications/toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] =
    useState<string | null>(null);
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      notifySuccess('Welcome back.');
      router.push('/dashboard');
    },
    onError: (error) => {
      const normalized =
        normalizeApiError(error);
      setFormError(normalized.message);
    },
  });

  const handleLogin = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    setFormError(null);

    try {
      await loginMutation.mutateAsync({
        email,
        password,
      });
    } catch {
      // Errors are normalized and surfaced via mutation onError + toast.
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >
          {formError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {formError}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value,
                )
              }
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              loginMutation.isPending
            }
          >
            {loginMutation.isPending
              ? 'Signing in...'
              : 'Sign in'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex-col">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
