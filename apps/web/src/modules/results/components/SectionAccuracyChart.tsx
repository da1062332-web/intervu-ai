import React from 'react';

export const SectionAccuracyChart = ({ data }: { data: Record<string, number> }) => {
  const entries = Object.entries(data || {});
  if (entries.length === 0) return <div className="text-gray-500">No data available</div>;

  return (
    <div className="space-y-4">
      {entries.map(([section, accuracy]) => (
        <div key={section}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700 capitalize">{section}</span>
            <span className="text-gray-500">{accuracy}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${accuracy >= 80 ? 'bg-green-500' : accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${accuracy}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};
