'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRole } from '@/components/auth/RoleProvider';
import { useRouter } from 'next/navigation';
import type { MemberRow } from '@/app/api/admin/members/route';
import type { AppRole } from '@/lib/auth/roles';

const ROLE_LABELS: Record<AppRole, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  client: 'Client',
};

const ROLE_BADGE_STYLES: Record<AppRole, string> = {
  superadmin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  client: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

export default function MembersPage() {
  const { hasRole, loading: roleLoading } = useRole();
  const router = useRouter();

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Record<AppRole, boolean>>({
    superadmin: true,
    admin: true,
    client: true,
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/members');
      if (!res.ok) throw new Error('Failed to load members');
      const data: MemberRow[] = await res.json();
      setMembers(data);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (roleLoading) return;
    if (!hasRole('superadmin')) {
      router.replace('/');
      return;
    }
    fetchMembers();
  }, [roleLoading, hasRole, fetchMembers, router]);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdatingId(userId);
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)),
      );
    } catch {
      setError('Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${name}? This cannot be undone.`)) {
      return;
    }
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/members?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete member');
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch {
      setError('Failed to delete member');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleFilter = (role: AppRole) => {
    setFilters((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const visibleMembers = members.filter((m) => filters[m.role]);

  if (roleLoading || (!hasRole('superadmin') && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Members</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Manage registered users and their roles.
          </p>
        </div>

        {/* Filter checkboxes */}
        <div className="flex flex-wrap gap-4 mb-6">
          {(Object.keys(ROLE_LABELS) as AppRole[]).map((role) => (
            <label
              key={role}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={filters[role]}
                onChange={() => toggleFilter(role)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              />
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_STYLES[role]}`}>
                {ROLE_LABELS[role]}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                ({members.filter((m) => m.role === role).length})
              </span>
            </label>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
            Loading members...
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">User</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Email</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Role</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Joined</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No members match the selected filters.
                    </td>
                  </tr>
                ) : (
                  visibleMembers.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {m.imageUrl ? (
                            <img
                              src={m.imageUrl}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">
                            {m.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate max-w-[220px]">
                        {m.email}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={m.role}
                          disabled={updatingId === m.id}
                          onChange={(e) => handleRoleChange(m.id, e.target.value as AppRole)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${ROLE_BADGE_STYLES[m.role]}`}
                        >
                          {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={updatingId === m.id}
                          onClick={() => handleDelete(m.id, m.name)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Showing {visibleMembers.length} of {members.length} members
        </div>
      </div>
    </div>
  );
}
