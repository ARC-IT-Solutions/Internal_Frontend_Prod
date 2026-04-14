import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/config';
import type { Session } from '@/types';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through Next.js internals and static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  let session: Session | null = null;

  if (raw) {
    try {
      const parsed: Session = JSON.parse(raw);
      if (Date.now() < parsed.expires) session = parsed;
    } catch {}
  }

  // Login page
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL(session.user.role === 'client' ? '/client' : '/', request.url));
    }
    return NextResponse.next();
  }

  // Unauthenticated — redirect to login
  if (!session) {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  // Client-role users: /client/* only
  if (session.user.role === 'client' && !pathname.startsWith('/client')) {
    return NextResponse.redirect(new URL('/client', request.url));
  }

  // Staff: blocked from /client/*
  if (session.user.role !== 'client' && pathname.startsWith('/client')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)'],
};
