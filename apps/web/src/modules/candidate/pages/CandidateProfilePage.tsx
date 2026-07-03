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
import { User, Phone, GraduationCap, School } from 'lucide-react';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  college: z.string().optional().or(z.literal('')),
  graduationYear: z.string()
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
  const { data: profile, isLoading } = useCandidateProfile();
  const { mutate: updateProfile, isPending } = useUpdateCandidateProfile();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      college: '',
      graduationYear: '',
    },
  });

  const { register, handleSubmit, reset, formState: { isDirty, errors } } = form;

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        phone: profile.phone || '',
        college: profile.college || '',
        graduationYear: profile.graduationYear ? profile.graduationYear.toString() : '',
      });
    }
  }, [profile, reset]);

  if (isLoading) {
    return (
      <div className='h-[400px] w-full max-w-2xl mx-auto bg-muted/30 animate-pulse rounded-xl mt-8' />
    );
  }

  const onSubmit = (data: ProfileFormValues) => {
    if (!isDirty) return;

    updateProfile(
      {
        name: data.name,
        phone: data.phone,
        college: data.college,
        graduationYear: data.graduationYear ? parseInt(data.graduationYear, 10) : undefined,
      },
      {
        onSuccess: (updatedUser) => {
          toast.success('Profile updated successfully', { ariaLive: 'polite' });
          reset(data); // reset to new clean state
          
          // Update the auth/Zustand store immediately
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            useAuthStore.getState().setAuthenticated({
              ...currentUser,
              name: data.name || null,
              phone: data.phone || null,
              college: data.college || null,
              graduationYear: data.graduationYear ? parseInt(data.graduationYear, 10) : null,
            });
          }
        },
        onError: () => toast.error('Failed to update profile', { ariaLive: 'polite' }),
      },
    );
  };

  return (
    <div className='max-w-2xl mx-auto space-y-8 animate-fade-in-up mt-8'>
      <div className='flex items-center gap-3'>
        <User className='size-8 text-primary' />
        <div>
          <h1 className='text-3xl font-heading font-bold tracking-tight text-foreground'>
            My Profile
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage your personal and educational information
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              This information will be visible to recruiters and companies you apply to.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' value={profile?.email || ''} disabled className='bg-muted' />
              <p className='text-xs text-muted-foreground'>Email cannot be changed.</p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='name'>Full Name</Label>
              <div className='relative'>
                <User className='absolute left-3 top-3 size-4 text-muted-foreground' />
                <Input
                  id='name'
                  {...register('name')}
                  className='pl-9'
                  placeholder='John Doe'
                />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone Number</Label>
              <div className='relative'>
                <Phone className='absolute left-3 top-3 size-4 text-muted-foreground' />
                <Input
                  id='phone'
                  {...register('phone')}
                  className='pl-9'
                  placeholder='+91 9876543210'
                />
              </div>
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='college'>College / University</Label>
                <div className='relative'>
                  <School className='absolute left-3 top-3 size-4 text-muted-foreground' />
                  <Input
                    id='college'
                    {...register('college')}
                    className='pl-9'
                    placeholder='IIT Bombay'
                  />
                </div>
                {errors.college && <p className="text-sm text-destructive">{errors.college.message}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='graduationYear'>Graduation Year</Label>
                <div className='relative'>
                  <GraduationCap className='absolute left-3 top-3 size-4 text-muted-foreground' />
                  <Input
                    id='graduationYear'
                    type='number'
                    min='1990'
                    max='2040'
                    {...register('graduationYear')}
                    className='pl-9'
                    placeholder='2026'
                  />
                </div>
                {errors.graduationYear && <p className="text-sm text-destructive">{errors.graduationYear.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex justify-end pt-6 border-t border-border/40'>
            <Button type='submit' disabled={isPending || !isDirty}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
