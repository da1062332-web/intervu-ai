import React, { useState } from 'react';
import { useDeactivateConcept, type ConceptMapping } from '@/services/concept-mapping';
import { Loader2, AlertTriangle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface DeactivateConceptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  concept: ConceptMapping | null;
}

interface ErrorDetails {
  code: string;
  message: string;
  templates?: { id: string; name: string }[];
}

export function DeactivateConceptDialog({
  isOpen,
  onClose,
  topicId,
  concept,
}: DeactivateConceptDialogProps) {
  const { mutateAsync: deactivateConcept, isPending } = useDeactivateConcept(topicId);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);

  const handleDeactivate = async () => {
    if (!concept) return;
    try {
      setErrorDetails(null);
      await deactivateConcept(concept.id);
      onClose();
    } catch (err: any) {
      if (
        err.isApiError &&
        (err.code === 'CONCEPT_LINKED_TO_TEMPLATES' || err.code === 'CONCEPT_LINKED_TO_QUESTIONS')
      ) {
        setErrorDetails({
          code: err.code,
          message: err.message,
          templates: err.raw?.error?.details || [],
        });
      }
    }
  };

  const handleClose = () => {
    setErrorDetails(null);
    onClose();
  };

  if (!concept) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className='max-w-md'>
      <div className='flex flex-col items-center justify-center space-y-4 text-center'>
        {errorDetails ? (
          <>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30'>
              <AlertCircle className='h-6 w-6 text-amber-600 dark:text-amber-500' />
            </div>

            <div className='space-y-2 w-full'>
              <h3 className='text-lg font-medium'>Cannot Deactivate Concept</h3>
              <p className='text-sm text-muted-foreground px-2'>{errorDetails.message}</p>

              {errorDetails.code === 'CONCEPT_LINKED_TO_TEMPLATES' &&
                errorDetails.templates &&
                errorDetails.templates.length > 0 && (
                  <div className='mt-4 w-full'>
                    <p className='text-xs font-semibold text-gray-500 text-left mb-2 uppercase tracking-wider'>
                      Linked Templates:
                    </p>
                    <ul className='text-left bg-gray-50 dark:bg-gray-900/50 border rounded-md p-2 divide-y divide-gray-100 dark:divide-gray-800 text-sm max-h-40 overflow-y-auto w-full'>
                      {errorDetails.templates.map((t) => (
                        <li
                          key={t.id}
                          className='py-1.5 px-2 flex justify-between items-center hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors'
                        >
                          <span className='font-medium text-gray-700 dark:text-gray-300 truncate pr-2'>
                            {t.name}
                          </span>
                          <a
                            href={`/admin/templates/${t.id}`}
                            target='_blank'
                            rel='noreferrer'
                            className='text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center shrink-0'
                          >
                            View Editor <ArrowUpRight className='w-3 h-3 ml-0.5' />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            <div className='flex w-full justify-end pt-4 mt-6 border-t'>
              <Button
                onClick={handleClose}
                className='w-full md:w-auto bg-gray-900 hover:bg-gray-800 text-white'
              >
                Close
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
              <AlertTriangle className='h-6 w-6 text-red-600 dark:text-red-500' />
            </div>

            <div className='space-y-2'>
              <h3 className='text-lg font-medium'>Deactivate Concept?</h3>
              <p className='text-sm text-muted-foreground'>
                Are you sure you want to deactivate{' '}
                <span className='font-semibold'>{concept.name || concept.conceptName}</span>?
                Inactive concepts will not be used for generation.
              </p>
            </div>

            <div className='flex w-full justify-end space-x-2 pt-4 mt-6 border-t'>
              <Button variant='outline' onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button variant='destructive' onClick={handleDeactivate} disabled={isPending}>
                {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Deactivate
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
