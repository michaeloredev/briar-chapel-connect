import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Sign In • Briar Chapel Connect',
  description: 'Sign in to Briar Chapel Connect',
};

/**
 * Catch-all sign-in route.
 *
 * The header signs people in with a modal, so this page is not part of the
 * usual flow. It exists as the destination for `auth.protect()` in
 * middleware.ts, which redirects unauthenticated visitors to
 * NEXT_PUBLIC_CLERK_SIGN_IN_URL. Without it those visitors get a 404.
 *
 * The optional catch-all segment is required: Clerk routes its own
 * sub-steps (SSO callbacks, factor verification) under this path.
 */
export default function SignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-16">
      <SignIn />
    </div>
  );
}
