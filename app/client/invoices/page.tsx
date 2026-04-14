import { getToken } from '@/lib/auth';
import { invoicesApi, paymentsApi } from '@/lib/api';
import { ClientInvoicesView } from './ClientInvoicesView';
export const dynamic = 'force-dynamic';
export default async function ClientInvoicesPage() {
  const token = await getToken();
  if (!token) return null;
  const inv = await invoicesApi.list(token, { page_size:50 }).catch(() => ({ items:[] }));
  const enriched = await Promise.all(inv.items.map(async i => ({ ...i, payments: await paymentsApi.listByInvoice(token, i.id).catch(() => []) })));
  return <ClientInvoicesView invoices={enriched} />;
}
