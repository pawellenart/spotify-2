import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  // token will exist if user is logged in
  const token = await getToken({
    req,
    secret: process.env.JWT_SECRET,
    secureCookie:
      process.env.NEXTAUTH_URL?.startsWith('https://') ??
      !!process.env.VERCEL_URL,
  });

  const { pathname } = req.nextUrl;
  console.log(pathname);

  // allow the requests if the following is true...
  //  1) it's a request for next-auth session & provider fetching
  //  2) the token exists
  if (pathname.includes('/api/auth') || token) {
    // then go through
    return NextResponse.next();
  }

  // redirect to login if there is no token AND the request is for a protected route
  if (!token && pathname !== '/login') {
    return NextResponse.redirect('/login');
  }
}
