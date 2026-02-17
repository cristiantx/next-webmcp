export type ToolErrorCode = 'INVALID_INPUT' | 'INVALID_OUTPUT' | 'HANDLER_ERROR' | 'INTERNAL_ERROR';

export interface ToolErrorShape {
  code: ToolErrorCode;
  message: string;
  cause?: unknown;
}

export class ToolExecutionError extends Error {
  readonly code: ToolErrorCode;
  readonly cause?: unknown;

  constructor({ code, message, cause }: ToolErrorShape) {
    super(message);
    this.name = 'ToolExecutionError';
    this.code = code;
    this.cause = cause;
  }
}

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
