import { getToken, getUser } from '@/lib/auth';
import { invoicesApi, paymentsApi } from '@/lib/api';
import { PaymentsClient } from './PaymentsClient';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp    = await searchParams;
  const token = await getToken();
  const user  = await getUser();
  if (!token || !user) return null;

  // Get invoices that have payments or are in billing states
  const invoices = await invoicesApi.list(token, {
    page:    sp.page ?? 1,
    status:  sp.status,
  }).catch(() => ({ items: [], total: 0, page: 1, page_size: 20, total_pages: 1 }));

  // Load payments for invoices that have been sent/paid
  const billingInvoices = invoices.items.filter(inv =>
    ['SENT','PARTIALLY_PAID','PAID','OVERDUE'].includes(inv.status)
  );

  const invoicesWithPayments = await Promise.all(
    billingInvoices.map(async inv => ({
      ...inv,
      payments: await paymentsApi.listByInvoice(token, inv.id).catch(() => []),
    }))
  );

  return (
    <PaymentsClient
      invoices={invoicesWithPayments}
      currentUser={user}
      total={invoices.total}
    />
  );
}
