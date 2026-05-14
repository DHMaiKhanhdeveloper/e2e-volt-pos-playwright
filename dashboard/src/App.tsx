import { useMemo, useState } from 'react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { DonutChart } from './components/DonutChart';
import { GroupedBar } from './components/GroupedBar';
import { TestTable } from './components/TestTable';
import { TestRecordings } from './components/TestRecordings';
import { useResults } from './hooks/useResults';
import { groupByFile, groupByProject } from './utils/parseResults';

type View = 'overview' | 'recordings' | 'table';

const App = () => {
  const { tests, summary, state, error, fileName, reload, loadFromFile } = useResults();
  const [view, setView] = useState<View>('overview');

  const byFile = useMemo(() => groupByFile(tests), [tests]);
  const byProject = useMemo(() => groupByProject(tests), [tests]);

  return (
    <div className="app">
      <Header
        startedAt={summary?.startedAt}
        fileName={fileName}
        onReload={reload}
        onLoadFile={loadFromFile}
      />

      {state === 'ready' && summary && (
        <nav className="view-tabs" role="tablist">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'recordings', label: `Recordings · ${summary.withVideo}` },
              { id: 'table', label: `All tests · ${summary.total}` },
            ] as { id: View; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={view === t.id}
              className={`view-tab ${view === t.id ? 'is-active' : ''}`}
              onClick={() => setView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}

      {state === 'loading' && <p className="subtle">Loading results…</p>}

      {state === 'error' && (
        <div className="card error">
          <h2>Could not load results</h2>
          <p>{error}</p>
          <p className="subtle">
            Tip: from the project root run <code>npm test</code> first, then open the dashboard. Or
            click <strong>Open file…</strong> above to load any <code>results.json</code>.
          </p>
        </div>
      )}

      {state === 'ready' && summary && (
        <>
          {view === 'overview' && (
            <>
              <SummaryCards summary={summary} />
              <section className="grid-2">
                <div className="card">
                  <h2>Pass / Fail distribution</h2>
                  <DonutChart summary={summary} />
                </div>
                <GroupedBar title="By project / browser" groups={byProject} />
              </section>
              <GroupedBar title="By spec file" groups={byFile} />
            </>
          )}

          {view === 'recordings' && <TestRecordings tests={tests} />}

          {view === 'table' && <TestTable tests={tests} />}

          <footer className="footer">
            <span className="subtle">
              Showing {tests.length} tests · {summary.passed} passed · {summary.failed} failed ·{' '}
              {summary.flaky} flaky · {summary.skipped} skipped · {summary.withVideo} with video
            </span>
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
