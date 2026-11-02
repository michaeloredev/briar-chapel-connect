/**
 * fetch() for the group activity routes. They answer failures with
 * `{ error }` JSON whose message is written for people ("That slot is full"),
 * so throw that rather than the raw body.
 */
export async function groupRequest(url: string, init: RequestInit, fallback: string): Promise<void> {
  const res = await fetch(url, {
    ...init,
    headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
  });
  if (res.ok) return;
  if (res.status === 401) throw new Error('Please sign in first.');
  let message = fallback;
  try {
    const parsed = (await res.json()) as { error?: string };
    if (parsed?.error) message = parsed.error;
  } catch {
    // Not JSON: keep the fallback.
  }
  throw new Error(message);
}
