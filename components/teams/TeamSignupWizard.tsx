'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { compressImage, LOGO_OPTIONS } from '@/lib/image';
import { ALLOWED_IMAGE_TYPES, safeFileExtension } from '@/lib/url-validation';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';

const INDUSTRIES = [
  'Technology',
  'Creative & media',
  'Professional services',
  'Finance',
  'Education',
  'Healthcare',
  'Retail & e-commerce',
  'Nonprofit',
  'Other',
] as const;

const COMPANY_SIZES = [
  '1',
  '2–10',
  '11–50',
  '51–200',
  '201–500',
  '501+',
] as const;

const STEPS = ['Basics', 'About', 'Branding', 'Finish'] as const;

type OrganizationResult = {
  id: string;
  slug: string;
};

function slugifyOrganizationName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function isValidWebsite(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function TeamSignupWizard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [organizationName, setOrganizationName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdOrganization, setCreatedOrganization] =
    useState<OrganizationResult | null>(null);

  const inputClassName =
    'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-(--main-orange) focus:outline-none focus:ring-1 focus:ring-(--main-orange)';
  const normalizedSlug = slug.trim().toLowerCase();

  useEffect(() => {
    if (!logoPreview) return;
    return () => URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  const updateOrganizationName = (value: string) => {
    setOrganizationName(value);
    if (!slugWasEdited) setSlug(slugifyOrganizationName(value));
  };

  const handleSlugChange = (value: string) => {
    setSlugWasEdited(true);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50),
    );
  };

  const validateStep = () => {
    if (step === 0) {
      if (organizationName.trim().length < 2) {
        setErrorMessage(
          'Enter an organization name with at least 2 characters.',
        );
        return false;
      }
      if (
        normalizedSlug.length < 3 ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)
      ) {
        setErrorMessage(
          'Use 3–50 lowercase letters, numbers, or single hyphens for the workspace URL.',
        );
        return false;
      }
    }
    if (step === 1) {
      if (!isValidWebsite(website)) {
        setErrorMessage(
          'Enter a website that starts with http:// or https://.',
        );
        return false;
      }
      if (
        contactEmail.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())
      ) {
        setErrorMessage('Enter a valid general contact email address.');
        return false;
      }
    }
    setErrorMessage('');
    return true;
  };

  const handleContinue = () => {
    if (validateStep())
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setErrorMessage('');
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleLogoSelection = (file: File | undefined) => {
    if (!file) return;
    const allowedImageTypes: readonly string[] = ALLOWED_IMAGE_TYPES;
    if (!allowedImageTypes.includes(file.type)) {
      setErrorMessage(
        'Choose a PNG, JPG, or WebP logo. SVG files are not supported.',
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Choose a logo smaller than 5 MB.');
      return;
    }

    setErrorMessage('');
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCreateOrganization = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setErrorMessage('');

    let uploadedLogoPath: string | null = null;
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);
      if (!user)
        throw new Error('Your session has expired. Sign in again to continue.');

      if (logoFile) {
        const compressedLogo = await compressImage(logoFile, LOGO_OPTIONS);
        const logoPath = `${user.id}/org-logos/${crypto.randomUUID()}.${safeFileExtension(compressedLogo.name)}`;
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(logoPath, compressedLogo, {
            contentType: compressedLogo.type,
            upsert: false,
          });
        if (uploadError)
          throw new Error(`Logo upload failed: ${uploadError.message}`);
        uploadedLogoPath = logoPath;
      }

      const response = await fetch('/api/teams/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: organizationName.trim(),
          slug: normalizedSlug,
          website: website.trim(),
          industry,
          companySize,
          contactEmail: contactEmail.trim(),
          logoPath: uploadedLogoPath,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        organization?: OrganizationResult;
      };

      if (!response.ok) {
        if (uploadedLogoPath) {
          const { error: cleanupError } = await supabase.storage
            .from('logos')
            .remove([uploadedLogoPath]);
          if (cleanupError) {
            console.error(
              '[teams/signup] logo cleanup failed:',
              cleanupError.message,
            );
          }
        }
        throw new Error(
          result.error ??
            'We could not create the workspace. Please try again.',
        );
      }

      if (!result.organization?.id || !result.organization.slug) {
        throw new Error(
          'The workspace was created, but its confirmation was incomplete. Please contact support.',
        );
      }

      setCreatedOrganization(result.organization);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not create the workspace. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMessage(`Could not sign out: ${error.message}`);
      setLoading(false);
      return;
    }
    router.push('/teams/signup');
  };

  if (createdOrganization) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090909] px-4 py-10 text-white">
        <section className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400 text-2xl font-bold text-zinc-950">
            ✓
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-emerald-300">
            Workspace created
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {organizationName} is ready.
          </h1>
          <p className="mt-4 text-zinc-300">
            Your personal Konneqta profile has not changed. The organization is
            linked to the account you used to sign in.
          </p>
          <div className="mt-8 rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-left">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Chosen workspace address
            </p>
            <p className="mt-1 break-all font-medium">
              teams.konneqta.com/{createdOrganization.slug}
            </p>
          </div>
          <p className="mt-5 text-sm text-zinc-400">
            The team dashboard, member management, and live workspace page are
            the next part of the Teams rollout.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-(--main-orange) px-6 py-3 font-semibold text-white hover:opacity-90"
          >
            Return to Konneqta
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090909] px-4 py-6 text-white sm:px-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <Link href="/" aria-label="Konneqta home">
          <BrandLogo className="h-8 w-auto" priority />
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="rounded-full bg-(--brand-cream) px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-60"
        >
          Sign out
        </button>
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)] lg:items-stretch">
        <section className="flex min-h-[620px] flex-col py-2 sm:py-4 lg:pr-8">
          <div className="flex items-center justify-between text-sm text-zinc-400">
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
            <span>{STEPS[step]}</span>
          </div>
          <div
            role="progressbar"
            className="mt-4 grid grid-cols-4 gap-2"
            aria-label="Organization setup progress"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
          >
            {STEPS.map((label, index) => (
              <span
                key={label}
                aria-label={`${label}${index <= step ? ', complete or current' : ', upcoming'}`}
                className={`h-1.5 rounded-full ${index <= step ? 'bg-(--main-orange)' : 'bg-zinc-800'}`}
              />
            ))}
          </div>

          <div className="mt-9 flex-1">
            {step === 0 && (
              <div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                  What&apos;s your{' '}
                  <span className="text-(--main-orange)">organization</span>{' '}
                  called?
                </h1>
                <p className="mt-3 text-sm text-zinc-400">
                  Start a workspace for your team. You&apos;ll be its owner and
                  admin.
                </p>
                <label
                  className="mt-8 block text-sm font-medium"
                  htmlFor="organizationName"
                >
                  Organization name
                </label>
                <input
                  id="organizationName"
                  className={`${inputClassName} mt-2`}
                  value={organizationName}
                  onChange={(event) =>
                    updateOrganizationName(event.target.value)
                  }
                  maxLength={120}
                  placeholder="Your organization"
                  autoComplete="organization"
                />
                <label
                  className="mt-5 block text-sm font-medium"
                  htmlFor="organizationSlug"
                >
                  Organization URL
                </label>
                <div className="mt-2 flex items-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 focus-within:border-(--main-orange)">
                  <span className="shrink-0 text-sm text-zinc-500">
                    teams.konneqta.com/
                  </span>
                  <input
                    id="organizationSlug"
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none"
                    value={slug}
                    onChange={(event) => handleSlugChange(event.target.value)}
                    maxLength={50}
                    placeholder="your-organization"
                    autoComplete="off"
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Use 3–50 lowercase letters, numbers, or hyphens. You can edit
                  the suggested address.
                </p>
              </div>
            )}

            {step === 1 && (
              <div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                  A little more{' '}
                  <span className="text-(--main-orange)">about you.</span>
                </h1>
                <p className="mt-3 text-sm text-zinc-400">
                  These details help your workspace represent your organization.
                </p>
                <label
                  className="mt-8 block text-sm font-medium"
                  htmlFor="website"
                >
                  Website{' '}
                  <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <input
                  id="website"
                  className={`${inputClassName} mt-2`}
                  type="url"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://yourcompany.com"
                  autoComplete="url"
                />
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      className="block text-sm font-medium"
                      htmlFor="industry"
                    >
                      Industry
                    </label>
                    <select
                      id="industry"
                      className={`${inputClassName} mt-2`}
                      value={industry}
                      onChange={(event) => setIndustry(event.target.value)}
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium"
                      htmlFor="companySize"
                    >
                      Company size
                    </label>
                    <select
                      id="companySize"
                      className={`${inputClassName} mt-2`}
                      value={companySize}
                      onChange={(event) => setCompanySize(event.target.value)}
                    >
                      <option value="">Select size</option>
                      {COMPANY_SIZES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <label
                  className="mt-5 block text-sm font-medium"
                  htmlFor="contactEmail"
                >
                  General contact email{' '}
                  <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <input
                  id="contactEmail"
                  className={`${inputClassName} mt-2`}
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="hello@yourcompany.com"
                  autoComplete="email"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  This is displayed as an organization contact, never used to
                  sign in.
                </p>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                  Give it your{' '}
                  <span className="text-(--main-orange)">look.</span>
                </h1>
                <p className="mt-3 text-sm text-zinc-400">
                  Add your organization logo now or continue without one.
                </p>
                <input
                  ref={fileInputRef}
                  className="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    handleLogoSelection(event.target.files?.[0])
                  }
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-8 flex min-h-48 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 px-5 text-center transition-colors hover:border-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--main-orange)"
                >
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="Organization logo preview"
                      className="h-20 w-20 rounded-xl object-contain"
                    />
                  ) : (
                    <span className="text-3xl text-zinc-400">↑</span>
                  )}
                  <span className="mt-3 font-semibold">
                    {logoFile ? 'Choose a different logo' : 'Upload a logo'}
                  </span>
                  <span className="mt-1 text-xs text-zinc-500">
                    PNG, JPG or WebP · up to 5 MB
                  </span>
                </button>
              </div>
            )}

            {step === 3 && (
              <div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                  Ready when{' '}
                  <span className="text-(--main-orange)">you are.</span>
                </h1>
                <p className="mt-3 text-sm text-zinc-400">
                  Review your organization details before creating its
                  workspace.
                </p>
                <dl className="mt-8 divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900 px-5">
                  {[
                    ['Organization', organizationName.trim()],
                    ['URL', `teams.konneqta.com/${normalizedSlug}`],
                    ['Industry', industry || 'Not added'],
                    ['Company size', companySize || 'Not added'],
                    ['Website', website.trim() || 'Not added'],
                    ['General contact', contactEmail.trim() || 'Not added'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <dt className="text-sm text-zinc-400">{label}</dt>
                      <dd className="break-all text-sm font-medium sm:text-right">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 text-sm leading-6 text-zinc-400">
                  You&apos;ll be the owner and admin of this workspace. Your
                  personal Konneqta profile stays exactly as it is.
                </p>
              </div>
            )}
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {errorMessage}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-4">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="rounded-full bg-zinc-800 px-6 py-3 text-sm font-semibold hover:bg-zinc-700 disabled:opacity-50"
              >
                Back
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleContinue}
                className="rounded-full bg-(--brand-cream) px-7 py-3 text-sm font-semibold text-zinc-950 hover:bg-white"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreateOrganization}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-(--main-orange) px-7 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Spinner size="sm" className="text-white" />}
                {loading ? 'Creating workspace…' : 'Create organization'}
              </button>
            )}
          </div>
        </section>

        <aside
          aria-label="Organization card preview"
          className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-3xl bg-[#6B21D4] p-8 sm:min-h-[620px]"
        >
          <span className="absolute left-12 top-16 h-3 w-3 rounded-full bg-[#F3C23A]" />
          <span className="absolute right-16 top-32 h-3 w-3 rounded-full bg-[#2DD9A6]" />
          <span className="absolute bottom-24 right-16 h-3 w-3 rounded-full bg-[#F3C23A]" />
          <div className="absolute bottom-20 h-44 w-64 rotate-3 rounded-3xl bg-[#2DD9A6] sm:h-56 sm:w-80" />
          <div className="relative w-full max-w-md -rotate-2 rounded-3xl bg-[#F3EFE4] p-6 text-zinc-950 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt=""
                  className="h-12 w-12 rounded-xl object-contain"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--main-orange) text-xl font-bold">
                  {organizationName.trim().charAt(0).toUpperCase() || 'K'}
                </span>
              )}
              <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold text-white">
                Workspace
              </span>
            </div>
            <h2 className="mt-5 break-words text-2xl font-bold sm:text-3xl">
              {organizationName.trim() || 'Your organization'}
            </h2>
            <p className="mt-1 break-all text-sm text-zinc-700">
              teams.konneqta.com/{normalizedSlug || 'your-organization'}
            </p>
            <div className="mt-5 border-t border-zinc-300 pt-4">
              <span className="rounded-full border border-zinc-400 px-3 py-1 text-xs font-semibold">
                You · Owner
              </span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
