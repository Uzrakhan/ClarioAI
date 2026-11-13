# ClarioAI frontend

Next.js 15 App Router application built with TypeScript and Tailwind CSS. Authentication uses Supabase Auth with the `@supabase/ssr` cookie-based client pattern.

## Configure Supabase Auth

Copy `.env.example` to `.env.local` and set these values from the Supabase project's API settings:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_API_URL=http://localhost:8000
# Or, for projects still using the legacy public anon key:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

The browser uses only the project URL and a publishable key (or the project's public anon key). Never expose the backend's generic `SUPABASE_KEY` unless you have independently confirmed it is the public anon/publishable key; never put a service-role key, database password, signing secret, or other server secret in a `NEXT_PUBLIC_` variable or frontend file. Restart Next.js after changing `.env.local`.

Google sign-in uses Supabase Auth with the PKCE flow. In Supabase Dashboard, enable the Google provider and add the Google OAuth Web Client ID and Client Secret there; never place the Google Client Secret in frontend environment variables. In Google Cloud, set the authorized redirect URI to `https://<project-ref>.supabase.co/auth/v1/callback`. In Supabase Auth URL Configuration, allow the deployed site URL and callback URLs such as `https://<your-domain>/auth/callback` and `http://localhost:3000/auth/callback`.

The frontend uses only the Supabase URL and publishable/anon key, and exchanges the OAuth authorization code server-side into Supabase SSR cookies. Existing confirmed email/password users should be automatically linked to Google when Google returns the same verified email, retaining the existing Supabase user ID and patient ownership. Before launch, verify account linking for this project and review any legacy unconfirmed users; do not create a second account with a different Google email if their patients belong to the old user ID.

On Render, set `FRONTEND_ORIGINS` to the exact production Vercel origin (and retain localhost only if needed) so browser API requests can pass CORS. On Vercel, set `NEXT_PUBLIC_API_URL` to the Render API origin. The Supabase URL and frontend publishable/anon key must also be present in the Vercel environment.

## Run locally

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. `/dashboard`, `/patients`, and `/documents` (and the related upload/report preview routes) require a verified Supabase session. All displayed patient/document records remain synthetic frontend sample data; patient CRUD, real document uploads, and AI processing are not implemented.
