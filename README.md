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

The copied organization setup SQL and signup flow are still being integrated.
Do not run a second schema setup against Supabase until you have checked whether
the organization tables and `create_organization_for_current_user` function
already exist in the shared project.

## Checks

- `pnpm lint`
- `pnpm type-check`
- `pnpm build`
