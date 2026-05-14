import { FlatTest, Outcome, PwReport, PwSpec, PwSuite, PwTest, Summary } from '../types';

const classifyOutcome = (test: PwTest): Outcome => {
  const lastResult = test.results[test.results.length - 1];
  if (!lastResult) return 'skipped';

  if (test.expectedStatus === 'skipped' || lastResult.status === 'skipped') return 'skipped';

  const finalStatus = lastResult.status;
  const passed = finalStatus === 'passed';

  // Flaky = eventually passed, but had failed attempts before.
  if (passed && test.results.length > 1) {
    const hadFailure = test.results
      .slice(0, -1)
      .some((r) => r.status === 'failed' || r.status === 'timedOut');
    if (hadFailure) return 'flaky';
  }

  return passed ? 'passed' : 'failed';
};

const extractTags = (title: string, declared?: string[]): string[] => {
  const fromTitle = Array.from(title.matchAll(/@[\w-]+/g)).map((m) => m[0]);
  const set = new Set<string>([...(declared ?? []), ...fromTitle]);
  return Array.from(set);
};

const walkSuites = (suites: PwSuite[], parentTitles: string[], acc: FlatTest[]): void => {
  for (const suite of suites) {
    const titles = [...parentTitles, suite.title].filter(Boolean);

    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          acc.push(flattenSpec(spec, test, titles, suite));
        }
      }
    }

    if (suite.suites?.length) {
      walkSuites(suite.suites, titles, acc);
    }
  }
};

const flattenSpec = (spec: PwSpec, test: PwTest, titles: string[], suite: PwSuite): FlatTest => {
  const outcome = classifyOutcome(test);
  const lastResult = test.results[test.results.length - 1];
  return {
    id: `${spec.file ?? suite.file ?? ''}::${titles.join(' › ')}::${spec.title}::${test.projectName ?? test.projectId ?? ''}`,
    file: spec.file ?? suite.file ?? '(unknown file)',
    suite: titles.join(' › ') || '(root)',
    title: spec.title,
    project: test.projectName ?? test.projectId ?? 'default',
    outcome,
    durationMs: lastResult?.duration ?? 0,
    retries: Math.max(0, test.results.length - 1),
    errorMessage: lastResult?.errors?.[0]?.message,
    tags: extractTags(spec.title, spec.tags),
  };
};

export const flattenReport = (report: PwReport): FlatTest[] => {
  const acc: FlatTest[] = [];
  walkSuites(report.suites ?? [], [], acc);
  return acc;
};

export const summarise = (tests: FlatTest[], report?: PwReport): Summary => {
  const total = tests.length;
  const passed = tests.filter((t) => t.outcome === 'passed').length;
  const failed = tests.filter((t) => t.outcome === 'failed').length;
  const flaky = tests.filter((t) => t.outcome === 'flaky').length;
  const skipped = tests.filter((t) => t.outcome === 'skipped').length;
  const totalDurationMs = tests.reduce((sum, t) => sum + t.durationMs, 0);
  const denominator = total - skipped;
  const passRate = denominator === 0 ? 0 : ((passed + flaky) / denominator) * 100;

  return {
    total,
    passed,
    failed,
    flaky,
    skipped,
    passRate,
    totalDurationMs,
    startedAt: report?.stats?.startTime,
  };
};

export const groupByFile = (tests: FlatTest[]): Map<string, FlatTest[]> => {
  const out = new Map<string, FlatTest[]>();
  for (const t of tests) {
    const list = out.get(t.file) ?? [];
    list.push(t);
    out.set(t.file, list);
  }
  return out;
};

export const groupByProject = (tests: FlatTest[]): Map<string, FlatTest[]> => {
  const out = new Map<string, FlatTest[]>();
  for (const t of tests) {
    const list = out.get(t.project) ?? [];
    list.push(t);
    out.set(t.project, list);
  }
  return out;
};
