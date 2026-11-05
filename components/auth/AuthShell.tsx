import type { ReactNode } from 'react';
import BrandLogo from '@/components/BrandLogo';

export default function AuthShell({
  children,
  topAction,
}: {
  children: ReactNode;
  topAction?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#090909] p-3 text-white sm:p-5">
      <div className="mx-auto flex flex-col-reverse lg:grid min-h-[calc(100vh-2.5rem)] max-w-[1440px] gap-4 lg:grid-cols-2">
        <aside className="relative flex min-h-[330px] flex-col justify-between overflow-hidden rounded-[24px] bg-[#6B21D4] p-6 sm:min-h-[390px] sm:p-8 lg:min-h-[calc(100vh-2.5rem)] lg:p-10">
          <span className="absolute left-[22%] top-[22%] h-2.5 w-2.5 rounded-full bg-[#F3C23A]" />
          <span className="absolute right-[17%] top-[38%] h-2.5 w-2.5 rounded-full bg-[#2DD9A6]" />
          <span className="absolute bottom-[18%] right-[22%] h-2.5 w-2.5 rounded-full bg-[#F3C23A]" />

          <div className="relative z-10 flex items-center gap-3">
            <BrandLogo className="h-7 w-auto sm:h-8" priority />
            <span className="rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold text-white/90">
              Teams
            </span>
          </div>

          <div className="relative z-10 my-10 max-w-xl lg:my-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
              One Konneqta workspace
            </p>
            <h2 className="text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl xl:text-5xl">
              Manage your team&apos;s Konneqta presence.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
              One workspace to bring everyone&apos;s identity together:
              consistent, branded and ready to share.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rotate-[-2deg] rounded-2xl bg-[#F3EFE4] p-3 text-[#111111] sm:p-4">
              <span className="mb-3 block h-2 w-2 rounded-full bg-[#6B21D4]" />
              <p className="text-xs font-semibold sm:text-sm">One workspace</p>
              <p className="mt-1 hidden text-[11px] leading-4 text-zinc-600 sm:block">
                Bring your people together.
              </p>
            </div>
            <div className="translate-y-2 rotate-[2deg] rounded-2xl bg-[#2DD9A6] p-3 text-[#111111] sm:p-4">
              <span className="mb-3 block h-2 w-2 rounded-full bg-[#6B21D4]" />
              <p className="text-xs font-semibold sm:text-sm">On brand</p>
              <p className="mt-1 hidden text-[11px] leading-4 text-zinc-700 sm:block">
                A consistent team identity.
              </p>
            </div>
            <div className="rotate-[-1deg] rounded-2xl bg-[#F7DDE3] p-3 text-[#111111] sm:p-4">
              <span className="mb-3 block h-2 w-2 rounded-full bg-[#FF6B2C]" />
              <p className="text-xs font-semibold sm:text-sm">Ready to share</p>
              <p className="mt-1 hidden text-[11px] leading-4 text-zinc-700 sm:block">
                Everyone, one tap away.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex flex-col px-2 py-2 sm:px-6 sm:py-4 lg:px-10 lg:py-6">
          <header className="flex min-h-11 items-center justify-end">
            {topAction}
          </header>
          <div className="mx-auto flex w-full max-w-[440px] flex-1 items-center py-8">
            {children}
          </div>
          <div className="pb-2 text-center text-xs text-zinc-600">
            © Konneqta Teams
          </div>
        </section>
      </div>
    </main>
  );
}
