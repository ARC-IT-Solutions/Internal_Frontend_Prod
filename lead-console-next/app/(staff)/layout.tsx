import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { StaffShell } from '@/components/layout/StaffShell';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role === 'client') redirect('/client');
  return <StaffShell user={session.user}>{children}</StaffShell>;
}
