'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Logo } from '@/components/ui/logo';
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
    onSuccess: (data) => {
      notifySuccess('Account created successfully.');
      if (data.user.role === 'CANDIDATE') {
        router.push('/candidate/dashboard');
      } else {
        router.push('/admin/dashboard');
      }
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      setFormError(normalized.message);
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: authApi.googleLogin,
    onSuccess: (data) => {
      notifySuccess('Welcome.');

      if (data.user.role === 'CANDIDATE') {
        router.replace('/candidate/dashboard');
      } else {
        router.replace('/admin/dashboard');
      }
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      setFormError(normalized.message);
    },
  });

  const { mutateAsync: performGoogleLogin } = googleLoginMutation;

  useEffect(() => {
    const initGoogle = () => {
      const google = (window as any).google;
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      if (google && clientId) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (res: any) => {
            if (res.credential) {
              setFormError(null);
              try {
                await performGoogleLogin({ idToken: res.credential });
              } catch {}
            }
          },
          auto_select: false,
        });

        google.accounts.id.renderButton(
          document.getElementById('google-login-btn'),
          {
            theme: 'outline',
            size: 'large',
            width: 200,
            text: 'signup_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          }
        );

        google.accounts.id.prompt();
      }
    };

    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      if ((window as any).google) {
        initGoogle();
      } else {
        script.addEventListener('load', initGoogle);
      }
    }

    return () => {
      if (script) {
        script.removeEventListener('load', initGoogle);
      }
    };
  }, [performGoogleLogin]);

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
    <div className='min-h-screen w-full flex bg-background'>
      {/* Left side: Form */}
      <div className='flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-20 relative'>
        <div className='absolute top-8 left-8 flex items-center gap-2 lg:hidden'>
          <Logo className='size-8' />
          <span className='font-heading font-bold text-xl tracking-tight'>InterVu AI</span>
        </div>

        <div className='max-w-md w-full mx-auto space-y-8 animate-fade-in-up'>
          <div className='text-center md:text-left'>
            <Logo className='hidden lg:block size-12 mb-6 drop-shadow-xl' />
            <h1 className='text-3xl md:text-4xl font-heading font-bold tracking-tight text-foreground'>
              Create an account
            </h1>
            <p className='text-muted-foreground mt-3 text-base'>Join InterVu AI to get started.</p>
          </div>

          <div className='grid grid-cols-2 gap-4 items-center'>
            <div id='google-login-btn' className='h-11 w-full flex justify-center items-center overflow-hidden rounded-md border border-border/50 bg-card shadow-sm hover:shadow-md transition-all' />
            <Button
              variant='outline'
              className='h-11 bg-card hover:bg-muted font-medium border-border/50 shadow-sm transition-all hover:shadow-md'
            >
              <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' />
              </svg>
              GitHub
            </Button>
          </div>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t border-border' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-background px-4 text-muted-foreground font-medium'>
                Or continue with
              </span>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            {formError && (
              <div className='rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-medium'>
                {formError}
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='fullName' className='font-semibold text-foreground'>
                Full Name (Optional)
              </Label>
              <Input
                id='fullName'
                type='text'
                placeholder='Jane Candidate'
                className='h-12 transition-all focus:ring-primary/50 bg-card border-border/50'
                {...form.register('fullName')}
              />
              {form.formState.errors.fullName && (
                <p className='text-sm text-destructive font-medium'>
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email' className='font-semibold text-foreground'>
                Email
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='you@example.com'
                className='h-12 transition-all focus:ring-primary/50 bg-card border-border/50'
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className='text-sm text-destructive font-medium'>
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='password' className='font-semibold text-foreground'>
                  Password
                </Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='••••••••'
                  className='h-12 transition-all focus:ring-primary/50 bg-card border-border/50'
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className='text-sm text-destructive font-medium'>
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword' className='font-semibold text-foreground'>
                  Confirm
                </Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  placeholder='••••••••'
                  className='h-12 transition-all focus:ring-primary/50 bg-card border-border/50'
                  {...form.register('confirmPassword')}
                />
                {form.formState.errors.confirmPassword && (
                  <p className='text-sm text-destructive font-medium'>
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type='submit'
              className='w-full h-12 bg-gradient-to-r from-primary to-violet-500 hover:opacity-90 transition-opacity text-white text-base font-semibold shadow-lg shadow-primary/25 mt-4'
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? (
                'Creating account...'
              ) : (
                <>
                  Create Account <ArrowRight className='ml-2 size-5' />
                </>
              )}
            </Button>
          </form>

          <p className='text-center text-sm text-muted-foreground pt-4'>
            Already have an account?{' '}
            <Link
              href='/login'
              className='text-primary hover:text-primary/80 transition-colors font-bold'
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Abstract visual */}
      <div className='hidden lg:flex flex-1 relative bg-indigo-50 dark:bg-slate-950 overflow-hidden transition-colors duration-500'>
        <div className='absolute inset-0 bg-gradient-to-tr from-violet-300/60 to-indigo-200/60 dark:from-violet-600/40 dark:to-indigo-900/40 mix-blend-multiply transition-colors duration-500' />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-10 dark:opacity-30 mix-blend-overlay transition-opacity duration-500" />

        {/* Glowing orbs */}
        <div className='absolute top-1/3 right-1/4 w-96 h-96 bg-primary/30 dark:bg-primary/40 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-1000' />
        <div className='absolute bottom-1/4 left-1/4 w-96 h-96 bg-violet-400/40 dark:bg-violet-500/40 rounded-full blur-[100px] mix-blend-screen' />

        <div className='relative z-10 flex flex-col justify-center items-start p-16 xl:p-24 h-full max-w-2xl text-foreground dark:text-white transition-colors duration-500'>
          <div className='glass-panel p-4 rounded-2xl mb-8 shadow-2xl'>
            <Sparkles className='size-8 text-violet-500 dark:text-violet-300' />
          </div>
          <h2 className='text-5xl xl:text-6xl font-heading font-bold leading-[1.1] mb-6'>
            Hire smarter, not harder.
          </h2>
          <p className='text-lg xl:text-xl text-muted-foreground dark:text-indigo-100/80 max-w-lg leading-relaxed'>
            Join thousands of recruiters and hiring managers who use InterVu AI to transform their
            hiring pipeline today.
          </p>
        </div>
      </div>
    </div>
  );
}
