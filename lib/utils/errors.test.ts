import { describe, expect, it } from 'vitest';
import { errorMessage } from '@/lib/utils/errors';

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
