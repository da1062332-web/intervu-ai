'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTopic } from '@/services/topics';
import {
  useConcepts,
  useCreateConcept,
  useUpdateConcept,
  useDeactivateConcept,
} from '@/services/concept-mapping';
import { useManualQuestions } from '@/services/manual-questions/hooks';
import { useTemplatesByConcept, useCreateTemplate, useDeleteTemplate } from '@/services/templates/hooks';
import { toast } from 'sonner';
import { ManualQuestionModal } from '@/app/admin/manual-questions/components/ManualQuestionModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyStateCard } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { AnimatedLoader } from '@/components/ui/animated-loader';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  RefreshCcw,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  List,
} from 'lucide-react';
import type { ConceptMapping } from '@/services/concept-mapping/types';
import { Label } from '@/components/ui/label';
import { useQueries } from '@tanstack/react-query';
import * as templateApi from '@/services/templates/api';
import { useRouter } from 'next/navigation';

interface ClientProps {
  topicId: string;
}

// Child component to fetch and render templates for a specific concept
function ConceptTemplatesRow({
  concept,
  onAddTemplate,
}: {
  concept: ConceptMapping;
  onAddTemplate: (c: ConceptMapping) => void;
}) {
  const conceptKey = concept.code || concept.conceptCode;
  const { data: response, isLoading, isError } = useTemplatesByConcept(conceptKey);
  const templates = response?.items || [];
  const deleteMutation = useDeleteTemplate();

  const handleDeleteTemplate = async (templateId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete template "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(templateId);
      toast.success(`Template "${name}" deleted successfully!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete template.');
    }
  };

  if (isLoading) {
    return (
      <TableRow className='bg-muted/5'>
        <TableCell colSpan={5} className='p-6'>
          <Skeleton className='h-24 w-full' />
        </TableCell>
      </TableRow>
    );
  }

  if (isError) {
    return (
      <TableRow className='bg-muted/5'>
        <TableCell colSpan={5} className='p-6 text-center text-red-500'>
          Error loading templates for this concept.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className='bg-muted/5 hover:bg-muted/5 border-b-2'>
      <TableCell colSpan={5} className='p-0'>
        <div className='border-l-4 border-l-primary/60 m-4 rounded-r-lg bg-background shadow-inner space-y-4'>
          <div className='flex items-center justify-between'>
            <h4 className='font-semibold text-sm flex items-center gap-2'>
              <FileText className='w-4 h-4 text-muted-foreground' />
              Templates ({templates.length})
            </h4>
            <Button size='sm' onClick={() => onAddTemplate(concept)}>
              <Plus className='w-4 h-4 mr-2' /> Add Template
            </Button>
          </div>

          {templates.length === 0 ? (
            <div className='text-center py-8 border-2 border-dashed rounded-lg'>
              <p className='text-muted-foreground text-sm mb-4'>
                No templates created for this concept.
              </p>
              <Button variant='outline' size='sm' onClick={() => onAddTemplate(concept)}>
                <Plus className='w-4 h-4 mr-2' /> Create First Template
              </Button>
            </div>
          ) : (
            <div className='border rounded-md divide-y'>
              {templates.map((tpl: any) => (
                <div
                  key={tpl.id}
                  className='flex items-center justify-between p-3 hover:bg-muted/20 transition-colors'
                >
                  <div>
                    <div className='font-medium text-sm'>{tpl.name}</div>
                    <div className='flex items-center gap-2 mt-1'>
                      <Badge variant='outline' className='text-[10px] uppercase'>
                        {tpl.difficultyLevel ?? tpl.difficulty ?? 'MEDIUM'}
                      </Badge>
                      <span
                        className={`text-[10px] font-medium ${tpl.isActive ? 'text-green-600' : 'text-muted-foreground'}`}
                      >
                        {tpl.isActive ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button variant='ghost' size='sm' asChild className='h-8'>
                      <Link href={`/admin/templates/${tpl.id}`}>
                        <Edit2 className='w-3.5 h-3.5 mr-1' /> Edit
                      </Link>
                    </Button>
                    <ConfirmationDialog
                      title='Delete Template'
                      description={`Are you sure you want to delete "${tpl.name || 'Untitled Template'}"?`}
                      confirmLabel='Delete'
                      destructive
                      onConfirm={async () => {
                        try {
                          await deleteMutation.mutateAsync(tpl.id);
                          toast.success(`Template "${tpl.name || 'Untitled Template'}" deleted successfully!`);
                        } catch (err: any) {
                          toast.error(err?.message || 'Failed to delete template.');
                        }
                      }}
                      trigger={
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 text-red-500 hover:text-red-600'
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className='w-3.5 h-3.5 mr-1' /> Delete
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ConceptManualQuestionsRow({
  concept,
  onAddManualQuestion,
  onEditManualQuestion,
}: {
  concept: ConceptMapping;
  onAddManualQuestion: (c: ConceptMapping) => void;
  onEditManualQuestion: (q: any) => void;
}) {
  const { data: response, isLoading, isError } = useManualQuestions({ conceptId: concept.id });
  const allQuestions = Array.isArray(response) ? response : (response as any)?.data || (response as any)?.items || [];
  const questions = allQuestions.filter((q: any) => q.conceptId === concept.id || q.conceptId === concept.code);

  if (isLoading) {
    return (
      <TableRow className='bg-muted/5'>
        <TableCell colSpan={6} className='p-6'>
          <Skeleton className='h-24 w-full' />
        </TableCell>
      </TableRow>
    );
  }

  if (isError) {
    return (
      <TableRow className='bg-muted/5'>
        <TableCell colSpan={6} className='p-6 text-center text-red-500'>
          Error loading manual questions for this concept.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className='bg-muted/5 hover:bg-muted/5 border-b-2'>
      <TableCell colSpan={6} className='p-0'>
        <div className='p-6 border-l-4 border-l-secondary m-4 rounded-r-lg bg-background shadow-inner space-y-4'>
          <div className='flex items-center justify-between'>
            <h4 className='font-semibold text-sm flex items-center gap-2'>
              <List className='w-4 h-4 text-muted-foreground' />
              Manual Questions ({questions.length})
            </h4>
            <Button size='sm' variant='secondary' onClick={() => onAddManualQuestion(concept)}>
              <Plus className='w-4 h-4 mr-2' /> Add Question
            </Button>
          </div>

          {questions.length === 0 ? (
            <div className='text-center py-8 border-2 border-dashed rounded-lg'>
              <p className='text-muted-foreground text-sm mb-4'>
                No manual questions created for this concept.
              </p>
              <Button variant='outline' size='sm' onClick={() => onAddManualQuestion(concept)}>
                <Plus className='w-4 h-4 mr-2' /> Create First Question
              </Button>
            </div>
          ) : (
            <div className='border rounded-md divide-y'>
              {questions.map((q: any) => (
                <div
                  key={q.id}
                  className='flex items-center justify-between p-3 hover:bg-muted/20 transition-colors'
                >
                  <div>
                    <div className='font-medium text-sm max-w-xl truncate' title={q.questionText}>
                      {q.questionText}
                    </div>
                    <div className='flex items-center gap-2 mt-1'>
                      <Badge variant='outline' className='text-[10px] uppercase'>
                        {q.questionType}
                      </Badge>
                      <Badge variant='outline' className='text-[10px] uppercase'>
                        {q.difficulty}
                      </Badge>
                      <span
                        className={`text-[10px] font-medium ${q.status === 'ACTIVE' ? 'text-green-600' : 'text-muted-foreground'}`}
                      >
                        {q.status}
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button variant='ghost' size='sm' className='h-8' onClick={() => onEditManualQuestion(q)}>
                      <Edit2 className='w-3.5 h-3.5 mr-1' /> Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function TopicDetailPageClient({ topicId }: ClientProps) {
  const router = useRouter();
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

  // Accordion state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedMqRows, setExpandedMqRows] = useState<Set<string>>(new Set());

  // Template creation modal state
  const createTemplateMutation = useCreateTemplate();
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedConceptForTemplate, setSelectedConceptForTemplate] =
    useState<ConceptMapping | null>(null);
  const [templateFormData, setTemplateFormData] = useState({
    name: 'New Template',
    questionType: 'coding',
    difficulty: 'MEDIUM',
    generationStrategy: 'VARIABLE',
  });

  // Manual Question modal state
  const [isMqModalOpen, setIsMqModalOpen] = useState(false);
  const [selectedConceptForMq, setSelectedConceptForMq] = useState<ConceptMapping | null>(null);
  const [editingMq, setEditingMq] = useState<any | null>(null);

  const isLoading = topicLoading || conceptsLoading;
  const isError = topicError || conceptsError;

  // Fetch templates for all concepts to calculate readiness
  const templateQueries = useQueries({
    queries: (concepts || []).map((c) => {
      const cKey = c.code || c.conceptCode;
      return {
        queryKey: ['templatesByConcept', cKey, 1, 100],
        queryFn: async () => {
          const res = await templateApi.getTemplates(1, 100, cKey);
          if (res && res.items) {
            res.items = res.items.filter((t: any) => t.conceptKey === cKey);
            res.totalCount = res.items.length;
          }
          return res;
        },
        enabled: !!cKey,
      };
    }),
  });

  const readyConceptsCount = templateQueries.filter(
    (q) => q.isSuccess && q.data?.items?.length > 0,
  ).length;
  const isTopicReady = concepts && concepts.length > 0 && readyConceptsCount === concepts.length;

  if (isLoading) {
    return <AnimatedLoader variant='table' className='mt-8' />;
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

  const toggleRow = (conceptId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(conceptId)) {
        next.delete(conceptId);
      } else {
        next.add(conceptId);
      }
      return next;
    });
    setExpandedMqRows((prev) => {
      if (prev.has(conceptId)) {
        const next = new Set(prev);
        next.delete(conceptId);
        return next;
      }
      return prev;
    });
  };

  const toggleMqRow = (conceptId: string) => {
    setExpandedMqRows((prev) => {
      const next = new Set(prev);
      if (next.has(conceptId)) {
        next.delete(conceptId);
      } else {
        next.add(conceptId);
      }
      return next;
    });
    setExpandedRows((prev) => {
      if (prev.has(conceptId)) {
        const next = new Set(prev);
        next.delete(conceptId);
        return next;
      }
      return prev;
    });
  };

  const handleOpenAddManualQuestion = (concept: ConceptMapping) => {
    const returnTo = encodeURIComponent(`/admin/topics/${topicId}`);
    router.push(`/admin/manual-questions/create?topicId=${topicId}&conceptId=${concept.id}&returnTo=${returnTo}`);
  };

  const handleOpenEditManualQuestion = (question: any) => {
    setEditingMq(question);
    setIsMqModalOpen(true);
  };

  const handleOpenAddTemplate = (concept: ConceptMapping) => {
    setSelectedConceptForTemplate(concept);
    setTemplateFormData({
      name: 'New Template',
      questionType: 'coding',
      difficulty: 'MEDIUM',
      generationStrategy: 'VARIABLE',
    });
    setIsTemplateModalOpen(true);
  };

  const handleCreateTemplateSubmit = () => {
    if (!selectedConceptForTemplate) return;
    createTemplateMutation.mutate(
      {
        name: templateFormData.name,
        description: 'A new template for generation',
        templateKey: undefined,
        conceptKey: selectedConceptForTemplate.code || selectedConceptForTemplate.conceptCode,
        questionType: templateFormData.questionType,
        difficulty: templateFormData.difficulty as any,
        generationStrategy: templateFormData.generationStrategy as any,
        config: { topics: [], timeLimit: 3600 },
        isSystem: false,
      },
      {
        onSuccess: (data) => {
          if (data && data.id) {
            setIsTemplateModalOpen(false);
            router.push(`/admin/templates/${data.id}`);
          }
        },
      },
    );
  };

  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Page Header */}
      <PageHeader
        title={topic ? topic.name : 'Topic Details'}
        subtitle='Manage your topic configuration and its hierarchical dependencies.'
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Topics', href: '/admin/topics' },
          { label: topic.name },
        ]}
        action={
          <div className='flex gap-2 items-center'>
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
        }
      />



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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[40px]'></TableHead>
                    <TableHead>Concept Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConcepts.map((concept) => {
                    const cName = concept.name || concept.conceptName;
                    const cCode = concept.code || concept.conceptCode;
                    const isAct =
                      (concept.status || (concept.isActive ? 'ACTIVE' : 'INACTIVE')) === 'ACTIVE';
                    const isExpanded = expandedRows.has(concept.id) || expandedMqRows.has(concept.id);

                    return (
                      <React.Fragment key={concept.id}>
                        <TableRow
                          className='group hover:bg-muted/20 transition-all duration-200 cursor-pointer'
                          onClick={() => toggleRow(concept.id)}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown className='w-4 h-4 text-muted-foreground' />
                            ) : (
                              <ChevronRight className='w-4 h-4 text-muted-foreground' />
                            )}
                          </TableCell>
                          <TableCell className='font-medium text-foreground group-hover:text-primary transition-colors'>
                            {cName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant='outline'
                              className='font-mono text-xs uppercase bg-muted/40'
                            >
                              {cCode}
                            </Badge>
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>
                            <div className='flex gap-2 items-center'>
                              <Button
                                variant='ghost'
                                size='sm'
                                className={`h-8 text-xs font-medium hover:text-foreground ${expandedRows.has(concept.id) ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRow(concept.id);
                                }}
                              >
                                <FileText className='w-3.5 h-3.5 mr-1.5' />
                                Templates
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                className={`h-8 text-xs font-medium hover:text-foreground ${expandedMqRows.has(concept.id) ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMqRow(concept.id);
                                }}
                              >
                                <List className='w-3.5 h-3.5 mr-1.5' />
                                Manual Questions
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='inline-flex items-center gap-2'>
                              <Button
                                variant='ghost'
                                size='icon'
                                title='Edit Concept'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(concept);
                                }}
                                className='h-8 w-8 text-muted-foreground hover:text-primary'
                              >
                                <Edit2 className='w-4 h-4' />
                              </Button>
                              <ConfirmationDialog
                                title={isAct ? 'Deactivate Concept' : 'Activate Concept'}
                                description={isAct ? `Are you sure you want to deactivate "${cName}"?` : `Are you sure you want to activate "${cName}"?`}
                                confirmLabel={isAct ? 'Deactivate' : 'Activate'}
                                destructive={isAct}
                                onConfirm={() => {
                                  if (isAct) {
                                    deactivateMutation.mutate(concept.id, { onSuccess: () => refetchConcepts() });
                                  } else {
                                    updateMutation.mutate(
                                      { conceptId: concept.id, payload: { status: 'ACTIVE', isActive: true } },
                                      { onSuccess: () => refetchConcepts() }
                                    );
                                  }
                                }}
                                trigger={
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    title={isAct ? 'Deactivate Concept' : 'Activate Concept'}
                                    onClick={(e) => e.stopPropagation()}
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
                                }
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(concept.id) && (
                          <ConceptTemplatesRow
                            concept={concept}
                            onAddTemplate={handleOpenAddTemplate}
                          />
                        )}
                        {expandedMqRows.has(concept.id) && (
                          <ConceptManualQuestionsRow
                            concept={concept}
                            onAddManualQuestion={handleOpenAddManualQuestion}
                            onEditManualQuestion={handleOpenEditManualQuestion}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
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
              onChange={(e) => setCode(e.target.value.replace(/\s+/g, '_'))}
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
              onChange={(e) => setCode(e.target.value.replace(/\s+/g, '_'))}
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

      {/* Add Template Modal */}
      <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)}>
        <h2 className='text-xl font-semibold mb-4'>Create New Template</h2>
        <div className='space-y-4'>
          <div>
            <Label>Name</Label>
            <Input
              value={templateFormData.name}
              onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
              placeholder='e.g. React Custom Hook'
            />
          </div>
          <div>
            <Label>Concept</Label>
            <Input
              value={
                selectedConceptForTemplate?.name || selectedConceptForTemplate?.conceptName || ''
              }
              disabled
              className='bg-muted cursor-not-allowed'
            />
          </div>
          <div>
            <Label>Question Type</Label>
            <Input
              value={templateFormData.questionType}
              onChange={(e) =>
                setTemplateFormData({ ...templateFormData, questionType: e.target.value })
              }
              placeholder='e.g. coding'
            />
          </div>
          <div>
            <Label>Difficulty</Label>
            <select
              className='flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              value={templateFormData.difficulty}
              onChange={(e) =>
                setTemplateFormData({ ...templateFormData, difficulty: e.target.value })
              }
            >
              <option value='EASY'>EASY</option>
              <option value='MEDIUM'>MEDIUM</option>
              <option value='HARD'>HARD</option>
            </select>
          </div>
          <div>
            <Label>Generation Strategy</Label>
            <select
              className='flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              value={templateFormData.generationStrategy}
              onChange={(e) =>
                setTemplateFormData({ ...templateFormData, generationStrategy: e.target.value })
              }
            >
              <option value='VARIABLE'>Variable Generation</option>
              <option value='DATASET'>Dataset-backed</option>
            </select>
          </div>
          <div className='flex justify-end space-x-2 mt-6'>
            <Button variant='outline' onClick={() => setIsTemplateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplateSubmit}
              disabled={createTemplateMutation.isPending}
            >
              {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manual Question Modal */}
      {isMqModalOpen && (
        <ManualQuestionModal
          isOpen={isMqModalOpen}
          onClose={() => {
            setIsMqModalOpen(false);
            setEditingMq(null);
            setSelectedConceptForMq(null);
          }}
          question={editingMq}
          initialTopicId={topicId}
          initialConceptId={selectedConceptForMq?.id}
        />
      )}
    </div>
  );
}
