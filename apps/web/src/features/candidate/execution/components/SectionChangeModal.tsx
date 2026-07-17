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
import { AlertTriangle, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SectionChangeModal() {
  const {
    testInstance,
    currentQuestionIndex,
    pendingSectionChangeTarget,
    confirmSectionChange,
    cancelSectionChange,
    sectionTimingEnabled,
    advanceSectionLocally,
  } = useExecutionStore();

  const isOpen = pendingSectionChangeTarget !== null;

  const { currentSectionName, targetSectionName, isForwardMove } = useMemo(() => {
    let currentName = 'Current Section';
    let targetName = 'Next Section';
    let forward = true;

    if (!testInstance || pendingSectionChangeTarget === null) {
      return {
        currentSectionName: currentName,
        targetSectionName: targetName,
        isForwardMove: true,
      };
    }

    let currentIdx = -1;
    let targetIdx = -1;
    let runningCount = 0;

    for (let i = 0; i < testInstance.sections.length; i++) {
      const section = testInstance.sections[i];
      const sectionEnd = runningCount + section.questions.length;

      if (currentQuestionIndex >= runningCount && currentQuestionIndex < sectionEnd) {
        currentName = section.title;
        currentIdx = i;
      }

      if (pendingSectionChangeTarget >= runningCount && pendingSectionChangeTarget < sectionEnd) {
        targetName = section.title;
        targetIdx = i;
      }

      runningCount = sectionEnd;
    }

    forward = targetIdx > currentIdx;

    return {
      currentSectionName: currentName,
      targetSectionName: targetName,
      isForwardMove: forward,
    };
  }, [testInstance, currentQuestionIndex, pendingSectionChangeTarget]);

  // Warning about locking applies when moving forward with section timing enabled
  const showLockWarning = isForwardMove && sectionTimingEnabled;

  const handleConfirm = async () => {
    if (showLockWarning && testInstance) {
      try {
        // We need to call backend to advance section, since it's locked
        const result = await import('../services/execution.service').then((m) =>
          m.executionService.advanceSection(testInstance.id),
        );

        if (result.nextSectionIndex !== null) {
          const newLockedKeys = testInstance.sections
            .slice(0, result.nextSectionIndex)
            .map((s) => s.sectionKey);

          advanceSectionLocally(result.nextSectionIndex, newLockedKeys, result.serverTime);
        }
      } catch (err) {
        console.error('Failed to advance section via modal:', err);
      }
    } else {
      confirmSectionChange();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <AlertDialog open={isOpen} onOpenChange={(open: any) => !open && cancelSectionChange()}>
          <AlertDialogContent className='overflow-hidden p-0 max-w-md border-0 ring-1 ring-primary/10 shadow-2xl'>
            <div
              className={`h-2 w-full ${showLockWarning ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-r from-blue-500 to-primary'}`}
            />

            <div className='p-6'>
              <AlertDialogHeader>
                <AlertDialogTitle className='flex items-center gap-3 text-xl'>
                  {showLockWarning ? (
                    <div className='flex items-center justify-center size-10 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500'>
                      <Lock className='size-5' />
                    </div>
                  ) : (
                    <div className='flex items-center justify-center size-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500'>
                      <ArrowRight className='size-5' />
                    </div>
                  )}
                  Switch to {targetSectionName}?
                </AlertDialogTitle>

                <AlertDialogDescription className='space-y-4 pt-3 text-base text-slate-600 dark:text-slate-300'>
                  <p>
                    You are about to switch from{' '}
                    <span className='font-semibold text-foreground'>{currentSectionName}</span> to{' '}
                    <span className='font-semibold text-foreground'>{targetSectionName}</span>.
                  </p>

                  {showLockWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 p-4 shadow-sm'
                    >
                      <ShieldAlert className='size-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5' />
                      <div className='text-sm leading-relaxed'>
                        <span className='font-bold text-amber-700 dark:text-amber-400'>
                          Warning:{' '}
                        </span>
                        Once you proceed, the{' '}
                        <span className='font-semibold'>{currentSectionName}</span> section will be{' '}
                        <strong>permanently locked</strong>. You will not be able to return to it
                        later.
                      </div>
                    </motion.div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className='mt-8 flex gap-3 sm:gap-0'>
                <AlertDialogCancel
                  onClick={cancelSectionChange}
                  className='mt-0 border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800'
                >
                  Stay here
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirm}
                  className={`gap-2 text-white shadow-md transition-all ${
                    showLockWarning
                      ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                      : 'bg-primary hover:bg-primary/90 focus:ring-primary'
                  }`}
                >
                  Proceed
                  <ArrowRight className='size-4' />
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AnimatePresence>
  );
}
