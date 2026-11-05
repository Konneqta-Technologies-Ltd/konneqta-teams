import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSafeRedirectPath } from '@/lib/auth/redirect-target';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get('code');
  const next = getSafeRedirectPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth/callback] exchange error:', error.message);
      return NextResponse.redirect(
        new URL('/auth/login?error=callback', requestUrl.origin),
      );
    }
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}
