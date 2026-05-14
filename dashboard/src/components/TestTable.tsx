import { Fragment, useMemo, useState } from 'react';
import { FlatTest, Outcome } from '../types';
import { fmtDuration, shortFile } from '../utils/format';
import { VideoPlayer } from './VideoPlayer';

interface Props {
  tests: FlatTest[];
}

type SortKey = 'title' | 'project' | 'durationMs' | 'outcome';

const outcomeBadge: Record<Outcome, string> = {
  passed: 'badge badge-good',
  failed: 'badge badge-bad',
  flaky: 'badge badge-warn',
  skipped: 'badge badge-muted',
};

export const TestTable = ({ tests }: Props) => {
  const [query, setQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | Outcome>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('outcome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expanded, setExpanded] = useState<string | null>(null);

  const projects = useMemo(() => {
    const set = new Set(tests.map((t) => t.project));
    return ['all', ...Array.from(set).sort()];
  }, [tests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tests.filter((t) => {
      if (outcomeFilter !== 'all' && t.outcome !== outcomeFilter) return false;
      if (projectFilter !== 'all' && t.project !== projectFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.suite.toLowerCase().includes(q) ||
        t.file.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [tests, query, outcomeFilter, projectFilter]);

  const sorted = useMemo(() => {
    const out = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    const outcomeRank: Record<Outcome, number> = {
      failed: 0,
      flaky: 1,
      passed: 2,
      skipped: 3,
    };
    out.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'project':
          cmp = a.project.localeCompare(b.project);
          break;
        case 'durationMs':
          cmp = a.durationMs - b.durationMs;
          break;
        case 'outcome':
          cmp = outcomeRank[a.outcome] - outcomeRank[b.outcome];
          break;
      }
      return cmp * dir;
    });
    return out;
  }, [filtered, sortKey, sortDir]);

  const setSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <section className="card">
      <div className="table-toolbar">
        <h2>
          Tests <span className="muted">({sorted.length})</span>
        </h2>
        <div className="filters">
          <input
            type="search"
            placeholder="Filter by title, suite, file, tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value as 'all' | Outcome)}
          >
            <option value="all">All outcomes</option>
            <option value="failed">Failed</option>
            <option value="flaky">Flaky</option>
            <option value="passed">Passed</option>
            <option value="skipped">Skipped</option>
          </select>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            {projects.map((p) => (
              <option key={p} value={p}>
                {p === 'all' ? 'All projects' : p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <button onClick={() => setSort('outcome')}>Outcome</button>
              </th>
              <th>
                <button onClick={() => setSort('title')}>Test</button>
              </th>
              <th>
                <button onClick={() => setSort('project')}>Project</button>
              </th>
              <th className="num">
                <button onClick={() => setSort('durationMs')}>Duration</button>
              </th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const isOpen = expanded === t.id;
              return (
                <Fragment key={t.id}>
                  <tr
                    className={`row row-${t.outcome} ${isOpen ? 'is-open' : ''}`}
                    onClick={() => setExpanded(isOpen ? null : t.id)}
                  >
                    <td>
                      <span className={outcomeBadge[t.outcome]}>{t.outcome}</span>
                      {t.retries > 0 && (
                        <span className="badge badge-muted" title={`${t.retries} retries`}>
                          ↻ {t.retries}
                        </span>
                      )}
                      {t.video && (
                        <span className="badge badge-info" title="Video recording available">
                          ▶ video
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="cell-title">{t.title}</div>
                      <div className="cell-sub">
                        {t.suite} · <code>{shortFile(t.file)}</code>
                      </div>
                    </td>
                    <td>{t.project}</td>
                    <td className="num">{fmtDuration(t.durationMs)}</td>
                    <td className="tags">
                      {t.tags.map((tag) => (
                        <span key={tag} className="badge badge-tag">
                          {tag}
                        </span>
                      ))}
                    </td>
                  </tr>
                  {isOpen && (t.video || t.errorMessage || t.screenshots.length > 0) && (
                    <tr className="row-detail">
                      <td colSpan={5}>
                        <div className="detail-grid">
                          {t.video && (
                            <VideoPlayer
                              key={`${t.id}-video`}
                              video={t.video}
                              poster={t.screenshots[0]?.url}
                              className="detail-video"
                            />
                          )}
                          {t.errorMessage && (
                            <pre className="detail-error">{t.errorMessage}</pre>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="subtle">
                  No tests match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
