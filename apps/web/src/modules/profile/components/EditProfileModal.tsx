'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useUpdateProfile } from '@/hooks/use-update-profile';
import { AuthUser } from '@/types/auth.types';
import { notifySuccess, notifyApiError } from '@/services/notifications/toast';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
}

export function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
  const [name, setName] = useState(user.name || user.fullName || '');
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (isOpen) {
      setName(user.name || user.fullName || '');
    }
  }, [isOpen, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateProfile.mutate(
      { name: name.trim() },
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

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          <div className='space-y-2'>
            <label htmlFor='name' className='text-sm font-medium text-foreground'>
              Full Name
            </label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              placeholder='Enter your full name'
              disabled={updateProfile.isPending}
              required
            />
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={updateProfile.isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={updateProfile.isPending || !name.trim()}>
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
