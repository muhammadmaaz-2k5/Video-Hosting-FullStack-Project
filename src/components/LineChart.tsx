import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  data: { label: string; value: number }[];
  height?: number;
}

export function LineChart({ data, height = 200 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 600;
  const pad = { top: 16, right: 16, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: pad.left + i * stepX,
    y: pad.top + innerH - (d.value / max) * innerH,
    ...d,
  }));

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const areaPath = `${linePath} L ${pad.left + innerW} ${pad.top + innerH} L ${pad.left} ${pad.top + innerH} Z`;

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7941d" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f7941d" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => {
          const y = pad.top + innerH - t * innerH;
          const v = Math.round(max * t);
          return (
            <g key={t}>
              <line x1={pad.left} y1={y} x2={pad.left + innerW} y2={y} stroke="#2a2a2a" strokeWidth="1" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6b6b6b">
                {v}
              </text>
            </g>
          );
        })}

        <motion.path
          d={areaPath}
          fill="url(#chart-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="#f7941d"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {points.map((p, i) => (
          <g key={i}>
            <text x={p.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#6b6b6b">
              {p.label}
            </text>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#f7941d" />
            <rect
              x={p.x - stepX / 2}
              y={pad.top}
              width={stepX}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
            {hover === i && (
              <g>
                <line x1={p.x} y1={pad.top} x2={p.x} y2={pad.top + innerH} stroke="#f7941d" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                <circle cx={p.x} cy={p.y} r="5" fill="#f7941d" />
                <g transform={`translate(${Math.min(Math.max(p.x, 60), width - 60)}, ${Math.max(p.y - 50, 20)})`}>
                  <rect x="-50" y="0" width="100" height="36" rx="6" fill="#1a1a1a" stroke="#2a2a2a" />
                  <text x="0" y="14" textAnchor="middle" fontSize="10" fill="#9a9a9a">
                    {p.label}
                  </text>
                  <text x="0" y="28" textAnchor="middle" fontSize="13" fontWeight="700" fill="#f7941d">
                    {p.value} views
                  </text>
                </g>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
