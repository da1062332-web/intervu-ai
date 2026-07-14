'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useExecutionStore } from '../stores/execution.store';
import { useMemo } from 'react';

export function SectionChangeModal() {
  const {
    testInstance,
    currentQuestionIndex,
    pendingSectionChangeTarget,
    confirmSectionChange,
    cancelSectionChange,
  } = useExecutionStore();

  const isOpen = pendingSectionChangeTarget !== null;

  // Determine section names for the prompt
  const { currentSectionName, targetSectionName } = useMemo(() => {
    let currentName = 'Current Section';
    let targetName = 'Next Section';

    if (!testInstance || pendingSectionChangeTarget === null) {
      return { currentSectionName: currentName, targetSectionName: targetName };
    }

    let runningCount = 0;
    for (const section of testInstance.sections) {
      const sectionEnd = runningCount + section.questions.length;

      if (currentQuestionIndex >= runningCount && currentQuestionIndex < sectionEnd) {
        currentName = section.title;
      }

      if (pendingSectionChangeTarget >= runningCount && pendingSectionChangeTarget < sectionEnd) {
        targetName = section.title;
      }

      runningCount = sectionEnd;
    }

    return { currentSectionName: currentName, targetSectionName: targetName };
  }, [testInstance, currentQuestionIndex, pendingSectionChangeTarget]);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open: any) => !open && cancelSectionChange()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change Section?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to switch from <strong>{currentSectionName}</strong> to{' '}
            <strong>{targetSectionName}</strong>. Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelSectionChange}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmSectionChange}
            className='bg-primary text-primary-foreground hover:bg-primary/90'
          >
            Proceed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
