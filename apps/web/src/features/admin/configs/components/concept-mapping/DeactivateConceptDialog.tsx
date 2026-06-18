import React from 'react';
import { useDeactivateConcept, type ConceptMapping } from '@/services/concept-mapping';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface DeactivateConceptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  concept: ConceptMapping | null;
}

export function DeactivateConceptDialog({
  isOpen,
  onClose,
  topicId,
  concept,
}: DeactivateConceptDialogProps) {
  const { mutateAsync: deactivateConcept, isPending } = useDeactivateConcept(topicId);

  const handleDeactivate = async () => {
    if (!concept) return;
    try {
      await deactivateConcept(concept.id);
      onClose();
    } catch {
      // Error handling is in the hook
    }
  };

  if (!concept) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Deactivate Concept?</h3>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to deactivate <span className="font-semibold">{concept.conceptName}</span>? 
            Inactive concepts will not be used for generation.
          </p>
        </div>

        <div className="flex w-full justify-end space-x-2 pt-4 mt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeactivate} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Deactivate
          </Button>
        </div>
      </div>
    </Modal>
  );
}
