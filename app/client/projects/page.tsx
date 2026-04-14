import { getToken } from '@/lib/auth';
import { projectsApi, milestonesApi, onboardingApi } from '@/lib/api';
import { ClientProjectsView } from './ClientProjectsView';
export const dynamic = 'force-dynamic';
export default async function ClientProjectsPage() {
  const token = await getToken();
  if (!token) return null;
  const pr = await projectsApi.list(token, { page_size:20 }).catch(() => ({ items:[] }));
  const enriched = await Promise.all(pr.items.map(async p => ({
    ...p,
    milestones: await milestonesApi.list(token, p.id).catch(() => []),
    onboarding: await onboardingApi.get(token, p.id).catch(() => null),
  })));
  return <ClientProjectsView projects={enriched} />;
}
