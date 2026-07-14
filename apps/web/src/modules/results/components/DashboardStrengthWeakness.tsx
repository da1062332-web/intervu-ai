import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardStrengthWeakness: React.FC<Props> = ({ data }) => {
  // Categorize from sectionAccuracy to get "Needs Improvement" (50-69%)
  const needsImprovement = data.sectionAccuracy
    .filter(s => s.accuracy >= 50 && s.accuracy < 70)
    .map(s => s.sectionName);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strengths & Weaknesses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-green-50/50">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="text-green-600 w-5 h-5" />
              <h3 className="font-semibold text-green-900">💪 Strengths</h3>
            </div>
            {data.strengths.length > 0 ? (
              <ul className="space-y-2">
                {data.strengths.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                    <span className="text-green-800 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-green-600/70 italic">Keep practicing to build your strengths.</p>
            )}
          </div>

          <div className="border rounded-lg p-4 bg-yellow-50/50">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-yellow-600 w-5 h-5" />
              <h3 className="font-semibold text-yellow-900">⚠️ Needs Improvement</h3>
            </div>
            {needsImprovement.length > 0 ? (
              <ul className="space-y-2">
                {needsImprovement.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
                    <span className="text-yellow-800 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-yellow-600/70 italic">No moderate areas detected.</p>
            )}
          </div>

          <div className="border rounded-lg p-4 bg-red-50/50">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="text-red-600 w-5 h-5" />
              <h3 className="font-semibold text-red-900">❌ Weak Areas</h3>
            </div>
            {data.weaknesses.length > 0 ? (
              <ul className="space-y-2">
                {data.weaknesses.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                    <span className="text-red-800 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-red-600/70 italic">Great job! No major weak areas found.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
