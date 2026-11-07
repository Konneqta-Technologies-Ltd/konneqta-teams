import Joi from 'joi';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const industries = [
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

const companySizes = ['1', '2–10', '11–50', '51–200', '201–500', '501+'] as const;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const settingsSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  slug: Joi.string()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .min(3)
    .max(50)
    .required(),
  website: Joi.string()
    .trim()
    .max(2048)
    .uri({ scheme: ['http', 'https'] })
    .allow('')
    .default(''),
  industry: Joi.string()
    .valid(...industries)
    .allow('')
    .default(''),
  companySize: Joi.string()
    .valid(...companySizes)
    .allow('')
    .default(''),
  contactEmail: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .allow('')
    .max(254)
    .default(''),
  logoAction: Joi.string().valid('keep', 'replace', 'remove').required(),
  logoPath: Joi.string().allow(null).default(null),
})
  .unknown(false)
  .custom((value, helpers) => {
    if (value.logoAction === 'replace' && !value.logoPath) {
      return helpers.error('any.invalid');
    }
    if (value.logoAction !== 'replace' && value.logoPath) {
      return helpers.error('any.invalid');
    }
    return value;
  })
  .messages({
    'any.invalid': 'Choose a valid logo update and try again.',
  });

type RouteContext = {
  params: Promise<{ organizationId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const { organizationId } = await params;
  if (!uuidPattern.test(organizationId)) {
    return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && userError.name !== 'AuthSessionMissingError') {
    console.error('[teams/settings] session lookup failed:', userError.message);
    return NextResponse.json(
      { error: 'We could not verify your session. Please sign in again.' },
      { status: 401 },
    );
  }
  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to update workspace settings.' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'The request body must be valid JSON.' },
      { status: 400 },
    );
  }

  const { error: validationError, value } = settingsSchema.validate(body, {
    abortEarly: false,
    convert: true,
  });
  if (validationError) {
    return NextResponse.json(
      {
        error:
          validationError.details[0]?.message ??
          'Check the workspace details and try again.',
      },
      { status: 400 },
    );
  }

  let logoUrl: string | null = null;
  if (value.logoAction === 'replace') {
    const logoPathPattern = new RegExp(
      `^${user.id}/org-logos/[0-9a-f-]{36}\\.png$`,
      'i',
    );
    if (!logoPathPattern.test(value.logoPath)) {
      return NextResponse.json(
        { error: 'The selected logo does not belong to this account.' },
        { status: 400 },
      );
    }
    const { data } = supabase.storage.from('logos').getPublicUrl(value.logoPath);
    logoUrl = data.publicUrl;
  }

  const { data, error } = await supabase.rpc(
    'update_organization_for_current_user',
    {
      p_organization_id: organizationId,
      p_name: value.name,
      p_slug: value.slug,
      p_website: value.website || null,
      p_industry: value.industry || null,
      p_company_size: value.companySize || null,
      p_contact_email: value.contactEmail || null,
      p_logo_action: value.logoAction,
      p_logo_url: logoUrl,
    },
  );

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'That workspace URL is already in use.' },
        { status: 409 },
      );
    }
    if (error.code === '42501') {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can make changes.' },
        { status: 403 },
      );
    }
    if (error.code === '02000') {
      return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
    }

    console.error('[teams/settings] update failed:', error.message);
    return NextResponse.json(
      { error: 'We could not save workspace settings. Please try again.' },
      { status: 500 },
    );
  }

  if (
    !data ||
    typeof data !== 'object' ||
    !('slug' in data) ||
    typeof data.slug !== 'string'
  ) {
    console.error('[teams/settings] update RPC returned an invalid response.');
    return NextResponse.json(
      { error: 'The workspace was updated, but we could not confirm the result.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ organization: { slug: data.slug } });
}
