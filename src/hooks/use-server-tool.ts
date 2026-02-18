'use client';

import { useWebMCP } from '@mcp-b/react-webmcp';
import { type DependencyList, useCallback, useRef } from 'react';
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
 * Uses refs for `enabled`, `onSuccess`, and `onError` to avoid stale closures
 * without requiring them in the dependency array passed to `useWebMCP`.
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

  // Use refs to avoid stale closures — these values are read inside the handler
  // but should not force handler re-creation when they change.
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const handler = useCallback(
    async (input: unknown) => {
      const typedInput = input as z.input<TTool['inputSchema']>;

      if (!enabledRef.current) {
        const disabledError = normalizeToolError(
          new Error(`Tool "${tool.name}" is disabled.`),
          'HANDLER_ERROR',
          `Tool "${tool.name}" is disabled.`
        );
        onErrorRef.current?.(disabledError, typedInput);
        throw disabledError;
      }

      try {
        const result = await action(typedInput);
        onSuccessRef.current?.(result as InferToolOutput<TTool>, typedInput as InferToolInput<TTool>);
        return result as InferToolOutput<TTool>;
      } catch (error) {
        const normalizedError = normalizeToolError(
          error,
          'HANDLER_ERROR',
          `Tool "${tool.name}" execution failed.`
        );
        onErrorRef.current?.(normalizedError, typedInput);
        throw normalizedError;
      }
    },
    // action is a stable server action reference; tool.name is a string primitive
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action, tool.name]
  );

  return useWebMCP(
    {
      name: tool.name,
      description: tool.description ?? `Execute ${tool.name}`,
      inputSchema: tool.inputSchema.shape,
      outputSchema: tool.outputSchema?.shape,
      handler
    },
    deps
  );
}
