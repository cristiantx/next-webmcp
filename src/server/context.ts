import { randomUUID } from 'node:crypto';

import type { ToolContextFactory, ToolHandlerContext } from '../shared/types.js';

export interface CreateToolContextOptions<TAuth = unknown> {
  getAuth?: ToolContextFactory<TAuth | null>;
  getMetadata?: ToolContextFactory<Record<string, unknown>>;
  createRequestId?: () => string;
}

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
