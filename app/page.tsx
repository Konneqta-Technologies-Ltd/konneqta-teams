import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#090909] px-4 py-5 text-white sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-8 w-auto" priority />
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300">
            Teams
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login?next=%2Fteams%2Fsignup"
            className="rounded-full px-4 py-2 text-sm font-semibold text-white/80 transition hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/teams/signup"
            className="rounded-full bg-(--brand-cream) px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-white"
          >
            Get started
          </Link>
        </div>
      </div>

      <section className="relative mx-auto mt-6 flex min-h-[calc(100vh-7rem)] max-w-7xl items-center overflow-hidden rounded-[28px] bg-[#6B21D4] px-6 py-16 sm:px-12 lg:px-20">
        <span className="absolute left-[18%] top-[20%] h-3 w-3 rounded-full bg-[#F3C23A]" />
        <span className="absolute right-[15%] top-[34%] h-3 w-3 rounded-full bg-[#2DD9A6]" />
        <span className="absolute bottom-[17%] right-[22%] h-3 w-3 rounded-full bg-[#F3C23A]" />
        <div className="relative max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
            One workspace for your people
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Manage your team&apos;s Konneqta presence.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
            One workspace to bring everyone&apos;s identity together:
            consistent, branded and ready to share.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/teams/signup"
              className="rounded-full bg-(--brand-cream) px-7 py-3 text-center font-semibold text-zinc-950 transition hover:bg-white"
            >
              Create a team workspace
            </Link>
            <Link
              href="/auth/login?next=%2Fteams%2Fsignup"
              className="rounded-full border border-white/40 px-7 py-3 text-center font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
