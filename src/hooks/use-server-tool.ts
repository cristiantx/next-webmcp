'use client';

import { useWebMCP } from '@mcp-b/react-webmcp';
import { type DependencyList } from 'react';
import { z } from 'zod';

import { normalizeToolError, type ToolExecutionError } from '../shared/errors.js';
import type {
  InferToolInput,
  InferToolOutput,
  ServerToolAction,
  ToolDefinition
} from '../shared/types.js';

export interface UseServerToolOptions<TTool extends ToolDefinition<z.AnyZodObject, z.AnyZodObject | undefined>> {
  enabled?: boolean;
  deps?: DependencyList;
  onSuccess?: (result: InferToolOutput<TTool>, input: InferToolInput<TTool>) => void;
  onError?: (error: ToolExecutionError, input: z.input<TTool['inputSchema']>) => void;
}

/**
 * Hook that registers a server action as a WebMCP tool.
 *
 * @example
 * ```tsx
 * 'use client';
 * import { useServerTool } from 'next-webmcp';
 *
 * export function MyTools() {
 *   useServerTool(createTaskTool, createTaskAction);
 *   return null;
 * }
 * ```
 *
 * @param tool - The tool definition with schemas
 * @param action - The Server Action created by createToolAction
 * @param options - Optional configuration for enabled state, callbacks, and dependencies
 */
export function useServerTool<TTool extends ToolDefinition<z.AnyZodObject, z.AnyZodObject | undefined>>(
  tool: TTool,
  action: ServerToolAction<TTool>,
  options: UseServerToolOptions<TTool> = {}
) {
  const { enabled = true, deps, onError, onSuccess } = options;

  return useWebMCP(
    {
      name: tool.name,
      description: tool.description ?? `Execute ${tool.name}`,
      inputSchema: tool.inputSchema.shape,
      outputSchema: tool.outputSchema?.shape,
      handler: async (input: unknown) => {
        const typedInput = input as z.input<TTool['inputSchema']>;

        if (!enabled) {
          const disabledError = normalizeToolError(
            new Error(`Tool "${tool.name}" is disabled.`),
            'HANDLER_ERROR',
            `Tool "${tool.name}" is disabled.`
          );
          onError?.(disabledError, typedInput);
          throw disabledError;
        }

        try {
          const result = await action(typedInput);
          onSuccess?.(result as InferToolOutput<TTool>, typedInput as InferToolInput<TTool>);
          return result as InferToolOutput<TTool>;
        } catch (error) {
          const normalizedError = normalizeToolError(
            error,
            'HANDLER_ERROR',
            `Tool "${tool.name}" execution failed.`
          );
          onError?.(normalizedError, typedInput);
          throw normalizedError;
        }
      }
    },
    deps
  );
}
