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

The browser uses only the project URL and a publishable key (or the project's public anon key). The app accepts either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `NEXT_PUBLIC_API_URL` is the FastAPI origin. Never expose the backend's generic `SUPABASE_KEY` unless you have independently confirmed it is the public anon/publishable key; never put a service-role key, database password, signing secret, or other server secret in a `NEXT_PUBLIC_` variable or frontend file. Restart Next.js after changing `.env.local`.

In Supabase Dashboard → Authentication → URL Configuration, add the local callback URL `http://localhost:3000/auth/callback` to the allowed redirect URLs. Set the site URL to the deployed app origin when deploying, and add the production callback URL there too. Email confirmation must be enabled/configured if signup should require confirmation. The password reset flow returns through the same callback and continues to `/reset-password/update`.

## Run locally

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. `/dashboard`, `/patients`, and `/documents` (and the related upload/report preview routes) require a verified Supabase session. All displayed patient/document records remain synthetic frontend sample data; patient CRUD, real document uploads, and AI processing are not implemented.
