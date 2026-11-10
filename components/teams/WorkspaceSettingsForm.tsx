'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import { compressImage, LOGO_OPTIONS } from '@/lib/image';
import { ALLOWED_IMAGE_TYPES } from '@/lib/url-validation';
import { createClient } from '@/lib/supabase/client';

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

const COMPANY_SIZES = ['1', '2–10', '11–50', '51–200', '201–500', '501+'] as const;

type WorkspaceSettings = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  contactEmail: string | null;
  logoUrl: string | null;
};

type WorkspaceSettingsFormProps = {
  organization: WorkspaceSettings;
  canEdit: boolean;
};

export default function WorkspaceSettingsForm({
  organization,
  canEdit,
}: WorkspaceSettingsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(organization.name);
  const [slug, setSlug] = useState(organization.slug);
  const [website, setWebsite] = useState(organization.website ?? '');
  const [industry, setIndustry] = useState(organization.industry ?? '');
  const [companySize, setCompanySize] = useState(
    organization.companySize ?? '',
  );
  const [contactEmail, setContactEmail] = useState(
    organization.contactEmail ?? '',
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [removeLogo, setRemoveLogo] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!logoPreview) return;
    return () => URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  const inputClassName =
    'mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-(--main-orange) focus:ring-1 focus:ring-(--main-orange) disabled:cursor-not-allowed disabled:opacity-60';

  const handleLogoSelection = (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.some((type) => type === file.type)) {
      setLogoFile(null);
      setLogoPreview('');
      setSuccessMessage('');
      setErrorMessage('Choose a PNG, JPG, or WebP logo.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoFile(null);
      setLogoPreview('');
      setSuccessMessage('');
      setErrorMessage('Choose a logo smaller than 5 MB.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setRemoveLogo(false);
    setLogoPreview(URL.createObjectURL(file));
    setLogoFile(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit || loading) return;

    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    let uploadedLogoPath: string | null = null;
    try {
      const supabase = createClient();
      if (logoFile) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw new Error(userError.message);
        if (!user) {
          throw new Error('Your session expired. Sign in again to continue.');
        }

        const compressedLogo = await compressImage(logoFile, LOGO_OPTIONS);
        uploadedLogoPath = `${user.id}/org-logos/${crypto.randomUUID()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(uploadedLogoPath, compressedLogo, {
            contentType: compressedLogo.type,
            upsert: false,
          });
        if (uploadError) {
          uploadedLogoPath = null;
          throw new Error(`Logo upload failed: ${uploadError.message}`);
        }
      }

      const response = await fetch(
        `/api/teams/organizations/${organization.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            website: website.trim(),
            industry,
            companySize,
            contactEmail: contactEmail.trim(),
            logoAction: removeLogo ? 'remove' : logoFile ? 'replace' : 'keep',
            logoPath: uploadedLogoPath,
          }),
        },
      );

      let result: {
        error?: string;
        organization?: { slug?: string };
      };
      try {
        result = (await response.json()) as typeof result;
      } catch {
        throw new Error('We could not read the save response. Please try again.');
      }

      if (!response.ok) {
        if (uploadedLogoPath) {
          const { error: cleanupError } = await supabase.storage
            .from('logos')
            .remove([uploadedLogoPath]);
          if (cleanupError) {
            console.error(
              '[teams/settings] uploaded logo cleanup failed:',
              cleanupError.message,
            );
          }
          uploadedLogoPath = null;
        }
        throw new Error(
          result.error ?? 'We could not save workspace settings. Please try again.',
        );
      }

      const updatedSlug = result.organization?.slug;
      if (!updatedSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(updatedSlug)) {
        throw new Error(
          'The workspace was updated, but we could not confirm its URL. Please contact support.',
        );
      }

      setLogoFile(null);
      setLogoPreview('');
      setRemoveLogo(false);
      if (updatedSlug !== organization.slug) {
        router.replace(`/${updatedSlug}`);
        return;
      }

      setSuccessMessage('Workspace settings saved.');
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not save workspace settings. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-7">
      <fieldset disabled={!canEdit || loading} className="space-y-7">
        <div>
          <h2 className="text-lg font-semibold">Organization profile</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Update the details for this team workspace.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="workspaceName" className="text-sm font-medium">
              Organization name
            </label>
            <input
              id="workspaceName"
              name="name"
              required
              minLength={2}
              maxLength={120}
              autoComplete="organization"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="workspaceSlug" className="text-sm font-medium">
              Workspace URL
            </label>
            <div className="mt-2 flex items-center rounded-xl border border-zinc-700 bg-zinc-900 px-3 focus-within:border-(--main-orange)">
              <span className="shrink-0 text-xs text-zinc-500">
                /
              </span>
              <input
                id="workspaceSlug"
                name="slug"
                required
                minLength={3}
                maxLength={50}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                autoComplete="off"
                value={slug}
                onChange={(event) =>
                  setSlug(
                    event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-')
                      .replace(/-{2,}/g, '-')
                      .slice(0, 50),
                  )
                }
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Changing this URL updates your dashboard address.
            </p>
          </div>

          <div>
            <label htmlFor="workspaceWebsite" className="text-sm font-medium">
              Website
            </label>
            <input
              id="workspaceWebsite"
              name="website"
              type="url"
              maxLength={2048}
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              className={inputClassName}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label htmlFor="workspaceIndustry" className="text-sm font-medium">
              Industry
            </label>
            <select
              id="workspaceIndustry"
              name="industry"
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              className={inputClassName}
            >
              <option value="">Select an industry</option>
              {INDUSTRIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="workspaceSize" className="text-sm font-medium">
              Company size
            </label>
            <select
              id="workspaceSize"
              name="companySize"
              value={companySize}
              onChange={(event) => setCompanySize(event.target.value)}
              className={inputClassName}
            >
              <option value="">Select company size</option>
              {COMPANY_SIZES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="workspaceEmail" className="text-sm font-medium">
              General contact email
            </label>
            <input
              id="workspaceEmail"
              name="contactEmail"
              type="email"
              maxLength={254}
              autoComplete="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              className={inputClassName}
              placeholder="hello@example.com"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium">Organization logo</h3>
          <p className="mt-1 text-xs text-zinc-500">
            PNG, JPG, or WebP, up to 5 MB.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900">
              {removeLogo ? (
                <span className="text-xs text-zinc-600">No logo</span>
              ) : logoPreview || organization.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview || organization.logoUrl || ''}
                  alt="Organization logo preview"
                  className="size-full object-contain p-2"
                />
              ) : (
                <span className="text-2xl font-semibold text-(--main-orange)">
                  {name.trim().charAt(0).toUpperCase() || 'K'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  handleLogoSelection(event.target.files?.[0])
                  event.currentTarget.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Choose logo
              </button>
              {logoFile && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview('');
                  }}
                  className="rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition hover:text-red-300"
                >
                  Discard selected logo
                </button>
              )}
              {organization.logoUrl && !removeLogo && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview('');
                    setRemoveLogo(true);
                  }}
                  className="rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition hover:text-red-300"
                >
                  Remove logo
                </button>
              )}
              {removeLogo && (
                <button
                  type="button"
                  onClick={() => setRemoveLogo(false)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition hover:text-white"
                >
                  Keep current logo
                </button>
              )}
            </div>
          </div>
        </div>
      </fieldset>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          {successMessage}
        </p>
      )}

      {canEdit && (
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-w-40 items-center justify-center gap-2 rounded-full bg-(--main-orange) px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
        >
          {loading && <Spinner size="sm" />}
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      )}
    </form>
  );
}
