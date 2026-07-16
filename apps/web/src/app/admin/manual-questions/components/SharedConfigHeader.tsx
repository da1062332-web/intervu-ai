import React, { useEffect } from 'react';
import { useTopics } from '@/services/topics/hooks';
import { useConcepts } from '@/services/concept-mapping/hooks';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface SharedConfigHeaderProps {
  topicId: string;
  conceptId: string;
  onTopicChange: (id: string) => void;
  onConceptChange: (id: string) => void;
  onSectionResolved?: (id: string) => void;
  disabled?: boolean;
}

export function SharedConfigHeader({
  topicId,
  conceptId,
  onTopicChange,
  onConceptChange,
  onSectionResolved,
  disabled
}: SharedConfigHeaderProps) {
  const { data: topics, isLoading: isLoadingTopics } = useTopics(true);
  const { data: concepts, isLoading: isLoadingConcepts } = useConcepts(topicId, true);

  const conceptsArray = Array.isArray(concepts) 
    ? concepts 
    : (concepts as any)?.data 
      ? (concepts as any).data 
      : (concepts as any)?.items 
        ? (concepts as any).items 
        : [];

  // Auto-select first concept if none is selected and concepts are loaded
  useEffect(() => {
    if (topicId && conceptsArray && conceptsArray.length > 0 && !conceptId) {
      onConceptChange(conceptsArray[0].id);
    }
  }, [topicId, conceptsArray, conceptId, onConceptChange]);

  // Resolve sectionId based on selected concept
  useEffect(() => {
    if (conceptId && conceptsArray && onSectionResolved) {
      const selectedConcept = conceptsArray.find((c: any) => c.id === conceptId);
      if (selectedConcept && selectedConcept.sectionId) {
        onSectionResolved(selectedConcept.sectionId);
      } else {
        // Fallback for types, or let backend fail/handle it
        onSectionResolved('');
      }
    }
  }, [conceptId, conceptsArray, onSectionResolved]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
      <div className="space-y-2">
        <Label htmlFor="topic-select" className="text-base font-semibold">
          Topic <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <select
            id="topic-select"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={topicId}
            onChange={(e) => {
              onTopicChange(e.target.value);
              onConceptChange(''); // reset concept when topic changes
              onSectionResolved?.(''); // reset sectionId
            }}
            disabled={disabled || isLoadingTopics}
          >
            <option value="" disabled>Select a Topic</option>
            {topics?.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name} ({topic.code})
              </option>
            ))}
          </select>
          {isLoadingTopics && (
            <div className="absolute right-3 top-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="concept-select" className="text-base font-semibold">
          Concept <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <select
            id="concept-select"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={conceptId}
            onChange={(e) => onConceptChange(e.target.value)}
            disabled={disabled || !topicId || isLoadingConcepts}
          >
            <option value="" disabled>Select a Concept</option>
            {conceptsArray.map((concept: any) => (
              <option key={concept.id} value={concept.id}>
                {concept.name} ({concept.code})
              </option>
            ))}
          </select>
          {isLoadingConcepts && (
            <div className="absolute right-3 top-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
