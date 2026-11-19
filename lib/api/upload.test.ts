import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// upload.ts imports the Clerk-backed auth helper for its route handlers. These
// tests only cover the pure path checks, so keep Clerk out of the picture.
vi.mock('@/lib/supabase/auth', () => ({ requireAuthSupabase: vi.fn() }));

const { ownImageUrls, publicImagePath, storageObjectPath } = await import('@/lib/api/upload');

const R2 = 'https://images.example.com';
const SUPABASE = 'https://abc.supabase.co';

beforeEach(() => {
  // A trailing slash, as someone might paste it, must not matter.
  vi.stubEnv('R2_PUBLIC_URL', `${R2}/`);
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('publicImagePath', () => {
  it('returns the object path of one of our R2 URLs', () => {
    expect(publicImagePath(`${R2}/group-images/user_1/a.webp`, 'group-images')).toBe('user_1/a.webp');
  });

  it('drops a query string or fragment', () => {
    expect(publicImagePath(`${R2}/group-images/user_1/a.webp?v=2`, 'group-images')).toBe('user_1/a.webp');
    expect(publicImagePath(`${R2}/group-images/user_1/a.webp#x`, 'group-images')).toBe('user_1/a.webp');
  });

  it('rejects another bucket', () => {
    expect(publicImagePath(`${R2}/comment-images/user_1/a.webp`, 'group-images')).toBeNull();
  });

  it('rejects other hosts, including lookalikes', () => {
    expect(publicImagePath('https://evil.com/group-images/user_1/a.webp', 'group-images')).toBeNull();
    expect(publicImagePath('https://images.example.com.evil.com/group-images/user_1/a.webp', 'group-images')).toBeNull();
    expect(publicImagePath('http://images.example.com/group-images/user_1/a.webp', 'group-images')).toBeNull();
  });

  it('rejects path traversal, plain or percent-encoded', () => {
    expect(publicImagePath(`${R2}/group-images/user_1/../user_2/a.webp`, 'group-images')).toBeNull();
    expect(publicImagePath(`${R2}/group-images/user_1/%2e%2e/user_2/a.webp`, 'group-images')).toBeNull();
    expect(publicImagePath(`${R2}/group-images/user_1//a.webp`, 'group-images')).toBeNull();
  });

  it('accepts legacy Supabase Storage URLs, mapping renamed buckets', () => {
    expect(
      publicImagePath(`${SUPABASE}/storage/v1/object/public/provider-logos/u/a.png`, 'service-images'),
    ).toBe('u/a.png');
    expect(
      publicImagePath(`${SUPABASE}/storage/v1/object/public/group-images/u/a.png`, 'group-images'),
    ).toBe('u/a.png');
  });

  it('rejects empty input', () => {
    expect(publicImagePath('', 'group-images')).toBeNull();
  });
});

describe('storageObjectPath', () => {
  it('accepts a raw object path', () => {
    expect(storageObjectPath('user_1/a.webp', 'group-images')).toBe('user_1/a.webp');
  });

  it('validates a full URL the same way as publicImagePath', () => {
    expect(storageObjectPath(`${R2}/group-images/user_1/a.webp`, 'group-images')).toBe('user_1/a.webp');
    expect(storageObjectPath('https://evil.com/group-images/user_1/a.webp', 'group-images')).toBeNull();
  });

  it('rejects unsafe raw paths', () => {
    expect(storageObjectPath('user_1/../user_2/a.webp', 'group-images')).toBeNull();
    expect(storageObjectPath('./a.webp', 'group-images')).toBeNull();
    expect(storageObjectPath('user_1\\a.webp', 'group-images')).toBeNull();
    expect(storageObjectPath('', 'group-images')).toBeNull();
  });
});

describe('ownImageUrls', () => {
  const mine = (n: number) => `${R2}/comment-images/user_1/${n}.webp`;

  it("accepts the caller's own uploads, trimmed", () => {
    expect(ownImageUrls([mine(1), ` ${mine(2)} `], 'comment-images', 'user_1', 5)).toEqual([mine(1), mine(2)]);
  });

  it('treats a missing list as no images', () => {
    expect(ownImageUrls(undefined, 'comment-images', 'user_1', 5)).toEqual([]);
    expect(ownImageUrls(null, 'comment-images', 'user_1', 5)).toEqual([]);
    expect(ownImageUrls([], 'comment-images', 'user_1', 5)).toEqual([]);
  });

  it('rejects the whole list if any entry is bad', () => {
    expect(ownImageUrls([mine(1), 'https://evil.com/x.png'], 'comment-images', 'user_1', 5)).toBeNull();
    expect(ownImageUrls([mine(1), 42], 'comment-images', 'user_1', 5)).toBeNull();
  });

  it("rejects someone else's upload", () => {
    expect(ownImageUrls([`${R2}/comment-images/user_2/1.webp`], 'comment-images', 'user_1', 5)).toBeNull();
    // A user ID that merely starts with the caller's must not pass.
    expect(ownImageUrls([`${R2}/comment-images/user_10/1.webp`], 'comment-images', 'user_1', 5)).toBeNull();
  });

  it('rejects another bucket', () => {
    expect(ownImageUrls([`${R2}/group-images/user_1/1.webp`], 'comment-images', 'user_1', 5)).toBeNull();
  });

  it('rejects too many, or something that is not a list', () => {
    expect(ownImageUrls([mine(1), mine(2), mine(3), mine(4)], 'comment-images', 'user_1', 3)).toBeNull();
    expect(ownImageUrls(mine(1), 'comment-images', 'user_1', 5)).toBeNull();
  });
});
