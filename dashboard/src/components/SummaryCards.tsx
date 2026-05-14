import { Summary } from '../types';
import { fmtDuration, fmtPct } from '../utils/format';

interface Props {
  summary: Summary;
}

const Card = ({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string | number;
  tone?: 'good' | 'bad' | 'warn' | 'info';
  hint?: string;
}) => (
  <div className={`stat-card stat-${tone ?? 'info'}`}>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    {hint ? <div className="stat-hint">{hint}</div> : null}
  </div>
);

export const SummaryCards = ({ summary }: Props) => (
  <section className="stat-grid">
    <Card label="Total tests" value={summary.total} tone="info" />
    <Card label="Passed" value={summary.passed} tone="good" />
    <Card label="Failed" value={summary.failed} tone="bad" />
    <Card label="Flaky" value={summary.flaky} tone="warn" />
    <Card label="Skipped" value={summary.skipped} tone="info" />
    <Card
      label="Pass rate"
      value={fmtPct(summary.passRate)}
      tone={summary.failed === 0 ? 'good' : summary.passRate >= 90 ? 'warn' : 'bad'}
      hint="passed + flaky / (total − skipped)"
    />
    <Card label="Total duration" value={fmtDuration(summary.totalDurationMs)} tone="info" />
    <Card label="Recordings" value={summary.withVideo} tone="info" hint="Tests with video" />
  </section>
);
