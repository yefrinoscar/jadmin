import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/register(.*)',
  '/verify(.*)',
  '/api/email-access(.*)',
  '/api/email-smtp(.*)',
  '/api/public-tickets(.*)',
  '/api/chat/public(.*)',
])


export default clerkMiddleware(async (auth, request) => {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (!isPublicRoute(request)) {
    const { sessionClaims } = await auth();
    const authObject = await auth.protect();
    const s = await authObject.sessionClaims?.metadata;
    // const user = await authObject.currentUser();

    // Redirect client users to /clients instead of /dashboard
    const url = new URL(request.url);
    // Get the user role from session claims
    const role = sessionClaims?.role_app as string;

    // Only redirect if the user is a client and trying to access any dashboard route
    if (role === 'client' && url.pathname.startsWith('/dashboard')) {
      const clientsUrl = new URL('/clients', request.url);
      return NextResponse.redirect(clientsUrl);
    }
  }
})


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
