import { NextResponse } from 'next/server';

/**
 * Standard error response for API routes.
 * Automatically handles the common "Unauthorized" case and
 * exposes debug info in non-production environments.
 */
export function apiError(
  err: unknown,
  fallbackMessage = 'Internal server error',
): NextResponse {
  const message = err instanceof Error ? err.message : String(err);

  if (message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (message === 'Forbidden') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(
    {
      error: fallbackMessage,
      ...(process.env.NODE_ENV !== 'production' ? { debug: message } : {}),
    },
    { status: 500 },
  );
}

/**
 * Validation-error response (400).
 */
export function apiBadRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}
