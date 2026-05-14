// Subset of the Playwright JSON reporter shape — only the fields the dashboard uses.

export type PwStatus = 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';
export type PwExpectedStatus = 'passed' | 'failed' | 'skipped' | 'flaky';

export interface PwTestError {
  message?: string;
  stack?: string;
  location?: { file: string; line: number; column: number };
}

export interface PwTestResult {
  status: PwStatus;
  duration: number;
  errors?: PwTestError[];
  retry?: number;
  workerIndex?: number;
}

export interface PwTest {
  testId?: string;
  projectId?: string;
  projectName?: string;
  expectedStatus: PwExpectedStatus;
  results: PwTestResult[];
  annotations?: { type: string; description?: string }[];
}

export interface PwSpec {
  title: string;
  ok: boolean;
  tags?: string[];
  tests: PwTest[];
  file?: string;
  line?: number;
}

export interface PwSuite {
  title: string;
  file?: string;
  suites?: PwSuite[];
  specs?: PwSpec[];
}

export interface PwStats {
  startTime?: string;
  duration?: number;
  expected?: number;
  unexpected?: number;
  flaky?: number;
  skipped?: number;
}

export interface PwReport {
  config?: { rootDir?: string; version?: string };
  suites: PwSuite[];
  errors?: PwTestError[];
  stats?: PwStats;
}

// --- Dashboard's flattened view ---

export type Outcome = 'passed' | 'failed' | 'flaky' | 'skipped';

export interface FlatTest {
  id: string;
  file: string;
  suite: string;
  title: string;
  project: string;
  outcome: Outcome;
  durationMs: number;
  retries: number;
  errorMessage?: string;
  tags: string[];
}

export interface Summary {
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  passRate: number;
  totalDurationMs: number;
  startedAt?: string;
}
