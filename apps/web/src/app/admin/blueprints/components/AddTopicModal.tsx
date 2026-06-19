'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddBlueprintTopic } from '@/services/blueprints';
import { useAdminTopics } from '@/features/topic-section-mapping/api/queries';
import { useQuery } from '@tanstack/react-query';
import { examConfigsApi } from '@/services/exam-configs/api';
import { useSections } from '@/services/exam-sections/hooks';
import toast from 'react-hot-toast';

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprintId: string;
}

export function AddTopicModal({ isOpen, onClose, blueprintId }: AddTopicModalProps) {
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [topicId, setTopicId] = useState('');

  const [questionCount, setQuestionCount] = useState<number>(10);
  const [weightage, setWeightage] = useState<number>(25);
  const [easyCount, setEasyCount] = useState<number>(3);
  const [mediumCount, setMediumCount] = useState<number>(4);
  const [hardCount, setHardCount] = useState<number>(3);

  const { data: configs } = useQuery({
    queryKey: ['exam-configs'],
    queryFn: () => examConfigsApi.getConfigs(),
    enabled: isOpen,
  });

  const { data: sections } = useSections(selectedConfigId);
  const { data: topics } = useAdminTopics();

  const { mutateAsync: addTopic, isPending } = useAddBlueprintTopic();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sectionId || !topicId) {
      toast.error('Please select an Exam Section and a Topic.');
      return;
    }

    if (easyCount + mediumCount + hardCount !== questionCount) {
      toast.error(
        `Difficulty counts (${easyCount} + ${mediumCount} + ${hardCount}) must equal total questions (${questionCount}).`,
      );
      return;
    }

    try {
      await addTopic({
        id: blueprintId,
        data: {
          sectionId,
          topicId,
          questionCount,
          weightage,
          easyCount,
          mediumCount,
          hardCount,
        },
      });
      toast.success('Topic added successfully');
      setTopicId('');
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to add topic config');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className='max-w-2xl'>
      <div className='mb-4'>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
          Add Topic Configuration
        </h2>
        <p className='text-sm text-gray-500 mt-1'>
          Map a specific topic to this blueprint and allocate difficulty distribution.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1'>
            <Label htmlFor='config-select'>1. Select Exam Config</Label>
            <select
              id='config-select'
              value={selectedConfigId}
              onChange={(e) => setSelectedConfigId(e.target.value)}
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              disabled={isPending}
            >
              <option value=''>-- Select Exam Config --</option>
              {configs?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='section-select'>2. Select Section *</Label>
            <select
              id='section-select'
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              disabled={!selectedConfigId || isPending}
              required
            >
              <option value=''>-- Select Section --</option>
              {sections?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='space-y-1'>
          <Label htmlFor='topic-select'>3. Select Topic *</Label>
          <select
            id='topic-select'
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            disabled={isPending}
            required
          >
            <option value=''>-- Select Topic --</option>
            {topics?.map((t: unknown) => {
              const topic = t as { id: string; domain: string; topicName: string };
              return (
                <option key={topic.id} value={topic.id}>
                  {topic.domain} - {topic.topicName}
                </option>
              );
            })}
          </select>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1'>
            <Label htmlFor='topic-questions'>Total Questions *</Label>
            <Input
              id='topic-questions'
              type='number'
              min={1}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              disabled={isPending}
              required
            />
          </div>

          <div className='space-y-1'>
            <Label htmlFor='topic-weightage'>Weightage (%) *</Label>
            <Input
              id='topic-weightage'
              type='number'
              min={0}
              max={100}
              step='0.1'
              value={weightage}
              onChange={(e) => setWeightage(Number(e.target.value))}
              disabled={isPending}
              required
            />
          </div>
        </div>

        <div className='p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-4'>
          <h4 className='font-medium text-sm text-gray-900 dark:text-white'>
            Difficulty Distribution
          </h4>
          <div className='grid grid-cols-3 gap-4'>
            <div className='space-y-1'>
              <Label htmlFor='easyCount'>Easy *</Label>
              <Input
                id='easyCount'
                type='number'
                min={0}
                value={easyCount}
                onChange={(e) => setEasyCount(Number(e.target.value))}
                disabled={isPending}
                required
              />
            </div>
            <div className='space-y-1'>
              <Label htmlFor='mediumCount'>Medium *</Label>
              <Input
                id='mediumCount'
                type='number'
                min={0}
                value={mediumCount}
                onChange={(e) => setMediumCount(Number(e.target.value))}
                disabled={isPending}
                required
              />
            </div>
            <div className='space-y-1'>
              <Label htmlFor='hardCount'>Hard *</Label>
              <Input
                id='hardCount'
                type='number'
                min={0}
                value={hardCount}
                onChange={(e) => setHardCount(Number(e.target.value))}
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className='flex items-center text-sm'>
            <span
              className={`font-semibold ${easyCount + mediumCount + hardCount !== questionCount ? 'text-red-500' : 'text-green-500'}`}
            >
              Sum: {easyCount + mediumCount + hardCount} / {questionCount}
            </span>
            {easyCount + mediumCount + hardCount !== questionCount && (
              <span className='ml-2 text-red-500'>Must equal total questions.</span>
            )}
          </div>
        </div>

        <div className='mt-6 flex justify-end space-x-3'>
          <Button variant='outline' type='button' onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={isPending || easyCount + mediumCount + hardCount !== questionCount}
          >
            {isPending ? 'Adding...' : 'Add Topic'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
