import React from 'react';
import { useResultRecommendations } from '../hooks/results.hooks';
import { useTopics } from '@/services/topics/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { Lightbulb, Target, Clock, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const RecommendationPanel = ({ attemptId }: { attemptId: string }) => {
  const { data, isLoading, isError } = useResultRecommendations(attemptId);
  const { data: topicsList } = useTopics(false);

  const topicMap = React.useMemo(() => {
    const map = new Map<string, string>();
    topicsList?.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [topicsList]);

  if (isLoading) return <Loading />;
  if (isError || !data) return null;

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='p-4 flex items-center gap-4'>
            <div className='bg-blue-100 p-3 rounded-full'>
              <Clock className='text-blue-600 w-6 h-6' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Suggested Practice</p>
              <h3 className='text-xl font-bold'>{data.estimatedPracticeHours} Hours</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 flex items-center gap-4'>
            <div className='bg-purple-100 p-3 rounded-full'>
              <ArrowUpRight className='text-purple-600 w-6 h-6' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Priority Level</p>
              <h3 className='text-xl font-bold'>{data.priority}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 flex items-center gap-4'>
            <div className='bg-indigo-100 p-3 rounded-full'>
              <Target className='text-indigo-600 w-6 h-6' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Focus Areas</p>
              <h3 className='text-xl font-bold'>{data.focusTopics.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Lightbulb className='text-amber-500 w-5 h-5' />
            Actionable Improvement Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            <div>
              <h4 className='font-semibold text-gray-800 mb-2'>Focus Topics</h4>
              <div className='flex flex-wrap gap-2'>
                {data.focusTopics.map((topic, i) => (
                  <Badge key={i} variant='secondary'>
                    {topicMap.get(topic) || topic}
                  </Badge>
                ))}
              </div>
            </div>

            <div className='space-y-4'>
              <h4 className='font-semibold text-gray-800'>Practice Plan</h4>
              {data.improvementPlan.map((step, i) => (
                <div
                  key={i}
                  className='flex gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-100'
                >
                  <span className='flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold'>
                    {i + 1}
                  </span>
                  <p className='text-sm text-gray-700 leading-relaxed'>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
