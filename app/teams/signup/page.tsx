import { Suspense } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import TeamSignupWizard from '@/components/teams/TeamSignupWizard';
import PageLoading from '@/components/ui/PageLoading';
import { createClient } from '@/lib/supabase/server';

export default function TeamSignupPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <TeamSignupContent />
    </Suspense>
  );
}

async function TeamSignupContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return <TeamSignupWizard />;
  }

  return (
    <AuthShell
      topAction={
        <Link
          href="/auth/login?next=%2Fteams%2Fsignup"
          className="rounded-full bg-(--brand-cream) px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-white"
        >
          Sign in
        </Link>
      }
    >
      <section className="w-full">
        <p className="text-sm font-semibold text-(--main-orange)">
          TEAM WORKSPACE
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Create your team workspace
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Sign in with your Konneqta account, or create one first. Your personal
          profile stays separate from the workspace you create.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/auth/login?next=%2Fteams%2Fsignup"
            className="rounded-xl bg-(--main-orange) px-5 py-3 text-center font-semibold text-white transition hover:brightness-110"
          >
            Sign in to continue
          </Link>
          <Link
            href="/auth/signup?next=%2Fteams%2Fsignup"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-zinc-900"
          >
            Create a Konneqta account
          </Link>
        </div>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-zinc-500 hover:text-white"
        >
          Back to Konneqta
        </Link>
      </section>
    </AuthShell>
  );
}
