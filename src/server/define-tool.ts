import { z } from 'zod';

import type { ToolDefinition } from '../shared/types.js';

export function defineTool<
  TInputSchema extends z.AnyZodObject,
  TOutputSchema extends z.AnyZodObject | undefined = undefined
>(tool: ToolDefinition<TInputSchema, TOutputSchema>): ToolDefinition<TInputSchema, TOutputSchema> {
  return tool;
}
