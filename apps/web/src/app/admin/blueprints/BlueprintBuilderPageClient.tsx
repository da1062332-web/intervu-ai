'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBlueprint } from '@/services/blueprints';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EditBlueprintModal } from './components/EditBlueprintModal';
import { AddTopicModal } from './components/AddTopicModal';
import { Edit, Plus, ArrowLeft, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useBlueprintEditorStore } from '@/store/blueprint-editor.store';

export function BlueprintBuilderPageClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';

  const { data: blueprint, isLoading, isError, refetch } = useBlueprint(id);

  const setValidationState = useBlueprintEditorStore((state) => state.setValidationState);
  const setSelectedBlueprint = useBlueprintEditorStore((state) => state.setSelectedBlueprint);

  useEffect(() => {
    if (id) {
      setSelectedBlueprint(id);
    }
  }, [id, setSelectedBlueprint]);

  useEffect(() => {
    if (blueprint) {
      setValidationState({
        isValid: blueprint.valid,
        errors: blueprint.validationSummary?.errors || [],
      });
    }
  }, [blueprint, setValidationState]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);

  if (!id) {
    return <div className='mt-8 text-center text-red-500'>No blueprint ID provided</div>;
  }

  if (isLoading) {
    return (
      <div className='space-y-6 mt-8'>
        <Skeleton className='h-32 w-full rounded-md' />
        <Skeleton className='h-64 w-full rounded-md' />
      </div>
    );
  }

  if (isError || !blueprint) {
    return (
      <div className='mt-8 text-center py-12 border rounded-md'>
        <h3 className='text-lg font-medium text-red-600 mb-2'>Error loading blueprint</h3>
        <Button onClick={() => refetch()} variant='outline'>
          Try again
        </Button>
      </div>
    );
  }

  const validationSummary = blueprint.validationSummary || {
    totalConfiguredQuestions: 0,
    totalExpectedQuestions: blueprint.totalQuestions,
    totalMissingQuestions: blueprint.totalQuestions,
    totalWeightage: 0,
    errors: [],
  };

  return (
    <div className='mt-8 space-y-6'>
      <div className='flex items-center space-x-4 mb-4'>
        <Link
          href='/admin/blueprints'
          className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
        >
          <ArrowLeft className='h-5 w-5' />
        </Link>
        <h1 className='text-2xl font-bold tracking-tight text-gray-900 dark:text-white'>
          Manage Blueprint
        </h1>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Section 1: General Info */}
        <Card className='md:col-span-2'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>Blueprint Information</CardTitle>
              <CardDescription>General metadata for the blueprint</CardDescription>
            </div>
            <Button variant='outline' size='sm' onClick={() => setIsEditModalOpen(true)}>
              <Edit className='h-4 w-4 mr-2' />
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6'>
              <div>
                <dt className='text-sm font-medium text-gray-500'>Name</dt>
                <dd className='mt-1 text-sm text-gray-900 dark:text-white font-semibold'>
                  {blueprint.name}
                </dd>
              </div>
              <div>
                <dt className='text-sm font-medium text-gray-500'>Code</dt>
                <dd className='mt-1 text-sm text-gray-900 dark:text-white'>
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'>
                    {blueprint.code}
                  </span>
                </dd>
              </div>
              <div className='sm:col-span-2'>
                <dt className='text-sm font-medium text-gray-500'>Description</dt>
                <dd className='mt-1 text-sm text-gray-900 dark:text-white'>
                  {blueprint.description || 'No description provided.'}
                </dd>
              </div>
              <div>
                <dt className='text-sm font-medium text-gray-500'>Total Questions</dt>
                <dd className='mt-1 text-sm text-gray-900 dark:text-white'>
                  {blueprint.totalQuestions}
                </dd>
              </div>
              <div>
                <dt className='text-sm font-medium text-gray-500'>Total Duration</dt>
                <dd className='mt-1 text-sm text-gray-900 dark:text-white'>
                  {blueprint.totalDurationMinutes} minutes
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Section 2: Validation Summary Widget */}
        <Card>
          <CardHeader>
            <CardTitle>Validation Summary</CardTitle>
            <CardDescription>Status and health of blueprint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-500'>Status</span>
                {blueprint.valid ? (
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-green-100 text-green-800'>
                    <CheckCircle2 className='w-4 h-4 mr-1' /> VALID
                  </span>
                ) : (
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-red-100 text-red-800'>
                    <XCircle className='w-4 h-4 mr-1' /> INVALID
                  </span>
                )}
              </div>

              <div className='grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800'>
                <div>
                  <dt className='text-xs font-medium text-gray-500 uppercase'>Configured Q's</dt>
                  <dd className='mt-1 text-xl font-semibold text-gray-900 dark:text-white'>
                    {validationSummary.totalConfiguredQuestions}
                  </dd>
                </div>
                <div>
                  <dt className='text-xs font-medium text-gray-500 uppercase'>Expected Q's</dt>
                  <dd className='mt-1 text-xl font-semibold text-gray-900 dark:text-white'>
                    {validationSummary.totalExpectedQuestions}
                  </dd>
                </div>
                <div>
                  <dt className='text-xs font-medium text-gray-500 uppercase'>Missing Q's</dt>
                  <dd
                    className={`mt-1 text-xl font-semibold ${validationSummary.totalMissingQuestions > 0 ? 'text-red-500' : 'text-green-500'}`}
                  >
                    {validationSummary.totalMissingQuestions}
                  </dd>
                </div>
                <div>
                  <dt className='text-xs font-medium text-gray-500 uppercase'>Total Weightage</dt>
                  <dd
                    className={`mt-1 text-xl font-semibold ${validationSummary.totalWeightage !== 100 ? 'text-red-500' : 'text-green-500'}`}
                  >
                    {validationSummary.totalWeightage}%
                  </dd>
                </div>
              </div>

              {!blueprint.valid && (validationSummary.errors || []).length > 0 && (
                <div className='mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-900/50'>
                  <h4 className='text-sm font-semibold text-red-800 dark:text-red-400 flex items-center mb-2'>
                    <AlertTriangle className='h-4 w-4 mr-1' /> Issues
                  </h4>
                  <ul className='list-disc pl-5 space-y-1'>
                    {(validationSummary.errors || []).map((err, idx) => (
                      <li key={idx} className='text-xs text-red-700 dark:text-red-300'>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Topic Configuration */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle>Topic Configuration</CardTitle>
            <CardDescription>Mapped topics and difficulty allocations</CardDescription>
          </div>
          <Button size='sm' onClick={() => setIsAddTopicModalOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Add Topic
          </Button>
        </CardHeader>
        <CardContent>
          <div className='-mx-6 overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
              <thead className='bg-gray-50 dark:bg-gray-800'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Section
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Topic
                  </th>
                  <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Count
                  </th>
                  <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Weightage
                  </th>
                  <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Easy
                  </th>
                  <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Medium
                  </th>
                  <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Hard
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700'>
                {(blueprint.topics || []).map((t, idx) => (
                  <tr key={idx}>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                      {t.sectionName}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                      {t.topicName}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center'>
                      {t.questionCount}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center'>
                      {t.weightage}%
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center'>
                      {t.difficultyDistribution.easyCount}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center'>
                      {t.difficultyDistribution.mediumCount}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center'>
                      {t.difficultyDistribution.hardCount}
                    </td>
                  </tr>
                ))}
                {(blueprint.topics || []).length === 0 && (
                  <tr>
                    <td colSpan={7} className='px-6 py-8 text-center text-sm text-gray-500'>
                      No topics configured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EditBlueprintModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        blueprint={blueprint}
      />

      <AddTopicModal
        isOpen={isAddTopicModalOpen}
        onClose={() => setIsAddTopicModalOpen(false)}
        blueprintId={blueprint.id}
      />
    </div>
  );
}
