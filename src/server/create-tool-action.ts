import { z } from 'zod';

import { normalizeToolError } from '../shared/errors.js';
import type {
  InferToolOutput,
  ServerToolAction,
  ToolContextFactory,
  ToolDefinition
} from '../shared/types.js';

export interface CreateToolActionOptions<TContext> {
  getContext?: ToolContextFactory<TContext>;
}

export function createToolAction<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny | undefined = undefined,
  TContext = unknown
>(
  tool: ToolDefinition<TInputSchema, TOutputSchema>,
  handler: (
    input: z.output<TInputSchema>,
    context: TContext
  ) => Promise<InferToolOutput<ToolDefinition<TInputSchema, TOutputSchema>>> | InferToolOutput<ToolDefinition<TInputSchema, TOutputSchema>>,
  options: CreateToolActionOptions<TContext> = {}
): ServerToolAction<ToolDefinition<TInputSchema, TOutputSchema>> {
  return async (input: z.input<TInputSchema>) => {
    'use server';

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
  };
}
