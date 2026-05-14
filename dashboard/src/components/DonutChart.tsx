import { Summary } from '../types';
import { fmtPct } from '../utils/format';

interface Props {
  summary: Summary;
}

interface Slice {
  label: string;
  value: number;
  color: string;
}

/**
 * Dependency-free donut chart in SVG.
 * Each slice is drawn with a stroke-dasharray trick on a circle.
 */
export const DonutChart = ({ summary }: Props) => {
  const slices: Slice[] = [
    { label: 'Passed', value: summary.passed, color: 'var(--c-good)' },
    { label: 'Failed', value: summary.failed, color: 'var(--c-bad)' },
    { label: 'Flaky', value: summary.flaky, color: 'var(--c-warn)' },
    { label: 'Skipped', value: summary.skipped, color: 'var(--c-muted)' },
  ];

  const total = summary.total || 1;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg
        viewBox="0 0 200 200"
        className="donut-svg"
        role="img"
        aria-label="Pass/fail donut chart"
      >
        <circle cx="100" cy="100" r={radius} className="donut-track" />
        {slices.map((s) => {
          const length = (s.value / total) * circumference;
          const dasharray = `${length} ${circumference - length}`;
          const dashoffset = -offset;
          offset += length;
          return s.value > 0 ? (
            <circle
              key={s.label}
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke={s.color}
              strokeWidth="22"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              transform="rotate(-90 100 100)"
            />
          ) : null;
        })}
        <text x="100" y="92" className="donut-pct" textAnchor="middle">
          {fmtPct(summary.passRate, 0)}
        </text>
        <text x="100" y="118" className="donut-label" textAnchor="middle">
          pass rate
        </text>
      </svg>
      <ul className="donut-legend">
        {slices.map((s) => (
          <li key={s.label}>
            <span className="legend-dot" style={{ background: s.color }} />
            <span className="legend-label">{s.label}</span>
            <span className="legend-value">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
