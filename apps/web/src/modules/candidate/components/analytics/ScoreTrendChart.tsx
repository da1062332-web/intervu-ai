'use client';

import React, { useState } from 'react';

interface ScorePoint {
  date: string;
  score: number;
  label?: string;
}

interface ScoreTrendChartProps {
  data: ScorePoint[];
  height?: string;
}

export const ScoreTrendChart = React.memo(function ScoreTrendChart({
  data,
  height = '260px',
}: ScoreTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className='flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/60 p-6 text-center'
        style={{ height }}
      >
        <p className='text-sm font-semibold text-foreground/80'>
          No score trend data available yet
        </p>
        <p className='text-xs text-muted-foreground mt-1'>
          Complete assessments to view your historical performance timeline.
        </p>
      </div>
    );
  }

  // 1. Sort data chronologically by date
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // 2. Take the most recent items
  const displayData = sortedData.slice(-8);

  const scores = displayData.map((d) => d.score);
  const lowest = scores.length > 0 ? Math.min(...scores) : 0;
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const peak = scores.length > 0 ? Math.max(...scores) : 0;

  // Y-axis grid levels (0 to 100)
  const yTicks = [100, 75, 50, 25, 0];

  const firstDateMs =
    displayData.length > 0 && displayData[0].date && !isNaN(new Date(displayData[0].date).getTime())
      ? new Date(displayData[0].date).getTime()
      : Date.now();

  const getPointLabel = (p: ScorePoint, i: number, total: number) => {
    if (total <= 3 && p.date && !isNaN(new Date(p.date).getTime())) {
      const dayDiff = Math.max(
        0,
        Math.round((new Date(p.date).getTime() - firstDateMs) / (1000 * 60 * 60 * 24)),
      );
      return `Day ${dayDiff} (Test ${i + 1})`;
    }
    return `Test ${i + 1}`;
  };

  const svgWidth = 500;
  const svgHeight = 175;
  const paddingLeft = 45;
  const paddingRight = 35;
  const paddingTop = 28;
  const paddingBottom = 32;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const points = displayData.map((d, i) => {
    const x =
      displayData.length === 1
        ? paddingLeft + chartWidth / 2
        : paddingLeft + (i / (displayData.length - 1)) * chartWidth;
    const y = paddingTop + (1 - Math.max(0, Math.min(100, d.score)) / 100) * chartHeight;
    return { x, y, ...d };
  });

  const pathD =
    points.length === 1
      ? `M ${points[0].x} ${points[0].y}`
      : points.reduce((acc, p, i) => {
          if (i === 0) return `M ${p.x} ${p.y}`;
          const prev = points[i - 1];
          const cx1 = prev.x + (p.x - prev.x) / 2;
          const cy1 = prev.y;
          const cx2 = prev.x + (p.x - prev.x) / 2;
          const cy2 = p.y;
          return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
        }, '');

  return (
    <div className='w-full flex flex-col space-y-3 select-none'>
      {/* Chart Container */}
      <div className='relative w-full bg-muted/10 rounded-2xl border border-border/40 p-3 pt-4'>
        {/* Floating Tooltip on Hover */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            className='absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full px-3 py-2 rounded-xl bg-slate-900/95 dark:bg-[#0b1220]/95 border border-cyan-500/30 text-white shadow-xl shadow-cyan-950/40 backdrop-blur-md transition-all duration-100 max-w-[220px]'
            style={{
              left: `${(points[hoveredIdx].x / svgWidth) * 100}%`,
              top: `${Math.max(10, (points[hoveredIdx].y / svgHeight) * 100 - 15)}%`,
            }}
          >
            <div className='text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider'>
              {`Test ${hoveredIdx + 1}`}
            </div>
            <div
              className='text-xs font-bold text-slate-100 truncate mt-0.5'
              title={points[hoveredIdx].label}
            >
              {points[hoveredIdx].label || `Assessment #${hoveredIdx + 1}`}
            </div>
            <div className='flex items-center gap-2 mt-1 text-[11px] font-mono'>
              <span className='font-extrabold text-cyan-400'>{points[hoveredIdx].score}%</span>
              {points[hoveredIdx].date && !isNaN(new Date(points[hoveredIdx].date).getTime()) && (
                <span className='text-muted-foreground text-[10px]'>
                  •{' '}
                  {new Date(points[hoveredIdx].date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className='w-full h-auto overflow-visible'
        >
          {/* Grid lines & tick labels */}
          {yTicks.map((tick) => {
            const y = paddingTop + (1 - tick / 100) * chartHeight;
            return (
              <g key={tick}>
                <text
                  x={paddingLeft - 10}
                  y={y + 3.5}
                  fontSize='9'
                  fontFamily='monospace'
                  fill='currentColor'
                  className='text-muted-foreground/60'
                  textAnchor='end'
                >
                  {tick}%
                </text>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke='currentColor'
                  className='text-border/40'
                  strokeDasharray='3 3'
                  strokeWidth='1'
                />
              </g>
            );
          })}

          {/* Area fill under curve */}
          {points.length > 1 && (
            <path
              d={`${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`}
              fill='url(#trendGradient)'
              opacity='0.25'
            />
          )}

          <defs>
            <linearGradient id='trendGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='#38bdf8' stopOpacity='0.5' />
              <stop offset='100%' stopColor='#6366f1' stopOpacity='0' />
            </linearGradient>
            <linearGradient id='strokeGradient' x1='0' y1='0' x2='1' y2='0'>
              <stop offset='0%' stopColor='#38bdf8' />
              <stop offset='100%' stopColor='#818cf8' />
            </linearGradient>
          </defs>

          {/* Trend line */}
          <path
            d={pathD}
            fill='none'
            stroke='url(#strokeGradient)'
            strokeWidth='3'
            strokeLinecap='round'
          />

          {/* Interactive points */}
          {points.map((p, i) => (
            <g
              key={i}
              className='cursor-pointer group'
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r='6'
                fill='#0f172a'
                stroke='#38bdf8'
                strokeWidth='2.5'
                className='transition-transform hover:scale-125'
              />
              <circle cx={p.x} cy={p.y} r='2.5' fill='#38bdf8' />

              {/* Score pill directly above point */}
              <g transform={`translate(${p.x}, ${p.y - 12})`}>
                <rect
                  x='-16'
                  y='-12'
                  width='32'
                  height='14'
                  rx='4'
                  fill='#1e293b'
                  stroke='#475569'
                  strokeWidth='0.8'
                />
                <text
                  x='0'
                  y='-2'
                  fontSize='8.5'
                  fontWeight='bold'
                  fill='#f8fafc'
                  textAnchor='middle'
                >
                  {p.score}%
                </text>
              </g>

              {/* Clean X-axis label */}
              <text
                x={p.x}
                y={svgHeight - 8}
                fontSize='8.5'
                fontFamily='monospace'
                fill='currentColor'
                className='text-muted-foreground/80 font-medium'
                textAnchor='middle'
              >
                {getPointLabel(p, i, displayData.length)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Bottom Summary Stats Row */}
      <div className='flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40 px-1 font-medium'>
        <span>
          Lowest: <strong className='text-foreground'>{lowest}%</strong>
        </span>
        <span>
          Average Accuracy: <strong className='text-foreground'>{avg}%</strong>
        </span>
        <span>
          Peak: <strong className='text-foreground'>{peak}%</strong>
        </span>
      </div>
    </div>
  );
});
