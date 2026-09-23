import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)',
  '/services(.*)',
  '/marketplace(.*)',
  '/events(.*)',
  '/groups(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  // Allow unauthenticated reads on certain API routes
  if (request.method === 'GET' && (pathname === '/api/comments' || pathname === '/api/me/role')) {
    return;
  }
  if (!isPublicRoute(request)) {
    // auth.protect() rewrites to a 404 for signed-out visitors, which is wrong
    // in both directions: a page request lands on a dead end with no way to
    // sign in, and an API call gets an HTML error page where its caller is
    // parsing JSON. Handle each explicitly instead.
    if (pathname.startsWith('/api/')) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return;
    }

    await auth.protect({
      unauthenticatedUrl: new URL('/sign-in', request.url).toString(),
    });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

