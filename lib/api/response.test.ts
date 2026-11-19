import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiBadRequest, apiError, apiForbidden } from '@/lib/api/response';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('apiError', () => {
  it("maps a thrown 'Unauthorized' to 401", async () => {
    const res = apiError(new Error('Unauthorized'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it("maps a thrown 'Forbidden' to 403", async () => {
    const res = apiError(new Error('Forbidden'));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Forbidden' });
  });

  it('returns 500 with the fallback message for anything else', async () => {
    const res = apiError(new Error('relation "x" does not exist'), 'Failed to load');
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to load');
  });

  it('includes the real message as debug outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = apiError(new Error('relation "x" does not exist'));
    expect((await res.json()).debug).toBe('relation "x" does not exist');
  });

  it('never leaks the real message in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const body = await apiError(new Error('relation "x" does not exist'), 'Failed').json();
    expect(body).toEqual({ error: 'Failed' });
  });
});

describe('apiForbidden and apiBadRequest', () => {
  it('pass their message through with the right status', async () => {
    const forbidden = apiForbidden('Join the group first');
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toEqual({ error: 'Join the group first' });

    const bad = apiBadRequest('Missing title');
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: 'Missing title' });
  });
});
