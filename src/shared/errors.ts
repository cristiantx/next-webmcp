export type ToolErrorCode = 'INVALID_INPUT' | 'INVALID_OUTPUT' | 'HANDLER_ERROR' | 'INTERNAL_ERROR';

export interface ToolErrorShape {
  code: ToolErrorCode;
  message: string;
  cause?: unknown;
}

/**
 * Error thrown when a tool execution fails.
 * Preserves the original error stack trace when available.
 */
export class ToolExecutionError extends Error {
  readonly code: ToolErrorCode;
  readonly cause?: unknown;

  constructor({ code, message, cause }: ToolErrorShape) {
    super(message);
    this.name = 'ToolExecutionError';
    this.code = code;
    this.cause = cause;

    // Preserve the original stack trace if cause is an Error
    if (cause instanceof Error && cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Normalizes an unknown error into a ToolExecutionError with proper context.
 * Preserves the original error as the cause and includes helpful context in the message.
 *
 * @param error - The error to normalize
 * @param code - The error code categorizing the failure
 * @param fallbackMessage - Message to use if error is not an Error instance
 * @returns A ToolExecutionError with full context
 */
export function normalizeToolError(
  error: unknown,
  code: ToolErrorCode,
  fallbackMessage: string
): ToolExecutionError {
  if (error instanceof ToolExecutionError) {
    return error;
  }

  if (error instanceof Error) {
    return new ToolExecutionError({
      code,
      message: error.message || fallbackMessage,
      cause: error
    });
  }

  return new ToolExecutionError({
    code,
    message: fallbackMessage,
    cause: error
  });
}
