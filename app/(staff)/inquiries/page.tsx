import { getToken, getUser } from '@/lib/auth';
import { inquiriesApi, usersApi } from '@/lib/api';
import { InquiriesClient } from './InquiriesClient';
export const dynamic = 'force-dynamic';
export default async function InquiriesPage({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
  const sp = await searchParams;
  const [token, user] = await Promise.all([import('@/lib/auth').then(m => m.getToken()), import('@/lib/auth').then(m => m.getUser())]);
  if (!token || !user) return null;
  const [iq, emp] = await Promise.allSettled([
    inquiriesApi.list(token, { page: sp.page??1, status: sp.status, priority: sp.priority }),
    usersApi.list(token, { page_size: 100 }),
  ]);
  return (
    <InquiriesClient
      inquiries={iq.status==='fulfilled' ? iq.value : { items:[], total:0, page:1, page_size:20, total_pages:1 }}
      employees={emp.status==='fulfilled' ? emp.value.items.filter(u=>u.role!=='client') : []}
      currentUser={user}
    />
  );
}
