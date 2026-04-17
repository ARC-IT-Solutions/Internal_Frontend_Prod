import { getToken, getUser } from '@/lib/auth';
import { projectsApi, usersApi } from '@/lib/api';
import { ProjectsClient } from './ProjectsClient';
export const dynamic = 'force-dynamic';
export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
  const sp = await searchParams;
  const token = await getToken(); const user = await getUser();
  if (!token || !user) return null;
  const [pr, allUsers] = await Promise.allSettled([
    projectsApi.list(token, { page: sp.page??1, status: sp.status }),
    usersApi.list(token, { page_size: 200, role: 'client' }),
  ]);
  return <ProjectsClient
    projects={pr.status==='fulfilled' ? pr.value : { items:[], total:0, page:1, page_size:20, total_pages:1 }}
    clients={allUsers.status==='fulfilled' ? allUsers.value.items.filter(u=>u.role==='client') : []}
    currentUser={user}
  />;
}
