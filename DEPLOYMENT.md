# PowerCycle deployment checklist

Deployment has not been verified. Configure provider credentials in the provider dashboards and environment settings; do not commit local `.env` files.

## Backend (Render)

1. Push the repository to GitHub.
2. Create a Render Web Service for this monorepo. Set its root directory to `server` if the selected Render build environment can resolve the workspace packages from that root; otherwise keep the repository root and use workspace commands from the root. Confirm the commands against a clean deployment build.
3. Use `npm install && npm run build` as the build command and `npm start` as the start command.
4. Configure the variables in `server/.env.example`, including `MONGODB_URI`, Supabase settings, `CLIENT_ORIGIN`, optional `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`.
5. Verify `GET /api/v1/health` and then run the seed command with a configured `MONGODB_URI`.

## Frontend (Vercel)

1. Import the repository into Vercel with root directory `client`.
2. Use `npm run build` and output directory `dist`.
3. Set `VITE_API_BASE_URL` to the deployed API `/api/v1` URL.
4. Set the public Supabase variables only after the Supabase project is configured.
5. Configure SPA fallback rewrites if direct nested route refreshes are not handled by the selected Vercel setup.

## Ideas image storage

Create the bucket named by `SUPABASE_STORAGE_BUCKET` (default `idea-images`) before enabling idea or marketplace publishing. Use a private bucket. The backend is the only upload path and uses the service-role key server-side; never expose that key through a `VITE_` variable. Do not grant browser clients direct upload access. Images are stored under the verified user's ID and are limited to JPEG, PNG, or WebP files up to 8 MB. The API returns expiring signed URLs for image display.

## Marketplace limits

Community sellers can publish listings, buyers can submit a manual request-to-buy, and a seller can accept or decline. Accepting checks available quantity and reserves stock. Buyer email is shown to the seller only after acceptance. PowerCycle does not process payment, shipping, pickup, refunds, buyer protection, or disputes. Do not present marketplace requests as paid orders or completed sales.

## Authentication and production URLs

- Set `VITE_API_BASE_URL` to the deployed Render API ending in `/api/v1`.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the client build. These are public client credentials.
- Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY` in Render.
- Set `CLIENT_ORIGIN` to the exact Vercel production origin and configure that origin in Supabase Auth redirect URLs.
- Add a Vercel SPA rewrite for `/(.*)` to `/index.html` so direct app routes work after refresh.
- Configure a real `GEMINI_API_KEY` only if photo analysis is enabled; its model name is `GEMINI_MODEL` and defaults to the currently configured `gemini-3.8-flash`.

## Required verification after credentials are available

- Configure Supabase access-token verification before enabling protected writes.
- Confirm MongoDB ownership queries with two separate users.
- Configure Gemini server-side only and test success, quota failure, malformed output, and timeout fallback.
- Test CORS with the actual Vercel origin.
- Run the final private-window smoke test from the master specification.

Do not describe the application as deployed until the live API and frontend URLs have been tested.
