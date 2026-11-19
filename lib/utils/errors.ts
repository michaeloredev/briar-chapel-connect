/**
 * A caught value's message, for showing to the user.
 *
 * `catch` binds `unknown`: usually an Error from our own `throw new Error(...)`
 * after a failed fetch, but it can be anything. Falls back when there is no
 * usable message, including an Error with an empty one.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/**
 * The message from a failed API response. Routes answer `{ error }` JSON
 * (lib/api/response.ts); fall back when the body is empty or something else.
 */
export async function responseError(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const parsed = JSON.parse(text) as { error?: unknown };
      return typeof parsed?.error === 'string' && parsed.error ? parsed.error : fallback;
    } catch {
      return fallback;
    }
  } catch {
    return fallback;
  }
}
