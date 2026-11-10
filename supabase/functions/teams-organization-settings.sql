-- Konneqta Teams: additive workspace settings update.
-- Safe to apply to an existing Teams schema. Does not drop tables, policies, or data.

create or replace function public.update_organization_for_current_user(
    p_organization_id uuid,
    p_name text,
    p_slug text,
    p_website text default null,
    p_industry text default null,
    p_company_size text default null,
    p_contact_email text default null,
    p_logo_action text default 'keep',
    p_logo_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_slug text;
begin
    if v_user_id is null then
        raise exception 'Authentication required' using errcode = '28000';
    end if;

    if not exists (
        select 1
        from public.organization_memberships membership
        where membership.organization_id = p_organization_id
          and membership.user_id = v_user_id
          and membership.role in ('owner', 'admin')
    ) then
        raise exception 'Workspace owner or admin role required'
            using errcode = '42501';
    end if;

    if p_logo_action is null
       or p_logo_action not in ('keep', 'replace', 'remove')
       or (p_logo_action = 'replace' and p_logo_url is null) then
        raise exception 'Invalid workspace logo update'
            using errcode = '22023';
    end if;

    update public.organizations
    set name = btrim(p_name),
        slug = lower(btrim(p_slug)),
        website = nullif(btrim(coalesce(p_website, '')), ''),
        industry = nullif(btrim(coalesce(p_industry, '')), ''),
        company_size = nullif(btrim(coalesce(p_company_size, '')), ''),
        contact_email = nullif(btrim(coalesce(p_contact_email, '')), ''),
        logo_url = case p_logo_action
            when 'replace' then p_logo_url
            when 'remove' then null
            else logo_url
        end
    where id = p_organization_id
    returning slug into v_slug;

    if not found then
        raise exception 'Workspace not found' using errcode = '02000';
    end if;

    return jsonb_build_object('id', p_organization_id, 'slug', v_slug);
end;
$$;

revoke all on function public.update_organization_for_current_user(
    uuid, text, text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.update_organization_for_current_user(
    uuid, text, text, text, text, text, text, text, text
) to authenticated;
