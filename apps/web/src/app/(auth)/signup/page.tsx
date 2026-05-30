'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/services/api/auth.api';
import { normalizeApiError } from '@/services/api/error';
import { notifySuccess } from '@/services/notifications/toast';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';

export default function SignupPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => {
      notifySuccess('Account created successfully.');
      router.push('/dashboard');
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      setFormError(normalized.message);
    },
  });

  const onSubmit = async (data: SignupInput) => {
    setFormError(null);
    try {
      await signupMutation.mutateAsync({
        fullName: data.fullName?.trim() || undefined,
        email: data.email,
        password: data.password,
      });
    } catch {}
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left side: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto space-y-8 animate-fade-in-up">
          <div>
            <h1 className="text-4xl font-heading font-bold tracking-tight">Create an account</h1>
            <p className="text-muted-foreground mt-2">Join InterVu AI to get started.</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {formError && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-semibold text-foreground">Full Name (Optional)</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jane Candidate"
                className="h-11 transition-all focus:ring-primary/50"
                {...form.register('fullName')}
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-11 transition-all focus:ring-primary/50"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11 transition-all focus:ring-primary/50"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-semibold text-foreground">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="h-11 transition-all focus:ring-primary/50"
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-violet-500 hover:opacity-90 transition-opacity text-white text-base shadow-lg shadow-primary/25 mt-2"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? 'Creating account...' : (
                <>
                  Create Account <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Abstract visual */}
      <div className="hidden lg:flex flex-1 relative bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/40 to-indigo-900/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay" />
        
        {/* Glowing orbs */}
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/40 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-violet-500/40 rounded-full blur-[100px] mix-blend-screen" />
        
        <div className="relative z-10 flex flex-col justify-center items-start p-16 h-full max-w-2xl text-white">
          <div className="glass-panel p-3 rounded-xl mb-6">
            <Sparkles className="size-6 text-violet-300" />
          </div>
          <h2 className="text-5xl font-heading font-bold leading-tight mb-6">
            Hire smarter, not harder.
          </h2>
          <p className="text-lg text-indigo-100/80 max-w-md">
            Join thousands of recruiters and hiring managers who use InterVu AI to transform their hiring pipeline today.
          </p>
        </div>
      </div>
    </div>
  );
}
