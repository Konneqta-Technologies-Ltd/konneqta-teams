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

const companySizes = [
  '1',
  '2–10',
  '11–50',
  '51–200',
  '201–500',
  '501+',
] as const;

const organizationSchema = Joi.object({
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
  logoPath: Joi.string().allow(null).default(null),
}).unknown(false);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Sign in to create a team workspace.' },
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

  const { error: validationError, value } = organizationSchema.validate(body, {
    abortEarly: false,
    convert: true,
  });
  if (validationError) {
    return NextResponse.json(
      {
        error:
          validationError.details[0]?.message ??
          'Check the organization details and try again.',
      },
      { status: 400 },
    );
  }

  const logoPath = value.logoPath as string | null;
  const logoPathPattern = new RegExp(
    `^${user.id}/org-logos/[0-9a-f-]{36}\\.(?:png|jpe?g|webp)$`,
    'i',
  );
  if (logoPath && !logoPathPattern.test(logoPath)) {
    return NextResponse.json(
      { error: 'The selected logo does not belong to this account.' },
      { status: 400 },
    );
  }

  let logoUrl: string | null = null;
  if (logoPath) {
    const { data } = supabase.storage.from('logos').getPublicUrl(logoPath);
    logoUrl = data.publicUrl;
  }

  const { data, error } = await supabase.rpc(
    'create_organization_for_current_user',
    {
      p_name: value.name,
      p_slug: value.slug,
      p_website: value.website || null,
      p_industry: value.industry || null,
      p_company_size: value.companySize || null,
      p_contact_email: value.contactEmail || null,
      p_logo_url: logoUrl,
    },
  );

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        {
          error:
            'That workspace URL is already in use. Choose another URL and try again.',
        },
        { status: 409 },
      );
    }
    console.error('[teams/organizations] create failed:', error.message);
    return NextResponse.json(
      {
        error:
          'We could not save the organization. Please try again or contact support.',
      },
      { status: 500 },
    );
  }

  if (
    !data ||
    typeof data !== 'object' ||
    !('id' in data) ||
    typeof data.id !== 'string' ||
    !('slug' in data) ||
    typeof data.slug !== 'string'
  ) {
    console.error(
      '[teams/organizations] create RPC returned an invalid response.',
    );
    return NextResponse.json(
      {
        error:
          'The organization was saved, but we could not confirm it. Please contact support.',
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { organization: { id: data.id, slug: data.slug } },
    { status: 201 },
  );
}
