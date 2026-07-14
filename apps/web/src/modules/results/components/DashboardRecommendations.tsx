import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { ArrowRight, Lightbulb } from 'lucide-react';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardRecommendations: React.FC<Props> = ({ data }) => {
  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-900">
          <Lightbulb className="w-5 h-5 text-indigo-600" />
          Personalized Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                <ArrowRight className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-slate-700 font-medium">{rec}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-indigo-600/70 font-medium">Continue practicing to generate more personalized recommendations.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
