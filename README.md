# PowerCycle

PowerCycle is a circular-economy prototype for giving unwanted electronics a new purpose.

## Current status

The project is being implemented phase by phase from `POWERCYCLE_MASTER_SPEC.md`. The current prototype includes a Vite client, an Express API, deterministic assessment guidance, seeded catalog definitions, safe AI upload fallback behavior, a local demo cart, and optional MongoDB model/seed boundaries.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer

## Local setup

```powershell
npm install
npm run typecheck
npm run build
```

Copy the environment examples before running either workspace:

```powershell
Copy-Item client/.env.example client/.env
Copy-Item server/.env.example server/.env
```

The API listens on `http://localhost:4000` and the client on `http://localhost:5173`.

## Commands

- `npm run dev` — start both workspaces for local development
- `npm run build` — build the client and server
- `npm run typecheck` — run TypeScript checks
- `npm run lint` — run the configured ESLint checks
- `npm test` — run workspace tests when implemented

## API endpoints currently available

- `GET /api/v1/health`
- `GET /api/v1/products` and `GET /api/v1/products/:slug`
- `GET /api/v1/ideas` and `GET /api/v1/ideas/:slug`
- `GET /api/v1/impact/summary`
- `POST /api/v1/assessments`
- `POST /api/v1/ai/analyse-device` with one `image` upload, limited to 5 MB and JPEG/PNG/WebP

The API returns a consistent `{ data, error, meta }` envelope. Authenticated endpoints intentionally return a clear configuration response until Supabase verification credentials are configured; no fake identity is accepted.

## UI routes

The client includes responsive screenshot-inspired pages for `/`, `/assess`, `/ideas`, `/shop`, `/cart`, `/about`, `/collection`, `/feedback`, `/impact`, `/passport`, and `/profile`. Collection, feedback, impact, passport, and profile states clearly identify when external persistence or Supabase Auth is not configured; they do not claim a real pickup, account, metric, or passport record.

## Current limitations

- MongoDB models and an idempotent seed command are present, but database-backed reads/writes are not enabled without `MONGODB_URI`.
- Supabase Auth is used for browser sessions. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `client/.env`, and set the matching `SUPABASE_URL` and public `SUPABASE_ANON_KEY` in `server/.env` so the API can verify bearer tokens through Supabase's `/auth/v1/user` endpoint. Never put a service-role key in the client.
- New Supabase accounts may require email confirmation. The login screen provides a real “Resend confirmation email” action when Supabase returns `Email not confirmed`. In Supabase Dashboard → Authentication → URL Configuration, add the local/deployed frontend URL as an allowed redirect URL. If confirmation is intentionally disabled for a trusted development project, change Authentication → Providers → Email → Confirm email; do not disable it for production.
- Supabase's hosted email service rate-limits repeated signup/confirmation emails. The client now explains this state and does not pretend signup succeeded. Wait for the limit to clear or create/confirm a test user once from Supabase Dashboard → Authentication → Users; do not repeatedly submit the form.
- Gemini analysis is optional and currently returns an explicit manual-fallback response when `GEMINI_API_KEY` is unavailable.
- When `GEMINI_API_KEY` and `GEMINI_MODEL` are configured on the server, the image endpoint sends the image to Gemini with a 15-second timeout and validates the returned JSON before displaying observations.
- The owner-supplied logo has not been provided; copy it to `client/public/images/` when available.
- The shop is a local demo cart only. It does not process payments or shipments.
- The authenticated `/profile` dashboard loads user-scoped assessment and collection activity from MongoDB. Assessment and collection submissions remain explicitly unpersisted/unavailable until `MONGODB_URI` is configured and reachable; records are always queried by the verified Supabase user ID.
- Ideas publishing now uses `POST /api/v1/ideas` with multipart cover/step images. Configure MongoDB plus a server-only `SUPABASE_SERVICE_ROLE_KEY` and a Supabase Storage bucket named by `SUPABASE_STORAGE_BUCKET` (default `idea-images`). The bucket must not be client-writable; use a private bucket with authenticated/server-mediated upload policies, or deliberately configure public read only for published image URLs. Never expose the service-role key to Vite.

No external credentials are required for the foundation.

## External credentials needed

| Credential | Where it goes | Why it is needed |
| --- | --- | --- |
| `MONGODB_URI`, `MONGODB_DB_NAME` | `server/.env` or Render environment | Persist assessments, collection requests, feedback, impact metrics, and passports |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_AUDIENCE` | `server/.env` or Render environment | Server-side bearer-token verification for protected API routes |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `client/.env` or Vercel environment | Browser-side Supabase Auth client; these are public client values |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | `server/.env` or Render environment only | Optional image understanding; never expose the key as a `VITE_` variable |
| `CLIENT_ORIGIN` | server environment | Restrict production CORS to the deployed frontend |
| `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | server `.env` or Render environment | Server-mediated Ideas image uploads; service role is never sent to the browser |

Never paste secrets into chat or commit `.env` files. Use `.env.example` as the placeholder template.
