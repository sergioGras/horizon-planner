# Deployment: Authenticated Roadmap MVP

## Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/001_authenticated_roadmap.sql` in the SQL editor.
   Then apply the remaining migrations in numeric order, including
   `008_read_only_display_links.sql` before creating read-only display links.
3. Enable Google in `Authentication > Providers`.
4. Add redirect URLs in `Authentication > URL Configuration`:
   - `http://localhost:8080`
   - your deployed Cloudflare URL
   - your custom domain when available
5. Copy the project URL and anon key.

## Local Environment

Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Run:

```bash
npm run dev
```

## Cloudflare

`VITE_*` values are bundled into the client build, so they must be present before `npm run build`.
For local deploys, set them in your shell or `.env.local`. For CI, configure them as build
environment variables in the CI provider.

```powershell
$env:VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

Then build and deploy with the project's Cloudflare/TanStack Start flow.

```bash
npm run build
npx wrangler deploy
```

## Verification

- Signed-out users can use a local-only roadmap without an account.
- Google sign-in redirects back to the deployed app.
- A first signed-in user can create or import a project.
- Refresh keeps the session and reloads cloud roadmap data.
- RLS blocks cross-user data access in Supabase.
- A revoked read-only display link no longer loads its project.
