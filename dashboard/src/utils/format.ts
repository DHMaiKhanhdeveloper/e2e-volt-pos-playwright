export const fmtDuration = (ms: number): string => {
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
};

export const fmtPct = (n: number, fractionDigits = 1): string => `${n.toFixed(fractionDigits)}%`;

export const fmtDate = (iso?: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

export const shortFile = (path: string): string => {
  const parts = path.split(/[\\/]/);
  return parts.slice(-2).join('/');
};
