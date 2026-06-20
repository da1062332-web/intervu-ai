'use client';

import { usePreviewBlueprint } from '@/services/blueprints/hooks';
import { Skeleton } from '@/components/ui/skeleton';

interface PreviewScreenProps {
  blueprintId: string;
}

export function PreviewScreen({ blueprintId }: PreviewScreenProps) {
  const { data: previewData, isLoading, isError, refetch } = usePreviewBlueprint(blueprintId);

  return (
    <div className='space-y-4 border rounded-md p-6 bg-white dark:bg-gray-900 shadow-sm'>
      <div className='flex items-center justify-between border-b pb-4'>
        <h3 className='text-lg font-semibold'>Blueprint Preview</h3>
      </div>

      {isLoading && (
        <div className='space-y-2 mt-4'>
          <Skeleton className='h-4 w-1/2' />
          <Skeleton className='h-4 w-1/3' />
          <Skeleton className='h-32 w-full' />
        </div>
      )}

      {isError && (
        <div className='text-center py-8 text-muted-foreground'>
          <p className='text-red-500 font-medium'>Unable to load preview.</p>
          <button onClick={() => refetch()} className='text-indigo-600 hover:underline mt-2 text-sm'>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && !previewData && (
        <div className='text-center py-8 text-muted-foreground'>
          <p>No Preview Available</p>
        </div>
      )}

      {!isLoading && !isError && previewData && (
        <div className='mt-4 space-y-6'>
          <div className='flex gap-4 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md'>
            <div><span className='font-semibold text-gray-700 dark:text-gray-300'>Config ID:</span> {previewData.configId}</div>
            <div><span className='font-semibold text-gray-700 dark:text-gray-300'>Profile ID:</span> {previewData.styleProfileId}</div>
          </div>

          {previewData.sections?.map((section: any, idx: number) => (
            <div key={idx} className='border rounded-md overflow-hidden'>
              <div className='bg-indigo-50 dark:bg-indigo-950/30 p-3 border-b'>
                <h4 className='font-semibold text-indigo-900 dark:text-indigo-300'>
                  Section {idx + 1}
                  <span className='text-xs font-normal text-indigo-600 ml-2'>({section.sectionId})</span>
                </h4>
                <p className='text-sm text-indigo-700 dark:text-indigo-400'>
                  {section.questionCount} Total Questions
                </p>
              </div>
              
              <div className='p-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-900'>
                <div>
                  <h5 className='text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300'>Topics Mapping</h5>
                  <div className='space-y-2'>
                    {section.topics?.map((topic: any, tIdx: number) => (
                      <div key={tIdx} className='flex justify-between items-center text-sm border-b pb-1 border-dashed'>
                        <span className='truncate pr-2'>{topic.topicId}</span>
                        <span className='font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs'>
                          {topic.expectedQuestions} Qs ({topic.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className='text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300'>Difficulty Constraints</h5>
                  <div className='flex gap-2 flex-wrap'>
                    {Object.entries(section.difficultyAllocation || {}).map(([level, count]) => (
                      <div key={level} className='bg-gray-50 dark:bg-gray-800 border px-3 py-1.5 rounded-md text-sm flex items-center gap-2'>
                        <span className='text-xs font-semibold uppercase tracking-wider text-gray-500'>{level}</span>
                        <span className='font-bold text-gray-900 dark:text-gray-100'>{String(count)}</span>
                      </div>
                    ))}
                  </div>

                  <div className='mt-4'>
                    <h5 className='text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300'>Template Types</h5>
                    <div className='flex gap-2 flex-wrap'>
                      {section.templateTypes?.map((type: string, typeIdx: number) => (
                        <span key={typeIdx} className='bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded text-xs'>
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
