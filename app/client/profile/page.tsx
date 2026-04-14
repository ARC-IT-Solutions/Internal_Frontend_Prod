import { getUser } from '@/lib/auth';
import { ClientProfileView } from './ClientProfileView';
export const dynamic = 'force-dynamic';
export default async function ClientProfilePage() {
  const user = await getUser();
  if (!user) return null;
  return <ClientProfileView user={user} />;
}
