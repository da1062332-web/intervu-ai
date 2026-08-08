'use client';

import React, { useState } from 'react';
import { ConfigurationSelection } from '@/features/assessment-builder/components/ConfigurationSelection';
import { BlueprintPreview } from '@/features/assessment-builder/components/BlueprintPreview';
import { GenerationProgress } from '@/features/assessment-builder/components/GenerationProgress';
import { AssessmentPreview } from '@/features/assessment-builder/components/AssessmentPreview';
import { AssessmentSummaryDashboard } from '@/features/assessment-builder/components/AssessmentSummaryDashboard';
import {
  useGenerateAssessment,
  useJobPolling,
} from '@/features/assessment-builder/hooks/use-generate-assessment';
import { validateAssessment } from '@/features/assessment-builder/validators/assessment-validator';
import type { ExamConfig } from '@/services/exam-configs/types';
import type { Assessment, ValidationResult } from '@/features/assessment-builder/types';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { CustomFormCard } from '@/components/ui/custom-form-card';

export default function AssessmentBuilderPage() {
  const [step, setStep] = useState<'SELECT_CONFIG' | 'PREVIEW_BLUEPRINT' | 'GENERATING' | 'RESULT'>(
    'SELECT_CONFIG',
  );
  const [selectedConfig, setSelectedConfig] = useState<ExamConfig | null>(null);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const {
    mutate: generateAssessment,
    isPending: isMutationPending,
    isError: isMutationError,
  } = useGenerateAssessment();
  const { data: jobStatus, isError: isJobError } = useJobPolling(activeJobId);

  const [generatedAssessment, setGeneratedAssessment] = useState<Assessment | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | undefined>(undefined);

  const isGenerating =
    isMutationPending ||
    (!!activeJobId && jobStatus?.status !== 'completed' && jobStatus?.status !== 'failed');
  const isError = isMutationError || isJobError || jobStatus?.status === 'failed';
  const isSuccess = jobStatus?.status === 'completed';

  React.useEffect(() => {
    if (jobStatus?.status === 'completed' && jobStatus.result && selectedConfig) {
      const assessmentData = jobStatus.result as Assessment;
      setGeneratedAssessment(assessmentData);
      const validation = validateAssessment(selectedConfig, assessmentData);
      setValidationResult(validation);
      const timer = setTimeout(() => setStep('RESULT'), 1500);
      return () => clearTimeout(timer);
    }
  }, [jobStatus?.status, jobStatus?.result, selectedConfig]);

  const handleConfigSelect = (config: ExamConfig) => {
    setSelectedConfig(config);
  };

  const handleContinueToPreview = () => {
    if (selectedConfig) {
      setStep('PREVIEW_BLUEPRINT');
    }
  };

  const handleGenerate = () => {
    if (!selectedConfig) return;

    setStep('GENERATING');

    generateAssessment(
      {
        requestId: crypto.randomUUID(),
        blueprintId: selectedConfig.id,
        sectionId: 'default-section',
        topicId: 'default-topic',
        conceptId: 'default-concept',
        difficulty: 'MEDIUM',
        templateId: 'default-template',
        quantity: selectedConfig.totalQuestions,
      },
      {
        onSuccess: (res: any) => {
          const id = res?.jobId || res?.data?.jobId;
          const questionsList = res?.questions || res?.data?.questions;

          if (questionsList && questionsList.length > 0) {
            const assessmentData = (res.data || res) as Assessment;
            setGeneratedAssessment(assessmentData);
            const validation = validateAssessment(selectedConfig, assessmentData);
            setValidationResult(validation);
            setTimeout(() => setStep('RESULT'), 1000);
          } else if (id) {
            setActiveJobId(id);
          } else {
            const assessmentData = (res.data || res) as Assessment;
            setGeneratedAssessment(assessmentData);
            const validation = validateAssessment(selectedConfig, assessmentData);
            setValidationResult(validation);
            setTimeout(() => setStep('RESULT'), 1000);
          }
        },
        onError: () => {
          setActiveJobId(null);
          // error handled by hook toast, but we should let user retry
        },
      },
    );
  };

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8 animate-fade-in'>
      <SectionHeader
        title='Assessment Generator'
        description='Transform your validated blueprints into complete, ready-to-use assessments powered by AI.'
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Assessment Generator' },
        ]}
      />

      {step === 'SELECT_CONFIG' && (
        <div className='space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'>
          <CustomFormCard
            title='1. Select Configuration'
            description='Choose the exam configuration to build your assessment from.'
            footer={
              <div className='flex w-full justify-end'>
                <Button
                  disabled={!selectedConfig}
                  onClick={handleContinueToPreview}
                  className='gap-2'
                >
                  Continue to Preview <ChevronRight className='w-4 h-4' />
                </Button>
              </div>
            }
          >
            <ConfigurationSelection onSelect={handleConfigSelect} selectedId={selectedConfig?.id} />
          </CustomFormCard>
        </div>
      )}

      {step === 'PREVIEW_BLUEPRINT' && selectedConfig && (
        <div className='space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'>
          <CustomFormCard
            title={`2. Review Blueprint: ${selectedConfig.name}`}
            description='Review the blueprint requirements before generating the assessment.'
            footer={
              <div className='flex gap-2 w-full justify-between items-center'>
                <Button variant='outline' size='icon' onClick={() => setStep('SELECT_CONFIG')}>
                  <ArrowLeft className='w-4 h-4' />
                </Button>
                <Button
                  disabled={isGenerating}
                  onClick={handleGenerate}
                  className='gap-2 bg-indigo-600 hover:bg-indigo-700 text-white'
                >
                  {isGenerating ? 'Generating...' : 'Generate Assessment'}
                </Button>
              </div>
            }
          >
            <BlueprintPreview config={selectedConfig} />
          </CustomFormCard>
        </div>
      )}

      {step === 'GENERATING' && (
        <div className='max-w-2xl mx-auto py-12 animate-in fade-in zoom-in-95 duration-500'>
          <GenerationProgress
            isGenerating={isGenerating}
            isError={isError}
            isSuccess={isSuccess}
            progress={jobStatus?.progress}
          />
          {isError && (
            <div className='mt-6 flex justify-center gap-4'>
              <Button variant='outline' onClick={() => setStep('PREVIEW_BLUEPRINT')}>
                Go Back
              </Button>
              <Button onClick={handleGenerate}>Retry Generation</Button>
            </div>
          )}
        </div>
      )}

      {step === 'RESULT' && generatedAssessment && (
        <div className='space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700'>
          <CustomFormCard
            title='3. Assessment Result'
            description='Review the generated assessment and its validation results.'
            footer={
              <div className='flex w-full justify-end'>
                <Button variant='outline' onClick={() => setStep('SELECT_CONFIG')}>
                  Generate Another
                </Button>
              </div>
            }
          >
            <AssessmentSummaryDashboard
              assessment={generatedAssessment}
              validation={validationResult}
            />

            <div className='pt-6 border-t mt-6'>
              <h3 className='text-lg font-semibold mb-6'>Preview Questions</h3>
              <AssessmentPreview assessment={generatedAssessment} />
            </div>
          </CustomFormCard>
        </div>
      )}
    </div>
  );
}
