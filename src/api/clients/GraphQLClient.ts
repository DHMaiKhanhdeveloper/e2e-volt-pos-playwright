import { env } from '@configs/env/loadEnv';
import { Logger } from '@utils/logger';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: (string | number)[] }>;
}

export interface GraphQLRequestOptions {
  variables?: Record<string, unknown>;
  operationName?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

/**
 * Minimal GraphQL client using global fetch.
 * The Volt POS app exposes its GraphQL endpoint at <BASE_URL>/graphql.
 */
export class GraphQLClient {
  private readonly endpoint: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly logger = Logger.child({ module: 'GraphQLClient' });

  constructor(options: { endpoint?: string; headers?: Record<string, string> } = {}) {
    this.endpoint = options.endpoint ?? env.GRAPHQL_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  async query<T>(query: string, options: GraphQLRequestOptions = {}): Promise<T> {
    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? env.API_TIMEOUT);
      try {
        this.logger.debug(`POST ${this.endpoint} (${options.operationName ?? 'anonymous'})`);
        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers: { ...this.defaultHeaders, ...options.headers },
          body: JSON.stringify({
            query,
            variables: options.variables,
            operationName: options.operationName,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`GraphQL HTTP ${res.status}: ${await res.text()}`);
        }

        const json = (await res.json()) as GraphQLResponse<T>;
        if (json.errors?.length) {
          throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
        }
        if (json.data === undefined) {
          throw new Error('GraphQL response had no data and no errors');
        }
        return json.data;
      } catch (error) {
        lastError = error;
        // Only retry transient network failures — `fetch` itself rejecting
        // (Node "fetch failed" → TypeError, e.g. the dev server restarting or a
        // localhost/IPv6 blip) or an aborted request. HTTP/GraphQL errors are
        // real responses and must surface immediately.
        const isNetworkError = error instanceof TypeError;
        const isAbort = error instanceof Error && error.name === 'AbortError';
        if ((!isNetworkError && !isAbort) || attempt === maxAttempts) {
          throw error;
        }
        this.logger.warn(
          `fetch attempt ${attempt}/${maxAttempts} failed (${(error as Error).message}); retrying…`,
        );
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      } finally {
        clearTimeout(timeout);
      }
    }

    // Unreachable in practice (loop either returns or throws), but satisfies TS.
    throw lastError;
  }
}
