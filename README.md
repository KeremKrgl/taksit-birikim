# Taksit & Birikim

A mobile-first web app (PWA) for Turkey: every credit card installment (taksit) you owe across all banks, plus the real, after-inflation value of your savings.

The app never connects to banks and never holds or moves money. Data comes from manual entry or statements the user uploads. Only the last 4 digits of a card are stored, and all money is stored as whole kuruş (`bigint`).

**Status:** phase 1 of 7 (foundation). See [Phases](#phases).

## Stack

Next.js 16 (App Router, TypeScript strict) · Supabase (Auth, Postgres with RLS on every table, Storage) · Tailwind CSS 4 with shadcn/ui conventions · next-intl (Turkish default at `/`, English at `/en`) · Zod on every server action · Vitest · Playwright · deployed on Vercel (`fra1`) next to Supabase Frankfurt.

## Run it locally

Requirements: Node 22, pnpm 10, a Supabase project (free tier is fine).

```bash
pnpm install
cp .env.example .env.local   # fill in the values, see below
pnpm dev                     # http://localhost:3000
```

### Environment variables

| Name | Where it's used | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | no |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server (anon or "publishable" key) | no, RLS protects the data |
| `SUPABASE_SERVICE_ROLE_KEY` | server only, account deletion | **yes**, never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | sign-in links | no |
| `DATABASE_URL` | RLS tests only | test database only |

Later phases add `OPENAI_API_KEY`, `EVDS_API_KEY`, `RESEND_API_KEY`, VAPID keys and PostHog; they are listed, commented out, in `.env.example`.

## Set up Supabase

1. Create a project in **Frankfurt (eu-central-1)**.
2. Apply the migrations in `supabase/migrations/`, in file-name order. Either:
   - with the Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`, or
   - paste each file into the SQL editor and run it.
3. **Authentication → URL configuration:** Site URL = your app URL (e.g. `https://taksit.vercel.app`). Add `http://localhost:3000/**` and your Vercel preview URL pattern to Redirect URLs.
4. **Authentication → Providers:** turn on Email (magic link) and Google. For Google, create an OAuth client in Google Cloud and set its redirect URI to `https://<project-ref>.supabase.co/auth/v1/callback`.
5. **Authentication → Email templates → Magic link** (and **Confirm signup**): make the link point at the app's confirm route, so it works even when the email opens in a different browser:

   ```html
   <h2>Taksit & Birikim'e giriş</h2>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Giriş yapmak için dokun</a></p>
   <p>Bu e-postayı sen istemediysen görmezden gelebilirsin.</p>
   ```

6. Before real users: set up custom SMTP (e.g. Resend) under Authentication → SMTP; the built-in sender is rate-limited.

## Tests

```bash
pnpm test        # unit tests (Vitest)
pnpm typecheck   # route types + tsc
pnpm lint

# Row Level Security: proves user A can't read or change user B's data, on every table.
eval "$(scripts/test-db.sh)"   # throwaway Postgres 16 + Supabase stub + migrations
pnpm test:rls
```

`scripts/test-db.sh` needs Postgres 16 binaries (`apt install postgresql-16`); no Docker. CI (`.github/workflows/ci.yml`) runs all of the above plus `pnpm build` on every pull request, using a Postgres service container.

The RLS suite also fails if any table in `public` has RLS turned off or isn't listed in the test, so a new table can't ship unchecked.

The Playwright happy-path test (`pnpm test:e2e`) arrives in phase 2 with the first real user flow.

## Deploy (Vercel + Supabase)

1. Push the repo to GitHub and import it in Vercel. Framework preset: Next.js. `vercel.json` pins the functions to `fra1`.
2. Add the four environment variables above in Vercel (Production and Preview). Set `NEXT_PUBLIC_SITE_URL` to the production URL.
3. Add the Vercel URL to Supabase's Site URL / Redirect URLs (step 3 above).
4. Deploy. Open the site on a phone and use "Ana ekrana ekle" to install it.

## How it's put together

```
app/[locale]/(public)    sign-in, privacy notice (no account needed)
app/[locale]/(gate)      consent (onay), welcome (hosgeldin): signed in, not yet set up
app/[locale]/(app)       the app itself: signed in + current consent + onboarded
app/auth/*               magic-link and Google callbacks
app/api/export           "download my data" (JSON)
proxy.ts                 locale routing + Supabase session refresh + sign-in redirect
lib/supabase             server (as the user), browser, admin (service role, server only)
lib/auth.ts              data access layer: getUser, requireUser, getProfile
lib/consent.ts           consent version; bump it to ask everyone again
messages/{tr,en}.json    all UI text
public/sw.js             service worker: offline reading, push (phase 5)
supabase/migrations      schema, RLS, reference data
tests/unit, tests/rls    Vitest
```

### Privacy (KVKK) in phase 1

- Consent screen with the aydınlatma metni; every choice is logged in `consent_events` with its version. Users can't edit that log or their consent flags directly.
- "Verilerimi indir" downloads everything the user owns as JSON.
- "Hesabımı sil" deletes the auth user; every table cascades. Offline copies on the phone are cleared on sign-out and deletion.
- The aydınlatma metni (`components/legal/notice-content.tsx`) is a **draft**: fill in the data-controller details and have a lawyer review it before launch.

## Phases

1. **Foundation** (this): auth, consent, profile, export/delete, i18n, PWA shell, schema + RLS with tests.
2. Installments: cards, purchases, schedule, dashboard, mark paid, heavy-month warning, demo seed, Playwright test.
3. Statement PDF upload with LLM parsing and a review screen.
4. Savings and inflation (TCMB EVDS rates, TÜFE, real return, net position).
5. Push and email reminders, monthly summary, analytics.
6. Free/premium flags and paywall (iyzico later).
7. Share card and referrals.
