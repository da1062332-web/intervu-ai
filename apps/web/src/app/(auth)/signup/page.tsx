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

export default function SignupPage() {
  const [fullName, setFullName] =
    useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] =
    useState<string | null>(null);
  const router = useRouter();

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => {
      notifySuccess(
        'Account created successfully.',
      );
      router.push('/dashboard');
    },
    onError: (error) => {
      const normalized =
        normalizeApiError(error);
      setFormError(normalized.message);
    },
  });

  const handleSignup = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError(
        'Passwords do not match.',
      );
      return;
    }

    if (password.length < 8) {
      setFormError(
        'Password must be at least 8 characters.',
      );
      return;
    }

    try {
      await signupMutation.mutateAsync({
        fullName:
          fullName.trim() || undefined,
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
        <CardTitle>
          Create your account
        </CardTitle>
        <CardDescription>
          Join InterVu AI to get started
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSignup}
          className="space-y-4"
        >
          {formError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {formError}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="fullName"
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              Full Name
            </label>
            <Input
              id="fullName"
              type="text"
              placeholder="Jane Candidate"
              value={fullName}
              onChange={(e) =>
                setFullName(
                  e.target.value,
                )
              }
            />
          </div>

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

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="********"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
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
              signupMutation.isPending
            }
          >
            {signupMutation.isPending
              ? 'Creating account...'
              : 'Sign up'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex-col">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
