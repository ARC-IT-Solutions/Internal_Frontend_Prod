import { getToken, getUser } from '@/lib/auth';
import { projectsApi, onboardingApi } from '@/lib/api';
import { ClientOnboardingClient } from './ClientOnboardingClient';

export const dynamic = 'force-dynamic';

export default async function ClientOnboardingPage() {
  const token = await getToken();
  if (!token) return null;

  const projects = await projectsApi.list(token, { page_size: 20 }).catch(() => ({ items: [] }));
  const eligible = projects.items.filter(p => ['PLANNING','ONBOARDING'].includes(p.status));

  const enriched = await Promise.all(
    eligible.map(async p => ({
      ...p,
      onboarding: await onboardingApi.get(token, p.id).catch(() => null),
    }))
  );

  return <ClientOnboardingClient projects={enriched} />;
}
