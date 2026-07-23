import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuestionFilters } from '@/services/question-pool/types';
import { useTopics } from '@/services/topics/hooks';
import { useConcepts } from '@/services/concept-mapping/hooks';
import { X, Filter } from 'lucide-react';

export interface PoolFiltersProps {
  filters: QuestionFilters;
  setFilters: React.Dispatch<React.SetStateAction<QuestionFilters>>;
  onClear: () => void;
}

export function PoolFilters({ filters, setFilters, onClear }: PoolFiltersProps) {
  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();
  const { data: concepts = [], isLoading: isLoadingConcepts } = useConcepts(filters.topicId || '', true);

  const hasActiveFilters = Boolean(
    filters.search || filters.topicId || filters.conceptId || filters.status || filters.difficulty
  );

  return (
    <div className='bg-white dark:bg-gray-900 border rounded-xl p-5 shadow-sm space-y-4'>
      <div className='flex justify-between items-center border-b pb-3'>
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Filter className="w-4 h-4 text-indigo-500" />
          Filter Questions
        </div>
        {hasActiveFilters && (
          <Button variant='outline' size='sm' onClick={onClear} className='h-8 text-xs text-muted-foreground hover:text-foreground'>
            <X className="w-3.5 h-3.5 mr-1" /> Clear Filters
          </Button>
        )}
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
        {/* Search Input */}
        <div className='space-y-1.5'>
          <Label className="text-xs text-muted-foreground">Search Statement</Label>
          <Input
            placeholder='Search text...'
            className="h-9 text-sm"
            value={filters.search || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
        </div>

        {/* Topic Selector */}
        <div className='space-y-1.5'>
          <Label className="text-xs text-muted-foreground">Topic</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={filters.topicId || ''}
            onChange={(e) => {
              const val = e.target.value;
              setFilters((prev) => ({
                ...prev,
                topicId: val || undefined,
                conceptId: undefined, // reset concept on topic change
              }));
            }}
            disabled={isLoadingTopics}
          >
            <option value="">{isLoadingTopics ? 'Loading topics...' : 'All Topics'}</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Concept Selector */}
        <div className='space-y-1.5'>
          <Label className="text-xs text-muted-foreground">Concept / Section</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={filters.conceptId || ''}
            onChange={(e) => {
              const val = e.target.value;
              setFilters((prev) => ({
                ...prev,
                conceptId: val || undefined,
              }));
            }}
            disabled={!filters.topicId || isLoadingConcepts}
          >
            <option value="">
              {!filters.topicId
                ? 'Select a topic first'
                : isLoadingConcepts
                  ? 'Loading concepts...'
                  : 'All Concepts'}
            </option>
            {concepts.map((c) => (
              <option key={c.id} value={c.code || c.id}>
                {c.name || c.conceptName}
              </option>
            ))}
          </select>
        </div>

        {/* Status Selector */}
        <div className='space-y-1.5'>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(val: string) => setFilters((prev) => ({ ...prev, status: val === 'all' ? undefined : val }))}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value='Approved'>Approved</SelectItem>
              <SelectItem value='Published'>Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Selector */}
        <div className='space-y-1.5'>
          <Label className="text-xs text-muted-foreground">Difficulty</Label>
          <Select 
            value={filters.difficulty || 'all'} 
            onValueChange={(val: string) => setFilters((prev) => ({ ...prev, difficulty: val === 'all' ? undefined : val }))}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value='Easy'>Easy</SelectItem>
              <SelectItem value='Medium'>Medium</SelectItem>
              <SelectItem value='Hard'>Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
