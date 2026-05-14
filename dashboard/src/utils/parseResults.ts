import {
  FlatTest,
  Outcome,
  PwAttachment,
  PwReport,
  PwSpec,
  PwSuite,
  PwTest,
  PwTestResult,
  Summary,
  TestArtifact,
} from '../types';

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

/**
 * Convert a Playwright attachment path on disk into a URL the dashboard can fetch.
 * Strategy: take the segment after the project root and prefix with `/test-results`
 * so the Vite middleware (configured in vite.config.ts) can serve the file.
 * Falls back to using the raw path if no project root marker is found.
 */
const toArtifactUrl = (rawPath: string): string => {
  const normalised = rawPath.replace(/\\/g, '/');
  const marker = '/test-results/';
  const idx = normalised.lastIndexOf(marker);
  if (idx !== -1) {
    return normalised.slice(idx);
  }
  // Already a relative URL from a sample fixture, or pre-prefixed.
  if (normalised.startsWith('/')) return normalised;
  return `/${normalised}`;
};

const toArtifact = (att: PwAttachment): TestArtifact | null => {
  if (!att.path) return null;
  return {
    url: toArtifactUrl(att.path),
    name: att.name,
    contentType: att.contentType,
  };
};

const pickArtifacts = (
  result: PwTestResult | undefined,
): { video?: TestArtifact; screenshots: TestArtifact[]; trace?: TestArtifact } => {
  if (!result?.attachments?.length) return { screenshots: [] };

  let video: TestArtifact | undefined;
  let trace: TestArtifact | undefined;
  const screenshots: TestArtifact[] = [];

  for (const att of result.attachments) {
    const artifact = toArtifact(att);
    if (!artifact) continue;

    if (att.contentType.startsWith('video/') || att.name === 'video') {
      video = artifact;
    } else if (att.contentType.startsWith('image/') || att.name.startsWith('screenshot')) {
      screenshots.push(artifact);
    } else if (att.name === 'trace' || att.contentType === 'application/zip') {
      trace = artifact;
    }
  }

  return { video, screenshots, trace };
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
  const { video, screenshots, trace } = pickArtifacts(lastResult);

  const project = test.projectName ?? test.projectId ?? 'default';
  const file = spec.file ?? suite.file ?? '(unknown file)';

  return {
    id: `${file}::${titles.join(' › ')}::${spec.title}::${project}`,
    file,
    suite: titles.join(' › ') || '(root)',
    title: spec.title,
    project,
    outcome,
    durationMs: lastResult?.duration ?? 0,
    retries: Math.max(0, test.results.length - 1),
    errorMessage: lastResult?.errors?.[0]?.message,
    errorStack: lastResult?.errors?.[0]?.stack,
    tags: extractTags(spec.title, spec.tags),
    video,
    screenshots,
    trace,
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
  const withVideo = tests.filter((t) => t.video).length;
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
    withVideo,
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

export const testsWithVideo = (tests: FlatTest[]): FlatTest[] =>
  tests.filter((t) => t.video !== undefined);
