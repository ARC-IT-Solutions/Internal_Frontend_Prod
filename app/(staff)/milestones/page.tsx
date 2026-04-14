import { getToken, getUser } from '@/lib/auth';
import { projectsApi, milestonesApi } from '@/lib/api';
import { MilestonesClient } from './MilestonesClient';
export const dynamic = 'force-dynamic';
export default async function MilestonesPage({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
  const sp = await searchParams;
  const token = await getToken(); const user = await getUser();
  if (!token || !user) return null;
  const pr = await projectsApi.list(token, { page_size:100 }).catch(() => ({ items:[] }));
  const active = pr.items.filter(p => !['CANCELLED'].includes(p.status));
  const pid = sp.project ?? active[0]?.id ?? null;
  const ms = pid ? await milestonesApi.list(token, pid).catch(() => []) : [];
  return <MilestonesClient projects={active} initialMilestones={ms} initialProjectId={pid} currentUser={user} />;
}
