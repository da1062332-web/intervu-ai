'use client';

import { useState, useEffect } from 'react';
import { useCandidateProfile, useUpdateCandidateProfile } from '../hooks/useCandidateProfile';
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

interface CandidateUser {
  id: string;
  name?: string | null;
  phone?: string | null;
  college?: string | null;
  graduationYear?: number | null;
}

export function CandidateProfilePage() {
  const { data: profile, isLoading } = useCandidateProfile();
  const { mutate: updateProfile, isPending } = useUpdateCandidateProfile();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    college: '',
    graduationYear: '',
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      const p = profile as CandidateUser;
      const initialData = {
        name: p.name || '',
        phone: p.phone || '',
        college: p.college || '',
        graduationYear: p.graduationYear?.toString() || '',
      };
      setFormData(initialData);
      setIsDirty(false);
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className='h-[400px] w-full max-w-2xl mx-auto bg-muted/30 animate-pulse rounded-xl' />
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFormData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newFormData);

    if (profile) {
      const p = profile as CandidateUser;
      setIsDirty(
        newFormData.name !== (p.name || '') ||
          newFormData.phone !== (p.phone || '') ||
          newFormData.college !== (p.college || '') ||
          newFormData.graduationYear !== (p.graduationYear?.toString() || ''),
      );
    } else {
      setIsDirty(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;

    updateProfile(
      {
        name: formData.name,
        phone: formData.phone,
        college: formData.college,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear, 10) : undefined,
      } as any,
      {
        onSuccess: () => {
          toast.success('Profile updated successfully');
          setIsDirty(false);
        },
        onError: () => toast.error('Failed to update profile'),
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
        <form onSubmit={handleSubmit}>
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
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  className='pl-9'
                  placeholder='John Doe'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone Number</Label>
              <div className='relative'>
                <Phone className='absolute left-3 top-3 size-4 text-muted-foreground' />
                <Input
                  id='phone'
                  name='phone'
                  value={formData.phone}
                  onChange={handleChange}
                  className='pl-9'
                  placeholder='+91 9876543210'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='college'>College / University</Label>
                <div className='relative'>
                  <School className='absolute left-3 top-3 size-4 text-muted-foreground' />
                  <Input
                    id='college'
                    name='college'
                    value={formData.college}
                    onChange={handleChange}
                    className='pl-9'
                    placeholder='IIT Bombay'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='graduationYear'>Graduation Year</Label>
                <div className='relative'>
                  <GraduationCap className='absolute left-3 top-3 size-4 text-muted-foreground' />
                  <Input
                    id='graduationYear'
                    name='graduationYear'
                    type='number'
                    min='1990'
                    max='2040'
                    value={formData.graduationYear}
                    onChange={handleChange}
                    className='pl-9'
                    placeholder='2026'
                  />
                </div>
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
