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
