'use client';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useTemplates, useCreateTemplate } from '@/services/templates/hooks';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const searchParams = useSearchParams();
  const autoTopicId = searchParams?.get('topicId');
  const autoOpen = searchParams?.get('autoOpen');

  const { data: response, isLoading, isError, refetch } = useTemplates(1, 100);
  const templates = response?.items || [];

  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const { data: concepts = [], isLoading: isLoadingConcepts } = useConcepts(selectedTopicId, true);

  const createMutation = useCreateTemplate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (autoTopicId) {
      setSelectedTopicId(autoTopicId);
    }
    if (autoOpen === 'true') {
      setIsModalOpen(true);
    }
  }, [autoTopicId, autoOpen]);
  const [formData, setFormData] = useState({
    name: 'New Template',
    templateKey: '',
    conceptKey: '',
    questionType: 'MULTIPLE_CHOICE',
    difficulty: 'MEDIUM',
    generationStrategy: 'VARIABLE',
  });
  const [modalError, setModalError] = useState('');

  const handleCreateTemplate = () => {
    setModalError('');
    if (selectedTopicId && !formData.conceptKey) {
      setModalError('Please select a Concept for the selected Topic before creating the template.');
      return;
    }

    createMutation.mutate(
      {
        name: formData.name,
        description: 'A new template for generation',
        templateKey: formData.templateKey || undefined,
        conceptKey: formData.conceptKey || undefined,
        questionType: formData.questionType || undefined,
        difficulty: formData.difficulty as any,
        generationStrategy: formData.generationStrategy as any,
        config: { topics: selectedTopicId ? [selectedTopicId] : [], timeLimit: 3600 },
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

  const columns: ColumnDef<any>[] = [
    {
      header: 'Name',
      cell: (row) => (
        <div>
          <div className='font-medium'>{row.name}</div>
          {row.templateKey && (
            <div className='text-xs text-muted-foreground font-mono'>{row.templateKey}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Concept Key',
      className: 'text-muted-foreground',
      cell: (row) => row.conceptKey ?? '-',
    },
    {
      header: 'Difficulty',
      cell: (row) => {
        const diff = (row.difficultyLevel ?? row.difficulty ?? 'MEDIUM').toUpperCase();
        return (
          <Badge
            variant={diff === 'EASY' ? 'secondary' : diff === 'HARD' ? 'destructive' : 'outline'}
            className='bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800'
          >
            {diff}
          </Badge>
        );
      },
    },
    {
      header: 'Strategy',
      cell: (row) => (
        <Badge
          variant='outline'
          className='bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 uppercase'
        >
          {row.generationStrategy ?? 'VARIABLE'}
        </Badge>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge
          variant={row.isActive ? 'outline' : 'secondary'}
          className={
            row.isActive
              ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-950/30 dark:bg-green-950/20 dark:text-green-400 capitalize shadow-sm'
              : 'capitalize shadow-sm'
          }
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className='inline-flex items-center gap-2 justify-end'>
          <Button
            asChild
            variant='ghost'
            size='sm'
            className='text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400'
          >
            <Link href={`/admin/templates/${row.id}`}>
              <Edit2 className='w-4 h-4 mr-1' /> Edit
            </Link>
          </Button>
          <Button
            asChild
            variant='ghost'
            size='sm'
            className='text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-400'
          >
            <Link href='/admin/assembly'>
              <ClipboardList className='w-4 h-4 mr-1' /> Assemble
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className='container mx-auto space-y-6 max-w-7xl'>
      <SectionHeader
        title='Templates'
        description='Manage generation templates and solutions.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Templates' }]}
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className='w-4 h-4 mr-2' />
            Create Template
          </Button>
        }
      />

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

      <div className='border rounded-xl bg-card shadow-sm'>
        {isError ? (
          <EmptyState
            variant='error'
            title='Unable to load templates'
            description='There was a problem fetching the templates. Please try again.'
            actionLabel='Retry'
            onAction={() => refetch()}
            className='py-12'
          />
        ) : (
          <DataTable
            columns={columns}
            data={templates}
            isLoading={isLoading}
            rowKey={(row) => row.id}
            emptyState={
              <EmptyState
                title='No Templates Found'
                description='Create your first template to get started.'
                actionLabel='Create Template'
                onAction={() => setIsModalOpen(true)}
                className='py-12 border-0'
              />
            }
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalError('');
        }}
      >
        <h2 className='text-xl font-semibold mb-4'>Create New Template</h2>
        {modalError && (
          <div className='p-3 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'>
            {modalError}
          </div>
        )}
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
            <Select
              disabled={isLoadingTopics}
              value={selectedTopicId}
              onValueChange={(val: string) => {
                setSelectedTopicId(val);
                setFormData({ ...formData, conceptKey: '' });
                setModalError('');
              }}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoadingTopics ? 'Loading topics...' : 'Select a topic...'}
                />
              </SelectTrigger>
              <SelectContent>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Concept {selectedTopicId ? '*' : '(optional)'}</Label>
            <Select
              disabled={!selectedTopicId || isLoadingConcepts}
              value={formData.conceptKey}
              onValueChange={(val: string) => {
                setFormData({ ...formData, conceptKey: val });
                setModalError('');
              }}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedTopicId
                      ? 'Select a topic first'
                      : isLoadingConcepts
                        ? 'Loading concepts...'
                        : 'Select a concept...'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {concepts.map((concept) => (
                  <SelectItem key={concept.id} value={concept.code || concept.conceptCode}>
                    {concept.name || concept.conceptName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Question Type</Label>
            <select
              className='flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              value={formData.questionType}
              onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
            >
              <option value='MULTIPLE_CHOICE'>Multiple Choice (MCQ)</option>
              <option value='CODING'>Coding Problem</option>
              <option value='NUMERIC'>Numeric Entry</option>
              <option value='TRUE_FALSE'>True / False</option>
            </select>
          </div>
          <div>
            <Label>Difficulty</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(val: string) => setFormData({ ...formData, difficulty: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select difficulty' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='EASY'>EASY</SelectItem>
                <SelectItem value='MEDIUM'>MEDIUM</SelectItem>
                <SelectItem value='HARD'>HARD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Generation Strategy</Label>
            <Select
              value={formData.generationStrategy}
              onValueChange={(val: string) => setFormData({ ...formData, generationStrategy: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select strategy' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='VARIABLE'>Variable Generation</SelectItem>
                <SelectItem value='DATASET'>Dataset-backed</SelectItem>
              </SelectContent>
            </Select>
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
