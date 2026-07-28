import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { Code2, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardCodingCard: React.FC<Props> = ({ data }) => {
  // Only render if we have a coding score
  if (data.codingScore === undefined) return null;

  // Find the coding section accuracy if it exists to show more details
  const codingSection = data.sectionAccuracy.find(s => 
    s.sectionName.toLowerCase().includes('coding') || 
    s.sectionName.toLowerCase().includes('programming')
  );

  return (
    <Card className="border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/30 overflow-hidden relative">
      <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none">
        <Code2 className="size-48" />
      </div>
      <CardHeader className="pb-3 border-b border-emerald-100/50 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md">
            <Terminal className="size-5" />
          </div>
          <CardTitle className="text-xl text-emerald-900">Coding Evaluation Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-emerald-600/80 uppercase tracking-wider mb-2">Technical Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-emerald-700">
                {Number.isInteger(data.codingScore) ? data.codingScore : data.codingScore.toFixed(1)}
              </span>
              {data.maxMarks && <span className="text-xl font-medium text-emerald-600/50">pts</span>}
            </div>
            <p className="text-sm text-gray-500 mt-3 max-w-sm">
              Your coding submissions were evaluated by our AI engine for functional correctness and adherence to constraints.
            </p>
          </div>
          
          <div className="space-y-4">
            {codingSection && (
              <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Section Accuracy</span>
                  <span className="font-bold text-emerald-600">{Math.round(codingSection.accuracy)}%</span>
                </div>
                <Progress value={codingSection.accuracy} className="h-2 bg-emerald-100" />
                <div className="flex justify-between mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><CheckCircle2 className="size-4 text-emerald-500" /> {codingSection.correct} Correct</span>
                  <span className="flex items-center gap-1"><AlertCircle className="size-4 text-orange-400" /> {codingSection.wrong} Incorrect</span>
                </div>
              </div>
            )}
            
            <div className="bg-emerald-700 text-white p-4 rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10">
                <Code2 className="size-24 translate-x-4 translate-y-4" />
              </div>
              <h4 className="font-medium mb-1">Evaluation Criteria</h4>
              <ul className="text-sm text-emerald-100 space-y-1 list-disc list-inside">
                <li>Functional Correctness</li>
                <li>Test Case Passes</li>
                <li>Constraint Satisfaction</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
