import { z } from 'zod';

export type AnyInputSchema = z.AnyZodObject;
export type AnyOutputSchema = z.AnyZodObject | undefined;

export interface ToolDefinition<
  TInputSchema extends AnyInputSchema,
  TOutputSchema extends AnyOutputSchema = undefined
> {
  name: string;
  description?: string;
  inputSchema: TInputSchema;
  outputSchema?: TOutputSchema;
}

export type InferToolInput<TTool extends ToolDefinition<AnyInputSchema, AnyOutputSchema>> = z.output<
  TTool['inputSchema']
>;

export type InferToolActionInput<TTool extends ToolDefinition<AnyInputSchema, AnyOutputSchema>> = z.input<
  TTool['inputSchema']
>;

export type InferToolOutput<TTool extends ToolDefinition<AnyInputSchema, AnyOutputSchema>> =
  TTool['outputSchema'] extends z.AnyZodObject ? z.output<TTool['outputSchema']> : unknown;

export type ServerToolAction<TTool extends ToolDefinition<AnyInputSchema, AnyOutputSchema>> = (
  input: z.input<TTool['inputSchema']>
) => Promise<InferToolOutput<TTool>>;

export interface ToolHandlerContext<TAuth = unknown> {
  auth: TAuth | null;
  requestId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export type ToolContextFactory<TContext> = () => Promise<TContext> | TContext;
