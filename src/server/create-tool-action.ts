import { z } from 'zod';

import { normalizeToolError } from '../shared/errors.js';
import type {
  InferToolOutput,
  ServerToolAction,
  ToolContextFactory,
  ToolDefinition
} from '../shared/types.js';

export interface ExecuteToolOptions<TContext> {
  getContext?: ToolContextFactory<TContext>;
}

export type CreateToolActionOptions<TContext> = ExecuteToolOptions<TContext>;

export async function executeTool<
  TInputSchema extends z.AnyZodObject,
  TOutputSchema extends z.AnyZodObject | undefined = undefined,
  TContext = unknown
>(
  tool: ToolDefinition<TInputSchema, TOutputSchema>,
  input: z.input<TInputSchema>,
  handler: (
    input: z.output<TInputSchema>,
    context: TContext
  ) =>
    | Promise<InferToolOutput<ToolDefinition<TInputSchema, TOutputSchema>>>
    | InferToolOutput<ToolDefinition<TInputSchema, TOutputSchema>>,
  options: ExecuteToolOptions<TContext> = {}
): Promise<InferToolOutput<ToolDefinition<TInputSchema, TOutputSchema>>> {
  let parsedInput: z.output<TInputSchema>;
  try {
    parsedInput = tool.inputSchema.parse(input);
  } catch (error) {
    throw normalizeToolError(error, 'INVALID_INPUT', `Invalid input for tool "${tool.name}".`);
  }

  const context = options.getContext
    ? await Promise.resolve(options.getContext())
    : (undefined as unknown as TContext);

  let result: unknown;
  try {
    result = await handler(parsedInput, context);
  } catch (error) {
    throw normalizeToolError(error, 'HANDLER_ERROR', `Tool "${tool.name}" execution failed.`);
  }

  if (!tool.outputSchema) {
    return result as InferToolOutput<ToolDefinition<TInputSchema, TOutputSchema>>;
  }

  try {
    return tool.outputSchema.parse(result) as InferToolOutput<ToolDefinition<TInputSchema, TOutputSchema>>;
  } catch (error) {
    throw normalizeToolError(error, 'INVALID_OUTPUT', `Invalid output for tool "${tool.name}".`);
  }
}

/**
 * Creates a function wrapper around {@link executeTool}.
 *
 * Prefer exporting a top-level server action and calling {@link executeTool}
 * inside it in Next.js App Router:
 *
 * ```ts
 * 'use server';
 *
 * export async function myAction(input: InferToolActionInput<typeof myTool>) {
 *   return executeTool(myTool, input, handler, { getContext });
 * }
 * ```
 *
 * @example
 * ```ts
 * const action = createToolAction(myTool, handler, { getContext });
 * ```
 */
export function createToolAction<
  TInputSchema extends z.AnyZodObject,
  TOutputSchema extends z.AnyZodObject | undefined = undefined,
  TContext = unknown
>(
  tool: ToolDefinition<TInputSchema, TOutputSchema>,
  handler: (
    input: z.output<TInputSchema>,
    context: TContext
  ) => Promise<InferToolOutput<ToolDefinition<TInputSchema, TOutputSchema>>> | InferToolOutput<ToolDefinition<TInputSchema, TOutputSchema>>,
  options: CreateToolActionOptions<TContext> = {}
): ServerToolAction<ToolDefinition<TInputSchema, TOutputSchema>> {
  return async (input: z.input<TInputSchema>) =>
    executeTool(tool, input, handler, options);
}
