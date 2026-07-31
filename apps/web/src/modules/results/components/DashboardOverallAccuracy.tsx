import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardOverallAccuracy: React.FC<Props> = ({ data }) => {
  const { correct, wrong, skipped } = data.accuracyDetails;
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Overall Accuracy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
            {/* Simple CSS donut chart representation */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(
                  #22c55e 0% ${data.overallAccuracy}%, 
                  #ef4444 ${data.overallAccuracy}% ${data.overallAccuracy + (wrong / (correct + wrong + skipped || 1)) * 100}%,
                  #94a3b8 ${data.overallAccuracy + (wrong / (correct + wrong + skipped || 1)) * 100}% 100%
                )`
              }}
            />
            <div className="absolute inset-2 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(data.overallAccuracy)}%</span>
            </div>
          </div>
          
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center p-2.5 bg-green-50 dark:bg-green-950/40 rounded-lg text-green-700 dark:text-green-300 border border-transparent dark:border-green-800/40">
              <span className="font-medium">Correct</span>
              <span className="font-bold text-lg">{correct}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-red-50 dark:bg-red-950/40 rounded-lg text-red-700 dark:text-red-300 border border-transparent dark:border-red-800/40">
              <span className="font-medium">Wrong</span>
              <span className="font-bold text-lg">{wrong}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-slate-700 dark:text-slate-300 border border-transparent dark:border-slate-800">
              <span className="font-medium">Skipped</span>
              <span className="font-bold text-lg">{skipped}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
