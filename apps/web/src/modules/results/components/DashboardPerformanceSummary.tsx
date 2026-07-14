import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardPerformanceSummary: React.FC<Props> = ({ data }) => {
  return (
    <Card className="h-full bg-slate-900 text-white">
      <CardHeader>
        <CardTitle className="text-white">Performance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-700 pb-3">
            <span className="text-slate-300">Overall Score</span>
            <span className="text-xl font-bold">{data.overallScore.toFixed(1)}</span>
          </div>
          
          <div className="flex justify-between items-center border-b border-slate-700 pb-3">
            <span className="text-slate-300">Overall Accuracy</span>
            <span className="text-xl font-bold text-green-400">{Math.round(data.overallAccuracy)}%</span>
          </div>
          
          <div className="flex justify-between items-center border-b border-slate-700 pb-3">
            <span className="text-slate-300">Time Taken</span>
            <span className="text-xl font-bold text-orange-400">{data.totalTimeSpent} mins</span>
          </div>
          
          <div className="flex flex-col pt-2">
            <span className="text-sm text-slate-400 mb-1">Strongest Section</span>
            <span className="text-lg font-semibold text-green-300">
              {data.sectionAccuracy.length > 0 
                ? [...data.sectionAccuracy].sort((a, b) => b.accuracy - a.accuracy)[0].sectionName 
                : 'None identified'}
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm text-slate-400 mb-1">Weakest Section</span>
            <span className="text-lg font-semibold text-red-300">
              {(() => {
                if (data.sectionAccuracy.length === 0) return 'None identified';
                const lowest = [...data.sectionAccuracy].sort((a, b) => a.accuracy - b.accuracy)[0];
                return lowest.accuracy < 50 ? lowest.sectionName : 'None identified';
              })()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
