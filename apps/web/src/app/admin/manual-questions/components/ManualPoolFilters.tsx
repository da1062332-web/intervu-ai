import React from 'react';
import { ManualQuestionFilters } from '@/services/manual-questions/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useTopics } from '@/services/topics/hooks';
import { useConcepts } from '@/services/concept-mapping/hooks';

interface ManualPoolFiltersProps {
  filters: ManualQuestionFilters;
  setFilters: React.Dispatch<React.SetStateAction<ManualQuestionFilters>>;
  onClear: () => void;
}

export function ManualPoolFilters({ filters, setFilters, onClear }: ManualPoolFiltersProps) {
  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();
  const { data: concepts = [], isLoading: isLoadingConcepts } = useConcepts(
    filters.topicId || '',
    true,
  );

  return (
    <div className='flex flex-col gap-4 md:flex-row md:items-end flex-wrap'>
      <div className='flex-1 min-w-[200px] space-y-1.5'>
        <label className='text-sm font-medium'>Search</label>
        <div className='relative'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search questions...'
            className='pl-8'
            value={filters.search || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
        </div>
      </div>

      {/* Topic Filter */}
      <div className='w-full md:w-44 space-y-1.5'>
        <label className='text-sm font-medium'>Topic</label>
        <select
          className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
          value={filters.topicId || 'ALL'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              topicId: e.target.value === 'ALL' ? undefined : e.target.value,
              conceptId: undefined,
            }))
          }
          disabled={isLoadingTopics}
        >
          <option value='ALL'>{isLoadingTopics ? 'Loading topics...' : 'All Topics'}</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Concept Filter */}
      <div className='w-full md:w-44 space-y-1.5'>
        <label className='text-sm font-medium'>Concept</label>
        <select
          className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
          value={filters.conceptId || 'ALL'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              conceptId: e.target.value === 'ALL' ? undefined : e.target.value,
            }))
          }
          disabled={!filters.topicId || isLoadingConcepts}
        >
          <option value='ALL'>
            {!filters.topicId
              ? 'Select Topic First'
              : isLoadingConcepts
                ? 'Loading concepts...'
                : 'All Concepts'}
          </option>
          {concepts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || c.conceptName}
            </option>
          ))}
        </select>
      </div>

      <div className='w-full md:w-36 space-y-1.5'>
        <label className='text-sm font-medium'>Difficulty</label>
        <select
          className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
          value={filters.difficulty || 'ALL'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              difficulty: e.target.value === 'ALL' ? undefined : e.target.value,
            }))
          }
        >
          <option value='ALL'>All Difficulties</option>
          <option value='EASY'>Easy</option>
          <option value='MEDIUM'>Medium</option>
          <option value='HARD'>Hard</option>
        </select>
      </div>

      <div className='w-full md:w-36 space-y-1.5'>
        <label className='text-sm font-medium'>Status</label>
        <select
          className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
          value={filters.status || 'ALL'}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: e.target.value === 'ALL' ? undefined : e.target.value,
            }))
          }
        >
          <option value='ALL'>All Statuses</option>
          <option value='DRAFT'>Draft</option>
          <option value='ACTIVE'>Active</option>
          <option value='ARCHIVED'>Archived</option>
        </select>
      </div>

      <Button
        variant='outline'
        onClick={onClear}
        className='w-full md:w-auto shrink-0'
        title='Clear filters'
      >
        <X className='mr-2 h-4 w-4' /> Clear
      </Button>
    </div>
  );
}
