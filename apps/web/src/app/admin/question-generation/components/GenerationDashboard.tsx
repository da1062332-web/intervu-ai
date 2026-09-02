'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CustomFormCard } from '@/components/ui/custom-form-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useGenerateQuestion, useGenerateBatch } from '@/services/question-generation/hooks';
import { useTopics } from '@/services/topics/hooks';
import { useConcepts } from '@/services/concept-mapping/hooks';
import { useTemplatesByConcept } from '@/services/templates/hooks';
import { useCodingPatterns } from '@/services/coding-patterns/hooks';
import { useApproveQuestion, useRejectQuestion, useRegenerateQuestion } from '@/services/question-pool/hooks';
import { toast } from 'sonner';
import { ConfigurationSelectors } from './ConfigurationSelectors';
import { BatchProgressWidget } from './BatchProgressWidget';

import { useSearchParams } from 'next/navigation';

export function GenerationDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoTopicId = searchParams?.get('topicId');

  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedConcept, setSelectedConcept] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generationType, setGenerationType] = useState<'single' | 'batch'>('single');
  const [batchCount, setBatchCount] = useState(10);

  // Progress states
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [generatedQuestion, setGeneratedQuestion] = useState<any>(null);
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | 'regenerate' | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Review Actions
  const { mutateAsync: approve } = useApproveQuestion();
  const { mutateAsync: reject } = useRejectQuestion();
  const { mutateAsync: regenerate } = useRegenerateQuestion();

  const handleApprove = async () => {
    if (!generatedQuestion) return;
    setProcessingAction('approve');
    try {
      await approve(generatedQuestion.id);
      toast.success('Question approved and added to bank!');
      setGeneratedQuestion(null);
    } catch (err: any) {
      // toast.error(err.message || 'Failed to approve question');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async () => {
    if (!generatedQuestion) return;
    setProcessingAction('reject');
    try {
      await reject(generatedQuestion.id);
      toast.success('Question rejected');
      setGeneratedQuestion(null);
    } catch (err: any) {
      // handled by global api error
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRegenerate = async () => {
    if (!generatedQuestion) return;
    setProcessingAction('regenerate');
    try {
      const res: any = await regenerate(generatedQuestion.id);
      toast.success('Question regenerated successfully');
      setGeneratedQuestion(res?.question || res);
    } catch (err: any) {
      // handled by global api error
    } finally {
      setProcessingAction(null);
    }
  };

  // External queries
  const { data: topics = [] } = useTopics();
  const { data: conceptsData } = useConcepts(selectedTopic);
  const concepts = conceptsData || [];
  const selectedConceptItem = concepts.find((concept) => concept.id === selectedConcept);
  const selectedConceptKey = selectedConceptItem?.code || selectedConceptItem?.conceptCode || '';
  const { data: templatesData } = useTemplatesByConcept(selectedConceptKey, 1, 100);
  const templates = templatesData?.items || [];

  const { data: patternsData } = useCodingPatterns(1, 100);
  const allPatterns = patternsData?.items || [];
  const matchingPatterns = allPatterns.filter((p: any) => {
    const metaConcept = String((p.metadata as any)?.conceptKey || '').trim().toLowerCase();
    const metaTopic = String((p.metadata as any)?.topicId || '').trim();
    const slug = (p.slug || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    const cKey = selectedConceptKey.trim().toLowerCase();
    const cName = (selectedConceptItem?.name || selectedConceptItem?.conceptName || '').trim().toLowerCase();

    return (
      (metaConcept && (metaConcept === cKey || metaConcept === cName)) ||
      (metaTopic && metaTopic === selectedTopic) ||
      (cKey && (slug.includes(cKey) || cKey.includes(slug))) ||
      (cName && (title.includes(cName) || cName.includes(title)))
    );
  });

  const combinedRaw = [
    ...templates.map((t: any) => ({
      id: t.id,
      name: t.name,
      type: 'template' as const,
    })),
    ...matchingPatterns.map((p: any) => ({
      id: p.id,
      name: p.title || p.name,
      type: 'coding_pattern' as const,
    })),
  ];

  // Deduplicate by ID — if a coding_pattern and a template share the same ID
  // (due to the ghost-upsert in the backend), keep only the coding_pattern entry.
  const seenIds = new Set<string>();
  const combinedItems = combinedRaw
    .sort((a, b) => (a.type === 'coding_pattern' ? -1 : 1)) // coding_patterns first so they win dedup
    .filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

  useEffect(() => {
    if (autoTopicId && topics.length > 0) {
      setSelectedTopic(autoTopicId);
    }
  }, [autoTopicId, topics]);

  useEffect(() => {
    setSelectedConcept('');
    setSelectedTemplate('');
  }, [selectedTopic]);

  useEffect(() => {
    setSelectedTemplate('');
  }, [selectedConcept]);

  const { mutateAsync: generateSingle } = useGenerateQuestion();
  const { mutateAsync: generateBatch } = useGenerateBatch();

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    setStatus('generating');
    setProgress(10); // Initial progress
    setGeneratedQuestion(null);

    try {
      const payload = {
        topicId: selectedTopic,
        conceptId: selectedConcept,
      };

      if (generationType === 'single') {
        setProgress(50);
        const res = await generateSingle({ templateId: selectedTemplate, context: payload });
        setProgress(100);
        setStatus('success');
        setGeneratedQuestion(res?.question ?? res?.questions?.[0]);
      } else {
        // Mock a progress bar for batch
        const interval = setInterval(() => {
          setProgress((p) => Math.min(p + 15, 90));
        }, 500);

        await generateBatch({ templateId: selectedTemplate, count: batchCount, context: payload });

        clearInterval(interval);
        setProgress(100);
        setStatus('success');
      }
    } catch (err) {
      // The error is already toasted by the global ApiClient.
      // We reset the status to idle to hide the progress widget and avoid a red error box.
      setStatus('idle');
      setProgress(0);
    }
  };

  const isFormValid =
    selectedTemplate && (generationType === 'single' || (batchCount > 0 && batchCount <= 100));

  useEffect(() => {
    if (generatedQuestion && previewRef.current) {
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [generatedQuestion]);

  return (
    <div className='space-y-6'>
      <ConfigurationSelectors
        selectedTopic={selectedTopic}
        setSelectedTopic={setSelectedTopic}
        selectedConcept={selectedConcept}
        setSelectedConcept={setSelectedConcept}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        topics={topics}
        concepts={concepts}
        templates={combinedItems}
      />

      <CustomFormCard
        title='Generation Settings'
        description='Choose how you want to generate questions from the selected template.'
        footer={
          <div className='flex justify-end gap-2 w-full'>
            <Button
              onClick={handleGenerate}
              disabled={!isFormValid || status === 'generating'}
              className='w-32'
            >
              {status === 'generating' ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        }
      >
        <div className='space-y-6'>
          <div className='space-y-4'>
            <Label className='text-base'>Generation Type</Label>
            <RadioGroup
              value={generationType}
              onValueChange={(val: string) => setGenerationType(val as 'single' | 'batch')}
              className='flex flex-col space-y-2'
            >
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='single' id='single' />
                <Label htmlFor='single' className='font-normal cursor-pointer'>
                  Single Question (Preview & Edit instantly)
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='batch' id='batch' />
                <Label htmlFor='batch' className='font-normal cursor-pointer'>
                  Batch Generation
                </Label>
              </div>
            </RadioGroup>
          </div>

          {generationType === 'batch' && (
            <div className='space-y-2'>
              <Label htmlFor='batchCount'>Number of Questions to Generate (Max 100)</Label>
              <Input
                id='batchCount'
                type='number'
                min={1}
                max={100}
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value) || 0)}
                className='w-[200px]'
              />
            </div>
          )}
        </div>
      </CustomFormCard>

      <BatchProgressWidget
        status={status}
        progress={progress}
        total={generationType === 'batch' ? batchCount : 1}
        successCount={generationType === 'batch' ? batchCount : 1}
      />

      <div ref={previewRef}>
        {generatedQuestion ? (
          <CustomFormCard
          title={
            <div className="flex items-center gap-3">
              <span>Question Preview</span>
              {generatedQuestion.difficulty && (
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                  generatedQuestion.difficulty.toUpperCase() === 'HARD' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30' :
                  generatedQuestion.difficulty.toUpperCase() === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30' :
                  'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30'
                }`}>
                  {generatedQuestion.difficulty}
                </span>
              )}
            </div>
          }
          description='Review your instantly generated question below.'
          footer={
            <div className='flex flex-col sm:flex-row justify-between gap-4 w-full'>
              <div className='flex gap-2 flex-wrap'>
                <Button 
                  variant='destructive' 
                  onClick={handleReject}
                  disabled={processingAction !== null}
                >
                  {processingAction === 'reject' ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button 
                  variant='secondary' 
                  onClick={handleRegenerate}
                  disabled={processingAction !== null}
                >
                  {processingAction === 'regenerate' ? 'Regenerating...' : 'Regenerate'}
                </Button>
                <Button 
                  variant='default' 
                  onClick={handleApprove}
                  disabled={processingAction !== null}
                >
                  {processingAction === 'approve' ? 'Approving...' : 'Approve'}
                </Button>
              </div>
              
              <div className='flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setGeneratedQuestion(null)}>
                  Clear Preview
                </Button>
                <Button variant='outline' asChild>
                  <Link href={`/admin/review?focus=${generatedQuestion.id}`}>
                    Edit in Review Queue
                  </Link>
                </Button>
              </div>
            </div>
          }
        >
          <div className='space-y-6'>
            <div className='space-y-2 flex-grow'>
              <h3 className='font-semibold text-sm text-gray-500 uppercase tracking-wider'>
                Statement
              </h3>
              <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-md border text-sm whitespace-pre-wrap'>
                {generatedQuestion.questionText}
              </div>
            </div>

            {generatedQuestion.options && generatedQuestion.options.length > 0 && (
              <div className='space-y-2'>
                <h3 className='font-semibold text-sm text-gray-500 uppercase tracking-wider'>
                  Options
                </h3>
                <ul className='list-inside list-decimal space-y-1 bg-gray-50 dark:bg-gray-900 rounded-md border p-4 text-sm whitespace-pre-wrap'>
                  {generatedQuestion.options.map((opt: any, idx: number) => {
                    const optText =
                      typeof opt === 'object' && opt !== null
                        ? opt.text ?? opt.optionText ?? opt.value ?? opt.label ?? JSON.stringify(opt)
                        : String(opt);
                    const isCorrect =
                      (typeof opt === 'object' && opt !== null && opt.isCorrect === true) ||
                      opt === generatedQuestion.correctAnswer ||
                      optText === generatedQuestion.correctAnswer ||
                      (typeof opt === 'object' && opt !== null && opt.id === generatedQuestion.correctAnswer);

                    return (
                      <li key={idx} className={isCorrect ? 'font-bold text-green-600 dark:text-green-400' : ''}>
                        {optText}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className='pt-4 border-t'>
              <h3 className='font-semibold text-sm text-gray-500 uppercase tracking-wider mb-4'>
                Solution
              </h3>
              <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-md border text-sm whitespace-pre-wrap'>
                {typeof generatedQuestion.correctAnswer === 'string'
                  ? generatedQuestion.correctAnswer.replace(/^"|"$/g, '')
                  : JSON.stringify(generatedQuestion.correctAnswer, null, 2)}
              </div>
            </div>

            {generatedQuestion.explanation && (
              <div className='pt-4 border-t'>
                <h3 className='font-semibold text-sm text-gray-500 uppercase tracking-wider mb-4'>
                  Explanation
                </h3>
                <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-md border text-sm whitespace-pre-wrap'>
                  {generatedQuestion.explanation}
                </div>
              </div>
            )}
          </div>
        </CustomFormCard>
      ) : (
        <CustomFormCard
          title='Review Queue'
          description='View and manage the full list of generated questions waiting for approval.'
        >
          <div className='flex items-center justify-center py-6'>
            <Button variant='outline' size='lg' asChild>
              <Link href='/admin/review'>
                Open Full Question Review List
              </Link>
            </Button>
          </div>
        </CustomFormCard>
      )}
      </div>
    </div>
  );
}
