# PowerCycle deployment checklist

Deployment is not verified in this workspace. No GitHub, MongoDB Atlas, Supabase, Gemini, Render, or Vercel credentials are configured.

## Backend (Render)

1. Push the repository to GitHub.
2. Create a Render Web Service with the repository root set to `server`.
3. Use `npm install && npm run build` as the build command and `npm start` as the start command.
4. Configure the variables in `server/.env.example`, including `MONGODB_URI`, Supabase settings, `CLIENT_ORIGIN`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`.
5. Verify `GET /api/v1/health` and then run the seed command with a configured `MONGODB_URI`.

## Frontend (Vercel)

1. Import the repository into Vercel with root directory `client`.
2. Use `npm run build` and output directory `dist`.
3. Set `VITE_API_BASE_URL` to the deployed API `/api/v1` URL.
4. Set the public Supabase variables only after the Supabase project is configured.
5. Configure SPA fallback rewrites if direct nested route refreshes are not handled by the selected Vercel setup.

## Ideas image storage

Create the `idea-images` Supabase Storage bucket (or set `SUPABASE_STORAGE_BUCKET` to an existing bucket) before enabling publishing. The backend is the only upload path and uses the service-role key server-side; never expose that key through a `VITE_` variable. Do not grant browser clients direct upload access. Images are stored beneath the verified user's ID and are limited to JPEG, PNG, or WebP files up to 8 MB. The current published-image response uses public object URLs, so the bucket must allow public reads; use signed URLs and a private bucket before treating private draft images as production-ready.

## Required verification after credentials are available

- Configure Supabase access-token verification before enabling protected writes.
- Confirm MongoDB ownership queries with two separate users.
- Configure Gemini server-side only and test success, quota failure, malformed output, and timeout fallback.
- Test CORS with the actual Vercel origin.
- Run the final private-window smoke test from the master specification.

Do not describe the application as deployed until the live API and frontend URLs have been tested.
