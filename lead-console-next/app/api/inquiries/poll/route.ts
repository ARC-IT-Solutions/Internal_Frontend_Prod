/**
 * GET /api/inquiries/poll
 * Public endpoint called by the client-side poller every 10 minutes.
 * Uses a server-level API key or anonymous access — returns minimal data
 * so logged-out users can't see private details, just the count.
 *
 * When the user IS logged in (cookie present), returns full list.
 * When NOT logged in, returns just the count (requires backend to support).
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, API_BASE } from '@/lib/config';
import type { Session } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = await cookies();
  const raw   = store.get(SESSION_COOKIE)?.value;

  // If no valid session, return empty — the real poll happens in the browser when logged in
  if (!raw) return NextResponse.json({ count: 0, authenticated: false });

  let session: Session;
  try {
    session = JSON.parse(raw);
    if (Date.now() > session.expires)
      return NextResponse.json({ count: 0, authenticated: false });
  } catch {
    return NextResponse.json({ count: 0, authenticated: false });
  }

  try {
    const res = await fetch(`${API_BASE}/inquiries?page_size=1&status=NEW`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ count: 0, authenticated: true });
    const data = await res.json();
    return NextResponse.json({
      count:         data.total ?? 0,
      authenticated: true,
      polledAt:      new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ count: 0, authenticated: true, error: true });
  }
}
