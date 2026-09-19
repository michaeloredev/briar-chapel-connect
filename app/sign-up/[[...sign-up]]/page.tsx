import type { Metadata } from 'next';
import { SignUp } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Sign Up • Briar Chapel Connect',
  description: 'Create a Briar Chapel Connect account',
};

/**
 * Catch-all sign-up route. See the sign-in page for why this exists;
 * Clerk links here from the sign-in card via NEXT_PUBLIC_CLERK_SIGN_UP_URL.
 */
export default function SignUpPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-16">
      <SignUp />
    </div>
  );
}
