'use client';

import React, { useState } from 'react';
import {
  useStyleProfiles,
  useDeleteStyleProfile,
  useDuplicateStyleProfile,
  useUpdateStyleProfile,
} from '@/services/blueprints/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit2, Copy, Trash2, Shield, Settings, Info } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { AnimatedLoader } from '@/components/ui/animated-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

export function StyleProfileTable() {
  const { data: profiles, isLoading, isError, refetch } = useStyleProfiles();
  const deleteMutation = useDeleteStyleProfile();
  const duplicateMutation = useDuplicateStyleProfile();
  const updateMutation = useUpdateStyleProfile();
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  if (isLoading) {
    return <AnimatedLoader variant='table' />;
  }

  if (isError) {
    return (
      <EmptyState
        variant='error'
        title='Error loading style profiles'
        description='Please try refreshing the page.'
        actionLabel='Retry'
        onAction={() => refetch()}
        className='border border-dashed rounded-xl bg-card'
      />
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <EmptyState
        icon={<Settings className='w-7 h-7 text-muted-foreground' />}
        title='No Style Profiles Found'
        description='Create your first Style Profile to establish reusable generation rules for your blueprints.'
        actionLabel='Create Style Profile'
        actionHref='/admin/style-profiles/new'
        className='border border-dashed rounded-xl bg-card p-12'
      />
    );
  }

  const handleDelete = async () => {
    if (!profileToDelete) return;
    try {
      await deleteMutation.mutateAsync(profileToDelete);
      toast.success('Style Profile deleted successfully');
      setProfileToDelete(null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Failed to delete Style Profile. It might be assigned to a Blueprint.';
      toast.error(msg);
      setProfileToDelete(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateMutation.mutateAsync(id);
      toast.success('Style Profile duplicated successfully');
    } catch (err: any) {
      toast.error('Failed to duplicate Style Profile');
    }
  };

  const handleToggleActive = async (profile: any) => {
    try {
      await updateMutation.mutateAsync({
        id: profile.id,
        data: { active: !profile.active },
      });
      toast.success(`Profile ${!profile.active ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleSetDefault = async (profile: any) => {
    if (profile.isDefault) return;
    try {
      await updateMutation.mutateAsync({
        id: profile.id,
        data: { isDefault: true },
      });
      toast.success('Default Style Profile updated');
    } catch (err: any) {
      toast.error('Failed to set default profile');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      id: 'details',
      header: 'Profile Details',
      cell: (row) => (
        <div className='flex flex-col'>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-foreground'>{row.name}</span>
            {row.isDefault && (
              <Badge
                variant='secondary'
                className='bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300 gap-1 text-[10px]'
              >
                <Shield className='h-3 w-3' /> Default
              </Badge>
            )}
          </div>
          {row.description && (
            <span className='text-xs text-muted-foreground mt-0.5 max-w-sm truncate'>
              {row.description}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      className: 'capitalize',
      cell: (row) => (
        <Badge variant='outline' className='shadow-sm'>
          {row.profileType || 'campus'}
        </Badge>
      ),
    },
    {
      id: 'language',
      header: 'Language / Constraints',
      cell: (row) => (
        <div className='flex flex-col text-xs text-muted-foreground space-y-0.5'>
          <div>
            <span className='font-semibold text-foreground'>Lang:</span>{' '}
            {row.languageStyle?.language || 'English'} (
            {row.languageStyle?.sentenceLength || 'medium'})
          </div>
          <div>
            <span className='font-semibold text-foreground'>Distractors:</span>{' '}
            {row.distractorRules?.exactlyFourOptions ? '4 Options' : 'Any'}
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: <div className='text-center'>Status</div>,
      className: 'text-center',
      cell: (row) => (
        <div className='flex items-center justify-center'>
          <Switch
            checked={row.active}
            onCheckedChange={() => handleToggleActive(row)}
            className='data-[state=checked]:bg-emerald-500'
          />
        </div>
      ),
    },
    {
      id: 'default',
      header: <div className='text-center'>Default</div>,
      className: 'text-center',
      cell: (row) => (
        <div className='flex items-center justify-center'>
          <Button
            variant={row.isDefault ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleSetDefault(row)}
            disabled={row.isDefault}
            className={`text-xs ${
              row.isDefault
                ? 'bg-violet-600 hover:bg-violet-600 text-white shadow-sm'
                : 'hover:bg-violet-50'
            }`}
          >
            {row.isDefault ? 'Active Default' : 'Set Default'}
          </Button>
        </div>
      ),
    },
    {
      id: 'actions',
      header: <div className='text-right'>Actions</div>,
      className: 'text-right',
      cell: (row) => (
        <div className='flex items-center justify-end gap-1.5'>
          <Button asChild variant='ghost' size='icon' className='hover:text-foreground'>
            <Link href={`/admin/style-profiles/${row.id}/edit`}>
              <Edit2 className='h-4 w-4' />
            </Link>
          </Button>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => handleDuplicate(row.id)}
            className='hover:text-foreground'
            title='Duplicate Profile'
          >
            <Copy className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setProfileToDelete(row.id)}
            disabled={row.isDefault}
            className='hover:text-destructive text-muted-foreground disabled:opacity-50'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className='border rounded-xl bg-card shadow-sm overflow-hidden backdrop-blur-md bg-white/50'>
      <DataTable columns={columns} data={profiles} rowKey={(row) => row.id} />
      <ConfirmationDialog
        isOpen={!!profileToDelete}
        onOpenChange={(open) => !open && setProfileToDelete(null)}
        title='Delete Style Profile?'
        description='Are you sure you want to delete this Style Profile? This action cannot be undone.'
        confirmLabel='Delete'
        destructive
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
