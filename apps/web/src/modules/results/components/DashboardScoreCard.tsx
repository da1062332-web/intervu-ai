import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { CheckCircle, XCircle } from 'lucide-react';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardScoreCard: React.FC<Props> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Score Card</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div className="bg-slate-50 p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500 font-medium mb-1">Overall Score</p>
            <p className="text-3xl font-bold text-gray-900">{data.overallScore.toFixed(1)} {data.maxMarks ? <span className="text-sm font-normal text-gray-400">/ {data.maxMarks}</span> : ''}</p>
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

        {data.objectiveScore !== undefined && data.codingScore !== undefined && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center pt-2">
            <div className="bg-indigo-50/50 p-4 rounded-lg shadow-sm border border-indigo-100 flex flex-col justify-center">
              <p className="text-sm text-indigo-600/80 font-medium mb-1">Objective Score</p>
              <p className="text-2xl font-bold text-indigo-700">{data.objectiveScore.toFixed(1)}</p>
            </div>
            
            <div className="bg-emerald-50/50 p-4 rounded-lg shadow-sm border border-emerald-100 flex flex-col justify-center">
              <p className="text-sm text-emerald-600/80 font-medium mb-1">Coding Score</p>
              <p className="text-2xl font-bold text-emerald-700">{data.codingScore.toFixed(1)}</p>
            </div>
            
            {data.passed !== undefined && (
              <div className={`p-4 rounded-lg shadow-sm border flex flex-col items-center justify-center ${data.passed ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                <p className={`text-sm font-medium mb-1 ${data.passed ? 'text-green-600/80' : 'text-red-600/80'}`}>Result Status</p>
                <div className="flex items-center gap-2">
                  {data.passed ? (
                    <><CheckCircle className="size-6 text-green-600" /><span className="text-2xl font-bold text-green-700">PASS</span></>
                  ) : (
                    <><XCircle className="size-6 text-red-600" /><span className="text-2xl font-bold text-red-700">FAIL</span></>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
