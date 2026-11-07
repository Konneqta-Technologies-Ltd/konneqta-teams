import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import PageLoading from '@/components/ui/PageLoading';
import WorkspaceMenu from '@/components/teams/WorkspaceMenu';
import WorkspaceSidebar from '@/components/teams/WorkspaceSidebar';
import WorkspaceSettingsForm from '@/components/teams/WorkspaceSettingsForm';
import { createClient } from '@/lib/supabase/server';

type SettingsPageProps = {
  params: Promise<{ slug: string }>;
};

export default function WorkspaceSettingsPage({ params }: SettingsPageProps) {
  return (
    <Suspense fallback={<PageLoading />}>
      <WorkspaceSettings params={params} />
    </Suspense>
  );
}

async function WorkspaceSettings({ params }: SettingsPageProps) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && userError.name !== 'AuthSessionMissingError') {
    console.error(
      '[teams/settings] session lookup failed:',
      userError.message,
    );
    redirect(`/auth/login?next=${encodeURIComponent(`/${slug}/settings`)}`);
  }
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/${slug}/settings`)}`);
  }

  const { data: organization, error: organizationError } = await supabase
    .from('organizations')
    .select(
      'id, name, slug, website, industry, company_size, contact_email, logo_url',
    )
    .eq('slug', slug)
    .maybeSingle();

  if (organizationError) {
    console.error(
      '[teams/settings] organization lookup failed:',
      organizationError.message,
    );
    throw new Error('We could not load workspace settings. Please try again.');
  }
  if (!organization) notFound();

  const { data: membership, error: membershipError } = await supabase
    .from('organization_memberships')
    .select('role')
    .eq('organization_id', organization.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) {
    console.error(
      '[teams/settings] membership lookup failed:',
      membershipError.message,
    );
    throw new Error('We could not verify your workspace role. Please try again.');
  }
  if (!membership) notFound();

  const canEdit = membership.role === 'owner' || membership.role === 'admin';

  return (
    <main className="min-h-screen bg-[#090909] p-3 text-white sm:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1600px] gap-5">
        <WorkspaceSidebar slug={organization.slug} active="settings" />

        <div className="min-w-0 flex-1">
          <header className="flex min-h-14 items-center justify-between gap-4 px-1 sm:px-2">
            <WorkspaceMenu
              name={organization.name}
              slug={organization.slug}
              logoUrl={organization.logo_url}
            />
            <div className="flex items-center gap-3">
              <span className="hidden max-w-48 truncate text-xs text-zinc-500 sm:block">
                {user.email}
              </span>
              <span
                aria-label={`Signed in as ${user.email ?? 'team member'}`}
                title={user.email ?? undefined}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--brand-purple) text-sm font-semibold"
              >
                {user.email?.trim().charAt(0).toUpperCase() || 'K'}
              </span>
            </div>
          </header>

          <Link
            href={`/${organization.slug}`}
            className="mt-4 inline-flex rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            Back to dashboard
          </Link>

          <section className="mt-5 rounded-[24px] border border-zinc-800 bg-[#151515] p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-(--main-orange)">
                  Workspace
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  Settings
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  Manage the organization details shown across your Konneqta
                  Teams workspace.
                </p>
              </div>
              <span className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium capitalize text-zinc-300">
                {membership.role}
              </span>
            </div>

            <div className="mt-8 border-t border-zinc-800 pt-7">
              {!canEdit && (
                <p className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
                  You can view workspace settings, but only an owner or admin
                  can make changes.
                </p>
              )}
              <WorkspaceSettingsForm
                key={`${organization.id}-${organization.slug}-${organization.logo_url ?? 'no-logo'}`}
                organization={{
                  id: organization.id,
                  name: organization.name,
                  slug: organization.slug,
                  website: organization.website,
                  industry: organization.industry,
                  companySize: organization.company_size,
                  contactEmail: organization.contact_email,
                  logoUrl: organization.logo_url,
                }}
                canEdit={canEdit}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
