import { redirect } from 'next/navigation';
import { getToken, getUser } from '@/lib/auth';
import { auditApi } from '@/lib/api';
import { AuditClient } from './AuditClient';
export const dynamic = 'force-dynamic';
export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
  const sp = await searchParams;
  const token = await getToken(); const user = await getUser();
  if (!token || !user) return null;
  if (user.role !== 'admin') redirect('/inquiries');
  const logs = await auditApi.list(token, { page: sp.page??1, action: sp.action, entity_type: sp.entity_type }).catch(() => ({ items:[], total:0, page:1, page_size:20, total_pages:1 }));
  return <AuditClient logs={logs} />;
}
