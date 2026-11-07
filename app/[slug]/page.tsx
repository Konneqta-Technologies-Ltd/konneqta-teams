import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import PageLoading from '@/components/ui/PageLoading';
import { createClient } from '@/lib/supabase/server';
import WorkspaceMenu from '@/components/teams/WorkspaceMenu';
import WorkspaceSidebar from '@/components/teams/WorkspaceSidebar';

type DashboardProps = {
  params: Promise<{ slug: string }>;
};

export default function TeamDashboardPage({ params }: DashboardProps) {
  return (
    <Suspense fallback={<PageLoading />}>
      <TeamDashboard params={params} />
    </Suspense>
  );
}

async function TeamDashboard({ params }: DashboardProps) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error(
      '[teams/dashboard] session lookup failed:',
      userError.message,
    );
    redirect(`/auth/login?next=${encodeURIComponent(`/${slug}`)}`);
  }
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/${slug}`)}`);
  }

  const { data: organization, error: organizationError } = await supabase
    .from('organizations')
    .select(
      'id, name, slug, website, industry, company_size, contact_email, logo_url, created_at',
    )
    .eq('slug', slug)
    .maybeSingle();

  if (organizationError) {
    console.error(
      '[teams/dashboard] organization lookup failed:',
      organizationError.message,
    );
    throw new Error('We could not load this workspace. Please try again.');
  }
  if (!organization) notFound();

  const profileDetails = [
    { label: 'Industry', value: organization.industry || 'Not added' },
    { label: 'Company size', value: organization.company_size || 'Not added' },
    {
      label: 'Website',
      value: organization.website || 'Not added',
      href: organization.website || undefined,
    },
    {
      label: 'General contact',
      value: organization.contact_email || 'Not added',
      href: organization.contact_email
        ? `mailto:${organization.contact_email}`
        : undefined,
    },
  ];

  return (
    <main className="min-h-screen bg-[#090909] p-3 text-white sm:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1600px] gap-5">
        <WorkspaceSidebar slug={organization.slug} active="dashboard" />

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

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
            <section className="relative flex min-h-[280px] flex-col items-start justify-center overflow-hidden rounded-[26px] bg-(--brand-purple) p-7 sm:min-h-[320px] sm:p-10">
              <span className="absolute right-[12%] top-[15%] size-3 rounded-full bg-[#F3C23A]" />
              <span className="absolute right-[7%] top-[38%] size-3 rounded-full bg-(--brand-teal)" />
              <span className="absolute bottom-[13%] right-[22%] size-3 rounded-full bg-[#F3C23A]" />
              <div className="relative max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 text-xs font-medium text-white">
                  <span className="size-1.5 rounded-full bg-[#F3C23A]" />
                  Your workspace is ready
                </span>
                <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  Welcome{' '}
                  <span className="text-[#F3C23A]">{organization.name}</span>
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
                  This is where you manage your organization&apos;s Konneqta
                  Teams presence. Start by bringing your people in.
                </p>
                <Link
                  href="#team-setup"
                  className="mt-6 inline-flex rounded-full bg-(--brand-cream) px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg transition hover:bg-white"
                >
                  View setup steps
                </Link>
              </div>
            </section>

            <section
              id="team-setup"
              className="rounded-[24px] border border-zinc-800 bg-[#151515] p-5 sm:p-6"
            >
              <h2 className="text-lg font-semibold">Get set up</h2>
              <ol className="mt-4 divide-y divide-zinc-800">
                <SetupStep complete label="Create your workspace" />
                <SetupStep complete label="Complete organization details" />
                <SetupStep label="Add team members" comingSoon />
                <SetupStep
                  label="Review workspace settings"
                  href={`/${organization.slug}/settings`}
                />
              </ol>
            </section>

            <section
              id="organization-profile"
              className="rounded-[24px] border border-zinc-800 bg-[#151515] p-5 sm:p-6 xl:col-span-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Organization profile
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    The details saved for {organization.name}.
                  </p>
                </div>
                <span className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300">
                  {organization.slug}
                </span>
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {profileDetails.map((detail) => (
                  <div
                    key={detail.label}
                    className="min-w-0 rounded-2xl border border-zinc-800 bg-[#1d1d1d] p-4"
                  >
                    <dt className="text-xs text-zinc-500">{detail.label}</dt>
                    <dd className="mt-2 truncate text-sm font-medium">
                      {detail.href ? (
                        <a
                          href={detail.href}
                          target={
                            detail.label === 'Website' ? '_blank' : undefined
                          }
                          rel={
                            detail.label === 'Website'
                              ? 'noreferrer'
                              : undefined
                          }
                          className="transition hover:text-(--main-orange)"
                        >
                          {detail.value}
                        </a>
                      ) : (
                        detail.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function SetupStep({
  label,
  complete = false,
  comingSoon = false,
  href,
}: {
  label: string;
  complete?: boolean;
  comingSoon?: boolean;
  href?: string;
}) {
  return (
    <li className="flex min-h-14 items-center gap-3 py-3">
      <span
        aria-label={
          complete ? 'Complete' : comingSoon ? 'Coming soon' : 'To do'
        }
        className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs ${
          complete
            ? 'border-(--brand-teal) bg-(--brand-teal) text-zinc-950'
            : 'border-zinc-600 text-zinc-500'
        }`}
      >
        {complete ? '✓' : ''}
      </span>
      <span
        className={`min-w-0 flex-1 text-sm ${
          complete ? 'text-zinc-500 line-through' : 'text-zinc-200'
        }`}
      >
        {href ? (
          <Link
            href={href}
            className="transition hover:text-(--main-orange) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--main-orange)"
          >
            {label}
          </Link>
        ) : (
          label
        )}
      </span>
      {comingSoon ? (
        <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] font-medium text-zinc-400">
          Coming soon
        </span>
      ) : (
        !complete &&
        (href ? (
          <Link
            href={href}
            aria-label={`Open ${label}`}
            className="text-(--main-orange)"
          >
            →
          </Link>
        ) : (
          <span className="text-(--main-orange)">→</span>
        ))
      )}
    </li>
  );
}
