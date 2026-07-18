import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { Progress } from '@/components/ui/progress';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardSectionAccuracy: React.FC<Props> = ({ data }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Section-wise Accuracy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.sectionAccuracy.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="font-semibold text-slate-800">{section.sectionName}</span>
                <span className="text-lg font-bold text-slate-700">{Math.round(section.accuracy)}%</span>
              </div>
              
              <Progress value={section.accuracy} className="h-3" />
              
              <div className="flex justify-between text-xs text-slate-500">
                <span><strong className="text-green-600">{section.correct}</strong> Correct</span>
                <span><strong className="text-slate-400">{section.skipped || 0}</strong> Skipped</span>
                <span><strong className="text-red-600">{section.wrong}</strong> Wrong</span>
              </div>
            </div>
          ))}
          
          {data.sectionAccuracy.length === 0 && (
            <div className="text-center text-slate-500 py-4">No section data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
