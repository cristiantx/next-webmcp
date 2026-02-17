import { z } from 'zod';

export type AnyZodSchema = z.ZodTypeAny;

export interface ToolDefinition<
  TInputSchema extends AnyZodSchema,
  TOutputSchema extends AnyZodSchema | undefined = undefined
> {
  name: string;
  description?: string;
  inputSchema: TInputSchema;
  outputSchema?: TOutputSchema;
}

export type InferToolInput<TTool extends ToolDefinition<AnyZodSchema, AnyZodSchema | undefined>> = z.output<
  TTool['inputSchema']
>;

export type InferToolOutput<TTool extends ToolDefinition<AnyZodSchema, AnyZodSchema | undefined>> =
  TTool['outputSchema'] extends AnyZodSchema ? z.output<TTool['outputSchema']> : unknown;

export type ServerToolAction<TTool extends ToolDefinition<AnyZodSchema, AnyZodSchema | undefined>> = (
  input: z.input<TTool['inputSchema']>
) => Promise<InferToolOutput<TTool>>;

export interface ToolHandlerContext<TAuth = unknown> {
  auth: TAuth | null;
  requestId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export type ToolContextFactory<TContext> = () => Promise<TContext> | TContext;
