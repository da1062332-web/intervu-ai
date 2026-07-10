'use client';

import React, { useState, useEffect } from 'react';
import { useSections } from '@/services/exam-sections/hooks';
import { useSectionTopics } from '@/features/topic-section-mapping/api/queries';
import { useConcepts, ConceptMapping } from '@/services/concept-mapping';
import { ConceptTable } from './concept-mapping/ConceptTable';
import { ConceptFormModal } from './concept-mapping/ConceptFormModal';
import { DeactivateConceptDialog } from './concept-mapping/DeactivateConceptDialog';
import { TemplateMappingModal } from './concept-mapping/TemplateMappingModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ChevronRight, Plus } from 'lucide-react';

interface ConceptsAndTemplatesTabProps {
  configId: string;
}

export function ConceptsAndTemplatesTab({ configId }: ConceptsAndTemplatesTabProps) {
  const { data: sections = [], isLoading: isLoadingSections } = useSections(configId);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  
  // Auto-select first section
  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  const { data: topicsData, isLoading: isLoadingTopics } = useSectionTopics(selectedSectionId);
  const topics = Array.isArray(topicsData) ? topicsData : (topicsData as any)?.data || [];
  
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  // Auto-select first topic
  useEffect(() => {
    if (topics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(topics[0].topicId);
    } else if (topics.length === 0) {
      setSelectedTopicId('');
    }
  }, [topics, selectedTopicId]);

  const { data: concepts, isLoading: isLoadingConcepts, refetch: refetchConcepts } = useConcepts(selectedTopicId);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<ConceptMapping | null>(null);

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

  const handleMapTemplates = (concept: ConceptMapping) => {
    setSelectedConcept(concept);
    setIsMappingModalOpen(true);
  };

  if (isLoadingSections) {
    return <Skeleton className="w-full h-64" />;
  }

  if (sections.length === 0) {
    return (
      <EmptyState
        title="No Sections"
        description="You must create sections and assign topics to them before managing concepts."
      />
    );
  }

  return (
    <div className='flex flex-col md:flex-row gap-6 min-h-[500px]'>
      {/* Sections Sidebar */}
      <div className='w-full md:w-48 flex flex-col gap-2 border-r pr-4 shrink-0'>
        <h3 className='font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider'>Sections</h3>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => { setSelectedSectionId(section.id); setSelectedTopicId(''); }}
            className={`flex items-center justify-between p-3 rounded-md text-left transition-colors text-sm ${
              selectedSectionId === section.id
                ? 'bg-primary text-primary-foreground font-medium'
                : 'hover:bg-muted text-foreground'
            }`}
          >
            <span className='truncate'>{section.name}</span>
            {selectedSectionId === section.id && <ChevronRight className='w-4 h-4 shrink-0' />}
          </button>
        ))}
      </div>

      {/* Topics Sidebar */}
      <div className='w-full md:w-56 flex flex-col gap-2 border-r pr-4 shrink-0'>
        <h3 className='font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider'>Topics</h3>
        {isLoadingTopics ? (
          <Skeleton className='w-full h-10' />
        ) : topics.length === 0 ? (
          <p className='text-sm text-muted-foreground italic'>No topics assigned.</p>
        ) : (
          topics.map((topic: any) => (
            <button
              key={topic.topicId}
              onClick={() => setSelectedTopicId(topic.topicId)}
              className={`flex items-center justify-between p-3 rounded-md text-left transition-colors text-sm ${
                selectedTopicId === topic.topicId
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <span className='truncate'>{topic.topicName || topic.topic || topic.name || 'Unnamed'}</span>
              {selectedTopicId === topic.topicId && <ChevronRight className='w-4 h-4 shrink-0' />}
            </button>
          ))
        )}
      </div>

      {/* Concepts Main Area */}
      <div className='flex-1 flex flex-col min-w-0'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='font-semibold text-lg'>Concepts & Templates</h3>
          {selectedTopicId && (
            <Button onClick={handleAddClick} size='sm'>
              <Plus className='w-4 h-4 mr-2' />
              Add Concept
            </Button>
          )}
        </div>

        {!selectedTopicId ? (
          <div className='flex-1 flex items-center justify-center border rounded-md border-dashed bg-muted/10'>
            <p className='text-muted-foreground'>Select a topic to manage its concepts</p>
          </div>
        ) : isLoadingConcepts ? (
          <Skeleton className='w-full h-48' />
        ) : (
          <div className='bg-card border rounded-lg overflow-hidden flex-1'>
            <ConceptTable
              concepts={concepts || []}
              onEdit={handleEditClick}
              onDeactivate={handleDeactivateClick}
              onMapTemplates={handleMapTemplates}
              hideTemplatesButton={false}
            />
          </div>
        )}
      </div>

      <ConceptFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        concept={selectedConcept}
        topicId={selectedTopicId}
      />

      {selectedConcept && (
        <DeactivateConceptDialog
          isOpen={isDeactivateDialogOpen}
          onClose={() => setIsDeactivateDialogOpen(false)}
          topicId={selectedTopicId}
          concept={selectedConcept}
        />
      )}

      {selectedConcept && (
        <TemplateMappingModal
          isOpen={isMappingModalOpen}
          onClose={() => setIsMappingModalOpen(false)}
          concept={selectedConcept}
        />
      )}
    </div>
  );
}
