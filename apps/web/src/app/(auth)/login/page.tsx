'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

import { BrandLogo } from '@/components/ui/brand-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/services/api/auth.api';
import { normalizeApiError } from '@/services/api/error';
import { notifySuccess } from '@/services/notifications/toast';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';

function LoginFormContent() {
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams?.get('ref') || searchParams?.get('code');

  useEffect(() => {
    if (refCode) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('intervu_ref', refCode);
      }
      router.replace(`/signup?ref=${encodeURIComponent(refCode)}`);
    }
  }, [refCode, router]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      notifySuccess('Welcome back.');

      if (data.user.role === 'CANDIDATE') {
        router.replace('/candidate/dashboard');
      } else if (data.user.role === 'PLAN_MANAGER') {
        router.replace('/admin/billing');
      } else {
        router.replace('/admin/dashboard');
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
      notifySuccess('Welcome back.');

      if (data.user.role === 'CANDIDATE') {
        router.replace('/candidate/dashboard');
      } else if (data.user.role === 'PLAN_MANAGER') {
        router.replace('/admin/billing');
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

        google.accounts.id.renderButton(document.getElementById('google-login-btn'), {
          theme: 'outline',
          size: 'large',
          width: 400,
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'center',
        });

        google.accounts.id.prompt();
      }
    };

    let script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    ) as HTMLScriptElement;
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

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);
    try {
      await loginMutation.mutateAsync(data);
    } catch {}
  };

  return (
    <div className='min-h-screen w-full flex flex-col lg:flex-row bg-background overflow-x-hidden'>
      {/* Left Form Section */}
      <div className='w-full lg:w-[50%] xl:w-[46%] 2xl:w-[42%] lg:min-w-[500px] xl:min-w-[560px] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 z-10 shrink-0 min-h-screen'>
        {/* Top Header Logo */}
        <div className='w-full flex items-center justify-between'>
          <Link href='/' className='inline-flex items-center gap-2 group'>
            <BrandLogo logoClassName='size-10 transition-transform group-hover:scale-105' textClassName='text-2xl font-bold tracking-tight' />
          </Link>
        </div>

        {/* Form Body Container */}
        <div className='w-full max-w-[460px] mx-auto lg:mx-0 my-auto py-8 sm:py-10 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out'>
          <div className='mb-8'>
            <h1 className='text-3xl sm:text-4xl font-heading font-bold tracking-tight text-foreground'>
              Welcome back
            </h1>
            <p className='text-muted-foreground mt-2.5 text-base font-medium'>
              Enter your credentials to access your account.
            </p>
          </div>

          {/* Google Sign In */}
          <div className='flex justify-center w-full mb-6'>
            <div id='google-login-btn' className='flex justify-center w-full'>
              {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                <Button
                  type='button'
                  variant='outline'
                  className='w-full h-12 bg-card hover:bg-muted/80 text-foreground font-semibold border-border/80 shadow-sm rounded-xl transition-all flex items-center justify-center gap-3'
                  onClick={() =>
                    notifySuccess(
                      'Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local to enable Google Login',
                    )
                  }
                >
                  <svg
                    className='w-5 h-5 shrink-0'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                      fill='#4285F4'
                    />
                    <path
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                      fill='#34A853'
                    />
                    <path
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                      fill='#FBBC05'
                    />
                    <path
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                      fill='#EA4335'
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </Button>
              )}
            </div>
          </div>

          <div className='relative flex items-center mb-6'>
            <div className='flex-grow border-t border-border/70'></div>
            <span className='flex-shrink-0 mx-4 text-xs font-semibold uppercase text-muted-foreground tracking-widest'>
              Or sign in with email
            </span>
            <div className='flex-grow border-t border-border/70'></div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            {formError && (
              <div className='rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-semibold flex items-center gap-3'>
                <div className='size-2 rounded-full bg-destructive animate-pulse shrink-0' />
                <span>{formError}</span>
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email' className='font-bold text-foreground text-sm tracking-wide'>
                Email Address
              </Label>
              <div className='relative group'>
                <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors z-10'>
                  <Mail className='h-5 w-5' />
                </div>
                <Input
                  id='email'
                  type='email'
                  placeholder='candidate@intervu.ai'
                  className='h-12 pl-11 rounded-xl transition-all border-border/70 hover:border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-card/60 backdrop-blur-sm text-foreground shadow-sm'
                  {...form.register('email')}
                />
              </div>
              {form.formState.errors.email && (
                <p className='text-sm text-destructive font-medium'>
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label
                  htmlFor='password'
                  className='font-bold text-foreground text-sm tracking-wide'
                >
                  Password
                </Label>
                <Link
                  href='#'
                  className='text-sm text-primary hover:text-primary/80 transition-colors font-semibold'
                >
                  Forgot password?
                </Link>
              </div>
              <div className='relative group'>
                <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors z-10'>
                  <Lock className='h-5 w-5' />
                </div>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  className='h-12 pl-11 pr-11 rounded-xl transition-all border-border/70 hover:border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-card/60 backdrop-blur-sm text-foreground shadow-sm'
                  {...form.register('password')}
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none z-10'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className='text-sm text-destructive font-medium'>
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type='submit'
              className='w-full h-12 rounded-xl bg-gradient-to-r from-primary via-primary/95 to-violet-600 hover:opacity-95 text-white text-base font-bold shadow-xl shadow-primary/25 transition-all group mt-6'
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                'Signing in...'
              ) : (
                <>
                  Sign in{' '}
                  <ArrowRight className='ml-2 size-5 transition-transform group-hover:translate-x-1' />
                </>
              )}
            </Button>
          </form>

          <p className='text-center text-[0.95rem] text-muted-foreground pt-6 font-medium'>
            Don't have an account?{' '}
            <Link
              href={refCode ? `/signup?ref=${encodeURIComponent(refCode)}` : '/signup'}
              className='text-primary hover:text-primary/80 transition-colors font-bold ml-1 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-primary after:origin-bottom-right after:scale-x-0 hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300'
            >
              Sign up today
            </Link>
          </p>
        </div>

        {/* Bottom subtle note / footer */}
        <div className='pt-4 pb-2 text-xs text-muted-foreground/60 text-center lg:text-left'>
          &copy; {new Date().getFullYear()} SkillitriX. All rights reserved.
        </div>
      </div>

      {/* Right Hero Section with curved left edge at middle divider and square right edge */}
      <div className='hidden lg:flex flex-1 relative lg:rounded-l-[36px] xl:rounded-l-[48px] rounded-r-none overflow-hidden border-l border-white/10 shadow-2xl bg-zinc-950 flex-col justify-end p-12 lg:p-14 xl:p-18 2xl:p-20 text-white'>
        {/* Background Hero Image */}
        <div className='absolute inset-0'>
          <Image
            src='/images/login-hero.jpg'
            alt='Intervu Platform'
            fill
            sizes='(max-width: 1024px) 100vw, 55vw'
            className='object-cover object-center opacity-90 transition-transform duration-10000 hover:scale-105 ease-out rounded-l-[36px] xl:rounded-l-[48px] rounded-r-none'
            priority
          />
        </div>

        {/* Ambient Gradient Overlays: lighter on top to show artwork, rich at bottom for text contrast */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none' />
        <div className='absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent pointer-events-none' />
        <div className='absolute inset-0 ring-1 ring-inset ring-white/10 rounded-l-[36px] xl:rounded-l-[48px] rounded-r-none pointer-events-none' />

        {/* Content overlaid on image */}
        <div className='relative z-10 max-w-2xl text-white'>
          <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 w-max animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both shadow-sm'>
            <Sparkles className='size-4 text-violet-300' />
            <span className='text-xs sm:text-sm font-semibold tracking-wide text-violet-50'>
              AI-Powered Assessment Platform
            </span>
          </div>

          <h2 className='text-4xl xl:text-5xl 2xl:text-[3.25rem] font-heading font-extrabold leading-[1.14] mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/95 to-white/70 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500 fill-mode-both'>
            Test your knowledge &amp; showcase your expertise.
          </h2>

          <p className='text-base xl:text-lg 2xl:text-xl text-white/85 leading-relaxed font-normal max-w-xl mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700 fill-mode-both'>
            Take interactive AI-powered assessments, participate in real-time interviews, and
            demonstrate your problem-solving abilities with intelligent instant insights.
          </p>

          {/* Feature Highlights Bar */}
          <div className='flex flex-wrap items-center gap-4 sm:gap-6 pt-6 border-t border-white/15 text-xs sm:text-sm text-white/80 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-900 fill-mode-both'>
            <div className='flex items-center gap-2'>
              <div className='size-2 rounded-full bg-emerald-400 animate-pulse' />
              <span className='font-medium'>Live Adaptive AI</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='size-2 rounded-full bg-violet-400' />
              <span className='font-medium'>Instant Scoring &amp; Feedback</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginFormContent />
    </Suspense>
  );
}
