'use client';

import { useState, useEffect } from 'react';
import { useTopicMappingStore } from '../store/topic-mapping.store';
import {
  useWeightages,
  useUpdateWeightage,
  useCreateWeightage,
} from '@/services/topic-weightages/hooks';
import { Input } from '@/components/ui/input';
import { SectionTopicResponse } from '@intervu-ai/contracts';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface WeightageEditorProps {
  sectionId: string;
  topics: SectionTopicResponse[];
  onValidityChange?: (isValid: boolean) => void;
}

export function WeightageEditor({ sectionId, topics, onValidityChange }: WeightageEditorProps) {
  const { data: weightagesData = [], isLoading, isError } = useWeightages(sectionId);
  const updateWeightage = useUpdateWeightage(sectionId);
  const createWeightage = useCreateWeightage(sectionId);
  const weightages = useTopicMappingStore((state) => state.weightages);
  const updateLocalWeightage = useTopicMappingStore((state) => state.updateWeightage);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalWeightage = Object.values(weightages).reduce((sum, val) => sum + (val || 0), 0);
  const is100 = totalWeightage === 100;
  const hasValidationErrors = Object.keys(errors).length > 0;
  const isValid = is100 && !hasValidationErrors;

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  if (isLoading) {
    return (
      <div className='space-y-4 border rounded-lg p-4'>
        <Skeleton className='h-8 w-1/3' />
        <Skeleton className='h-8 w-1/3' />
      </div>
    );
  }

  if (isError) {
    return <p className='text-red-500'>Error loading weightages.</p>;
  }

  if (topics.length === 0) {
    return null;
  }

  const validateInput = (value: string): { isValid: boolean; parsed: number } => {
    if (value === '') return { isValid: true, parsed: 0 };
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      return { isValid: false, parsed: numValue };
    }
    return { isValid: true, parsed: numValue };
  };

  const handleBlur = (topicId: string, value: string) => {
    const { isValid, parsed } = validateInput(value);
    
    if (!isValid) {
      setErrors(prev => ({ ...prev, [topicId]: 'Must be 0-100' }));
      return;
    }
    
    setErrors(prev => {
      const next = { ...prev };
      delete next[topicId];
      return next;
    });

    const existing = weightagesData.find((w) => w.topicId === topicId);
    if (existing) {
      if (existing.weightagePercentage !== parsed) {
        updateWeightage.mutate({ id: existing.id, weightagePercentage: parsed });
      }
    } else {
      createWeightage.mutate({ topicId, weightagePercentage: parsed });
    }
  };

  const handleChange = (topicId: string, value: string) => {
    // Allow empty string for clearing
    if (value === '') {
      updateLocalWeightage(topicId, 0);
      return;
    }
    
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      // Clamping between 0 and 100 for better UX
      const clamped = Math.max(0, Math.min(100, parsed));
      updateLocalWeightage(topicId, clamped);
      
      setErrors(prev => {
        const next = { ...prev };
        delete next[topicId];
        return next;
      });
    }
  };

  return (
    <div className='space-y-4'>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg ${is100 ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-900/50' : 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900/50'}`}>
        <div>
          <h3 className='text-lg font-medium'>Weightage Configuration</h3>
          <p className='text-sm text-muted-foreground'>
            Topic weightages must exactly total 100% before you can generate questions.
          </p>
        </div>
        <div className={`mt-2 sm:mt-0 flex items-center font-bold text-lg px-4 py-2 rounded-md ${is100 ? 'text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400' : 'text-red-700 bg-red-100 dark:bg-red-900/40 dark:text-red-400'}`}>
          {is100 ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
          Total: {totalWeightage}%
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {topics.map((topic) => {
          const topicId = topic.topicId;
          const currentVal = weightages[topicId] !== undefined ? weightages[topicId] : '';
          const hasError = !!errors[topicId];
          
          return (
            <div
              key={topicId}
              className={`flex flex-col justify-center p-3 border rounded-md bg-background ${hasError ? 'border-red-500' : ''}`}
            >
              <div className='flex items-center justify-between'>
                <span className='font-medium truncate pr-4' title={(topic as any).topicName || (topic as any).topic || (topic as any).name || 'Unnamed Topic'}>
                  {(topic as any).topicName ||
                    (topic as any).topic ||
                    (topic as any).name ||
                    'Unnamed Topic'}
                </span>
                <div className='flex items-center gap-2 w-24 shrink-0'>
                  <Input
                    type='number'
                    min={0}
                    max={100}
                    value={currentVal === 0 ? '' : currentVal}
                    onChange={(e) => handleChange(topicId, e.target.value)}
                    onBlur={(e) => handleBlur(topicId, e.target.value)}
                    className={`text-right ${hasError ? 'focus-visible:ring-red-500' : ''}`}
                  />
                  <span className='text-muted-foreground font-medium'>%</span>
                </div>
              </div>
              {hasError && <span className="text-xs text-red-500 mt-1 text-right w-full block">{errors[topicId]}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
