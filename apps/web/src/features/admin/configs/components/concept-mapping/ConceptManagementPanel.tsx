import React, { useState, useMemo } from 'react';
import { useConcepts, type ConceptMapping } from '@/services/concept-mapping';
import { ConceptTable } from './ConceptTable';
import { ConceptFormModal } from './ConceptFormModal';
import { DeactivateConceptDialog } from './DeactivateConceptDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw } from 'lucide-react';

// Static topic registry based on generation/topic-registry/software-engineering.json
const TOPICS = [
  { id: 'se-ds-001', name: 'Data Structures' },
  { id: 'se-algo-001', name: 'Algorithms' },
  { id: 'se-oop-001', name: 'OOP' },
  { id: 'se-dbms-001', name: 'DBMS' },
  { id: 'se-os-001', name: 'Operating Systems' },
  { id: 'se-net-001', name: 'Computer Networks' },
  { id: 'se-sd-001', name: 'System Design' },
];

export function ConceptManagementPanel() {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(TOPICS[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<ConceptMapping | null>(null);

  const { data: concepts, isLoading, isError, refetch } = useConcepts(selectedTopicId);

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
            >
              {TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
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
            />
          </div>
        </div>
        <div>
          <Button onClick={handleAddClick}>
            <Plus className='mr-2 h-4 w-4' />
            Add Concept
          </Button>
        </div>
      </div>

      {isError ? (
        <div className='text-center py-12 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50'>
          <h3 className='text-lg font-medium text-red-600 mb-2'>Unable to load concepts</h3>
          <p className='text-muted-foreground mb-4'>
            There was an error fetching the concepts for this topic.
          </p>
          <Button variant='outline' onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Retry
          </Button>
        </div>
      ) : (
        <ConceptTable
          concepts={filteredConcepts}
          isLoading={isLoading}
          onEdit={handleEditClick}
          onDeactivate={handleDeactivateClick}
        />
      )}

      <ConceptFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        topicId={selectedTopicId}
        concept={selectedConcept}
      />

      <DeactivateConceptDialog
        isOpen={isDeactivateDialogOpen}
        onClose={() => setIsDeactivateDialogOpen(false)}
        topicId={selectedTopicId}
        concept={selectedConcept}
      />
    </div>
  );
}
