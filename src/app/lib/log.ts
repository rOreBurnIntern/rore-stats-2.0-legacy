export type ErrorLogContext = Record<string, unknown>;

interface SerializedError {
  message: string;
  name?: string;
  stack?: string;
  value?: unknown;
}

function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  if (typeof error === 'string' && error.length > 0) {
    return { message: error };
  }

  return {
    message: 'Unexpected error value thrown',
    value: error,
  };
}

export function logError(message: string, error: unknown, context: ErrorLogContext = {}) {
  console.error(message, {
    ...context,
    error: serializeError(error),
  });
}
