'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTopic } from '@/services/topics';
import {
  useConcepts,
  useCreateConcept,
  useUpdateConcept,
  useDeactivateConcept,
} from '@/services/concept-mapping';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyStateCard } from '@/components/ui/empty-state';
import { ArrowLeft, Search, Plus, Trash2, Edit2, X, RefreshCcw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ConceptMapping } from '@/services/concept-mapping/types';

interface ClientProps {
  topicId: string;
}

export function TopicDetailPageClient({ topicId }: ClientProps) {
  const {
    data: topic,
    isLoading: topicLoading,
    isError: topicError,
    refetch: refetchTopic,
  } = useTopic(topicId);
  const {
    data: concepts,
    isLoading: conceptsLoading,
    isError: conceptsError,
    refetch: refetchConcepts,
  } = useConcepts(topicId, false);

  const createMutation = useCreateConcept(topicId);
  const updateMutation = useUpdateConcept(topicId);
  const deactivateMutation = useDeactivateConcept(topicId);

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<ConceptMapping | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const isLoading = topicLoading || conceptsLoading;
  const isError = topicError || conceptsError;

  if (isLoading) {
    return (
      <div className='space-y-8 mt-8'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-8 w-8 rounded-full' />
          <Skeleton className='h-10 w-64' />
        </div>
        <Skeleton className='h-48 w-full rounded-xl' />
        <div className='space-y-4'>
          <div className='flex justify-between'>
            <Skeleton className='h-8 w-32' />
            <Skeleton className='h-8 w-24' />
          </div>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='h-16 w-full rounded-lg' />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !topic) {
    return (
      <div className='mt-8 text-center py-16 border border-dashed rounded-xl bg-card text-card-foreground shadow-sm'>
        <h3 className='text-xl font-semibold text-red-600 mb-2'>Error Loading Topic Details</h3>
        <p className='text-muted-foreground mb-6 max-w-sm mx-auto'>
          We could not load the details for this topic registry.
        </p>
        <div className='flex justify-center gap-4'>
          <Button asChild variant='outline'>
            <Link href='/admin/topics'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Topics
            </Link>
          </Button>
          <Button
            onClick={() => {
              refetchTopic();
              refetchConcepts();
            }}
            variant='outline'
          >
            <RefreshCcw className='w-4 h-4 mr-2' />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const filteredConcepts =
    concepts?.filter((c) => {
      const nameVal = c.name || c.conceptName || '';
      const codeVal = c.code || c.conceptCode || '';
      const descVal = c.description || '';
      const q = searchQuery.toLowerCase();
      return (
        nameVal.toLowerCase().includes(q) ||
        codeVal.toLowerCase().includes(q) ||
        descVal.toLowerCase().includes(q)
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
        description: description.trim() || undefined,
        status,
        conceptName: name.trim(),
        conceptCode: code.trim().toUpperCase(),
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          refetchConcepts();
        },
      },
    );
  };

  const handleOpenEdit = (concept: ConceptMapping) => {
    setEditingConcept(concept);
    setName(concept.name || concept.conceptName || '');
    setCode(concept.code || concept.conceptCode || '');
    setDescription(concept.description || '');
    setStatus(concept.status || 'ACTIVE');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConcept) return;
    if (!name.trim() || !code.trim()) {
      toast.error('Name and Code are required');
      return;
    }

    updateMutation.mutate(
      {
        conceptId: editingConcept.id,
        payload: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim() || undefined,
          status,
          conceptName: name.trim(),
          conceptCode: code.trim().toUpperCase(),
        },
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          refetchConcepts();
        },
      },
    );
  };

  const handleToggleDeactivate = (concept: ConceptMapping) => {
    const isAct = concept.status === 'ACTIVE';
    if (isAct) {
      if (
        !window.confirm(
          `Are you sure you want to deactivate the concept "${concept.name || concept.conceptName}"?`,
        )
      ) {
        return;
      }
      deactivateMutation.mutate(concept.id, {
        onSuccess: () => refetchConcepts(),
      });
    } else {
      updateMutation.mutate(
        {
          conceptId: concept.id,
          payload: {
            status: 'ACTIVE',
            isActive: true,
          },
        },
        {
          onSuccess: () => refetchConcepts(),
        },
      );
    }
  };

  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Navigation Breadcrumb */}
      <div>
        <Button
          asChild
          variant='ghost'
          className='pl-0 text-muted-foreground hover:text-foreground'
        >
          <Link href='/admin/topics'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Topics
          </Link>
        </Button>
      </div>

      {/* Topic Metadata Card with Rich Styling */}
      <div className='relative overflow-hidden rounded-2xl border bg-card p-6 md:p-8 shadow-md transition-all duration-300 hover:shadow-lg'>
        <div className='absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-bl-full pointer-events-none' />
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4 mb-4'>
          <div>
            <h2 className='text-3xl font-bold tracking-tight text-foreground'>{topic.name}</h2>
            <div className='flex flex-wrap items-center gap-2 mt-2'>
              <Badge variant='outline' className='font-mono text-xs uppercase bg-muted/40'>
                {topic.code}
              </Badge>
              <Badge
                variant={topic.status === 'ACTIVE' ? 'outline' : 'secondary'}
                className={
                  topic.status === 'ACTIVE'
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-950/30 dark:bg-green-950/20 dark:text-green-400 capitalize'
                    : 'capitalize'
                }
              >
                {topic.status.toLowerCase()}
              </Badge>
            </div>
          </div>
        </div>
        <p className='text-muted-foreground text-base max-w-3xl leading-relaxed'>
          {topic.description || (
            <span className='italic text-muted-foreground/50'>
              No description provided for this topic.
            </span>
          )}
        </p>
      </div>

      {/* Concepts Registry Section */}
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4'>
          <div>
            <h3 className='text-2xl font-bold tracking-tight text-foreground'>Concept Registry</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Create and manage nested concepts used for question generation mapping under this
              topic.
            </p>
          </div>
          <Button onClick={handleOpenCreate} className='self-start sm:self-auto shadow-sm'>
            <Plus className='w-4 h-4 mr-2' />
            Add Concept
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className='flex items-center gap-4 max-w-sm bg-card p-1 rounded-xl shadow-sm border'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              placeholder='Search concepts...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9 border-none bg-transparent focus-visible:ring-0 shadow-none'
            />
          </div>
        </div>

        {/* Concept List Table */}
        {filteredConcepts.length === 0 ? (
          <EmptyStateCard
            title='No Concepts Registered'
            description={
              searchQuery
                ? 'No concepts matched your search query.'
                : 'There are no concepts registered under this topic yet.'
            }
            actionLabel={searchQuery ? 'Clear Search' : 'Add Concept'}
            onAction={searchQuery ? () => setSearchQuery('') : handleOpenCreate}
            cardClassName='py-16 border border-dashed rounded-xl'
            compact
          />
        ) : (
          <div className='overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300'>
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse text-left text-sm'>
                <thead>
                  <tr className='border-b border-border bg-muted/50 text-muted-foreground font-semibold'>
                    <th className='p-4 font-medium'>Concept Name</th>
                    <th className='p-4 font-medium'>Code</th>
                    <th className='p-4 font-medium'>Description</th>
                    <th className='p-4 font-medium'>Status</th>
                    <th className='p-4 font-medium text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {filteredConcepts.map((concept) => {
                    const cName = concept.name || concept.conceptName;
                    const cCode = concept.code || concept.conceptCode;
                    const isAct =
                      (concept.status || (concept.isActive ? 'ACTIVE' : 'INACTIVE')) === 'ACTIVE';

                    return (
                      <tr
                        key={concept.id}
                        className='group hover:bg-muted/20 transition-all duration-200'
                      >
                        <td className='p-4 font-medium text-foreground group-hover:text-primary transition-colors'>
                          {cName}
                        </td>
                        <td className='p-4'>
                          <Badge
                            variant='outline'
                            className='font-mono text-xs uppercase bg-muted/40'
                          >
                            {cCode}
                          </Badge>
                        </td>
                        <td className='p-4 text-muted-foreground max-w-xs truncate'>
                          {concept.description || (
                            <span className='text-muted-foreground/30 italic'>No description</span>
                          )}
                        </td>
                        <td className='p-4'>
                          <Badge
                            variant={isAct ? 'outline' : 'secondary'}
                            className={
                              isAct
                                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-950/30 dark:bg-green-950/20 dark:text-green-400 capitalize'
                                : 'capitalize'
                            }
                          >
                            {isAct ? 'active' : 'inactive'}
                          </Badge>
                        </td>
                        <td className='p-4 text-right'>
                          <div className='inline-flex items-center gap-2'>
                            <Button
                              variant='ghost'
                              size='icon'
                              title='Edit Concept'
                              onClick={() => handleOpenEdit(concept)}
                              className='h-8 w-8 text-muted-foreground hover:text-primary'
                            >
                              <Edit2 className='w-4 h-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              title={isAct ? 'Deactivate Concept' : 'Activate Concept'}
                              onClick={() => handleToggleDeactivate(concept)}
                              className={`h-8 w-8 ${
                                isAct
                                  ? 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20'
                                  : 'text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-950/20'
                              }`}
                            >
                              {isAct ? (
                                <Trash2 className='w-4 h-4' />
                              ) : (
                                <CheckCircle className='w-4 h-4' />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Concept Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} className='max-w-md'>
        <div className='flex items-center justify-between border-b pb-4 mb-4'>
          <h2 className='text-lg font-bold text-foreground'>Create New Concept</h2>
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
            <label className='text-sm font-medium text-foreground' htmlFor='concept-create-name'>
              Name
            </label>
            <Input
              id='concept-create-name'
              placeholder='e.g., Traversal'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='concept-create-code'>
              Code
            </label>
            <Input
              id='concept-create-code'
              placeholder='e.g., TRAVERSAL'
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className='uppercase font-mono'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='concept-create-desc'>
              Description
            </label>
            <Input
              id='concept-create-desc'
              placeholder='Optional short summary of this concept...'
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
                  name='concept-create-status'
                  checked={status === 'ACTIVE'}
                  onChange={() => setStatus('ACTIVE')}
                  className='accent-primary'
                />
                Active
              </label>
              <label className='flex items-center gap-2 text-sm text-foreground cursor-pointer'>
                <input
                  type='radio'
                  name='concept-create-status'
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
              {createMutation.isPending ? 'Creating...' : 'Create Concept'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Concept Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} className='max-w-md'>
        <div className='flex items-center justify-between border-b pb-4 mb-4'>
          <h2 className='text-lg font-bold text-foreground'>Edit Concept</h2>
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
            <label className='text-sm font-medium text-foreground' htmlFor='concept-edit-name'>
              Name
            </label>
            <Input
              id='concept-edit-name'
              placeholder='e.g., Traversal'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='concept-edit-code'>
              Code
            </label>
            <Input
              id='concept-edit-code'
              placeholder='e.g., TRAVERSAL'
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className='uppercase font-mono'
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground' htmlFor='concept-edit-desc'>
              Description
            </label>
            <Input
              id='concept-edit-desc'
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
                  name='concept-edit-status'
                  checked={status === 'ACTIVE'}
                  onChange={() => setStatus('ACTIVE')}
                  className='accent-primary'
                />
                Active
              </label>
              <label className='flex items-center gap-2 text-sm text-foreground cursor-pointer'>
                <input
                  type='radio'
                  name='concept-edit-status'
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
