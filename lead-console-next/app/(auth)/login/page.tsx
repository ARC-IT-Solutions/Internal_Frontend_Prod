import { LoginForm } from './LoginForm';

export const metadata = { title: 'Sign In | ARC IT Solutions' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <LoginForm initialError={error === 'session_expired' ? 'Your session has expired. Please sign in again.' : ''} />;
}
