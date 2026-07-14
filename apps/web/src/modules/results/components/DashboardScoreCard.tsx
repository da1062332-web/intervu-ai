import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardScoreCard: React.FC<Props> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Score Card</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div className="bg-slate-50 p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500 font-medium mb-1">Overall Score</p>
            <p className="text-3xl font-bold text-gray-900">{data.overallScore.toFixed(1)}</p>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500 font-medium mb-1">Percentage</p>
            <p className="text-3xl font-bold text-indigo-600">{Math.round(data.percentage)}%</p>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500 font-medium mb-1">Grade</p>
            <p className="text-3xl font-bold text-green-600">{data.grade}</p>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500 font-medium mb-1">Accuracy</p>
            <p className="text-3xl font-bold text-blue-600">{Math.round(data.overallAccuracy)}%</p>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500 font-medium mb-1">Time Taken</p>
            <p className="text-3xl font-bold text-orange-500">{data.totalTimeSpent}m</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
