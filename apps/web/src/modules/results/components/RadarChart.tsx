import React from 'react';

export const RadarChart = ({ data }: { data: Record<string, number> }) => {
  const entries = Object.entries(data || {});
  if (entries.length === 0) {
    return (
      <div className='flex items-center justify-center py-8 text-xs font-semibold text-muted-foreground'>
        No performance overview data available
      </div>
    );
  }

  // Dimension calculations
  const size = 280;
  const center = size / 2;
  const radius = 80; // 80px radius leaves 60px padding on all sides for clear text labels

  const totalPoints = Math.max(entries.length, 3);
  const angleStep = (Math.PI * 2) / totalPoints;

  // Function to calculate (x, y) coordinates given score (0-100) and index
  const getPoint = (value: number, index: number) => {
    const clampedValue = Math.max(5, Math.min(100, value));
    const r = (clampedValue / 100) * radius;
    const angle = index * angleStep - Math.PI / 2; // Start at 12 o'clock
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const points = entries.map(([, value], index) => getPoint(value, index));
  const polygonPointsString = points.map((p) => `${p.x},${p.y}`).join(' ');

  const gridLevels = [25, 50, 75, 100];

  return (
    <div className='w-full flex justify-center items-center py-2 overflow-visible'>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className='w-full h-auto max-w-[260px] max-h-[260px] overflow-visible'
      >
        {/* Concentric Grid Lines */}
        {gridLevels.map((level) => {
          const levelPoints = Array.from({ length: totalPoints }).map((_, index) => {
            const r = (level / 100) * radius;
            const angle = index * angleStep - Math.PI / 2;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ');

          return (
            <polygon
              key={`grid-${level}`}
              points={levelPoints}
              fill='none'
              stroke='currentColor'
              strokeWidth='1'
              strokeDasharray={level === 100 ? undefined : '2,2'}
              className='text-slate-300 dark:text-slate-700'
            />
          );
        })}

        {/* Axes Lines */}
        {Array.from({ length: totalPoints }).map((_, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return (
            <line
              key={`axis-${index}`}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke='currentColor'
              strokeWidth='1'
              className='text-slate-300 dark:text-slate-700'
            />
          );
        })}

        {/* Data Polygon Fill & Outline */}
        <polygon
          points={polygonPointsString}
          fill='rgba(99, 102, 241, 0.25)'
          stroke='#6366f1'
          strokeWidth='2.5'
          strokeLinejoin='round'
        />

        {/* Data Points (Circles at Vertices) */}
        {points.map((p, index) => (
          <circle
            key={`vertex-${index}`}
            cx={p.x}
            cy={p.y}
            r='3.5'
            fill='#6366f1'
            stroke='#ffffff'
            strokeWidth='1.5'
          />
        ))}

        {/* Outer Section Labels */}
        {entries.map(([label], index) => {
          const angle = index * angleStep - Math.PI / 2;
          const labelRadius = radius + 20;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);

          // Calculate text alignment based on position relative to center
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          let textAnchor: 'middle' | 'start' | 'end' = 'middle';
          if (cos > 0.3) textAnchor = 'start';
          else if (cos < -0.3) textAnchor = 'end';

          let dominantBaseline: 'middle' | 'auto' | 'hanging' = 'middle';
          if (sin < -0.5) dominantBaseline = 'auto';
          else if (sin > 0.5) dominantBaseline = 'hanging';

          // Format clean short label without truncating abruptly
          const formattedLabel = label
            .replace(/ability/i, '')
            .replace(/advanced/i, 'Adv.')
            .trim();

          return (
            <text
              key={`label-${index}`}
              x={x}
              y={y}
              fontSize='11'
              textAnchor={textAnchor}
              dominantBaseline={dominantBaseline}
              className='fill-slate-700 dark:fill-slate-300 font-bold tracking-tight'
            >
              {formattedLabel || label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
