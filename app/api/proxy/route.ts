import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, API_BASE } from '@/lib/config';
import type { Session } from '@/types';

async function handle(request: NextRequest, method: string) {
  const store  = await cookies();
  const raw    = store.get(SESSION_COOKIE)?.value;
  if (!raw) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let session: Session;
  try {
    session = JSON.parse(raw);
    if (Date.now() > session.expires) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

  try {
    const options: RequestInit = {
      method,
      headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    };
    if (method === 'POST' || method === 'PATCH') {
      const body = await request.json().catch(() => ({}));
      options.body = JSON.stringify(body);
    }
    const res  = await fetch(`${API_BASE}/${path}`, options);
    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}

export const GET    = (req: NextRequest) => handle(req, 'GET');
export const POST   = (req: NextRequest) => handle(req, 'POST');
export const PATCH  = (req: NextRequest) => handle(req, 'PATCH');
export const DELETE = (req: NextRequest) => handle(req, 'DELETE');
