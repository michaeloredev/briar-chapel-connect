import { describe, expect, it } from 'vitest';
import { errorMessage, responseError } from '@/lib/utils/errors';

describe('errorMessage', () => {
  it("uses an Error's message", () => {
    expect(errorMessage(new Error('Group is full'), 'fallback')).toBe('Group is full');
  });

  it('falls back for an Error with an empty message', () => {
    expect(errorMessage(new Error(''), 'fallback')).toBe('fallback');
  });

  it('falls back for anything that is not an Error', () => {
    expect(errorMessage('a string', 'fallback')).toBe('fallback');
    expect(errorMessage({ message: 'looks like one' }, 'fallback')).toBe('fallback');
    expect(errorMessage(undefined, 'fallback')).toBe('fallback');
    expect(errorMessage(null, 'fallback')).toBe('fallback');
  });
});

describe('responseError', () => {
  it("reads a route's { error } JSON", async () => {
    const res = new Response(JSON.stringify({ error: 'Please remove offensive language from the title.' }), { status: 400 });
    expect(await responseError(res, 'fallback')).toBe('Please remove offensive language from the title.');
  });

  it('falls back for an empty body, non-JSON, or JSON without a message', async () => {
    expect(await responseError(new Response('', { status: 500 }), 'fallback')).toBe('fallback');
    expect(await responseError(new Response('<html>502</html>', { status: 502 }), 'fallback')).toBe('fallback');
    expect(await responseError(new Response('{"debug":"x"}', { status: 500 }), 'fallback')).toBe('fallback');
  });
});
