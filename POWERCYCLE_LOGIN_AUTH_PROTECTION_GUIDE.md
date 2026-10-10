# POWERCYCLE Login Screen + Authentication Protection Guide

## Goal

Implement a polished, responsive POWERCYCLE login screen matching the generated visual reference, and make sure **only authenticated/logged-in users can access protected parts of the app**.

The current project uses React + Vite + TypeScript + Tailwind on the client, Express + TypeScript on the server, MongoDB Atlas, and Supabase Auth. Preserve this existing stack and reuse the current auth setup.

**Security principle:** Hiding a page or redirecting in the frontend is not sufficient by itself. Protect frontend routes for user experience, and verify authentication on the backend for every protected API endpoint.

---

## 1. Login Screen Design

Use the generated login-screen image as a visual reference, not as a screenshot to copy pixel-for-pixel.

### Visual style
- Dark navy/near-black background.
- Neon purple/violet gradients and subtle glow.
- Clean typography, readable contrast, and restrained glassmorphism.
- Reuse the current POWERCYCLE logo, theme, buttons, inputs, and shared components.
- Responsive layout for desktop, tablet, and mobile.
- On smaller screens, stack the branding/benefits section above or below the login card and avoid horizontal overflow.

### Suggested layout
**Branding panel**
- POWERCYCLE logo.
- Heading: “Welcome to PowerCycle”.
- Supporting text about giving devices a second life.
- Short benefits: Reduce, Reuse, Recycle, Make an Impact.
- Optional sustainability illustration or existing asset.

**Login panel**
- Heading: “Welcome Back”.
- Email field.
- Password field with show/hide control.
- “Forgot password?” link.
- Primary “Sign In” button.
- Optional Google/GitHub/Microsoft buttons only if those providers are configured and enabled in Supabase Auth.
- “Sign Up” link to the existing registration screen.
- Accessible field labels and clear validation/error messages.

Do not display invented impact statistics as real facts. If the reference image includes sample numbers, treat them as decorative mockup content and omit them or replace them with verified project data.

## 2. Authentication Source of Truth

Use the project's existing Supabase Auth integration as the source of truth. First inspect how Supabase is initialized and how the current session/user is read.

- Do not create a second independent authentication system.
- Do not store passwords in localStorage or sessionStorage.
- Do not treat a manually set boolean such as `isLoggedIn = true` as authentication.
- Do not put service-role keys or server secrets in `VITE_*` variables.
- Keep the Supabase publishable/anon key in the client only as intended by Supabase.
- Never send or log passwords, access tokens, refresh tokens, API keys, or full `.env` contents.

If the existing project uses a different, already working auth mechanism, inspect it and follow that mechanism instead of introducing a competing one.

## 3. Routes and Access Rules

Inspect the current route setup first. Adapt the route names to the actual project rather than creating duplicate routes.

Suggested public routes:
- `/login` — sign-in page.
- `/signup` — registration page.
- `/forgot-password` — password reset request page.
- Public callback route only if required by the configured Supabase auth flow.

Suggested protected routes:
- `/` or `/home` — decide based on the existing product routing and intended public landing-page behavior.
- `/assess` — device assessment.
- `/assessment-result` or the existing result route.
- `/marketplace` — marketplace.
- Collection requests, account/profile, and other user-specific areas.

### Important product decision
If the Home page should also be visible before login, leave it public and protect the app features. If **the entire application must be visible only after login**, make the Home route protected too and redirect unauthenticated visitors to `/login`.

The requested default for this implementation is: **all product/app routes are protected, and only login, signup, password-reset, and necessary auth-callback routes remain public**. This means a logged-out visitor who enters a protected URL directly must be redirected to `/login`.

After successful sign-in:
- Redirect to the originally requested route when safe, otherwise go to the app's intended authenticated home page.
- Prevent redirect loops.
- If a logged-in user visits `/login` or `/signup`, redirect them to the authenticated home page.
- Provide a sign-out action that ends the Supabase session and returns the user to `/login`.

## 4. Frontend Route Protection

Implement a reusable protected-route guard using the project's current router.

Expected behavior:
1. On app startup, check the existing Supabase session using the supported SDK.
2. While auth status is being checked, show a loading screen/skeleton instead of briefly exposing protected page content.
3. If there is no valid session, redirect to `/login` and preserve the intended destination safely.
4. If a valid session exists, render the requested protected page.
5. Subscribe to Supabase auth-state changes so sign-in and sign-out update the UI.
6. Unsubscribe from auth-state listeners on component cleanup.
7. Keep the session/user state in the existing auth provider/context if the project already has one; do not duplicate it.

Suggested conceptual states:
- `loading`
- `authenticated`
- `unauthenticated`

Do not implement this as a visual-only check. Use the real session returned by the auth SDK.

## 5. Backend API Protection

Frontend guards do not secure APIs. Inspect all Express routes and classify which endpoints are public versus user-protected.

For protected endpoints:
- Validate the Supabase access token server-side using the project's supported Supabase/JWT verification approach.
- Read the bearer token from the `Authorization: Bearer <access_token>` header.
- Reject missing, invalid, or expired tokens with HTTP `401`.
- Check permissions/ownership for user-specific resources; return `403` when an authenticated user lacks permission.
- Attach a verified user identity to the request context for controllers to use.
- Ensure users can access only their own private assessment history, profile, and collection requests unless an explicit sharing feature allows otherwise.
- Never trust a user ID supplied in the request body as proof of identity.
- Leave genuinely public endpoints public only when intentionally designed that way, and document them.
- Never log bearer tokens or secret configuration values.

Use existing middleware and SDK dependencies where possible. Do not add a new JWT library or replace auth architecture without first checking the current codebase and installed packages.

## 6. API Client Integration

Inspect the current frontend API client and make protected requests send the current Supabase access token in the Authorization header.

- Read the token from the active Supabase session using the existing SDK.
- Do not hardcode or persist tokens manually.
- Handle `401` by refreshing or re-checking the session using the supported auth flow, then redirect to login if the session is no longer valid.
- Avoid redirect loops and duplicate refresh requests.
- Do not attach auth headers to unrelated external URLs.
- Keep public login/signup/auth callback requests working without a session.

## 7. Sign-In and Sign-Out Behavior

### Sign in
- Validate email/password fields.
- Use the existing Supabase Auth SDK sign-in method.
- Display safe, user-friendly errors for incorrect credentials, network failures, or unconfirmed email when relevant.
- On success, update the shared auth state and navigate to the safe intended route or authenticated home.
- Disable the submit button while the request is processing to prevent duplicate submissions.

### Sign out
- Use the existing Supabase SDK sign-out method.
- Clear the app's in-memory authenticated user state through the existing auth provider.
- Navigate to `/login`.
- Ensure previously protected screens and APIs cannot be accessed after sign-out.

### Password reset and social providers
- Connect password reset to the existing Supabase reset-password flow if supported.
- Only show a social login button when its provider is actually enabled and configured.
- If social login is not configured, omit the button rather than making it appear functional.

## 8. Session and Security Requirements

- Use the SDK's normal session handling; do not invent a custom token storage scheme.
- Handle expired sessions and auth initialization failures.
- Do not expose service-role keys or other server secrets to the client.
- Protect backend endpoints even when frontend routes are guarded.
- Use the verified auth user ID for ownership checks.
- Avoid revealing whether a particular email address has an account in password-reset messages.
- Keep error messages useful but do not return stack traces or secret values to the browser.

## 9. Copilot Agent Prompt

Paste this into GitHub Copilot Agent in VS Code:

> Implement the POWERCYCLE Login screen and real authentication-based access control in my existing project.
>
> First inspect the repository's routing, current Supabase client initialization, auth provider/context (if any), API client, Express routes, middleware, and environment-variable usage. Do not start by redesigning the whole application. Reuse the existing auth architecture and dependencies.
>
> Build a responsive login screen matching the provided PowerCycle visual reference: dark navy/black background, neon purple accents, branding/benefits panel, email and password fields, password visibility toggle, forgot-password link, sign-in button, and signup link. Only show social sign-in providers that are already configured and enabled in Supabase. Connect every displayed action to a real flow; do not leave decorative buttons that do nothing.
>
> Use the existing Supabase Auth integration for real sign-in/sign-out. Add a shared auth state or reuse the existing one. Implement a protected-route guard for all app routes except login, signup, password reset, and required auth callback routes. While session status is loading, do not render protected page content. Redirect logged-out visitors to `/login`, preserve their intended destination safely, and redirect already logged-in users away from the login/signup pages to the authenticated home route. Since my requirement is that only logged-in users can access the app, protect the Home/app pages too unless the existing product requirements clearly identify a deliberately public landing page; report any such route decision.
>
> Also secure protected Express API endpoints. Verify the Supabase bearer access token server-side using the current supported SDK or existing verification middleware. Return 401 for missing/invalid/expired tokens and enforce ownership checks for user-specific resources. Update the existing frontend API client to attach the current session access token to protected API requests. Do not rely on frontend redirects alone for security.
>
> Do not store passwords manually, do not use a fake `isLoggedIn` boolean, do not expose service-role keys or server secrets in frontend variables, and do not log tokens or secrets. Do not create a second authentication system or change unrelated screens. Do not invent user counts, environmental statistics, or authentication success.
>
> Add or update sign-out behavior so signing out ends the session and protected routes/API requests are denied. Connect forgot-password only if supported by the current Supabase setup. Run the available lint, type-check, tests, and production build. Report the root changes, routes protected, API endpoints secured, tests run, and any Supabase dashboard configuration I must complete.

## 10. Manual Test Checklist

Test with a logged-out browser session:
- [ ] Opening `/` redirects to `/login` if the whole app is meant to be private.
- [ ] Opening `/assess` directly redirects to `/login`.
- [ ] Opening `/marketplace` directly redirects to `/login`.
- [ ] A protected page does not flash briefly while auth is loading.
- [ ] Login with valid credentials opens the intended protected page.
- [ ] Invalid credentials show a clear error.
- [ ] Refreshing a protected page preserves the valid session.
- [ ] Sign out returns to login and blocks protected routes.
- [ ] Calling a protected API without a token returns `401`.
- [ ] Calling a protected API with an invalid/expired token returns `401`.
- [ ] One user cannot read or modify another user's private data.
- [ ] Password reset works if enabled.
- [ ] Social sign-in buttons are shown only for enabled providers.
- [ ] Mobile layout works without horizontal scrolling.
- [ ] Type-check/build/tests pass, or remaining failures are documented.

## 11. Configuration Notes

- Confirm the Supabase project URL and client publishable/anon key are configured in the appropriate local environment file.
- Keep server-only credentials in `server/.env`, never in `client/.env`.
- If using OAuth, configure the provider in Supabase and set the correct redirect/callback URLs in the Supabase dashboard.
- Do not paste `.env` contents, API keys, passwords, or access tokens into chat or screenshots.

## 12. Scope Boundary

This task is only for:
1. Login screen UI.
2. Existing Supabase authentication flow.
3. Frontend route protection.
4. Backend authorization for protected API endpoints.
5. Minimal API client changes needed to pass the current session token.

Do not implement the Marketplace or Collection Request screen in this task. Keep the current Home, Assessment, and Assessment Result designs intact.
