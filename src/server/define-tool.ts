import { z } from 'zod';

import type { ToolDefinition } from '../shared/types.js';

export function defineTool<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny | undefined = undefined
>(tool: ToolDefinition<TInputSchema, TOutputSchema>): ToolDefinition<TInputSchema, TOutputSchema> {
  return tool;
}
