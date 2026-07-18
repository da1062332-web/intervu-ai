'use client';

import { useState } from 'react';
import { useTemplates, useCreateTemplate } from '@/services/templates/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit2, ClipboardList, ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTopics } from '@/services/topics/hooks';
import { useConcepts } from '@/services/concept-mapping/hooks';

export function TemplateListPageClient() {
  const router = useRouter();
  const { data: response, isLoading, isError, refetch } = useTemplates(1, 100);
  const templates = response?.items || [];

  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const { data: concepts = [], isLoading: isLoadingConcepts } = useConcepts(selectedTopicId, true);

  const createMutation = useCreateTemplate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: 'New Template',
    templateKey: '',
    conceptKey: '',
    questionType: 'coding',
    difficulty: 'MEDIUM',
    generationStrategy: 'VARIABLE',
  });

  const handleCreateTemplate = () => {
    createMutation.mutate(
      {
        name: formData.name,
        description: 'A new template for generation',
        templateKey: formData.templateKey || undefined,
        conceptKey: formData.conceptKey || undefined,
        questionType: formData.questionType || undefined,
        difficulty: formData.difficulty as any,
        generationStrategy: formData.generationStrategy as any,
        config: { topics: [], timeLimit: 3600 },
        isSystem: false,
      },
      {
        onSuccess: (data) => {
          if (data && data.id) {
            setIsModalOpen(false);
            router.push(`/admin/templates/${data.id}`);
          }
        },
      },
    );
  };

  return (
    <div className='container mx-auto py-6 space-y-6 max-w-7xl'>
      {/* Workflow Guide Banner */}
      <div className='flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4'>
        <Info className='w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0' />
        <div className='flex-1'>
          <p className='text-sm font-medium text-blue-800 dark:text-blue-300'>How Templates Work</p>
          <p className='text-sm text-blue-700 dark:text-blue-400 mt-0.5'>
            Templates define how questions are structured (solution format, variables, rules). Once
            a template is configured, go to <strong>Test Assembly</strong> to generate a full test
            instance.
          </p>
        </div>
        <Link href='/admin/assembly'>
          <Button size='sm' className='gap-1.5 shrink-0 bg-blue-600 hover:bg-blue-700 text-white'>
            <ClipboardList className='w-4 h-4' />
            Go to Assembly
            <ArrowRight className='w-3.5 h-3.5' />
          </Button>
        </Link>
      </div>

      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Templates</h1>
          <p className='text-muted-foreground'>Manage generation templates and solutions.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className='w-4 h-4 mr-2' />
          Create Template
        </Button>
      </div>

      <div className='border rounded-lg bg-white dark:bg-gray-900 shadow-sm overflow-hidden'>
        {isLoading && (
          <div className='p-6 space-y-4'>
            <Skeleton className='h-10 w-full rounded-md' />
            <Skeleton className='h-12 w-full rounded-md' />
            <Skeleton className='h-12 w-full rounded-md' />
          </div>
        )}

        {isError && (
          <div className='p-12 text-center'>
            <h3 className='text-lg font-medium text-red-600 mb-2'>Unable to load templates.</h3>
            <Button onClick={() => refetch()} variant='outline'>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !isError && (!templates || templates.length === 0) && (
          <div className='p-12 text-center border-dashed border-2 m-6 rounded-lg border-gray-200 dark:border-gray-800'>
            <h3 className='text-lg font-medium mb-2'>No Templates Found</h3>
            <p className='text-muted-foreground mb-6'>Create your first template to get started.</p>
            <Button onClick={handleCreateTemplate} disabled={createMutation.isPending}>
              <Plus className='w-4 h-4 mr-2' />
              {createMutation.isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        )}

        {!isLoading && !isError && templates && templates.length > 0 && (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Concept Key</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((tpl: any) => (
                  <TableRow key={tpl.id}>
                    <TableCell className='font-medium'>
                      <div>{tpl.name}</div>
                      {tpl.templateKey && (
                        <div className='text-xs text-muted-foreground font-mono'>
                          {tpl.templateKey}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>{tpl.conceptKey ?? '-'}</TableCell>
                    <TableCell>
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'>
                        {tpl.difficultyLevel ?? tpl.difficulty ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'>
                        {tpl.generationStrategy ?? 'VARIABLE'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tpl.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}
                      >
                        {tpl.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className='text-right space-x-2'>
                      <Link href={`/admin/templates/${tpl.id}`}>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400'
                        >
                          <Edit2 className='w-4 h-4 mr-1' /> Edit
                        </Button>
                      </Link>
                      <Link href='/admin/assembly'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-400'
                        >
                          <ClipboardList className='w-4 h-4 mr-1' /> Assemble
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className='text-xl font-semibold mb-4'>Create New Template</h2>
        <div className='space-y-4'>
          <div>
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder='e.g. React Custom Hook'
            />
          </div>
          <div>
            <Label>Template Key (optional)</Label>
            <Input
              value={formData.templateKey}
              onChange={(e) => setFormData({ ...formData, templateKey: e.target.value })}
              placeholder='e.g. react-custom-hook'
            />
          </div>
          <div>
            <Label>Topic (optional)</Label>
            <select
              className='flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4'
              value={selectedTopicId}
              onChange={(e) => {
                setSelectedTopicId(e.target.value);
                setFormData({ ...formData, conceptKey: '' });
              }}
              disabled={isLoadingTopics}
            >
              <option value=''>{isLoadingTopics ? 'Loading topics...' : 'Select a topic...'}</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Concept (optional)</Label>
            <select
              className='flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              value={formData.conceptKey}
              onChange={(e) => setFormData({ ...formData, conceptKey: e.target.value })}
              disabled={!selectedTopicId || isLoadingConcepts}
            >
              <option value=''>
                {!selectedTopicId
                  ? 'Select a topic first'
                  : isLoadingConcepts
                    ? 'Loading concepts...'
                    : 'Select a concept...'}
              </option>
              {concepts.map((concept) => (
                <option key={concept.id} value={concept.code || concept.conceptCode}>
                  {concept.name || concept.conceptName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Question Type</Label>
            <Input
              value={formData.questionType}
              onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
              placeholder='e.g. coding'
            />
          </div>
          <div>
            <Label>Difficulty</Label>
            <select
              className='flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
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
              value={formData.generationStrategy}
              onChange={(e) => setFormData({ ...formData, generationStrategy: e.target.value })}
            >
              <option value='VARIABLE'>Variable Generation</option>
              <option value='DATASET'>Dataset-backed</option>
            </select>
          </div>
          <div className='flex justify-end space-x-2 mt-6'>
            <Button variant='outline' onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
