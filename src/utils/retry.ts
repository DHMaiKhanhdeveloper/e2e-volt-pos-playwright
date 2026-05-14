export interface RetryOptions {
  retries: number;
  delayMs: number;
  factor?: number;
  onAttemptFail?: (error: unknown, attempt: number) => void;
}

export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  let lastErr: unknown;
  let delay = opts.delayMs;
  for (let attempt = 1; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      opts.onAttemptFail?.(err, attempt);
      if (attempt < opts.retries) {
        await new Promise((r) => setTimeout(r, delay));
        if (opts.factor) delay = Math.floor(delay * opts.factor);
      }
    }
  }
  throw lastErr;
}
