import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getUserRole, hasRole } from '@/lib/auth/roles';

/**
 * Server-side superadmin gate for /members.
 *
 * The nav link is hidden by RoleGate and the page redirects in an effect,
 * but both run in the browser, so the route itself was reachable by any
 * signed-in user who typed the URL. The admin API already refuses them,
 * so no member data leaked — this stops the page from rendering at all.
 */
export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const role = await getUserRole(userId);
  if (!hasRole(role, 'superadmin')) redirect('/');

  return <>{children}</>;
}
