import { getToken } from '@/lib/auth';
import { ticketsApi, projectsApi } from '@/lib/api';
import { ClientTicketsView } from './ClientTicketsView';
export const dynamic = 'force-dynamic';
export default async function ClientTicketsPage() {
  const token = await getToken();
  if (!token) return null;
  const [tk, pr] = await Promise.allSettled([
    ticketsApi.list(token, { page_size:50 }),
    projectsApi.list(token, { page_size:20 }),
  ]);
  return <ClientTicketsView
    tickets={tk.status==='fulfilled' ? tk.value.items : []}
    projects={pr.status==='fulfilled' ? pr.value.items : []}
  />;
}
