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
    // Bare auth.protect() rewrites to a 404 for signed-out visitors, which
    // leaves them on a dead page with no way to sign in. Send page requests
    // to the sign-in route instead, but leave API routes alone so their
    // callers keep getting a JSON 401 rather than a sign-in page as HTML.
    if (pathname.startsWith('/api/')) {
      await auth.protect();
    } else {
      await auth.protect({
        unauthenticatedUrl: new URL('/sign-in', request.url).toString(),
      });
    }
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

