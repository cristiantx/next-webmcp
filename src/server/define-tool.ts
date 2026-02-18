import { z } from 'zod';

import type { ToolDefinition } from '../shared/types.js';

/**
 * Defines a typed tool with Zod schema validation for input and output.
 *
 * @example
 * ```ts
 * const createTaskTool = defineTool({
 *   name: 'create_task',
 *   description: 'Create a new task',
 *   inputSchema: z.object({ title: z.string() }),
 *   outputSchema: z.object({ id: z.string() })
 * });
 * ```
 *
 * @param tool - The tool definition with name, description, and schemas
 * @returns The typed tool definition
 */
export function defineTool<
  TInputSchema extends z.AnyZodObject,
  TOutputSchema extends z.AnyZodObject | undefined = undefined
>(tool: ToolDefinition<TInputSchema, TOutputSchema>): ToolDefinition<TInputSchema, TOutputSchema> {
  return tool;
}
