'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import AuthShell from '@/components/auth/AuthShell';
import GoogleIcon from '@/components/ui/GoogleIcon';

type AuthMode = 'login' | 'signup';

export default function AuthForm({
  mode,
  nextPath,
  showCallbackError = false,
}: {
  mode: AuthMode;
  nextPath: string;
  showCallbackError?: boolean;
}) {
  const isSignup = mode === 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputClassName =
    'mt-2 w-full rounded-xl border border-[#303030] bg-[#171717] px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-(--main-orange) focus:ring-2 focus:ring-(--main-orange)/20';
  const linkedAuthPath = `/auth/${isSignup ? 'login' : 'signup'}?next=${encodeURIComponent(nextPath)}`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || password.length < 6) {
      setError('Enter a valid email address and a password of at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (isSignup) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: (() => {
              const callbackUrl = new URL('/auth/callback', window.location.origin);
              callbackUrl.searchParams.set('next', nextPath);
              return callbackUrl.toString();
            })(),
          },
        });

        if (authError) throw authError;
        if (!data.session) {
          setMessage(
            'Check your email to confirm your account. The confirmation link will bring you back to Konneqta Teams.',
          );
          return;
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
      }

      window.location.assign(nextPath);
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : 'We could not complete sign-in. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const supabase = createClient();
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('next', nextPath);
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl.toString() },
      });
      if (authError) throw authError;
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : 'Google sign-in could not be started. Please try again.',
      );
      setLoading(false);
    }
  };

  return (
    <AuthShell
      topAction={
        <Link
          href={linkedAuthPath}
          className="rounded-full bg-(--brand-cream) px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-white"
        >
          {isSignup ? 'Sign in' : 'Sign up'}
        </Link>
      }
    >
      <section className="w-full">
        <p className="text-sm font-semibold text-(--main-orange)">
          {isSignup ? 'TEAM WORKSPACE' : 'WELCOME BACK'}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {isSignup
            ? 'Use your Konneqta account for both your personal profile and your team workspace.'
            : 'Sign in with the Konneqta account you want to use as the workspace owner.'}
        </p>

        {showCallbackError && (
          <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            The confirmation link could not be completed. Try signing in again or request a new link.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </p>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl bg-(--brand-cream) px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-500">
          <span className="h-px flex-1 bg-zinc-800" />
          or continue with email
          <span className="h-px flex-1 bg-zinc-800" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-zinc-200">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-zinc-200">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-(--main-orange) px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Please wait…'
              : isSignup
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>
      </section>
    </AuthShell>
  );
}
