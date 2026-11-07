# Konneqta Teams

The standalone web app for creating and managing Konneqta team workspaces. It
uses the same Supabase project as Konneqta so a person can use one account for
their personal profile and organization memberships.

## Local setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   to the values from the **same Supabase project used by Konneqta**. The key
   is a public/publishable key; never put a service-role key in this app.
4. In Supabase **Authentication → URL Configuration → Redirect URLs**, add
   both callback URLs:
   - `http://localhost:3001/auth/callback`
   - `https://teams.konneqta.com/auth/callback`
5. In **Authentication → Sign In / Providers → Google**, enable Google. In the
   Google Cloud OAuth client, add the Supabase callback URL shown by Supabase
   as an authorized redirect URI. Google should return to Supabase; Supabase
   then returns to the Teams callback above.
6. Start the app with `pnpm dev` (this project runs on port `3001`).

Keep the Supabase **Site URL** set to the existing Konneqta production URL.
Teams passes its own callback URL during sign-in. If that callback is missing
from Supabase's **Redirect URLs** allowlist, Supabase may fall back to its Site
URL, which sends the Google response to the Konneqta homepage instead of this
app. After adding the callback URLs, try Google sign-in again from
`http://localhost:3001`.

The local Supabase values can be found in Konneqta's existing `.env.local`.
Never commit `.env.local` or put a service-role key in this app.

## Shared Supabase database

The Teams workspace tables live in the same Supabase project as Konneqta. If
the `organizations` and `organization_memberships` tables and
`create_organization_for_current_user` function already exist, apply only
`supabase/functions/teams-organization-settings.sql` in the SQL Editor to
enable workspace settings updates. This update adds a permission-checked
function; it does not drop tables, policies, or data.

Use `supabase/functions/teams-setup.sql` only when setting up the Teams schema
for a project that does not already have it, then apply the settings update
script above. Do not rerun the full setup script just to add settings support;
it recreates policies and may trigger Supabase's destructive-operation warning
even though it does not delete workspace data.

## Checks

- `pnpm lint`
- `pnpm type-check`
- `pnpm build`
