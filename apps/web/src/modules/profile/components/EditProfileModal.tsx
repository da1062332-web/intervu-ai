'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { CustomFormField } from '@/components/ui/custom-form-field';
import { Input } from '@/components/ui/input';

import { useUpdateProfile } from '@/hooks/use-update-profile';
import { AuthUser } from '@/types/auth.types';
import { notifySuccess, notifyApiError } from '@/services/notifications/toast';

const profileSchema = z.object({
  name: z.string().min(1, 'Full Name is required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
}

export function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || user.fullName || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ name: user.name || user.fullName || '' });
    }
  }, [isOpen, user, form]);

  const handleSubmit = (values: ProfileFormValues) => {
    if (!values.name.trim()) return;

    updateProfile.mutate(
      { name: values.name.trim(), fullName: values.name.trim() },
      {
        onSuccess: () => {
          notifySuccess('Profile updated successfully');
          onClose();
        },
        onError: (error) => {
          notifyApiError(error, 'Failed to update profile');
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className='sm:max-w-[425px]'>
      <div className='flex flex-col space-y-4'>
        <div className='flex flex-col space-y-1'>
          <h2 className='text-xl font-bold tracking-tight text-foreground'>Edit Profile</h2>
          <p className='text-sm text-muted-foreground'>Update your personal information.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4 py-2'>
            <CustomFormField
              control={form.control}
              name="name"
              label="Full Name"
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder='Enter your full name'
                  disabled={updateProfile.isPending}
                />
              )}
            />

            <div className='flex justify-end space-x-2 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={updateProfile.isPending}
              >
                Cancel
              </Button>
              <Button 
                type='submit' 
                isLoading={updateProfile.isPending}
                disabled={!form.formState.isValid}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Modal>
  );
}
