'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CustomFormCard } from '@/components/ui/custom-form-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useGenerateQuestion, useGenerateBatch } from '@/services/question-generation/hooks';
import { useTopics } from '@/services/topics/hooks';
import { useConcepts } from '@/services/concept-mapping/hooks';
import { useTemplatesByConcept } from '@/services/templates/hooks';
import { ConfigurationSelectors } from './ConfigurationSelectors';
import { BatchProgressWidget } from './BatchProgressWidget';
import { GenerationHistory } from './GenerationHistory';

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

  // External queries
  const { data: topics = [] } = useTopics();
  const { data: conceptsData } = useConcepts(selectedTopic);
  const concepts = conceptsData || [];
  const selectedConceptItem = concepts.find((concept) => concept.id === selectedConcept);
  const selectedConceptKey = selectedConceptItem?.code || selectedConceptItem?.conceptCode || '';
  const { data: templatesData } = useTemplatesByConcept(selectedConceptKey, 1, 100);
  const templates = templatesData?.items || [];

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
        // If the API returned the created question id, focus it on the review page
        const generatedId = res?.question?.id ?? res?.questions?.[0]?.id;
        const target = generatedId ? `/admin/review?focus=${generatedId}` : '/admin/review';
        // Route to review after slight delay
        setTimeout(() => router.push(target), 500);
      } else {
        // Mock a progress bar for batch
        const interval = setInterval(() => {
          setProgress((p) => Math.min(p + 15, 90));
        }, 500);

        await generateBatch({ templateId: selectedTemplate, count: batchCount, context: payload });

        clearInterval(interval);
        setProgress(100);
        setStatus('success');
        setTimeout(() => router.push('/admin/review'), 1000);
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setStatus('error');
    }
  };

  const isFormValid =
    selectedTemplate && (generationType === 'single' || (batchCount > 0 && batchCount <= 100));

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
        templates={templates}
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

      <GenerationHistory />
    </div>
  );
}
