import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Protect administrative paths: Settings and Finance
    if (pathname.startsWith('/finance') || pathname.startsWith('/settings')) {
      if (token?.role !== 'admin') {
        // Non-admins get redirected to dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Role-based constraints for staff
    // Staff are allowed to write/edit daily operations but not user management or system settings
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect all routes except auth endpoints, login page, static assets, and favicon
export const config = {
  matcher: [
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|next.svg|vercel.svg|Database).*)',
  ],
};
