import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { CheckCircle, XCircle } from 'lucide-react';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardScoreCard: React.FC<Props> = ({ data }) => {
  const overallScoreOutOf100 =
    data.percentage !== undefined && data.percentage !== null
      ? Math.round(data.percentage)
      : data.maxMarks && data.maxMarks > 0
        ? Math.round((data.overallScore / data.maxMarks) * 100)
        : Math.round(data.overallScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Score Card</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-slate-50 p-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500 font-medium mb-1">Overall Score</p>
            <p className="text-3xl font-bold text-gray-900">
              {overallScoreOutOf100} <span className="text-sm font-normal text-gray-400">/ 100</span>
            </p>
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

        {data.passed !== undefined && (
          <div className="pt-2">
            <div
              className={`p-4 rounded-lg shadow-sm border flex flex-col items-center justify-center ${
                data.passed ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'
              }`}
            >
              <p
                className={`text-sm font-medium mb-1 ${
                  data.passed ? 'text-green-600/80' : 'text-red-600/80'
                }`}
              >
                Result Status
              </p>
              <div className="flex items-center gap-2">
                {data.passed ? (
                  <>
                    <CheckCircle className="size-6 text-green-600" />
                    <span className="text-2xl font-bold text-green-700">PASS</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-6 text-red-600" />
                    <span className="text-2xl font-bold text-red-700">FAIL</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
