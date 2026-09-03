'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

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
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

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
    <div className='min-h-screen w-full flex relative overflow-hidden bg-background'>
      {/* Background Image (Full width absolute on mobile, relative flex-1 on desktop) */}
      <div className='absolute inset-0 lg:relative lg:flex-1 lg:order-2 z-0 bg-zinc-950'>
        <div className='absolute inset-0'>
          <Image
            src='/images/login-hero.jpg'
            alt='SkillitriX Platform'
            fill
            sizes='(max-width: 1024px) 100vw, 50vw'
            className='object-cover object-center opacity-90 transition-transform duration-10000 hover:scale-105 ease-out'
            priority
          />
        </div>

        {/* Overlay gradient for contrast */}
        <div className='absolute inset-0 bg-black/60 lg:bg-gradient-to-t lg:from-black/90 lg:via-black/40 lg:to-transparent' />
        <div className='hidden lg:block absolute inset-0 bg-gradient-to-r from-background/90 via-background/20 to-transparent' />

        {/* Content overlaid on image (Desktop only) */}
        <div className='hidden lg:flex relative z-10 flex-col justify-end p-20 h-full max-w-2xl text-white'>
          <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 w-max animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both'>
            <Sparkles className='size-4 text-violet-300' />
            <span className='text-sm font-semibold tracking-wide text-violet-50'>
              AI-Powered Assessment Platform
            </span>
          </div>

          <h2 className='text-5xl xl:text-[3.5rem] font-heading font-bold leading-[1.1] mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500 fill-mode-both'>
            Test your knowledge & showcase your expertise.
          </h2>

          <p className='text-lg xl:text-xl text-white/80 max-w-lg leading-relaxed font-medium mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700 fill-mode-both'>
            Take interactive AI-powered assessments, participate in real-time interviews, and
            demonstrate your problem-solving abilities with intelligent instant insights.
          </p>
        </div>
      </div>

      {/* Form Container (Center card on mobile, Left half on desktop) */}
      <div className='flex-1 lg:flex-none lg:w-1/2 w-full flex flex-col justify-center items-center lg:items-stretch lg:justify-center px-4 md:px-12 lg:px-24 relative z-10 lg:order-1 lg:bg-background'>
        {/* Absolute Logo for Desktop */}
        <div className='hidden lg:flex absolute top-10 left-10 items-center gap-3'>
          <Logo className='size-9' />
          <span className='font-heading font-bold text-2xl tracking-tight text-foreground'>Skillitri<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#9333EA]">X</span></span>
        </div>

        <div className='w-full max-w-[420px] mx-auto bg-background/85 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none p-8 sm:p-10 lg:p-0 rounded-3xl lg:rounded-none shadow-2xl lg:shadow-none border border-border/40 lg:border-none animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out'>
          {/* Logo inside card for mobile */}
          <div className='flex lg:hidden items-center justify-center gap-3 mb-8'>
            <Logo className='size-9' />
            <span className='font-heading font-bold text-2xl tracking-tight text-foreground'>Skillitri<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#9333EA]">X</span></span>
          </div>

          <div className='text-center lg:text-left mb-10'>
            <h1 className='text-3xl lg:text-4xl font-heading font-bold tracking-tight text-foreground'>
              Welcome back
            </h1>
            <p className='text-muted-foreground mt-3 text-[1.05rem] font-medium'>
              Enter your credentials to access your account.
            </p>
          </div>

          <div className='flex justify-center w-full mb-6'>
            <div id='google-login-btn' className='flex justify-center w-full'>
              {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                <Button
                  type='button'
                  variant='outline'
                  className='w-full h-12 bg-card text-foreground hover:bg-muted font-semibold border-border shadow-sm rounded-xl transition-all'
                  onClick={() =>
                    notifySuccess(
                      'Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local to enable Google Login',
                    )
                  }
                >
                  <svg
                    className='w-5 h-5 mr-3'
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
                  Sign in with Google
                </Button>
              )}
            </div>
          </div>

          <div className='relative flex items-center mb-6'>
            <div className='flex-grow border-t border-border'></div>
            <span className='flex-shrink-0 mx-4 text-xs font-semibold uppercase text-muted-foreground tracking-widest'>
              Or sign in with email
            </span>
            <div className='flex-grow border-t border-border'></div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            {formError && (
              <div className='rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-semibold flex items-center gap-3'>
                <div className='size-2 rounded-full bg-destructive animate-pulse' />
                {formError}
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
                  placeholder='hello@skillitrix.com'
                  className='h-12 pl-11 rounded-xl transition-all border-border/60 hover:border-border focus:border-primary focus:ring-1 focus:ring-primary/30 bg-background/50 lg:bg-background shadow-sm'
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
                  className='h-12 pl-11 pr-11 rounded-xl transition-all border-border/60 hover:border-border focus:border-primary focus:ring-1 focus:ring-primary/30 bg-background/50 lg:bg-background shadow-sm'
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
              className='w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white text-base font-bold shadow-xl shadow-primary/20 transition-all group mt-4'
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
              href='/signup'
              className='text-primary hover:text-primary/80 transition-colors font-bold ml-1 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-primary after:origin-bottom-right after:scale-x-0 hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300'
            >
              Sign up today
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
