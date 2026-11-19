import { afterEach, describe, expect, it, vi } from 'vitest';
import { isOpen, memberActions, type GroupAccess } from '@/lib/api/group-membership';

const nobody: GroupAccess = {
  isMember: false,
  isOwner: false,
  isManager: false,
  isSiteAdmin: false,
  canRead: true,
  canModerate: false,
  canDelete: false,
};
const member: GroupAccess = { ...nobody, isMember: true };
const groupAdmin: GroupAccess = { ...member, isManager: true, canModerate: true };
const owner: GroupAccess = { ...groupAdmin, isOwner: true, canDelete: true };
const siteAdmin: GroupAccess = { ...nobody, isSiteAdmin: true, canModerate: true, canDelete: true };

describe('memberActions', () => {
  it('lets the owner and site admins manage roles and ownership', () => {
    for (const viewer of [owner, siteAdmin]) {
      expect(memberActions(viewer, 'member', false)).toEqual(['make_admin', 'make_owner', 'remove']);
      expect(memberActions(viewer, 'admin', false)).toEqual(['make_member', 'make_owner', 'remove']);
    }
  });

  it('lets group admins remove plain members only', () => {
    expect(memberActions(groupAdmin, 'member', false)).toEqual(['remove']);
    expect(memberActions(groupAdmin, 'admin', false)).toEqual([]);
  });

  it('gives plain members and outsiders nothing', () => {
    for (const viewer of [member, nobody]) {
      expect(memberActions(viewer, 'member', false)).toEqual([]);
      expect(memberActions(viewer, 'admin', false)).toEqual([]);
    }
  });

  it('never acts on the owner', () => {
    for (const viewer of [owner, siteAdmin, groupAdmin, member, nobody]) {
      expect(memberActions(viewer, 'owner', false)).toEqual([]);
    }
  });

  it('never acts on yourself', () => {
    expect(memberActions(siteAdmin, 'admin', true)).toEqual([]);
    expect(memberActions(groupAdmin, 'member', true)).toEqual([]);
  });
});

describe('isOpen', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is closed once closed early', () => {
    expect(isOpen({ closed_at: '2026-01-01T00:00:00Z', closes_at: null })).toBe(false);
  });

  it('is open with no closing time', () => {
    expect(isOpen({ closed_at: null })).toBe(true);
    expect(isOpen({ closed_at: null, closes_at: null })).toBe(true);
  });

  it('closes at its closing time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-15T12:00:00Z'));
    expect(isOpen({ closed_at: null, closes_at: '2026-11-15T12:00:01Z' })).toBe(true);
    expect(isOpen({ closed_at: null, closes_at: '2026-11-15T12:00:00Z' })).toBe(false);
  });
});
