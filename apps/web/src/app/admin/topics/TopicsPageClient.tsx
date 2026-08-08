'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTopics, useCreateTopic, useUpdateTopic, useDeactivateTopic } from '@/services/topics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Search, Plus, Eye, Trash2, RefreshCcw, Edit2, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Topic } from '@/services/topics/types';

export function TopicsPageClient() {
  const router = useRouter();
  const { data: topics, isLoading, isError, refetch } = useTopics(false); // get both active and inactive
  const createMutation = useCreateTopic();
  const updateMutation = useUpdateTopic();
  const deactivateMutation = useDeactivateTopic();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  if (isError) {
    return (
      <EmptyState
        variant='error'
        title='Error Loading Topics'
        description='We encountered an error while loading the topics registry. Please try again.'
        actionLabel='Try Again'
        onAction={() => refetch()}
        className='mt-8 border rounded-xl bg-card'
      />
    );
  }

  const filteredTopics =
    topics?.filter((t) => {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    }) || [];

  const handleOpenCreate = () => {
    setName('');
    setCode('');
    setDescription('');
    setStatus('ACTIVE');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Name and Code are required');
      return;
    }

    createMutation.mutate(
      {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        status,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          refetch();
        },
      },
    );
  };

  const handleOpenEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setName(topic.name);
    setCode(topic.code);
    setDescription(topic.description || '');
    setStatus(topic.status);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;
    if (!name.trim() || !code.trim()) {
      toast.error('Name and Code are required');
      return;
    }

    updateMutation.mutate(
      {
        id: editingTopic.id,
        payload: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim() || null,
          status,
        },
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          refetch();
        },
      },
    );
  };

  const columns: ColumnDef<Topic>[] = [
    {
      header: 'Topic Info',
      cell: (row) => (
        <span className='font-medium text-foreground group-hover:text-primary transition-colors'>
          {row.name}
        </span>
      ),
    },
    {
      header: 'Code',
      cell: (row) => (
        <Badge variant='outline' className='font-mono text-xs uppercase bg-muted/40'>
          {row.code}
        </Badge>
      ),
    },
    {
      header: 'Description',
      cell: (row) => (
        <span className='text-muted-foreground max-w-xs truncate block'>
          {row.description || (
            <span className='text-muted-foreground/40 italic'>No description</span>
          )}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge
          variant={row.status === 'ACTIVE' ? 'outline' : 'secondary'}
          className={
            row.status === 'ACTIVE'
              ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-950/30 dark:bg-green-950/20 dark:text-green-400 capitalize shadow-sm'
              : 'capitalize shadow-sm'
          }
        >
          {row.status.toLowerCase()}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div
          className='inline-flex items-center gap-2 justify-end w-full'
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            asChild
            variant='ghost'
            size='icon'
            title='View Details'
            className='h-8 w-8 text-muted-foreground hover:text-primary'
          >
            <Link href={`/admin/topics/${row.id}`}>
              <Eye className='w-4 h-4' />
            </Link>
          </Button>
          <Button
            variant='ghost'
            size='icon'
            title='Edit Topic'
            onClick={() => handleOpenEdit(row)}
            className='h-8 w-8 text-muted-foreground hover:text-primary'
          >
            <Edit2 className='w-4 h-4' />
          </Button>
          <ConfirmationDialog
            title={row.status === 'ACTIVE' ? 'Deactivate Topic' : 'Activate Topic'}
            description={
              row.status === 'ACTIVE'
                ? `Are you sure you want to deactivate "${row.name}"?`
                : `Are you sure you want to activate "${row.name}"?`
            }
            confirmLabel={row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            destructive={row.status === 'ACTIVE'}
            onConfirm={() => {
              if (row.status === 'ACTIVE') {
                deactivateMutation.mutate(row.id, { onSuccess: () => refetch() });
              } else {
                updateMutation.mutate(
                  { id: row.id, payload: { status: 'ACTIVE' } },
                  { onSuccess: () => refetch() },
                );
              }
            }}
            trigger={
              <Button
                variant='ghost'
                size='icon'
                title={row.status === 'ACTIVE' ? 'Deactivate Topic' : 'Activate Topic'}
                className={`h-8 w-8 ${
                  row.status === 'ACTIVE'
                    ? 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20'
                    : 'text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-950/20'
                }`}
              >
                {row.status === 'ACTIVE' ? (
                  <Trash2 className='w-4 h-4' />
                ) : (
                  <CheckCircle className='w-4 h-4' />
                )}
              </Button>
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className='space-y-8 animate-fade-in'>
      <SectionHeader
        title='Topic Registry'
        description='Configure globally unique topics and manage nested modular concept nodes.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Topics' }]}
        actions={
          <Button
            onClick={handleOpenCreate}
            className='shadow-md hover:shadow-lg transition-all duration-200'
          >
            <Plus className='w-4 h-4 mr-2' />
            Add Topic
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filteredTopics}
        isLoading={isLoading}
        search={
          <div className='relative max-w-md w-full'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              placeholder='Search topics by name or code...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9 bg-card'
            />
          </div>
        }
        emptyState={
          <EmptyState
            title='No Topics Found'
            description={
              searchQuery
                ? 'No topics match your search criteria. Try a different search term.'
                : 'Get started by creating your first global topic.'
            }
            actionLabel={searchQuery ? 'Clear Search' : 'Add Topic'}
            onAction={searchQuery ? () => setSearchQuery('') : handleOpenCreate}
            className='py-20 border border-dashed rounded-xl'
          />
        }
        rowKey={(row) => row.id}
        containerClassName='bg-card border rounded-xl shadow-sm'
      />

      {/* Create Topic Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} className='max-w-md'>
        <div className='flex items-center justify-between border-b pb-4 mb-4'>
          <h2 className='text-lg font-bold text-foreground'>Create New Topic</h2>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setIsCreateOpen(false)}
            className='h-6 w-6'
          >
            <X className='w-4 h-4' />
          </Button>
        </div>
        <form onSubmit={handleCreateSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='create-name'>
              Name
            </label>
            <Input
              id='create-name'
              placeholder='e.g., Data Structures'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='create-code'>
              Code
            </label>
            <Input
              id='create-code'
              placeholder='e.g., DATA_STRUCTURES'
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s+/g, '_'))}
              required
              className='uppercase font-mono'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='create-desc'>
              Description
            </label>
            <Input
              id='create-desc'
              placeholder='Optional short summary of this topic...'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground'>Status</label>
            <div className='flex gap-4 mt-1'>
              <label className='flex items-center gap-2 text-sm text-foreground cursor-pointer'>
                <input
                  type='radio'
                  name='create-status'
                  checked={status === 'ACTIVE'}
                  onChange={() => setStatus('ACTIVE')}
                  className='accent-primary'
                />
                Active
              </label>
              <label className='flex items-center gap-2 text-sm text-foreground cursor-pointer'>
                <input
                  type='radio'
                  name='create-status'
                  checked={status === 'INACTIVE'}
                  onChange={() => setStatus('INACTIVE')}
                  className='accent-primary'
                />
                Inactive
              </label>
            </div>
          </div>
          <div className='flex justify-end gap-2 border-t pt-4 mt-6'>
            <Button type='button' variant='outline' onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Topic'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Topic Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} className='max-w-md'>
        <div className='flex items-center justify-between border-b pb-4 mb-4'>
          <h2 className='text-lg font-bold text-foreground'>Edit Topic</h2>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setIsEditOpen(false)}
            className='h-6 w-6'
          >
            <X className='w-4 h-4' />
          </Button>
        </div>
        <form onSubmit={handleEditSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='edit-name'>
              Name
            </label>
            <Input
              id='edit-name'
              placeholder='e.g., Data Structures'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='edit-code'>
              Code
            </label>
            <Input
              id='edit-code'
              placeholder='e.g., DATA_STRUCTURES'
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s+/g, '_'))}
              required
              className='uppercase font-mono'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='edit-desc'>
              Description
            </label>
            <Input
              id='edit-desc'
              placeholder='Optional short summary...'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground'>Status</label>
            <div className='flex gap-4 mt-1'>
              <label className='flex items-center gap-2 text-sm text-foreground cursor-pointer'>
                <input
                  type='radio'
                  name='edit-status'
                  checked={status === 'ACTIVE'}
                  onChange={() => setStatus('ACTIVE')}
                  className='accent-primary'
                />
                Active
              </label>
              <label className='flex items-center gap-2 text-sm text-foreground cursor-pointer'>
                <input
                  type='radio'
                  name='edit-status'
                  checked={status === 'INACTIVE'}
                  onChange={() => setStatus('INACTIVE')}
                  className='accent-primary'
                />
                Inactive
              </label>
            </div>
          </div>
          <div className='flex justify-end gap-2 border-t pt-4 mt-6'>
            <Button type='button' variant='outline' onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
