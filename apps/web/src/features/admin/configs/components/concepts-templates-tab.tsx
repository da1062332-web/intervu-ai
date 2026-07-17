'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSections } from '@/services/exam-sections/hooks';
import { useSectionTopics } from '@/features/topic-section-mapping/api/queries';
import { useConcepts, ConceptMapping } from '@/services/concept-mapping';
import { ConceptTable } from './concept-mapping/ConceptTable';
import { DeactivateConceptDialog } from './concept-mapping/DeactivateConceptDialog';
import { TemplateMappingModal } from './concept-mapping/TemplateMappingModal';
import { ConceptManualQuestionsModal } from './concept-mapping/ConceptManualQuestionsModal';
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
  const [isManualQuestionsModalOpen, setIsManualQuestionsModalOpen] = useState(false);
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

  const handleViewManualQuestions = (concept: ConceptMapping) => {
    setSelectedConcept(concept);
    setIsManualQuestionsModalOpen(true);
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
      <div className='flex items-start justify-between'>
        <h3 className='text-2xl font-semibold tracking-tight'>Concepts & Content</h3>
      </div>
      <p className='text-muted-foreground'>
        Select a topic to manage its concepts and map content (templates and manual questions).
      </p>

      <div className='flex flex-col border rounded-xl bg-card shadow-sm overflow-hidden min-h-[500px]'>
        {/* Concepts Main Area */}
        <div className='flex-1 p-6 flex flex-col min-w-0 bg-card'>
          <div className='flex flex-wrap items-center justify-between mb-6 gap-4 border-b pb-4'>
            <h3 className='font-semibold text-lg whitespace-nowrap'>Mapped Concepts</h3>
            
            <div className="flex items-center gap-4 flex-wrap justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium">Section:</span>
                <select
                  value={selectedSectionId}
                  onChange={(e) => { setSelectedSectionId(e.target.value); setSelectedTopicId(''); }}
                  className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium">Topic:</span>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={isLoadingTopics || topics.length === 0}
                >
                  {topics.length === 0 && <option value="">No topics available</option>}
                  {topics.map((topic: any) => (
                    <option key={topic.topicId} value={topic.topicId}>
                      {topic.topicName || topic.topic || topic.name || 'Unnamed'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTopicId && (
                <Button onClick={handleManageConcepts} size='sm' variant='outline' className='shadow-sm'>
                  <ExternalLink className='w-4 h-4 mr-2' />
                  Manage Concepts
                </Button>
              )}
            </div>
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
                onViewManualQuestions={handleViewManualQuestions}
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

      {selectedConcept && (
        <ConceptManualQuestionsModal
          isOpen={isManualQuestionsModalOpen}
          onClose={() => setIsManualQuestionsModalOpen(false)}
          concept={selectedConcept}
        />
      )}
    </div>
  );
}
