import React from 'react';

export const RadarChart = ({ data }: { data: Record<string, number> }) => {
  const size = 300;
  const center = size / 2;
  const radius = center - 40;
  
  const entries = Object.entries(data || {});
  if (entries.length === 0) return <div className="flex items-center justify-center h-full text-gray-500">No data available</div>;

  const totalPoints = Math.max(entries.length, 3); // Minimum 3 points to form a polygon
  const angleStep = (Math.PI * 2) / totalPoints;

  const getPoint = (value: number, index: number) => {
    const r = (value / 100) * radius;
    const x = center + r * Math.sin(index * angleStep);
    const y = center - r * Math.cos(index * angleStep);
    return `${x},${y}`;
  };

  const polygonPoints = entries.map(([, value], index) => getPoint(value, index)).join(' ');
  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <div className="w-full flex justify-center items-center overflow-hidden">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto max-w-[300px]">
        {/* Grid */}
        {gridLevels.map((level) => (
          <polygon
            key={`grid-${level}`}
            points={entries.map((_, index) => getPoint(level, index)).join(' ')}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Axes */}
        {entries.map((_, index) => (
          <line
            key={`axis-${index}`}
            x1={center}
            y1={center}
            x2={center + radius * Math.sin(index * angleStep)}
            y2={center - radius * Math.cos(index * angleStep)}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Data Polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(79, 70, 229, 0.2)"
          stroke="#4f46e5"
          strokeWidth="2"
        />

        {/* Labels */}
        {entries.map(([label], index) => {
          const x = center + (radius + 20) * Math.sin(index * angleStep);
          const y = center - (radius + 20) * Math.cos(index * angleStep);
          return (
            <text
              key={`label-${index}`}
              x={x}
              y={y}
              fontSize="10"
              fill="#374151"
              textAnchor="middle"
              alignmentBaseline="middle"
              className="font-medium"
            >
              {label.length > 15 ? label.substring(0, 15) + '...' : label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
