import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { Clock, Clock4, TimerReset } from 'lucide-react';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardSectionTime: React.FC<Props> = ({ data }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'Good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Slightly Slow': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Needs Improvement': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Section-wise Time Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {data.sectionTime.map((section, idx) => (
            <div key={idx} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:bg-slate-50 transition-colors">
              <div className="mb-2 md:mb-0">
                <h4 className="font-semibold text-slate-800">{section.sectionName}</h4>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Spent: {section.spentTime}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock4 className="w-4 h-4" />
                    <span>Expected: {section.expectedTime}m</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="text-sm font-medium text-slate-600 flex items-center gap-1">
                  <TimerReset className="w-4 h-4" />
                  {section.timeDifference > 0 
                    ? `${section.timeDifference}m diff` 
                    : 'On time'
                  }
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(section.status)}`}>
                  {section.status}
                </div>
              </div>
            </div>
          ))}
          
          {data.sectionTime.length === 0 && (
            <div className="text-center text-slate-500 py-4">No time tracking data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
