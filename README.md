# PowerCycle

PowerCycle is a circular-economy prototype for giving unwanted electronics a new purpose.

## Current status

PowerCycle helps people assess older electronics and choose repair, reuse, upcycling, or responsible recycling. The application has a Vite client, Express API, Supabase authentication, MongoDB persistence, deterministic assessment guidance, optional Cloudflare Workers AI photo observations and repair plans, community idea publishing, seller listings, manual marketplace request-to-buy, collection requests, feedback, and account-scoped activity. The catalog cart is a clearly labelled demo; PowerCycle does not process catalog payments or arrange shipments.

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
- `GET /api/v1/marketplace/listings` and `GET /api/v1/marketplace/listings/:id`
- `POST /api/v1/marketplace/listings` and authenticated seller management at `/api/v1/marketplace/listings/me`
- `POST /api/v1/marketplace/requests`, `/api/v1/marketplace/requests/me`, and seller accept/decline at `/api/v1/marketplace/requests/:id`
- `GET /api/v1/ideas` and `GET /api/v1/ideas/:slug`
- `GET /api/v1/impact/summary` (authenticated, private to the current user)
- `POST /api/v1/assessments`
- `POST /api/v1/ai/analyse-device` with one `image` upload, limited to 5 MB and JPEG/PNG/WebP
- `POST /api/v1/feedback`
- `POST /api/v1/collection-requests` and authenticated `/api/v1/collection-requests/me`

The API returns a consistent `{ data, error, meta }` envelope. Authenticated endpoints intentionally return a clear configuration response until Supabase verification credentials are configured; no fake identity is accepted.

## UI routes

The client includes `/`, `/assess`, `/ideas`, `/ideas/create`, `/marketplace`, `/marketplace/create`, `/my-listings`, `/shop`, `/cart`, `/about`, `/collection`, `/feedback`, `/impact`, `/passport`, `/profile`, and `/my-activity`. All app pages require Supabase sign-in. Database-backed flows show configuration or persistence errors when the corresponding services are unavailable.

## Current limitations

- MongoDB-backed reads/writes require `MONGODB_URI`; the API health endpoint reports whether the database connection is active.
- Supabase Auth is used for browser sessions. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `client/.env`, and set the matching `SUPABASE_URL` and public `SUPABASE_ANON_KEY` in `server/.env` so the API can verify bearer tokens through Supabase's `/auth/v1/user` endpoint. Never put a service-role key in the client.
- New Supabase accounts may require email confirmation. The login screen provides a real “Resend confirmation email” action when Supabase returns `Email not confirmed`. In Supabase Dashboard → Authentication → URL Configuration, add the local/deployed frontend URL as an allowed redirect URL. If confirmation is intentionally disabled for a trusted development project, change Authentication → Providers → Email → Confirm email; do not disable it for production.
- Supabase's hosted email service rate-limits repeated signup/confirmation emails. The client now explains this state and does not pretend signup succeeded. Wait for the limit to clear or create/confirm a test user once from Supabase Dashboard → Authentication → Users; do not repeatedly submit the form.
- Cloudflare Workers AI analysis is optional and returns an explicit manual-fallback response until `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are configured.
- When configured on the server, the image endpoint sends the image to Cloudflare's `@cf/meta/llama-3.2-11b-vision-instruct` vision model and validates the returned JSON before displaying observations.
- The owner-supplied logo has not been provided; copy it to `client/public/images/` when available.
- Catalog products and the local cart are demos. Community listings are persisted when MongoDB and Supabase Storage are configured. Buyers can send a manual request-to-buy; seller acceptance reserves stock and reveals the requester's account email to that seller. Payment, shipping, buyer protection, refunds, and dispute handling are not provided.
- The authenticated `/profile` dashboard loads user-scoped assessment and collection activity from MongoDB. Assessment and collection submissions remain explicitly unpersisted/unavailable until `MONGODB_URI` is configured and reachable; records are always queried by the verified Supabase user ID.
- Ideas and marketplace image publishing use server-mediated uploads and expiring signed image URLs. Configure MongoDB, a server-only `SUPABASE_SERVICE_ROLE_KEY`, and a private Supabase Storage bucket named by `SUPABASE_STORAGE_BUCKET` (default `idea-images`). The bucket must not be client-writable. Never expose the service-role key to Vite.
- Passport creation/QR lifecycle, verified environmental weights, online payment, courier quotes/tracking, and collection-provider scheduling remain unavailable until their respective data models or provider workflows are implemented.

No external credentials are required for the foundation.

## External credentials needed

| Credential | Where it goes | Why it is needed |
| --- | --- | --- |
| `MONGODB_URI`, `MONGODB_DB_NAME` | `server/.env` or Render environment | Persist assessments, collection requests, feedback, impact metrics, and passports |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_AUDIENCE` | `server/.env` or Render environment | Server-side bearer-token verification for protected API routes |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `client/.env` or Vercel environment | Browser-side Supabase Auth client; these are public client values |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_AI_MODEL` | `server/.env` or Render environment only | Optional photo understanding and repair plans; never expose the token as a `VITE_` variable |
| `CLIENT_ORIGIN` | server environment | Restrict production CORS to the deployed frontend |
| `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | server `.env` or Render environment | Server-mediated Ideas image uploads; service role is never sent to the browser |

Never paste secrets into chat or commit `.env` files. Use `.env.example` as the placeholder template.
