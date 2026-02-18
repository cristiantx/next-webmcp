import { randomUUID } from 'node:crypto';

import type { ToolContextFactory, ToolHandlerContext } from '../shared/types.js';

export interface CreateToolContextOptions<TAuth = unknown> {
  getAuth?: ToolContextFactory<TAuth | null>;
  getMetadata?: ToolContextFactory<Record<string, unknown>>;
  createRequestId?: () => string;
}

/**
 * Creates a context factory for tool handlers with auth, metadata, and request tracking.
 *
 * @example
 * ```ts
 * const getContext = createToolContext({
 *   getAuth: async () => ({ userId: '123' }),
 *   getMetadata: async () => ({ source: 'api' }),
 *   createRequestId: () => 'req-123'
 * });
 * ```
 *
 * @param options - Configuration for auth, metadata, and request ID generation
 * @returns A factory function that creates context objects
 */
export function createToolContext<TAuth = unknown>(
  options: CreateToolContextOptions<TAuth> = {}
): ToolContextFactory<ToolHandlerContext<TAuth>> {
  const {
    getAuth = () => null,
    getMetadata = () => ({}),
    createRequestId = () => randomUUID()
  } = options;

  return async () => {
    const [auth, metadata] = await Promise.all([Promise.resolve(getAuth()), Promise.resolve(getMetadata())]);

    return {
      auth,
      metadata,
      requestId: createRequestId(),
      createdAt: new Date().toISOString()
    };
  };
}
