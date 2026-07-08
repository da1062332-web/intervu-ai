import React, { useState, useMemo, useEffect } from 'react';
import { useConcepts, type ConceptMapping } from '@/services/concept-mapping';
import { useTopics } from '@/services/topics/hooks';
import { ConceptTable } from './ConceptTable';
import { ConceptFormModal } from './ConceptFormModal';
import { DeactivateConceptDialog } from './DeactivateConceptDialog';
import { TemplateMappingModal } from './TemplateMappingModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function ConceptManagementPanel() {
  const { data: topics = [], isLoading: isLoadingTopics, isError: isErrorTopics, refetch: refetchTopics } = useTopics();
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<ConceptMapping | null>(null);

  // Auto-select first topic when topics load
  useEffect(() => {
    if (topics.length > 0 && !selectedTopicId) {
      const firstTopic: any = topics[0];
      setSelectedTopicId(firstTopic.id || firstTopic.topicId || '');
    }
  }, [topics, selectedTopicId]);

  const { data: concepts, isLoading: isLoadingConcepts, isError: isErrorConcepts, refetch: refetchConcepts } = useConcepts(selectedTopicId);

  const filteredConcepts = useMemo(() => {
    if (!concepts) return [];
    if (!searchQuery.trim()) return concepts;

    const query = searchQuery.toLowerCase();
    return concepts.filter(
      (c) =>
        (c.name || c.conceptName || '').toLowerCase().includes(query) ||
        (c.code || c.conceptCode || '').toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query)),
    );
  }, [concepts, searchQuery]);

  const handleAddClick = () => {
    setSelectedConcept(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (concept: ConceptMapping) => {
    setSelectedConcept(concept);
    setIsFormModalOpen(true);
  };

  const handleDeactivateClick = (concept: ConceptMapping) => {
    setSelectedConcept(concept);
    setIsDeactivateDialogOpen(true);
  };

  const handleMapTemplatesClick = (concept: ConceptMapping) => {
    setSelectedConcept(concept);
    setIsMappingModalOpen(true);
  };

  if (isErrorTopics) {
    return (
      <div className='text-center py-12 border rounded-lg bg-red-50/50 dark:bg-red-900/10'>
        <h3 className='text-lg font-medium text-red-600 mb-2'>Unable to load topics</h3>
        <p className='text-muted-foreground mb-4'>There was an error fetching topics.</p>
        <Button variant='outline' onClick={() => refetchTopics()}>
          <RefreshCw className='mr-2 h-4 w-4' /> Retry
        </Button>
      </div>
    );
  }

  if (isLoadingTopics) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-10 w-full max-w-sm' />
        <Skeleton className='h-[400px] w-full' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between gap-4'>
        <div className='flex-1 flex flex-col sm:flex-row gap-4'>
          <div className='w-full sm:w-64'>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              aria-label='Select Topic'
              disabled={topics.length === 0}
            >
              {topics.length === 0 && <option value=''>No Topics Available</option>}
              {topics.map((topic: any) => (
                <option key={topic.id || topic.topicId} value={topic.id || topic.topicId}>
                  {topic.topicName || topic.name || topic.topic || 'Unnamed Topic'}
                </option>
              ))}
            </select>
          </div>
          <div className='relative w-full sm:w-80'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search concepts...'
              className='pl-8'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedTopicId}
            />
          </div>
        </div>
        <div>
          <Button onClick={handleAddClick} disabled={!selectedTopicId}>
            <Plus className='mr-2 h-4 w-4' />
            Add Concept
          </Button>
        </div>
      </div>

      {!selectedTopicId ? (
        <div className='text-center py-12 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50'>
          <h3 className='text-lg font-medium mb-2'>No Topic Selected</h3>
          <p className='text-muted-foreground'>Please select or create a topic to manage concepts.</p>
        </div>
      ) : isErrorConcepts ? (
        <div className='text-center py-12 border rounded-lg bg-red-50/50 dark:bg-red-900/10'>
          <h3 className='text-lg font-medium text-red-600 mb-2'>Unable to load concepts</h3>
          <p className='text-muted-foreground mb-4'>
            There was an error fetching the concepts for this topic.
          </p>
          <Button variant='outline' onClick={() => refetchConcepts()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Retry
          </Button>
        </div>
      ) : (
        <ConceptTable
          concepts={filteredConcepts}
          isLoading={isLoadingConcepts}
          onEdit={handleEditClick}
          onDeactivate={handleDeactivateClick}
          onMapTemplates={handleMapTemplatesClick}
        />
      )}

      {selectedTopicId && (
        <ConceptFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          topicId={selectedTopicId}
          concept={selectedConcept}
        />
      )}

      {selectedTopicId && (
        <DeactivateConceptDialog
          isOpen={isDeactivateDialogOpen}
          onClose={() => setIsDeactivateDialogOpen(false)}
          topicId={selectedTopicId}
          concept={selectedConcept}
        />
      )}

      {selectedTopicId && (
        <TemplateMappingModal
          isOpen={isMappingModalOpen}
          onClose={() => setIsMappingModalOpen(false)}
          concept={selectedConcept}
        />
      )}
    </div>
  );
}
