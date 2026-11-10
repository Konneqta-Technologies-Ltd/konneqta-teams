-- =============================================================================
-- Konneqta Teams: organization signup
-- Run in the Supabase SQL Editor before enabling /teams/signup.
-- Safe to re-run.
-- =============================================================================
--
-- Personal accounts remain in auth.users / profiles. An organization is a
-- separate workspace connected to its owner through organization_memberships.
-- Creating a workspace never creates or modifies a personal profile/card.
-- =============================================================================

create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 2 and 120),
    slug text not null unique
        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 50),
    website text check (
        website is null or (
            char_length(website) <= 2048
            and website ~ '^https?://[^[:space:]]+$'
        )
    ),
    industry text check (
        industry is null or industry in (
            'Technology',
            'Creative & media',
            'Professional services',
            'Finance',
            'Education',
            'Healthcare',
            'Retail & e-commerce',
            'Nonprofit',
            'Other'
        )
    ),
    company_size text check (
        company_size is null or company_size in ('1', '2–10', '11–50', '51–200', '201–500', '501+')
    ),
    contact_email text check (
        contact_email is null or (
            char_length(contact_email) <= 254
            and contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
        )
    ),
    logo_url text check (
        logo_url is null or (
            char_length(logo_url) <= 2048
            and logo_url ~ '^https?://[^[:space:]]+$'
        )
    ),
    created_by uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
    organization_id uuid not null references public.organizations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'member' check (role in ('owner', 'admin', 'member')),
    created_at timestamptz not null default now(),
    primary key (organization_id, user_id)
);

create index if not exists organization_memberships_user_id_idx
    on public.organization_memberships (user_id);

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;

drop policy if exists "organization_members_can_read_organizations"
    on public.organizations;
create policy "organization_members_can_read_organizations"
    on public.organizations
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.organization_memberships membership
            where membership.organization_id = organizations.id
              and membership.user_id = auth.uid()
        )
    );

drop policy if exists "users_can_read_own_organization_memberships"
    on public.organization_memberships;
create policy "users_can_read_own_organization_memberships"
    on public.organization_memberships
    for select
    to authenticated
    using (user_id = auth.uid());

grant select on public.organizations to authenticated;
grant select on public.organization_memberships to authenticated;

create or replace function public.create_organization_for_current_user(
    p_name text,
    p_slug text,
    p_website text default null,
    p_industry text default null,
    p_company_size text default null,
    p_contact_email text default null,
    p_logo_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_organization_id uuid;
begin
    if v_user_id is null then
        raise exception 'Authentication required' using errcode = '28000';
    end if;

    insert into public.organizations (
        name,
        slug,
        website,
        industry,
        company_size,
        contact_email,
        logo_url,
        created_by
    )
    values (
        btrim(p_name),
        lower(btrim(p_slug)),
        nullif(btrim(p_website), ''),
        nullif(btrim(p_industry), ''),
        nullif(btrim(p_company_size), ''),
        nullif(btrim(p_contact_email), ''),
        nullif(btrim(p_logo_url), ''),
        v_user_id
    )
    returning id into v_organization_id;

    insert into public.organization_memberships (organization_id, user_id, role)
    values (v_organization_id, v_user_id, 'owner');

    return jsonb_build_object('id', v_organization_id, 'slug', lower(btrim(p_slug)));
end;
$$;

revoke all on function public.create_organization_for_current_user(
    text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.create_organization_for_current_user(
    text, text, text, text, text, text, text
) to authenticated;
