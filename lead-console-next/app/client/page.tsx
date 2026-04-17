import { getToken, getUser } from '@/lib/auth';
import { projectsApi, ticketsApi, invoicesApi } from '@/lib/api';
import { ClientOverview } from './ClientOverview';
export const dynamic = 'force-dynamic';
export default async function ClientPage() {
  const token = await getToken(); const user = await getUser();
  if (!token || !user) return null;
  const [pr, tk, inv] = await Promise.allSettled([
    projectsApi.list(token, { page_size:10 }),
    ticketsApi.list(token, { page_size:8 }),
    invoicesApi.list(token, { page_size:8 }),
  ]);
  return <ClientOverview
    user={user}
    projects={pr.status==='fulfilled' ? pr.value.items : []}
    tickets={tk.status==='fulfilled' ? tk.value.items : []}
    invoices={inv.status==='fulfilled' ? inv.value.items : []}
  />;
}
