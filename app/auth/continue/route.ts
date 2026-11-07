import { NextResponse } from 'next/server';
import { getSafeRedirectPath } from '@/lib/auth/redirect-target';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = getSafeRedirectPath(requestUrl.searchParams.get('next'));
  const nextUrl = new URL(nextPath, requestUrl.origin);

  if (nextUrl.pathname !== '/teams/signup') {
    return NextResponse.redirect(nextUrl);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && userError.name !== 'AuthSessionMissingError') {
    console.error('[auth/continue] user lookup failed:', userError.message);
    return NextResponse.redirect(
      new URL('/auth/login?error=workspace', requestUrl.origin),
    );
  }

  if (!user) {
    const loginUrl = new URL('/auth/login', requestUrl.origin);
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error(
      '[auth/continue] workspace membership lookup failed:',
      membershipError.message,
    );
    return NextResponse.redirect(
      new URL('/auth/login?error=workspace', requestUrl.origin),
    );
  }

  if (!membership) {
    return NextResponse.redirect(nextUrl);
  }

  const { data: organization, error: organizationError } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', membership.organization_id)
    .maybeSingle();

  if (organizationError || !organization) {
    console.error(
      '[auth/continue] workspace lookup failed:',
      organizationError?.message ?? 'No organization found for membership.',
    );
    return NextResponse.redirect(
      new URL('/auth/login?error=workspace', requestUrl.origin),
    );
  }

  return NextResponse.redirect(
    new URL(`/${organization.slug}`, requestUrl.origin),
  );
}
