'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useExecutionStore } from '../stores/execution.store';
import { CheckCircle2, LayoutDashboard, Clock, FileText, CheckSquare } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

interface ThankYouModalProps {
  isOpen: boolean;
}

export function ThankYouModal({ isOpen }: ThankYouModalProps) {
  const router = useRouter();
  const { testInstance, questions, answers } = useExecutionStore();

  const total = questions.length;
  let answered = 0;

  Object.values(answers).forEach((ans) => {
    if (
      ans.selectedOptionId ||
      (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
      ans.textResponse
    ) {
      answered++;
    }
  });

  const handleNavigateDashboard = () => {
    router.push('/candidate/dashboard');
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <div className='p-3 sm:p-5 text-slate-800 font-sans select-none text-center'>
        {/* Animated Check Icon */}
        <div className='mx-auto w-16 h-16 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mb-4 shadow-sm animate-in zoom-in-95 duration-300'>
          <CheckCircle2 className='w-10 h-10 text-emerald-600' />
        </div>

        <h2 className='text-2xl font-bold text-slate-900 tracking-tight'>
          Thank You!
        </h2>
        <p className='text-sm font-semibold text-emerald-700 mt-1'>
          Assessment Submitted Successfully
        </p>

        <p className='text-xs text-slate-600 mt-3 max-w-md mx-auto leading-relaxed'>
          Your assessment responses have been recorded successfully. Thank you for completing the test.
          Your evaluation is being generated in the background and your results will be accessible on your dashboard.
        </p>

        {/* Assessment Summary Box */}
        {testInstance && (
          <div className='mt-5 p-4 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs space-y-2.5 shadow-2xs'>
            <div className='flex items-center justify-between font-medium text-slate-800 border-b border-slate-200 pb-2.5'>
              <span className='flex items-center gap-1.5 text-slate-800 font-semibold truncate max-w-[220px]' title={testInstance.assessmentName || 'Assessment'}>
                <FileText className='w-4 h-4 text-emerald-600 shrink-0' />
                {testInstance.assessmentName || 'Assessment'}
              </span>
              <span className='px-2.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold rounded-full shrink-0'>
                Submitted
              </span>
            </div>

            <div className='grid grid-cols-2 gap-3 pt-1 text-slate-600'>
              <div className='flex items-center gap-2'>
                <CheckSquare className='w-3.5 h-3.5 text-slate-400 shrink-0' />
                <span>Questions Attempted: <strong>{answered} / {total}</strong></span>
              </div>
              <div className='flex items-center gap-2'>
                <Clock className='w-3.5 h-3.5 text-slate-400 shrink-0' />
                <span>Submitted: <strong>Just now</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className='mt-6 pt-2 flex items-center justify-center'>
          <button
            type='button'
            onClick={handleNavigateDashboard}
            className='w-full sm:w-auto bg-[#27783f] hover:bg-[#1f6333] active:bg-[#195028] text-white border border-[#195028] font-bold text-xs px-8 py-3 rounded-md shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2'
          >
            <LayoutDashboard className='w-4 h-4' />
            Go to Dashboard
          </button>
        </div>
      </div>
    </Modal>
  );
}
