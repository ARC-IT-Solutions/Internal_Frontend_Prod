import { getToken, getUser } from '@/lib/auth';
import { projectsApi, onboardingApi } from '@/lib/api';
import { OnboardingClient } from './OnboardingClient';
export const dynamic = 'force-dynamic';
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
  const sp = await searchParams;
  const token = await getToken(); const user = await getUser();
  if (!token || !user) return null;
  const pr = await projectsApi.list(token, { page_size:100 }).catch(() => ({ items:[] }));
  const relevant = pr.items.filter(p => ['PLANNING','ONBOARDING','IN_PROGRESS'].includes(p.status));
  const focused = sp.project ?? null;
  const onb = focused ? await onboardingApi.get(token, focused).catch(() => null) : null;
  return <OnboardingClient projects={relevant} initialOnboarding={onb} initialProjectId={focused} currentUser={user} />;
}
