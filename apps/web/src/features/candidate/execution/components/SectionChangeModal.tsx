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
import { useMemo, useState } from 'react';
import { Lock, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(true);
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
        } else {
          cancelSectionChange();
        }
      } catch (err) {
        console.error('Failed to advance section via modal:', err);
        cancelSectionChange();
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      confirmSectionChange();
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <AlertDialog open={isOpen} onOpenChange={(open: any) => !open && cancelSectionChange()}>
          <AlertDialogContent className='overflow-hidden p-0 max-w-md bg-white border border-gray-300 rounded-md shadow-2xl text-gray-800 font-sans select-none z-[9999]'>
            <div
              className={`h-2 w-full ${showLockWarning ? 'bg-amber-600' : 'bg-[#26773e]'}`}
            />

            <div className='p-6'>
              <AlertDialogHeader>
                <AlertDialogTitle className='flex items-center gap-3 text-lg font-bold text-gray-900 tracking-tight'>
                  {showLockWarning ? (
                    <div className='flex items-center justify-center size-9 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0'>
                      <Lock className='size-4.5' />
                    </div>
                  ) : (
                    <div className='flex items-center justify-center size-9 rounded-full bg-[#d6eafb] text-[#1c3e66] border border-[#96bae0] shrink-0'>
                      <ArrowRight className='size-4.5' />
                    </div>
                  )}
                  Switch to {targetSectionName}?
                </AlertDialogTitle>

                <AlertDialogDescription asChild>
                  <div className='space-y-4 pt-3 text-sm text-gray-600 font-normal leading-relaxed'>
                    <p>
                      You are about to switch from{' '}
                      <span className='font-bold text-gray-900'>{currentSectionName}</span> to{' '}
                      <span className='font-bold text-gray-900'>{targetSectionName}</span>.
                    </p>

                    {showLockWarning && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='flex items-start gap-3 rounded-sm bg-amber-50 border border-amber-300 text-amber-900 p-3.5 shadow-2xs'
                      >
                        <ShieldAlert className='size-5 text-amber-700 shrink-0 mt-0.5' />
                        <div className='text-xs leading-normal'>
                          <span className='font-bold text-amber-950 block mb-0.5'>
                            Lock Warning:
                          </span>
                          Once you proceed, the{' '}
                          <span className='font-semibold'>{currentSectionName}</span> section will be{' '}
                          <strong>permanently locked</strong>. You will not be able to return to it later.
                        </div>
                      </motion.div>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className='mt-6 pt-4 border-t border-gray-200 flex flex-row items-center justify-end gap-3 sm:gap-3 sm:space-x-0'>
                <AlertDialogCancel
                  onClick={cancelSectionChange}
                  disabled={isLoading}
                  className='bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 font-bold text-xs px-5 py-2.5 h-9 rounded-sm shadow-xs transition-colors m-0 sm:m-0 cursor-pointer shrink-0'
                >
                  Stay here
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={cn(
                    'font-bold text-xs px-6 py-2.5 h-9 rounded-sm shadow-sm transition-colors flex items-center gap-1.5 m-0 sm:m-0 cursor-pointer shrink-0',
                    showLockWarning
                      ? 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-800'
                      : 'bg-[#27783f] hover:bg-[#1f6333] text-white border border-[#195028]'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='size-3.5 animate-spin' />
                      Loading...
                    </>
                  ) : (
                    <>
                      Proceed
                      <ArrowRight className='size-3.5' />
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AnimatePresence>
  );
}
