'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useTopics,
  useCreateTopic,
  useUpdateTopic,
  useDeactivateTopic,
} from '@/services/topics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyStateCard } from '@/components/ui/empty-state';
import {
  Search,
  Plus,
  Eye,
  Trash2,
  RefreshCcw,
  Edit2,
  X,
  CheckCircle,
} from 'lucide-react';
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

  if (isLoading) {
    return (
      <div className='space-y-6 mt-8'>
        <div className='flex justify-between items-center'>
          <Skeleton className='h-10 w-48' />
          <Skeleton className='h-10 w-32' />
        </div>
        <div className='flex gap-4'>
          <Skeleton className='h-10 w-96' />
        </div>
        <div className='space-y-3 mt-4'>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className='h-16 w-full rounded-lg' />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='mt-8 text-center py-16 border border-dashed rounded-xl bg-card text-card-foreground shadow-sm'>
        <h3 className='text-xl font-semibold text-red-600 mb-2'>Error Loading Topics</h3>
        <p className='text-muted-foreground mb-6 max-w-sm mx-auto'>
          We encountered an error while loading the topics registry. Please try again.
        </p>
        <Button onClick={() => refetch()} variant='outline'>
          <RefreshCcw className='w-4 h-4 mr-2 animate-spin' />
          Try Again
        </Button>
      </div>
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
      }
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
      }
    );
  };

  const handleToggleDeactivate = (topic: Topic) => {
    if (topic.status === 'ACTIVE') {
      if (!window.confirm(`Are you sure you want to deactivate the topic "${topic.name}"?`)) {
        return;
      }
      deactivateMutation.mutate(topic.id, {
        onSuccess: () => refetch(),
      });
    } else {
      updateMutation.mutate(
        {
          id: topic.id,
          payload: { status: 'ACTIVE' },
        },
        {
          onSuccess: () => refetch(),
        }
      );
    }
  };

  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Header section with rich aesthetics */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6'>
        <div>
          <h1 className='text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent'>
            Topic Registry
          </h1>
          <p className='text-muted-foreground mt-2 text-lg'>
            Configure globally unique topics and manage nested modular concept nodes.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className='self-start md:self-auto shadow-md hover:shadow-lg transition-all duration-200'>
          <Plus className='w-4 h-4 mr-2' />
          Add Topic
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className='flex items-center gap-4 max-w-md bg-card p-1 rounded-xl shadow-sm border'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Search topics by name or code...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9 border-none bg-transparent focus-visible:ring-0 shadow-none'
          />
        </div>
      </div>

      {/* Main List Table */}
      {filteredTopics.length === 0 ? (
        <EmptyStateCard
          title='No Topics Found'
          description={
            searchQuery
              ? 'No topics matched your search query. Try filtering with a different keyword.'
              : 'The topic registry is currently empty. Get started by creating your first topic.'
          }
          actionLabel={searchQuery ? 'Clear Search' : 'Add Topic'}
          onAction={searchQuery ? () => setSearchQuery('') : handleOpenCreate}
          cardClassName='py-20 border border-dashed rounded-xl'
        />
      ) : (
        <div className='overflow-hidden rounded-xl border border-border bg-card shadow-md transition-all duration-300 hover:shadow-lg'>
          <div className='overflow-x-auto'>
            <table className='w-full border-collapse text-left text-sm'>
              <thead>
                <tr className='border-b border-border bg-muted/55 text-muted-foreground font-semibold'>
                  <th className='p-4 font-medium'>Topic Info</th>
                  <th className='p-4 font-medium'>Code</th>
                  <th className='p-4 font-medium'>Description</th>
                  <th className='p-4 font-medium'>Status</th>
                  <th className='p-4 font-medium text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {filteredTopics.map((topic) => (
                  <tr
                    key={topic.id}
                    className='group hover:bg-muted/30 transition-all duration-200 cursor-pointer'
                    onClick={() => router.push(`/admin/topics/${topic.id}`)}
                  >
                    <td className='p-4 font-medium text-foreground group-hover:text-primary transition-colors'>
                      {topic.name}
                    </td>
                    <td className='p-4'>
                      <Badge variant='outline' className='font-mono text-xs uppercase bg-muted/40'>
                        {topic.code}
                      </Badge>
                    </td>
                    <td className='p-4 text-muted-foreground max-w-xs truncate'>
                      {topic.description || <span className='text-muted-foreground/40 italic'>No description</span>}
                    </td>
                    <td className='p-4'>
                      <Badge
                        variant={topic.status === 'ACTIVE' ? 'outline' : 'secondary'}
                        className={
                          topic.status === 'ACTIVE'
                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-950/30 dark:bg-green-950/20 dark:text-green-400 capitalize shadow-sm'
                            : 'capitalize shadow-sm'
                        }
                      >
                        {topic.status.toLowerCase()}
                      </Badge>
                    </td>
                    <td className='p-4 text-right' onClick={(e) => e.stopPropagation()}>
                      <div className='inline-flex items-center gap-2'>
                        <Button
                          asChild
                          variant='ghost'
                          size='icon'
                          title='View Details'
                          className='h-8 w-8 text-muted-foreground hover:text-primary'
                        >
                          <Link href={`/admin/topics/${topic.id}`}>
                            <Eye className='w-4 h-4' />
                          </Link>
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          title='Edit Topic'
                          onClick={() => handleOpenEdit(topic)}
                          className='h-8 w-8 text-muted-foreground hover:text-primary'
                        >
                          <Edit2 className='w-4 h-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          title={topic.status === 'ACTIVE' ? 'Deactivate Topic' : 'Activate Topic'}
                          onClick={() => handleToggleDeactivate(topic)}
                          className={`h-8 w-8 ${
                            topic.status === 'ACTIVE'
                              ? 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20'
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-950/20'
                          }`}
                        >
                          {topic.status === 'ACTIVE' ? (
                            <Trash2 className='w-4 h-4' />
                          ) : (
                            <CheckCircle className='w-4 h-4' />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Topic Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} className='max-w-md'>
        <div className='flex items-center justify-between border-b pb-4 mb-4'>
          <h2 className='text-lg font-bold text-foreground'>Create New Topic</h2>
          <Button variant='ghost' size='icon' onClick={() => setIsCreateOpen(false)} className='h-6 w-6'>
            <X className='w-4 h-4' />
          </Button>
        </div>
        <form onSubmit={handleCreateSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='create-name'>Name</label>
            <Input
              id='create-name'
              placeholder='e.g., Data Structures'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='create-code'>Code</label>
            <Input
              id='create-code'
              placeholder='e.g., DATA_STRUCTURES'
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className='uppercase font-mono'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='create-desc'>Description</label>
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
          <Button variant='ghost' size='icon' onClick={() => setIsEditOpen(false)} className='h-6 w-6'>
            <X className='w-4 h-4' />
          </Button>
        </div>
        <form onSubmit={handleEditSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='edit-name'>Name</label>
            <Input
              id='edit-name'
              placeholder='e.g., Data Structures'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='edit-code'>Code</label>
            <Input
              id='edit-code'
              placeholder='e.g., DATA_STRUCTURES'
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className='uppercase font-mono'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='edit-desc'>Description</label>
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
