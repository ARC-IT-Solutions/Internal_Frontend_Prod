import { getToken, getUser } from '@/lib/auth';
import { invoicesApi, paymentsApi } from '@/lib/api';
import { PaymentsClient } from './PaymentsClient';
export const dynamic = 'force-dynamic';
export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
  const sp = await searchParams;
  const token = await getToken(); const user = await getUser();
  if (!token || !user) return null;
  const inv = await invoicesApi.list(token, { page: sp.page??1, status: sp.status }).catch(() => ({ items:[], total:0, page:1, page_size:20, total_pages:1 }));
  const billing = inv.items.filter(i => ['SENT','PARTIALLY_PAID','PAID','OVERDUE'].includes(i.status));
  const enriched = await Promise.all(billing.map(async i => ({ ...i, payments: await paymentsApi.listByInvoice(token, i.id).catch(() => []) })));
  return <PaymentsClient invoices={enriched} currentUser={user} total={inv.total} />;
}
