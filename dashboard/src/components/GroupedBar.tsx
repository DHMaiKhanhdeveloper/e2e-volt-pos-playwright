import { FlatTest } from '../types';

interface Props {
  title: string;
  groups: Map<string, FlatTest[]>;
}

/**
 * Stacked horizontal bar chart per group (file or project).
 * No chart lib — just flex divs.
 */
export const GroupedBar = ({ title, groups }: Props) => {
  const rows = Array.from(groups.entries()).map(([name, list]) => {
    const passed = list.filter((t) => t.outcome === 'passed').length;
    const failed = list.filter((t) => t.outcome === 'failed').length;
    const flaky = list.filter((t) => t.outcome === 'flaky').length;
    const skipped = list.filter((t) => t.outcome === 'skipped').length;
    return { name, total: list.length, passed, failed, flaky, skipped };
  });

  // Sort: most failures first, then most tests.
  rows.sort((a, b) => b.failed - a.failed || b.total - a.total);

  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="bars">
        {rows.map((r) => (
          <div key={r.name} className="bar-row">
            <div className="bar-name" title={r.name}>
              {r.name}
            </div>
            <div className="bar-track" role="img" aria-label={`${r.name} results`}>
              {r.passed > 0 && (
                <div
                  className="bar-seg bar-good"
                  style={{ flex: r.passed }}
                  title={`${r.passed} passed`}
                >
                  {r.passed}
                </div>
              )}
              {r.flaky > 0 && (
                <div
                  className="bar-seg bar-warn"
                  style={{ flex: r.flaky }}
                  title={`${r.flaky} flaky`}
                >
                  {r.flaky}
                </div>
              )}
              {r.failed > 0 && (
                <div
                  className="bar-seg bar-bad"
                  style={{ flex: r.failed }}
                  title={`${r.failed} failed`}
                >
                  {r.failed}
                </div>
              )}
              {r.skipped > 0 && (
                <div
                  className="bar-seg bar-muted"
                  style={{ flex: r.skipped }}
                  title={`${r.skipped} skipped`}
                >
                  {r.skipped}
                </div>
              )}
            </div>
            <div className="bar-total">{r.total}</div>
          </div>
        ))}
        {rows.length === 0 && <p className="subtle">No data.</p>}
      </div>
    </section>
  );
};
