import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(['/login(.*)', '/register(.*)', '/verify(.*)', '/api/email-access(.*)', '/api/public-tickets(.*)',])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const authObject = await auth.protect();
    // const user = await authObject.currentUser();
    
    // Redirect client users to /clients instead of /dashboard
    const url = new URL(request.url);

    console.log(authObject);
    
    
    // Get the user role from session claims
    const metadata = authObject.sessionClaims?.metadata as { role?: string } || {};
    const role = metadata.role;
    
    // Only redirect if the user is a client and trying to access the dashboard root
    if (role === 'client' && url.pathname === '/dashboard') {
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
