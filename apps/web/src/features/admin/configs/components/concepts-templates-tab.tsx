'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSections } from '@/services/exam-sections/hooks';
import { useSectionTopics } from '@/features/topic-section-mapping/api/queries';
import { useConcepts, ConceptMapping } from '@/services/concept-mapping';
import { ConceptTable } from './concept-mapping/ConceptTable';
import { DeactivateConceptDialog } from './concept-mapping/DeactivateConceptDialog';
import { TemplateMappingModal } from './concept-mapping/TemplateMappingModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ChevronRight, ExternalLink } from 'lucide-react';

interface ConceptsAndTemplatesTabProps {
  configId: string;
}

export function ConceptsAndTemplatesTab({ configId }: ConceptsAndTemplatesTabProps) {
  const router = useRouter();
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

  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<ConceptMapping | null>(null);

  const handleManageConcepts = () => {
    router.push('/admin/topics');
  };

  const handleEditClick = (concept: ConceptMapping) => {
    router.push('/admin/topics');
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
    <div className='max-w-5xl mx-auto space-y-8 py-4'>
      <div className='space-y-1'>
        <h3 className='text-2xl font-semibold tracking-tight'>Concepts & Templates</h3>
        <p className='text-muted-foreground'>
          Select a topic to manage its concepts and map templates.
        </p>
      </div>

      <div className='flex flex-col md:flex-row border rounded-xl bg-card shadow-sm overflow-hidden min-h-[500px]'>
        {/* Sections Sidebar */}
        <div className='w-full md:w-56 bg-muted/5 border-r p-4 flex flex-col gap-2 shrink-0'>
          <h3 className='font-semibold mb-3 text-xs text-muted-foreground uppercase tracking-wider'>Sections</h3>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => { setSelectedSectionId(section.id); setSelectedTopicId(''); }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${
                selectedSectionId === section.id
                  ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <span className='truncate'>{section.name}</span>
              {selectedSectionId === section.id && <ChevronRight className='w-4 h-4 shrink-0' />}
            </button>
          ))}
        </div>

        {/* Topics Sidebar */}
        <div className='w-full md:w-64 bg-muted/10 border-r p-4 flex flex-col gap-2 shrink-0'>
          <h3 className='font-semibold mb-3 text-xs text-muted-foreground uppercase tracking-wider'>Topics</h3>
          {isLoadingTopics ? (
            <div className='space-y-2'>
              <Skeleton className='w-full h-10 rounded-lg' />
              <Skeleton className='w-full h-10 rounded-lg' />
            </div>
          ) : topics.length === 0 ? (
            <p className='text-sm text-muted-foreground italic text-center py-4'>No topics assigned.</p>
          ) : (
            topics.map((topic: any) => (
              <button
                key={topic.topicId}
                onClick={() => setSelectedTopicId(topic.topicId)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${
                  selectedTopicId === topic.topicId
                    ? 'bg-secondary text-secondary-foreground font-medium shadow-sm'
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
        <div className='flex-1 p-6 flex flex-col min-w-0 bg-card'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='font-semibold text-lg'>Mapped Concepts</h3>
            {selectedTopicId && (
              <Button onClick={handleManageConcepts} size='sm' variant='outline' className='shadow-sm'>
                <ExternalLink className='w-4 h-4 mr-2' />
                Manage Concepts
              </Button>
            )}
          </div>

          {!selectedTopicId ? (
            <div className='flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/5 p-8 text-center'>
              <p className='text-muted-foreground font-medium'>Select a topic</p>
              <p className='text-sm text-muted-foreground mt-1'>Choose a topic from the sidebar to view its concepts.</p>
            </div>
          ) : isLoadingConcepts ? (
            <div className='space-y-3'>
              <Skeleton className='w-full h-16 rounded-lg' />
              <Skeleton className='w-full h-16 rounded-lg' />
            </div>
          ) : (
            <div className='bg-background border rounded-lg overflow-hidden flex-1 shadow-sm'>
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
      </div>

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
