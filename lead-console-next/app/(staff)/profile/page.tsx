import { getUser } from '@/lib/auth';
import { ProfileClient } from './ProfileClient';
export const dynamic = 'force-dynamic';
export default async function ProfilePage() {
  const user = await getUser();
  if (!user) return null;
  return <ProfileClient currentUser={user} />;
}
