'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCandidateProfile, useUpdateCandidateProfile } from '../hooks/useCandidateProfile';
import { useAuthStore } from '@/store/auth.store';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/ui/section-header';
import { User, Phone, GraduationCap, School, Check, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  college: z.string().optional().or(z.literal('')),
  graduationYear: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val) return true;
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1990 && num <= 2040;
    }, 'Must be a valid year between 1990 and 2040'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function CandidateProfilePage() {
  const user = useAuthStore((state) => state.user);
  const { data: profile, isLoading } = useCandidateProfile(user?.id);
  const { mutate: updateProfile, isPending } = useUpdateCandidateProfile(user?.id);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      college: '',
      graduationYear: '',
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = form;

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        phone: (profile as any).phone || '',
        college: (profile as any).college || '',
        graduationYear: (profile as any).graduationYear
          ? (profile as any).graduationYear.toString()
          : '',
      });
    }
  }, [profile, reset]);

  if (isLoading) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-5xl space-y-6 animate-fade-in-up'>
        <SectionHeader
          title='My Profile'
          description='Manage your personal identity, contact information, and academic background.'
          breadcrumbs={[{ label: 'Dashboard', href: '/candidate/dashboard' }, { label: 'Profile' }]}
        />
        <Skeleton className='h-96 w-full rounded-xl border border-border/60 bg-muted/40' />
      </div>
    );
  }

  const onSubmit = (data: ProfileFormValues) => {
    if (!isDirty) return;

    updateProfile(
      {
        name: data.name,
        fullName: data.name,
        phone: data.phone,
        college: data.college,
        graduationYear: data.graduationYear ? parseInt(data.graduationYear, 10) : undefined,
      } as any,
      {
        onSuccess: (updatedUser) => {
          toast.success('Profile updated successfully', { ariaLive: 'polite' } as any);
          reset(data); // reset to new clean state

          // Update the auth/Zustand store immediately
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            const updatedName = updatedUser?.name || data.name || null;
            useAuthStore.getState().setAuthenticated({
              ...currentUser,
              name: updatedName,
              fullName: updatedName,
              phone: data.phone || null,
              college: data.college || null,
              graduationYear: data.graduationYear ? parseInt(data.graduationYear, 10) : null,
            } as any);
          }
        },
        onError: () => toast.error('Failed to update profile', { ariaLive: 'polite' } as any),
      },
    );
  };

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-5xl space-y-6 animate-fade-in-up'>
      <SectionHeader
        title='My Profile'
        description='Manage your personal identity, contact information, and academic background.'
        breadcrumbs={[{ label: 'Dashboard', href: '/candidate/dashboard' }, { label: 'Profile' }]}
      />

      <Card className='bg-card/80 border border-border/60 shadow-xs transition-all'>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader className='border-b border-border/40 pb-4'>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-lg font-bold text-foreground'>
                  Personal & Educational Information
                </CardTitle>
                <CardDescription className='text-xs text-muted-foreground font-medium mt-1'>
                  This credentials summary will be shared with potential recruiters and organization
                  evaluators during assessment verification.
                </CardDescription>
              </div>
              <div className='p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hidden sm:block'>
                <Sparkles className='size-5' />
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-6 space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label
                  htmlFor='email'
                  className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'
                >
                  Account Email Address
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-2.5 size-4 text-muted-foreground/60' />
                  <Input
                    id='email'
                    value={profile?.email || ''}
                    disabled
                    className='pl-9 bg-muted/50 border-border/60 text-muted-foreground font-medium h-9 text-xs sm:text-sm cursor-not-allowed'
                  />
                </div>
                <p className='text-[11px] text-muted-foreground/80 font-medium'>
                  Your primary authentication email cannot be modified directly.
                </p>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='name'
                  className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'
                >
                  Full Name
                </Label>
                <div className='relative'>
                  <User className='absolute left-3 top-2.5 size-4 text-muted-foreground/80' />
                  <Input
                    id='name'
                    {...register('name')}
                    className='pl-9 h-9 bg-background/60 border-border/60 focus-visible:bg-background text-xs sm:text-sm font-medium'
                    placeholder='Enter your full name...'
                  />
                </div>
                {errors.name && (
                  <p className='text-xs text-destructive font-semibold mt-1'>
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div className='space-y-2 max-w-md'>
              <Label
                htmlFor='phone'
                className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'
              >
                Contact Phone Number
              </Label>
              <div className='relative'>
                <Phone className='absolute left-3 top-2.5 size-4 text-muted-foreground/80' />
                <Input
                  id='phone'
                  {...register('phone')}
                  className='pl-9 h-9 bg-background/60 border-border/60 focus-visible:bg-background text-xs sm:text-sm font-medium'
                  placeholder='e.g. +91 9876543210'
                />
              </div>
              {errors.phone && (
                <p className='text-xs text-destructive font-semibold mt-1'>
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/40'>
              <div className='space-y-2'>
                <Label
                  htmlFor='college'
                  className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'
                >
                  College / University Institution
                </Label>
                <div className='relative'>
                  <School className='absolute left-3 top-2.5 size-4 text-muted-foreground/80' />
                  <Input
                    id='college'
                    {...register('college')}
                    className='pl-9 h-9 bg-background/60 border-border/60 focus-visible:bg-background text-xs sm:text-sm font-medium'
                    placeholder='e.g. IIT Bombay, NIT Warangal...'
                  />
                </div>
                {errors.college && (
                  <p className='text-xs text-destructive font-semibold mt-1'>
                    {errors.college.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='graduationYear'
                  className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'
                >
                  Graduation Year
                </Label>
                <div className='relative'>
                  <GraduationCap className='absolute left-3 top-2.5 size-4 text-muted-foreground/80' />
                  <Input
                    id='graduationYear'
                    type='number'
                    min='1990'
                    max='2040'
                    {...register('graduationYear')}
                    className='pl-9 h-9 bg-background/60 border-border/60 focus-visible:bg-background text-xs sm:text-sm font-medium'
                    placeholder='e.g. 2026'
                  />
                </div>
                {errors.graduationYear && (
                  <p className='text-xs text-destructive font-semibold mt-1'>
                    {errors.graduationYear.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex justify-between items-center px-6 py-4 bg-muted/20 border-t border-border/40'>
            <span className='text-xs text-muted-foreground font-medium'>
              {isDirty ? 'Unsaved modifications present' : 'All credentials up to date'}
            </span>
            <Button
              type='submit'
              size='sm'
              className='font-semibold h-9 px-5'
              disabled={isPending || !isDirty}
            >
              {isPending ? (
                'Saving...'
              ) : (
                <>
                  <Check className='size-4 mr-1.5' />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
