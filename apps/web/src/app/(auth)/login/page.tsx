'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Sparkles, Github } from 'lucide-react';

import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/services/api/auth.api';
import { normalizeApiError } from '@/services/api/error';
import { notifySuccess } from '@/services/notifications/toast';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';

export default function LoginPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      notifySuccess('Welcome back.');
      router.push('/dashboard');
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      setFormError(normalized.message);
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);
    try {
      await loginMutation.mutateAsync(data);
    } catch {}
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left side: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-20 relative">
        <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
          <Logo className="size-8" />
          <span className="font-heading font-bold text-xl tracking-tight">InterVu AI</span>
        </div>

        <div className="max-w-md w-full mx-auto space-y-8 animate-fade-in-up">
          <div className="text-center md:text-left">
            <Logo className="hidden lg:block size-12 mb-6 drop-shadow-xl" />
            <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-3 text-base">
              Enter your credentials to access your account.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-11 bg-card hover:bg-muted font-medium border-border/50 shadow-sm transition-all hover:shadow-md">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
            <Button variant="outline" className="h-11 bg-card hover:bg-muted font-medium border-border/50 shadow-sm transition-all hover:shadow-md">
              <Github className="w-5 h-5 mr-2" />
              GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium">Or continue with</span>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {formError && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-12 transition-all focus:ring-primary/50 bg-card border-border/50"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive font-medium">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-semibold text-foreground">Password</Label>
                <Link href="#" className="text-sm text-primary hover:text-primary/80 transition-colors font-semibold">Forgot password?</Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-12 transition-all focus:ring-primary/50 bg-card border-border/50"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive font-medium">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-violet-500 hover:opacity-90 transition-opacity text-white text-base font-semibold shadow-lg shadow-primary/25 mt-4"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : (
                <>
                  Sign in <ArrowRight className="ml-2 size-5" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground pt-4">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors font-bold">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Abstract visual */}
      <div className="hidden lg:flex flex-1 relative bg-indigo-50 dark:bg-slate-950 overflow-hidden transition-colors duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/60 to-violet-300/60 dark:from-indigo-600/40 dark:to-violet-900/40 mix-blend-multiply transition-colors duration-500" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 dark:opacity-30 mix-blend-overlay transition-opacity duration-500" />
        
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 dark:bg-primary/40 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-1000" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-400/40 dark:bg-violet-500/40 rounded-full blur-[100px] mix-blend-screen" />
        
        <div className="relative z-10 flex flex-col justify-center items-start p-16 xl:p-24 h-full max-w-2xl text-foreground dark:text-white transition-colors duration-500">
          <div className="glass-panel p-4 rounded-2xl mb-8 shadow-2xl">
            <Sparkles className="size-8 text-indigo-500 dark:text-indigo-300" />
          </div>
          <h2 className="text-5xl xl:text-6xl font-heading font-bold leading-[1.1] mb-6">
            Streamline your hiring process with AI.
          </h2>
          <p className="text-lg xl:text-xl text-muted-foreground dark:text-indigo-100/80 max-w-lg leading-relaxed">
            InterVu AI provides intelligent assessments to help you find the perfect candidate, faster than ever before.
          </p>
        </div>
      </div>
    </div>
  );
}
