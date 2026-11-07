'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FaArrowDown } from 'react-icons/fa';
import { createClient } from '@/lib/supabase/client';

type WorkspaceMenuProps = {
  name: string;
  slug: string;
  logoUrl: string | null;
};

export default function WorkspaceMenu({
  name,
  slug,
  logoUrl,
}: WorkspaceMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const signOut = async () => {
    if (
      !window.confirm('Are you sure you want to sign out of Konneqta Teams?')
    ) {
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.replace('/');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Could not sign out: ${error.message}`
          : 'Could not sign out. Please try again.',
      );
      setLoading(false);
    }
  };

  const initial = name.trim().charAt(0).toUpperCase() || 'K';

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="workspace-menu"
        onClick={() => {
          setErrorMessage('');
          setOpen((current) => !current);
        }}
        className="flex min-w-0 items-center gap-3 rounded-full border border-zinc-800 bg-[#151515] py-1.5 pl-1.5 pr-4 text-left transition hover:border-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--main-orange)"
      >
        <span
          className={`flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${logoUrl ? '' : 'bg-(--main-orange)'} font-semibold text-zinc-950`}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              aria-hidden="true"
              className="size-full object-cover"
            />
          ) : (
            initial
          )}
        </span>
        <span className="max-w-[min(48vw,18rem)] truncate text-sm font-semibold">
          {name}
        </span>
        <span aria-hidden="true" className="shrink-0 text-zinc-500">
          <FaArrowDown />
        </span>
      </button>

      {open && (
        <div
          id="workspace-menu"
          className="absolute left-0 top-full z-30 mt-2 w-60 rounded-2xl border border-zinc-700 bg-[#1b1b1b] p-2 shadow-2xl"
        >
          <Link
            href={`/${slug}/settings`}
            onClick={() => setOpen(false)}
            className="block rounded-xl px-4 py-3 text-sm text-zinc-200 transition hover:bg-zinc-800 hover:text-white focus-visible:bg-zinc-800 focus-visible:outline-none"
          >
            Workspace Settings
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={signOut}
            className="block w-full rounded-xl px-4 py-3 text-left text-sm text-zinc-200 transition hover:bg-zinc-800 hover:text-white focus-visible:bg-zinc-800 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? 'Signing out…' : 'Sign out'}
          </button>
          {errorMessage && (
            <p
              role="alert"
              className="px-4 py-2 text-xs leading-5 text-red-300"
            >
              {errorMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
