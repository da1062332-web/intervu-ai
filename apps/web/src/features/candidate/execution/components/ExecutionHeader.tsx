'use client';

import { useExecutionStore } from '../stores/execution.store';
import { Wifi, WifiOff, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export function ExecutionHeader() {
  const {
    testInstance,
    currentQuestionIndex,
    questions,
    connectionStatus,
    autosaveStatus,
    hasUnsavedChanges,
    ping,
    lastSavedAt,
  } = useExecutionStore();

  if (!testInstance) return null;

  const currentQuestionId = questions[currentQuestionIndex]?.id;
  const currentSection = testInstance.sections.find((s) =>
    s.questions.some((q) => q.id === currentQuestionId),
  );

  const isOffline = connectionStatus === 'OFFLINE';
  const isSyncFailed = autosaveStatus === 'FAILED';

  return (
    <header className='sticky top-0 z-50 w-full bg-[#26773e] border-b border-[#1c5a2e] shadow-sm select-none'>
      <div className='flex items-center justify-between h-14 w-full px-4 md:px-6 gap-3'>
        {/* Left - Assessment Title & Section */}
        <div className='flex items-center gap-3 overflow-hidden min-w-0 flex-1'>
          <h1 className='text-base sm:text-lg lg:text-xl font-bold text-white tracking-wide truncate font-sans'>
            {testInstance.assessmentName || 'Assessment'}
            {currentSection ? ` : ${currentSection.title}` : ''}
          </h1>
        </div>

        {/* Center/Right - Connectivity Status on Green Bar */}
        <div className='flex items-center gap-3 shrink-0'>
          <div className='flex items-center gap-2.5 bg-[#1e6132] border border-[#348b4f] px-3 py-1 rounded-sm text-xs font-semibold text-green-100 shadow-inner'>
            {/* Online Connection Status */}
            <div className='flex items-center gap-1.5 text-white'>
              <Wifi className='size-3.5 text-green-300' />
              <span className='hidden md:inline text-xs'>{isOffline ? 'Offline' : 'Online'}</span>
              {ping !== null && !isOffline && <span className='text-[11px] text-green-200 font-normal'>({ping}ms)</span>}
            </div>

            <span className='text-green-400 opacity-50 select-none'>|</span>

            {/* Autosave Sync Status inside Green Bar */}
            <div className='flex items-center gap-1.5 text-green-100 text-xs'>
              {autosaveStatus === 'SAVING' || hasUnsavedChanges ? (
                <>
                  <RefreshCw className={`size-3.5 ${autosaveStatus === 'SAVING' ? 'animate-spin' : ''} text-green-300`} />
                  <span>{autosaveStatus === 'SAVING' ? 'Syncing...' : 'Sync Pending'}</span>
                </>
              ) : autosaveStatus === 'FAILED' ? (
                <>
                  <AlertCircle className='size-3.5 text-amber-300' />
                  <span>Sync Retrying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className='size-3.5 text-green-300' />
                  <span className='hidden lg:inline'>
                    Synced {lastSavedAt ? `at ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </span>
                  <span className='lg:hidden'>Synced</span>
                </>
              )}
            </div>
          </div>

          {/* Right - Company Logo Emblem */}
          <div className='hidden sm:flex items-center gap-2.5 pl-3 border-l border-[#348b4f]'>
            <div className='w-8 h-8 rounded-sm bg-white text-[#26773e] font-black text-xl flex items-center justify-center shadow-xs border border-green-200'>
              V
            </div>
            <div className='flex flex-col text-white leading-none'>
              <span className='font-extrabold text-sm tracking-wide uppercase font-sans'>InterVu AI</span>
              <span className='text-[9px] font-semibold tracking-wider text-green-100 uppercase mt-0.5'>Skill Sandbox</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
