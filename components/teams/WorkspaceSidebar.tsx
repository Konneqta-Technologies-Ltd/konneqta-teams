import Link from 'next/link';
import type { ReactNode } from 'react';
import BrandLogo from '@/components/BrandLogo';

type WorkspaceSidebarProps = {
  slug: string;
  active: 'dashboard' | 'settings';
};

export default function WorkspaceSidebar({
  slug,
  active,
}: WorkspaceSidebarProps) {
  return (
    <aside className="hidden w-[242px] shrink-0 flex-col rounded-[24px] border border-zinc-800 bg-[#151515] p-3 lg:flex">
      <Link
        href={`/${slug}`}
        aria-label="Konneqta Teams dashboard"
        className="flex items-center gap-3 px-3 py-4"
      >
        <BrandLogo className="h-7 w-auto" priority />
        <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] font-semibold text-zinc-300">
          Teams
        </span>
      </Link>

      <nav aria-label="Workspace navigation" className="mt-5 space-y-1">
        <WorkspaceNavLink
          href={`/${slug}`}
          active={active === 'dashboard'}
          icon={<DashboardIcon />}
        >
          Dashboard
        </WorkspaceNavLink>
        <ComingSoonNavItem icon={<MembersIcon />} label="Members" />
        <ComingSoonNavItem icon={<CardsIcon />} label="Cards" />
        <WorkspaceNavLink
          href={`/${slug}/settings`}
          active={active === 'settings'}
          icon={<SettingsIcon />}
        >
          Settings
        </WorkspaceNavLink>
      </nav>

      <a
        href="https://www.konneqta.com"
        className="mt-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
      >
        <span
          aria-hidden="true"
          className="flex size-5 items-center justify-center rounded-full border border-current text-xs"
        >
          ?
        </span>
        Personal Konneqta
      </a>
    </aside>
  );
}

function WorkspaceNavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition ${
        active
          ? 'bg-(--brand-cream) text-zinc-950'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function ComingSoonNavItem({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div
      aria-disabled="true"
      className="flex cursor-not-allowed items-center gap-3 rounded-full px-4 py-3 text-sm text-zinc-500"
    >
      {icon}
      <span>{label}</span>
      {label === 'Cards' && (
        <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] font-semibold uppercase text-[#F3C23A]">
          Soon
        </span>
      )}
    </div>
  );
}

function DashboardIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0M16 5a3.5 3.5 0 0 1 0 6.8M17 14a5.8 5.8 0 0 1 4.2 5.5" />
    </svg>
  );
}

function CardsIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3 10h18M7 15h4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7h9m4 0h3M4 17h3m4 0h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  );
}
