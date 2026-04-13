import { getToken } from '@/lib/auth';
import { invoicesApi, paymentsApi } from '@/lib/api';
import { ClientInvoicesClient } from './ClientInvoicesClient';

export const dynamic = 'force-dynamic';

export default async function ClientInvoicesPage() {
  const token = await getToken();
  if (!token) return null;

  const invoices = await invoicesApi.list(token, { page_size: 50 }).catch(() => ({ items: [] }));

  const enriched = await Promise.all(
    invoices.items.map(async inv => ({
      ...inv,
      payments: await paymentsApi.listByInvoice(token, inv.id).catch(() => []),
    }))
  );

  return <ClientInvoicesClient invoices={enriched} />;
}
