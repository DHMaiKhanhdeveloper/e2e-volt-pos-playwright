import { useMemo, useState } from 'react';
import { FlatTest, Outcome } from '../types';
import { fmtDuration, shortFile } from '../utils/format';
import { VideoPlayer } from './VideoPlayer';

interface Props {
  tests: FlatTest[];
}

type OutcomeFilter = 'all' | Outcome;

const outcomeChip: Record<Outcome, string> = {
  passed: 'badge badge-good',
  failed: 'badge badge-bad',
  flaky: 'badge badge-warn',
  skipped: 'badge badge-muted',
};

/**
 * Gallery of test runs that have an attached video. Default tab "all" shows
 * passes and fails side-by-side so engineers can review the create-order flow
 * (or any other tagged scenario) visually.
 */
export const TestRecordings = ({ tests }: Props) => {
  const withVideo = useMemo(() => tests.filter((t) => t.video), [tests]);

  const [filter, setFilter] = useState<OutcomeFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(withVideo[0]?.id ?? null);

  const filtered = useMemo(
    () => (filter === 'all' ? withVideo : withVideo.filter((t) => t.outcome === filter)),
    [withVideo, filter],
  );

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0];

  if (withVideo.length === 0) {
    return (
      <section className="card">
        <h2>Test recordings</h2>
        <div className="video-empty">
          <div className="video-empty-icon">▶</div>
          <p>No recordings in the current report.</p>
          <p className="subtle">
            Run <code>npm test</code> with <code>video: 'on'</code> in{' '}
            <code>playwright.config.ts</code> to capture videos for every test.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="recordings-header">
        <h2>
          Test recordings <span className="muted">({withVideo.length})</span>
        </h2>
        <div className="filter-pills" role="tablist">
          {(['all', 'failed', 'flaky', 'passed'] as OutcomeFilter[]).map((f) => {
            const count =
              f === 'all' ? withVideo.length : withVideo.filter((t) => t.outcome === f).length;
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                className={`filter-pill ${filter === f ? 'is-active' : ''} pill-${f}`}
                onClick={() => setFilter(f)}
                disabled={count === 0}
              >
                {f === 'all' ? 'All' : f}
                <span className="pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="recordings-layout">
        <ul className="recording-list" role="tablist">
          {filtered.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                role="tab"
                aria-selected={selected?.id === t.id}
                className={`recording-item recording-${t.outcome} ${
                  selected?.id === t.id ? 'is-active' : ''
                }`}
                onClick={() => setSelectedId(t.id)}
              >
                <span className={outcomeChip[t.outcome]}>{t.outcome}</span>
                <div className="recording-title">{t.title}</div>
                <div className="recording-meta">
                  <code>{shortFile(t.file)}</code> · {fmtDuration(t.durationMs)} · {t.project}
                </div>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="subtle" style={{ padding: 12 }}>
              No recordings match this filter.
            </li>
          )}
        </ul>

        <div className="recording-detail">
          {selected ? (
            <>
              <div className="recording-detail-head">
                <div>
                  <h3>{selected.title}</h3>
                  <p className="subtle">
                    {selected.suite} · <code>{shortFile(selected.file)}</code>
                  </p>
                </div>
                <span className={outcomeChip[selected.outcome]}>{selected.outcome}</span>
              </div>

              {selected.video && (
                <VideoPlayer
                  key={selected.id}
                  video={selected.video}
                  poster={selected.screenshots[0]?.url}
                />
              )}

              {selected.errorMessage && (
                <details className="error-block" open>
                  <summary>Failure details</summary>
                  <pre>{selected.errorMessage}</pre>
                </details>
              )}

              <dl className="recording-stats">
                <div>
                  <dt>Project</dt>
                  <dd>{selected.project}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{fmtDuration(selected.durationMs)}</dd>
                </div>
                <div>
                  <dt>Retries</dt>
                  <dd>{selected.retries}</dd>
                </div>
                <div>
                  <dt>Screenshots</dt>
                  <dd>{selected.screenshots.length}</dd>
                </div>
                <div>
                  <dt>Tags</dt>
                  <dd>
                    {selected.tags.map((t) => (
                      <span key={t} className="badge badge-tag">
                        {t}
                      </span>
                    ))}
                  </dd>
                </div>
                {selected.trace && (
                  <div>
                    <dt>Trace</dt>
                    <dd>
                      <a href={selected.trace.url} download>
                        Download .zip
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </>
          ) : (
            <p className="subtle">Select a test to view its recording.</p>
          )}
        </div>
      </div>
    </section>
  );
};
