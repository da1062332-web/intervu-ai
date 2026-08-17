'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  HardDrive,
  Code2,
  Terminal,
  Check,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { apiClient } from '@/services/api/client';
import { useExecutionStore } from '../stores/execution.store';

// Dynamically import Monaco Editor to ensure SSR safety
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className='flex items-center justify-center h-full bg-slate-950 text-slate-400 font-mono text-sm'>
      <Loader2 className='w-5 h-5 animate-spin mr-2 text-indigo-400' />
      Loading Code Editor...
    </div>
  ),
});

export interface PublicTestResult {
  testIndex: number;
  status: 'PASSED' | 'FAILED' | 'TIME_LIMIT_EXCEEDED' | 'COMPILATION_ERROR' | 'ERROR';
  input: any;
  expectedOutput: any;
  actualOutput: string | null;
  runtimeSeconds: number | null;
  memoryKb: number | null;
  error: string | null;
}

export interface RunCodeResponse {
  success: boolean;
  questionId: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  results: PublicTestResult[];
}

export interface SubmitCodeResponse {
  success: boolean;
  submissionId: string;
  questionId?: string;
  status: string;
  verdict: string;
  score: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
    categories: Record<string, { total: number; passed: number; failed: number }>;
  };
  executionTime?: number;
  memory?: number;
  errorMessage?: string | null;
}

export interface EmbeddedCompilerProps {
  questionId?: string;
  testInstanceId?: string;
  onChange?: (data: any) => void;
  initialCode?: string;
  initialLanguage?: string;
}

const SUPPORTED_LANGUAGES = [
  { id: 'java', label: 'Java (OpenJDK 13)', monacoLang: 'java' },
  { id: 'python', label: 'Python 3 (3.8.1)', monacoLang: 'python' },
  { id: 'cpp', label: 'C++ (GCC 9.2.0)', monacoLang: 'cpp' },
];

const DEFAULT_STARTER_CODE: Record<string, string> = {
  java: `public class Main {\n    public static void main(String[] args) {\n        // Write your Java solution here\n    }\n}\n`,
  python: `# Write your Python solution here\ndef solution():\n    pass\n\nif __name__ == '__main__':\n    solution()\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ solution here\n    return 0;\n}\n`,
};

export function EmbeddedCompiler({
  questionId: propQuestionId,
  testInstanceId: propTestInstanceId,
  onChange,
  initialCode,
  initialLanguage = 'java',
}: EmbeddedCompilerProps) {
  const { currentQuestion, testInstance } = useExecutionStore();

  const activeQuestionId = propQuestionId || currentQuestion?.id || '';
  const activeTestInstanceId = propTestInstanceId || testInstance?.id || '';

  const [language, setLanguage] = useState<string>(initialLanguage);
  const [code, setCode] = useState<string>(
    initialCode || DEFAULT_STARTER_CODE[initialLanguage] || DEFAULT_STARTER_CODE.java,
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runResponse, setRunResponse] = useState<RunCodeResponse | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'results'>('editor');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitResponse, setSubmitResponse] = useState<SubmitCodeResponse | null>(null);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // Clean execution state whenever active question changes so editor starts fresh
  useEffect(() => {
    setRunResponse(null);
    setSubmitResponse(null);
    setExecutionError(null);
    setActiveTab('editor');
  }, [activeQuestionId]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setRunResponse(null);
    setSubmitResponse(null);
    setExecutionError(null);
    const starter = DEFAULT_STARTER_CODE[newLang] || '# Write your solution here\n';
    if (!code || code === DEFAULT_STARTER_CODE[language]) {
      setCode(starter);
      if (onChange) {
        onChange({ code: starter, language: newLang });
      }
    } else if (onChange) {
      onChange({ code, language: newLang });
    }
  };

  const handleCodeChange = (newCode: string | undefined) => {
    const val = newCode || '';
    setCode(val);
    if (onChange) {
      onChange({ code: val, language });
    }
  };

  const handleRunCode = useCallback(async () => {
    if (!activeQuestionId) {
      setExecutionError('No active question ID found.');
      return;
    }

    setIsRunning(true);
    setExecutionError(null);
    setRunResponse(null);
    setSubmitResponse(null);
    setActiveTab('results');

    try {
      const response = await apiClient.request<RunCodeResponse>('/coding/run', {
        method: 'POST',
        body: {
          questionId: activeQuestionId,
          testInstanceId: activeTestInstanceId || undefined,
          code,
          language,
        },
      });
      setRunResponse(response);
    } catch (err: any) {
      const msg = err?.message || err?.error || 'Failed to execute code against Judge0 service.';
      setExecutionError(msg);
      setRunResponse(null);
    } finally {
      setIsRunning(false);
    }
  }, [activeQuestionId, activeTestInstanceId, code, language]);

  const handleFinalSubmit = useCallback(async () => {
    if (!activeQuestionId) {
      setExecutionError('No active question ID found.');
      return;
    }

    setIsSubmitting(true);
    setExecutionError(null);
    setRunResponse(null);
    setSubmitResponse(null);
    setActiveTab('results');

    try {
      const response = await apiClient.request<SubmitCodeResponse>('/coding/submit', {
        method: 'POST',
        body: {
          questionId: activeQuestionId,
          testInstanceId: activeTestInstanceId || undefined,
          code,
          language,
        },
      });

      setSubmitResponse(response);
    } catch (err: any) {
      const msg = err?.message || err?.error || 'Failed to complete full evaluation submission.';
      setExecutionError(msg);
      setSubmitResponse(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeQuestionId, activeTestInstanceId, code, language]);

  const selectedMonacoLang =
    SUPPORTED_LANGUAGES.find((l) => l.id === language)?.monacoLang || 'python';

  return (
    <div
      title='Code Compiler'
      className={`flex flex-col h-full w-full rounded-xl overflow-hidden border shadow-xl font-sans transition-colors duration-200 ${
        themeMode === 'light'
          ? 'bg-slate-50 border-slate-200 text-slate-900'
          : 'bg-slate-950 border-slate-800 text-slate-100 shadow-2xl'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 border-b shrink-0 select-none transition-colors duration-200 ${
          themeMode === 'light'
            ? 'bg-white border-slate-200'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className='flex items-center space-x-3'>
          <div
            className={`flex items-center space-x-2 font-semibold text-sm ${
              themeMode === 'light' ? 'text-indigo-600' : 'text-indigo-400'
            }`}
          >
            <Code2 className='w-4 h-4' />
            <span>IntervuAI Compiler</span>
          </div>

          {/* Language Selector */}
          <div className='relative'>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className={`text-xs font-mono border rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors ${
                themeMode === 'light'
                  ? 'bg-slate-50 text-slate-800 border-slate-300 hover:border-slate-400'
                  : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
            <ChevronDown className='w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none' />
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className='flex items-center space-x-3'>
          {/* Theme Mode Toggle Button */}
          <button
            onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
            title={themeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              themeMode === 'light'
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {themeMode === 'light' ? (
              <>
                <Sun className='w-4 h-4 text-amber-500 fill-amber-500' />
                <span className='hidden sm:inline text-[11px]'>Light</span>
              </>
            ) : (
              <>
                <Moon className='w-4 h-4 text-indigo-400 fill-indigo-400' />
                <span className='hidden sm:inline text-[11px]'>Dark</span>
              </>
            )}
          </button>

          <div
            className={`flex p-1 rounded-lg border text-xs font-medium ${
              themeMode === 'light'
                ? 'bg-slate-100 border-slate-200'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'editor'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : themeMode === 'light'
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center space-x-1.5 ${
                activeTab === 'results'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : themeMode === 'light'
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className='w-3.5 h-3.5' />
              <span>Results</span>
              {runResponse && (
                <span className='ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/80 text-white font-mono'>
                  {runResponse.summary.passed}/{runResponse.summary.total}
                </span>
              )}
              {submitResponse && (
                <span className='ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-900/80 text-indigo-200 font-mono font-bold'>
                  {submitResponse.score}%
                </span>
              )}
            </button>
          </div>

          {/* Run Code Button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className='flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
          >
            {isRunning ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className='w-4 h-4 fill-white' />
                <span>Run Code</span>
              </>
            )}
          </button>

          {/* Submit (Full Evaluation) Button */}
          <button
            onClick={handleFinalSubmit}
            disabled={isRunning || isSubmitting}
            className='flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className='w-4 h-4 text-white' />
                <span>Submit Solution</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div
        className={`flex-1 relative min-h-[400px] overflow-hidden ${
          themeMode === 'light' ? 'bg-white' : 'bg-slate-950'
        }`}
      >
        {activeTab === 'editor' ? (
          <div className='w-full h-full'>
            <MonacoEditor
              height='100%'
              language={selectedMonacoLang}
              value={code}
              onChange={handleCodeChange}
              theme={themeMode === 'light' ? 'vs' : 'vs-dark'}
              options={{
                fontSize: 14,
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                fontFamily: 'Fira Code, Menlo, Monaco, Consolas, monospace',
                padding: { top: 12, bottom: 12 },
                contextmenu: true,
                copyWithSyntaxHighlighting: true,
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  alwaysConsumeMouseWheel: false,
                  handleMouseWheel: true,
                },
                smoothScrolling: true,
                mouseWheelScrollSensitivity: 1,
              }}
            />
          </div>
        ) : (
          /* Results Panel */
          <div
            className={`w-full h-full overflow-y-auto p-4 space-y-4 custom-scrollbar ${
              themeMode === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-100'
            }`}
          >
            {isRunning && (
              <div className='flex flex-col items-center justify-center py-16 space-y-3 text-slate-400'>
                <Loader2 className='w-8 h-8 animate-spin text-indigo-500' />
                <p className='text-sm font-medium animate-pulse'>
                  Submitting code to Judge0 execution engine...
                </p>
              </div>
            )}

            {isSubmitting && (
              <div className='flex flex-col items-center justify-center py-16 space-y-3 text-slate-400'>
                <Loader2 className='w-8 h-8 animate-spin text-indigo-500' />
                <p className='text-sm font-medium animate-pulse'>
                  Executing Full Evaluation across Public, Hidden, Boundary &amp; Stress test suites...
                </p>
              </div>
            )}

            {!isRunning && !isSubmitting && executionError && (
              <div className='p-4 bg-red-950/50 border border-red-800/80 rounded-xl space-y-2 text-red-200'>
                <div className='flex items-center space-x-2 font-semibold text-red-400 text-sm'>
                  <XCircle className='w-5 h-5 text-red-400' />
                  <span>Execution Failure</span>
                </div>
                <p className='text-xs font-mono whitespace-pre-wrap text-red-300'>
                  {executionError}
                </p>
              </div>
            )}

            {!isRunning && !isSubmitting && !executionError && !runResponse && !submitResponse && (
              <div className='flex flex-col items-center justify-center py-16 space-y-2 text-slate-500 text-center'>
                <Terminal className='w-10 h-10 stroke-[1.5]' />
                <p className='text-sm font-medium text-slate-400'>No test results yet</p>
                <p className='text-xs max-w-sm'>
                  Click <strong className='text-emerald-400'>Run Code</strong> for public tests, or{' '}
                  <strong className='text-indigo-400'>Submit Solution</strong> for full evaluation.
                </p>
              </div>
            )}

            {!isRunning && !isSubmitting && submitResponse && (
              <div className='space-y-4 font-sans'>
                {/* Verdict & Score Banner */}
                <div className='flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg'>
                  <div className='flex items-center space-x-3'>
                    <div
                      className={`p-2.5 rounded-lg border ${
                        submitResponse.verdict === 'ACCEPTED'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      {submitResponse.verdict === 'ACCEPTED' ? (
                        <CheckCircle2 className='w-7 h-7' />
                      ) : (
                        <XCircle className='w-7 h-7' />
                      )}
                    </div>
                    <div>
                      <div className='flex items-center space-x-2'>
                        <h3 className='text-base font-bold text-slate-100'>Final Submission Evaluation</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase font-mono border ${
                            submitResponse.verdict === 'ACCEPTED'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-red-950 text-red-400 border-red-800'
                          }`}
                        >
                          {submitResponse.verdict.replace('_', ' ')}
                        </span>
                      </div>
                      <p className='text-xs text-slate-400 mt-1'>
                        Submission ID: <code className='font-mono text-slate-300'>{submitResponse.submissionId}</code> • Time: {submitResponse.executionTime}s
                      </p>
                    </div>
                  </div>

                  {/* Score Badge */}
                  <div className='text-right'>
                    <span className='text-2xl font-black font-mono text-indigo-400'>
                      {submitResponse.score}%
                    </span>
                    <span className='block text-[10px] text-slate-400 uppercase font-semibold tracking-wider'>
                      Overall Score
                    </span>
                  </div>
                </div>

                {/* Category Breakdown Cards */}
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                  <div className='p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1'>
                    <span className='text-[10px] text-slate-400 font-bold uppercase tracking-wider block'>
                      Public Tests
                    </span>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-bold text-slate-200'>
                        {submitResponse.summary.categories.public.passed}/{submitResponse.summary.categories.public.total}
                      </span>
                      <span className={`text-xs font-bold ${submitResponse.summary.categories.public.passed === submitResponse.summary.categories.public.total ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {submitResponse.summary.categories.public.passed === submitResponse.summary.categories.public.total ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </div>
                  </div>

                  <div className='p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1'>
                    <span className='text-[10px] text-slate-400 font-bold uppercase tracking-wider block'>
                      Hidden Tests
                    </span>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-bold text-slate-200'>
                        {submitResponse.summary.categories.hidden.passed}/{submitResponse.summary.categories.hidden.total}
                      </span>
                      <span className={`text-xs font-bold ${submitResponse.summary.categories.hidden.passed === submitResponse.summary.categories.hidden.total ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {submitResponse.summary.categories.hidden.passed === submitResponse.summary.categories.hidden.total ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </div>
                  </div>

                  <div className='p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1'>
                    <span className='text-[10px] text-slate-400 font-bold uppercase tracking-wider block'>
                      Boundary Tests
                    </span>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-bold text-slate-200'>
                        {submitResponse.summary.categories.boundary.passed}/{submitResponse.summary.categories.boundary.total}
                      </span>
                      <span className={`text-xs font-bold ${submitResponse.summary.categories.boundary.passed === submitResponse.summary.categories.boundary.total ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {submitResponse.summary.categories.boundary.passed === submitResponse.summary.categories.boundary.total ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </div>
                  </div>

                  <div className='p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1'>
                    <span className='text-[10px] text-slate-400 font-bold uppercase tracking-wider block'>
                      Stress Tests
                    </span>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-bold text-slate-200'>
                        {submitResponse.summary.categories.stress.passed}/{submitResponse.summary.categories.stress.total}
                      </span>
                      <span className={`text-xs font-bold ${submitResponse.summary.categories.stress.passed === submitResponse.summary.categories.stress.total ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {submitResponse.summary.categories.stress.passed === submitResponse.summary.categories.stress.total ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isRunning && runResponse && (
              <div className='space-y-4'>
                {/* Summary Header Card */}
                <div
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    themeMode === 'light'
                      ? 'bg-white border-slate-200 shadow-xs text-slate-900'
                      : 'bg-slate-900/90 border-slate-800 text-slate-100'
                  }`}
                >
                  <div className='flex items-center space-x-3'>
                    {runResponse.summary.passed === runResponse.summary.total ? (
                      <div className='p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-500'>
                        <CheckCircle2 className='w-6 h-6' />
                      </div>
                    ) : (
                      <div className='p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500'>
                        <AlertTriangle className='w-6 h-6' />
                      </div>
                    )}
                    <div>
                      <h4 className='text-sm font-bold'>
                        Public Test Cases Evaluation
                      </h4>
                      <p className='text-xs text-muted-foreground'>
                        {runResponse.summary.passed} of {runResponse.summary.total} test cases
                        passed
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        runResponse.summary.passed === runResponse.summary.total
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {runResponse.summary.passed === runResponse.summary.total
                        ? 'PASSED'
                        : 'PARTIAL / FAILED'}
                    </span>
                  </div>
                </div>

                {/* Animated Per-Test Results List */}
                <div className='space-y-3'>
                  <AnimatePresence>
                    {runResponse.results.map((res, index) => (
                      <motion.div
                        key={`test-res-${index}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.08 }}
                        className={`p-4 rounded-xl border transition-all ${
                          themeMode === 'light'
                            ? res.status === 'PASSED'
                              ? 'bg-white border-emerald-200 text-slate-900 shadow-xs'
                              : res.status === 'COMPILATION_ERROR'
                                ? 'bg-amber-50/60 border-amber-200 text-slate-900 shadow-xs'
                                : 'bg-red-50/60 border-red-200 text-slate-900 shadow-xs'
                            : res.status === 'PASSED'
                              ? 'bg-slate-900/60 border-emerald-900/40 hover:border-emerald-700/50'
                              : res.status === 'COMPILATION_ERROR'
                                ? 'bg-slate-900/60 border-amber-900/50 hover:border-amber-700/50'
                                : 'bg-slate-900/60 border-red-900/40 hover:border-red-700/50'
                        }`}
                      >
                        {/* Test Header */}
                        <div
                          className={`flex items-center justify-between mb-3 pb-2 border-b ${
                            themeMode === 'light' ? 'border-slate-200' : 'border-slate-800/80'
                          }`}
                        >
                          <div className='flex items-center space-x-2.5'>
                            {res.status === 'PASSED' ? (
                              <CheckCircle2 className='w-4 h-4 text-emerald-500' />
                            ) : res.status === 'COMPILATION_ERROR' ? (
                              <AlertTriangle className='w-4 h-4 text-amber-500' />
                            ) : (
                              <XCircle className='w-4 h-4 text-red-500' />
                            )}
                            <span className='font-semibold text-sm'>
                              Test Case #{res.testIndex}
                            </span>
                          </div>

                          <div className='flex items-center space-x-3 text-xs font-mono text-muted-foreground'>
                            {res.runtimeSeconds !== null && (
                              <div className='flex items-center space-x-1'>
                                <Clock className='w-3.5 h-3.5 text-slate-400' />
                                <span>{res.runtimeSeconds.toFixed(3)}s</span>
                              </div>
                            )}
                            {res.memoryKb !== null && (
                              <div className='flex items-center space-x-1'>
                                <HardDrive className='w-3.5 h-3.5 text-slate-400' />
                                <span>{(res.memoryKb / 1024).toFixed(1)} MB</span>
                              </div>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                res.status === 'PASSED'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : res.status === 'COMPILATION_ERROR'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                              }`}
                            >
                              {res.status}
                            </span>
                          </div>
                        </div>

                        {/* Test Details Grid */}
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-3 text-xs'>
                          <div>
                            <span className='text-muted-foreground font-medium block mb-1 uppercase tracking-wider text-[10px]'>
                              Input:
                            </span>
                            <pre
                              className={`p-2.5 rounded-lg border font-mono overflow-x-auto whitespace-pre-wrap max-h-28 custom-scrollbar ${
                                themeMode === 'light'
                                  ? 'bg-slate-100 border-slate-200 text-slate-800'
                                  : 'bg-slate-950 border-slate-800 text-slate-300'
                              }`}
                            >
                              {typeof res.input === 'object'
                                ? JSON.stringify(res.input, null, 2)
                                : String(res.input)}
                            </pre>
                          </div>

                          <div>
                            <span className='text-muted-foreground font-medium block mb-1 uppercase tracking-wider text-[10px]'>
                              Expected Output:
                            </span>
                            <pre
                              className={`p-2.5 rounded-lg border font-mono overflow-x-auto whitespace-pre-wrap max-h-28 custom-scrollbar ${
                                themeMode === 'light'
                                  ? 'bg-slate-100 border-slate-200 text-slate-800'
                                  : 'bg-slate-950 border-slate-800 text-slate-300'
                              }`}
                            >
                              {typeof res.expectedOutput === 'object'
                                ? JSON.stringify(res.expectedOutput, null, 2)
                                : String(res.expectedOutput)}
                            </pre>
                          </div>

                          <div>
                            <span className='text-muted-foreground font-medium block mb-1 uppercase tracking-wider text-[10px]'>
                              Actual Output:
                            </span>
                            <pre
                              className={`p-2.5 rounded-lg border font-mono overflow-x-auto whitespace-pre-wrap max-h-28 custom-scrollbar ${
                                res.status === 'PASSED'
                                  ? themeMode === 'light'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-slate-950 border-slate-800 text-emerald-300'
                                  : themeMode === 'light'
                                    ? 'bg-red-50 border-red-200 text-red-800'
                                    : 'bg-slate-950 border-red-950 text-red-300'
                              }`}
                            >
                              {res.actualOutput !== null && res.actualOutput !== ''
                                ? res.actualOutput
                                : '(no output)'}
                            </pre>
                          </div>
                        </div>

                        {/* Error Log Box */}
                        {res.error && (
                          <div
                            className={`mt-3 p-2.5 rounded-lg border text-xs font-mono space-y-1 ${
                              themeMode === 'light'
                                ? 'bg-red-50 border-red-200 text-red-900'
                                : 'bg-red-950/40 border-red-900/60 text-red-300'
                            }`}
                          >
                            <span className='font-bold text-red-500 block text-[10px] uppercase tracking-wider'>
                              Error Log:
                            </span>
                            <div className='whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar'>
                              {res.error}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
