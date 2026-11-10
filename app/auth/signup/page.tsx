import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import PageLoading from '@/components/ui/PageLoading';
import { getSafeRedirectPath } from '@/lib/auth/redirect-target';

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <Suspense fallback={<PageLoading />}>
      <SignupForm searchParams={searchParams} />
    </Suspense>
  );
}

async function SignupForm({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const query = await searchParams;

  return <AuthForm mode="signup" nextPath={getSafeRedirectPath(query.next)} />;
}
