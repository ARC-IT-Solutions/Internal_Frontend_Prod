import { getUser } from '@/lib/auth';
import { StaffProfileClient } from './StaffProfileClient';

export const dynamic = 'force-dynamic';

export default async function StaffProfilePage() {
  const user = await getUser();
  if (!user) return null;
  return <StaffProfileClient currentUser={user} />;
}
