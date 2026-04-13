import { getToken } from '@/lib/auth';
import { projectsApi, milestonesApi, onboardingApi } from '@/lib/api';
import { ClientProjectsClient } from './ClientProjectsClient';

export const dynamic = 'force-dynamic';

export default async function ClientProjectsPage() {
  const token = await getToken();
  if (!token) return null;

  const projects = await projectsApi.list(token, { page_size: 50 }).catch(() => ({ items: [] }));

  const enriched = await Promise.all(
    projects.items.map(async p => ({
      ...p,
      milestones: await milestonesApi.list(token, p.id).catch(() => []),
      onboarding: await onboardingApi.get(token, p.id).catch(() => null),
    }))
  );

  return <ClientProjectsClient projects={enriched} />;
}
