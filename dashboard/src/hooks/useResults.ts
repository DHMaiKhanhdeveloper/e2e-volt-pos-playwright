import { useCallback, useEffect, useState } from 'react';
import { FlatTest, PwReport, Summary } from '../types';
import { flattenReport, summarise } from '../utils/parseResults';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface ResultsData {
  raw: PwReport | null;
  tests: FlatTest[];
  summary: Summary | null;
  state: LoadState;
  error: string | null;
  fileName: string | null;
  reload: () => void;
  loadFromFile: (file: File) => void;
}

const DEFAULT_RESULTS_PATH = '/results.json';

export const useResults = (): ResultsData => {
  const [raw, setRaw] = useState<PwReport | null>(null);
  const [tests, setTests] = useState<FlatTest[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const setReport = useCallback((report: PwReport, source: string) => {
    const flat = flattenReport(report);
    setRaw(report);
    setTests(flat);
    setSummary(summarise(flat, report));
    setFileName(source);
    setState('ready');
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setError(null);

    fetch(DEFAULT_RESULTS_PATH, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as PwReport;
      })
      .then((report) => {
        if (!cancelled) setReport(report, 'reports/json/results.json');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setState('error');
        setError(
          `Could not load results.json (${msg}). ` +
            `Run "npm test" to generate it, or drop a results.json into the dashboard.`,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [version, setReport]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const loadFromFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result ?? '');
          const json = JSON.parse(text) as PwReport;
          setReport(json, file.name);
        } catch (err) {
          setState('error');
          setError(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
        }
      };
      reader.onerror = () => {
        setState('error');
        setError('Failed to read file.');
      };
      reader.readAsText(file);
    },
    [setReport],
  );

  return { raw, tests, summary, state, error, fileName, reload, loadFromFile };
};
