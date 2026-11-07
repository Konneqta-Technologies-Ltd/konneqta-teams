import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import PageLoading from '@/components/ui/PageLoading';
import { getSafeRedirectPath } from '@/lib/auth/redirect-target';

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return (
    <Suspense fallback={<PageLoading />}>
      <LoginForm searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const query = await searchParams;

  return (
    <AuthForm
      mode="login"
      nextPath={getSafeRedirectPath(query.next)}
      showCallbackError={query.error === 'callback'}
      showWorkspaceError={query.error === 'workspace'}
    />
  );
}
