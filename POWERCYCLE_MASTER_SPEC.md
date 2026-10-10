# POWERCYCLE — Full-Stack Build & Deployment Master Specification
**Brand:** PowerCycle  
**Tagline:** Give Old Electronics a New Purpose  
**Project purpose:** Competition-ready, full-stack circular-economy/e-waste platform  
**Primary instruction:** Build a beautiful, accessible, secure, reliable product—not a static mockup. Inspect the repository before changing anything. Implement in phases, run the code and tests, fix failures, and report only what was actually verified.

---

# 0. How to use this file

1. Open the PowerCycle project folder in VS Code.
2. Save this file as `COPILOT_INSTRUCTIONS.md` in the project root.
3. Open GitHub Copilot **Agent** mode (or the coding agent you use).
4. Send this initial prompt:

   > Read `COPILOT_INSTRUCTIONS.md` completely. Start with Phase 0 only: inspect the existing repository, identify the installed tools/dependencies and existing logo, then summarize the current state and propose a phase-by-phase plan. Do not overwrite or delete existing work. After I approve the plan, implement one phase at a time. Keep the application runnable, run checks, fix errors, and report exact results. Never claim a test or deployment succeeded unless you actually verified it.

5. Let the agent finish a phase, review the changes, and then ask it to continue to the next phase. Commit working milestones to Git.

This document is the product and engineering contract. If the existing project already has a sound implementation, adapt it rather than rewriting everything.

---

# 1. Product vision

Build **PowerCycle**, a modern sustainability platform that helps users give unwanted electronics a second life. It should combine:
- Device assessment and explainable recommendations.
- AI-assisted image understanding for electronics photos.
- Reuse/upcycling ideas.
- A demonstration marketplace for refurbished/upcycled products.
- Collection requests and private request tracking.
- Feedback.
- A data-driven impact dashboard.
- A basic QR-linked digital device passport.
- Authentication and secure backend/data access.
- Production-ready build and deployment documentation.

The product should feel like a credible, polished eco-tech startup. It must be genuinely functional and not just a collection of attractive screens.

### Main user journey

**Register/sign in → assess a device (form and optionally image) → understand the recommendation → explore relevant ideas or shop items → submit a collection request if appropriate → track the request.**

### Truthfulness constraints

- The shop is a demo marketplace unless real stock, sellers, and fulfilment exist.
- Show **Prototype Price** on demonstration prices.
- Checkout must clearly say that no real payment or shipment will occur.
- Collection requests are not confirmed pickups unless a real service confirms them.
- Do not invent recycler partners, repair centres, environmental impact numbers, warranties, inventory, or testimonials.
- AI image analysis is preliminary visual guidance, not a certified hardware diagnosis.
- Label illustrative/sample metrics as demo data. Prefer live counts from the actual database when available.

---

# 2. Final technology choices

Use these choices unless the repository already contains a compatible, working stack.

## Frontend
- React + Vite + TypeScript.
- Tailwind CSS using the version-compatible setup already installed or the current official Vite integration. Do not mix Tailwind v3 and v4 instructions/configuration.
- React Router for routes.
- Lucide React for icons.
- React Hook Form + Zod for form validation.
- TanStack Query for API server-state management where useful.
- A small, consistent fetch/API client with typed response/error handling.
- Optional lightweight animation library only if it adds meaningful polish; respect `prefers-reduced-motion`.

## Backend
- Node.js + Express + TypeScript.
- Zod for server-side validation.
- MongoDB Atlas with the official MongoDB Node.js driver or Mongoose. Choose one; do not mix approaches. Prefer Mongoose if it makes schema validation and relations clearer, otherwise use the native driver consistently.
- Structured logging and centralized error handling.
- API version prefix: `/api/v1`.

## Authentication
- Use **Supabase Auth** for signup/signin/session management to avoid storing passwords ourselves.
- Backend must verify the Supabase access token using a supported verification approach before trusting a user ID.
- MongoDB stores app profiles and domain data; use the verified Supabase user ID as the external identity key.
- Never trust a user ID sent in a request body or query string to identify the caller.
- Enforce ownership checks on all user-owned records.
- Never expose the Supabase service-role key to the browser. Prefer token verification that does not require a service-role secret; if a secret is required server-side, store it only in the backend environment.
- If Supabase Auth cannot be configured, do not build insecure fake auth. Complete public functionality and clearly document which authenticated features need credentials.

## AI image analysis
- Use the **Gemini API** through the backend only.
- Read `GEMINI_API_KEY` from the server environment. Never expose it as a `VITE_` variable or commit it.
- Use a currently available vision-capable Gemini model chosen from the official API/model list at implementation time. Do not hard-code an outdated model name without checking current availability.
- The AI feature must be optional and have a manual form fallback.
- Apply file type and file size limits before forwarding an image.
- Do not permanently store the uploaded image by default. Analyse it in memory and discard it after processing unless the user explicitly opts into saving it.
- Use safe, schema-validated structured output where supported; validate the model output with Zod before using it.
- Never use AI output as the only basis for safety-critical advice.

## Deployment target
- Frontend: Vercel.
- Express API: Render.
- Database: MongoDB Atlas.
- Auth: Supabase Auth.
- AI: Gemini API free tier, if the selected model/account qualifies.
- Repository: GitHub.

**Budget target:** aim for ₹0 during the competition prototype. Free tiers, quotas, sleep policies, regional availability, and provider terms can change. Verify them during setup and never promise unlimited free use.

---

# 3. Brand assets and design direction

## Logo
Use the PowerCycle logo supplied by the project owner. Inspect the repository and available assets first. If the logo file is present, reuse it without distortion. Prefer `client/public/images/powercycle-logo.png` or an appropriate existing asset path. If it is not present in the project workspace, create the path and document that the owner needs to copy the original logo there; do not invent a replacement logo.

Brand tagline: **Give Old Electronics a New Purpose**

## Design goal
Deliver a premium, modern, user-friendly eco-tech interface. Avoid generic admin-template design, clutter, excessive gradients, fake glassmorphism, emoji-as-icons, and inconsistent components.

### Suggested design tokens
- Deep eco green: `#087F5B`
- Dark green/ink: `#12302A`
- Fresh green accent: `#35A853`
- Pale mint: `#EAF7EF`
- Off-white background: `#F8FAF7`
- Primary text: `#24352E`
- Secondary text: `#68776F`
- Border: `#DFE8E1`
- White card surface: `#FFFFFF`
- Error: accessible red; warning: accessible amber; success: accessible green.

Check contrast and adjust values as needed to meet WCAG AA. Do not sacrifice readability for aesthetics.

### Typography and spacing
- Use Inter or a good system sans-serif.
- Consistent 4/8-point spacing rhythm.
- Clear type scale, strong page headings, readable line length.
- Card radius around 14–20px, restrained shadows, subtle borders.
- Use motion sparingly (150–250ms), with reduced-motion support.
- Responsive layout for 360px mobile widths, tablets, laptops, and large screens.

### Required UI behaviours
- Visible keyboard focus.
- All form fields have labels, hints, and validation messages.
- Clear loading, success, error, disabled, and empty states.
- Toasts should be announced accessibly and not be the only place important errors appear.
- Dialogs and dropdowns support keyboard interaction and Escape.
- Navigation has active-route state and works with browser back/forward.
- No horizontal overflow on mobile.
- Images have descriptive alt text, consistent aspect ratios, and graceful fallbacks.
- Respect `prefers-reduced-motion`.
- No dead buttons, placeholder `href="#"` links, or unexplained disabled controls.

---

# 4. UX design and site map

## Global header
Desktop:
- PowerCycle logo and wordmark.
- Home, Assess Device, Ideas, Shop, About.
- Strong CTA: “Assess Your Device”.
- Account menu when authenticated.
- Three-dot overflow menu with Buy Items, Repair/Assessment, My Requests, About, Feedback, and Passport if enabled.

Mobile:
- Compact logo.
- Accessible menu button and panel/drawer.
- Close menu after navigation and on Escape.
- No hover-only interactions.

## Footer
- Logo and tagline.
- Short mission.
- Useful links.
- Prototype disclaimer.
- Do not invent a phone number, address, support email, or real collection partner.

## Pages and routes

### `/` — Home
- Hero heading: “Your old tech deserves a second life.”
- Short supporting message about assessing electronics and finding a responsible next step.
- Main CTA “Assess My Device”.
- Secondary CTA “Explore Upcycling Ideas”.
- A strong visual of electronics being repaired/reused, with reliable local/licensed image assets and fallbacks.
- Four-step flow: Assess → Get Recommendation → Give It a Second Life → Recycle Responsibly.
- Four outcome cards: Repair, Reuse, Upcycle, Recycle.
- Featured products.
- Upcycling idea preview.
- Impact preview based on real records or clearly labelled sample data.
- Final CTA and footer.

### `/assess` — Device assessment
Form fields:
- Device category: phone, tablet, laptop/computer, monitor, speaker, charger/cable, keyboard/mouse, small appliance, other.
- Approximate age: under 1 year, 1–3 years, 3–5 years, over 5 years, unknown.
- Condition: working well, minor issue, major issue, physically damaged, not working, unknown.
- Problem(s): battery, screen, charging, sound, performance, missing parts, no issue, other.
- Optional notes.
- Optional image upload with preview, remove/replace, file size/type validation, and clear privacy notice.
- Progress indicator if a multi-step flow is used.
- Submit and show a result panel with recommendation, reason, next steps, safety advice, and relevant links.
- Keep manual assessment fully functional if AI is unavailable or the user declines image upload.

### Recommendation logic
Use a transparent deterministic rules engine on the backend. AI image analysis can add context but must not silently override safety rules.
- Functional and unwanted device: usually Reuse.
- Minor/common issue: Repair or professional assessment.
- Suitable non-powered decorative reuse: Upcycle.
- Non-functional, severely damaged, or unsafe item: professional assessment/recycling route.
- Swollen/bulging battery, overheating, exposed wiring, smoke, or leakage: urgent safety warning. Tell the user not to charge, open, puncture, or DIY-upcycle it; seek qualified handling.
- Age alone must never determine the result.
- Explain why the result was chosen and what to do next.
- State clearly that this is guidance, not a certified diagnosis.

### `/ideas` and `/ideas/:slug`
- Responsive idea gallery.
- Search, category filters, difficulty filters.
- Card image, name, description, suitable source item, difficulty, safety note.
- Detail page with materials and safe steps.
- Avoid dangerous electrical disassembly instructions.
- Seed at least 8 useful ideas, including keyboard-key art, CD decoration, cable organisation, safe casing reuse, and educational kits.

### `/shop`, `/shop/:slug`
- Premium e-commerce-style product grid: 3–4 desktop columns, 2 tablet, 1 mobile.
- Search, category filter, price sort, no-results state.
- Card order must be:
  1. Product image.
  2. Product name.
  3. Label: “Made from/recovered from suitable e-waste”.
  4. Price with “Prototype Price”.
  5. “View Details”.
  6. “Add to Cart”.
- Product detail page: image, description, source/material, condition/testing note, demo price, quantity, add-to-cart.
- Clearly state listings and prices are demonstrations unless actual inventory and fulfilment are supplied.

### Required seeded product catalogue
Seed these products, preserving the first six names and prices exactly:

| Product | Prototype price (INR) |
|---|---:|
| Refurbished Bluetooth Speaker | 1499 |
| Upcycled Keyboard Wall Art | 499 |
| Electronic Parts Desk Organizer | 399 |
| Cable Organizer | 199 |
| Upcycled CD Decoration | 249 |
| DIY STEM/Electronics Learning Kit | 699 |
| Refurbished Computer Mouse | 299 |
| Refurbished LED Desk Lamp | 599 |
| Tech-Themed Photo Frame | 349 |
| Mini Storage Box | 299 |

The final four prices are provisional demo values. Store prices as integer paise or integer INR consistently; prefer integer INR for this demo, with formatting via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })`.

### Cart and demo checkout
- Add/remove products, increase/decrease quantities, subtotal, empty state.
- Persist the demo cart in localStorage; never store passwords, tokens, or sensitive personal data there.
- Show cart count in the header.
- Demo checkout clearly states: “Demo order only. No payment will be collected and no product will be shipped.”
- Do not integrate real payment services.

### `/collection`
- E-waste category, quantity, approximate area/city, optional contact method/value, optional notes.
- Clear consent checkbox that collection is not guaranteed in this prototype.
- Validate client and server.
- Save request to MongoDB and return a request ID.
- Do not claim a pickup is scheduled.
- Status values: Submitted, Under Review, Accepted, Completed, Rejected (use only states supported by the implemented workflow).

### `/my-requests`
- Authenticated user's own requests only.
- Status badges, request type, submitted date and details.
- Empty/loading/error states.
- Reject unauthenticated access.
- Enforce ownership on the server; do not trust IDs from the client.

### `/feedback`
- Accessible rating from 1–5.
- Optional topic and message.
- Server-side validation, success/error states, persistence in MongoDB.
- Rate-limit public write endpoints where practical.

### `/about`
- Explain e-waste problem, PowerCycle's solution, the four outcomes, prototype limits, and responsible disposal.
- No invented impact claims, partners, or certifications.

### `/impact`
- Real database-backed metrics where feasible: number of assessments, recommendations by category, collection requests by status, and completed activities if verified.
- Clearly separate submitted requests from completed recycling actions.
- No unsupported CO₂, water, or landfill savings claims.
- If the database has no data, show an honest empty state or explicitly labelled sample metrics.

### `/passport` and `/passport/:id` — QR device passport
- Register a device with category, approximate age, condition, and owner consent.
- Generate a unique, unguessable ID and QR code pointing to a safe passport route.
- Public passport page exposes only non-sensitive device history; private details require owner authentication.
- Keep a timeline of assessments and verified lifecycle updates.
- Label records as user-reported unless independently verified.
- Avoid public exact address, phone number, account identifiers, or private notes.
- Do not claim QR itself verifies authenticity.

### Authentication
- Signup, signin, signout, auth loading and error states.
- Use Supabase Auth; no custom password storage.
- Protect My Requests and owner-only passport actions.
- Keep user identity mapping in MongoDB using the verified Supabase user ID.
- Include a clear message if authentication credentials are not configured.

---

# 5. AI image analysis implementation

## Desired behaviour
1. User selects an image.
2. Client validates supported image type and maximum size; shows a preview and remove option.
3. Client uploads image to the Express API using `multipart/form-data`.
4. Backend checks MIME type and file signature where practical, limits size, rate-limits the endpoint, and forwards the image to Gemini.
5. Gemini returns structured fields such as:
   - `deviceCategory`
   - `visibleObservations`
   - `possibleVisibleDamage`
   - `uncertainties`
   - `safetyFlags`
   - `suggestedFollowUpQuestions`
6. Validate model output using a schema; reject malformed or unexpected output.
7. Combine the observations with user form inputs and the deterministic recommendation engine.
8. Return the recommendation, reasons, next steps, safety advice, and disclaimer.
9. Discard the image from memory after processing unless the user explicitly chooses a documented storage option.

## Safety and reliability
- Do not claim internal faults, exact repair cost, or repairability from an image alone.
- If a battery appears swollen or dangerous damage is suspected, return conservative safety guidance and recommend qualified handling.
- Never advise users to open batteries, CRT displays, power supplies, or mains-powered devices.
- AI should not determine a final recycle/repair decision by itself.
- If Gemini is unavailable, quota-exhausted, or returns invalid output, preserve the manual assessment flow and show a helpful fallback.
- Never expose the Gemini key to the client.
- Avoid logging uploaded image contents or personal details.
- Show users that image processing uses a third-party AI service and ask for consent before sending the image.

## API route
`POST /api/v1/ai/analyse-device`

- Accept one image plus optional non-sensitive assessment fields.
- Limit size (for example 5 MB), accept a controlled list of image MIME types, and reject malformed files.
- Return structured JSON with a request ID.
- Rate-limit per IP/session where practical.
- Use a timeout and safe error handling.
- Keep this feature optional, so API quota failure does not break the site.

## Environment variable
`GEMINI_API_KEY` belongs only in the backend environment. Use an up-to-date vision-capable model selected from the official model list at implementation time. Do not assume a model name will remain available indefinitely.

---

# 6. Backend architecture and API contract

## Suggested backend structure

```text
server/src/
  config/
    env.ts
    database.ts
  middleware/
    authenticate.ts
    errorHandler.ts
    rateLimit.ts
    validate.ts
    notFound.ts
  models/
  routes/
  controllers/
  services/
    assessment.service.ts
    recommendation.service.ts
    aiAnalysis.service.ts
    product.service.ts
    collection.service.ts
    passport.service.ts
  schemas/
  utils/
  app.ts
  index.ts
```

Keep route handlers thin. Put business logic in services, validation in schemas, and database operations in models/repositories. Avoid giant route files and duplicate logic.

## API endpoints

Prefix: `/api/v1`

Public/read endpoints:
- `GET /health`
- `GET /products`
- `GET /products/:slug`
- `GET /ideas`
- `GET /ideas/:slug`
- `GET /impact/summary` (public, aggregate values only)
- `GET /passports/:publicId` (safe public fields only)

Write/auth endpoints:
- `POST /assessments`
- `POST /ai/analyse-device`
- `POST /collection-requests`
- `GET /collection-requests/me` (auth required)
- `POST /feedback`
- `POST /passports` (auth required)
- `GET /passports/me` (auth required)
- `PATCH /passports/:id` (owner/admin only; whitelist mutable fields)
- `POST /passports/:id/events` (owner/admin with appropriate event rules)

Use one consistent JSON format:
```json
{
  "data": {},
  "error": null,
  "meta": {}
}
```
For errors:
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the highlighted fields."
  },
  "meta": {}
}
```

Requirements:
- Validate route params, query and body on the server.
- Use correct status codes: 200/201, 400, 401, 403, 404, 409, 413, 415, 429, 500 as appropriate.
- No stack traces in production responses.
- Handle missing env vars at startup with a useful, non-secret error.
- Configure CORS with explicit frontend origins in production.
- Add request IDs and safe structured logs.
- Use pagination for list endpoints and cap page size.
- Never trust client-provided role, user ID, price, recommendation, or request status.
- Recompute sensitive values on the server.
- Use server-side ownership checks for every user-specific document.
- Do not return MongoDB internal fields or private profile data accidentally.

---

# 7. MongoDB data model

Use MongoDB Atlas and Mongoose or the native driver consistently.

Suggested collections:

## `profiles`
- `authUserId` (unique; verified Supabase user ID)
- `displayName` (optional)
- `role` (default `user`; never client-assignable)
- `createdAt`, `updatedAt`

## `assessments`
- `userId` nullable verified user ID
- `deviceType`, `ageRange`, `condition`
- `problems` array
- `notes` optional with length limit
- `aiObservations` optional, schema-validated and non-authoritative
- `recommendation` enum: `repair | reuse | upcycle | recycle`
- `reason`, `nextSteps`, `safetyFlags`
- `createdAt`

## `products`
- `slug` unique
- `name`, `description`, `priceInr` integer
- `imageUrl`, `category`, `sourceMaterial`, `conditionNote`
- `isDemo` default true, `isActive` default true
- `createdAt`, `updatedAt`

## `ideas`
- `slug` unique
- `title`, `description`, `sourceItems`, `difficulty`, `materials`, `steps`
- `safetyNotes`, `imageUrl`, `category`, `isPublished`
- timestamps

## `collectionRequests`
- `userId` nullable verified user ID for anonymous prototype submissions only if that is explicitly supported; otherwise require login.
- `category`, `quantity`, `area`
- `contactMethod` and `contactValue` optional/minimized
- `notes` optional
- `status` enum
- `prototypeDisclaimerAccepted` boolean required true
- `createdAt`, `updatedAt`

## `feedback`
- `userId` nullable
- `rating` integer 1–5
- `topic` optional
- `message` length-limited
- `createdAt`

## `devicePassports`
- `publicId` unique, random/unguessable
- `ownerUserId` verified identity
- `deviceType`, `ageRange`, `initialCondition`
- `publicSummary` without personal information
- `verificationStatus`: `user-reported | partner-verified`
- timestamps

## `passportEvents`
- `passportId`
- `actorUserId`
- `eventType`: `assessed | repaired | reused | upcycled | recycled | note`
- `description` with length limit
- `verificationStatus`
- `createdAt`

Data requirements:
- Use schemas, enums, required fields, length limits and indexes.
- Unique indexes for slugs and passport IDs.
- Index common queries by user and created date.
- Do not store uploaded images as base64 in MongoDB.
- Seed products and ideas through a repeatable script.
- Make seed script idempotent (upsert by slug); repeated runs must not duplicate records.
- Keep demo data visibly distinct from verified user activity.

---

# 8. Security and privacy checklist

- Secrets in environment variables only; commit `.env.example`, never `.env`.
- `.gitignore` must include `.env`, `.env.*` except `.env.example`, `node_modules`, build outputs, logs and temporary uploads.
- Use a supported Supabase access-token verification flow on the backend.
- Never trust a user ID in request payload as proof of identity.
- Verify record ownership on every read/update/delete.
- Never allow regular users to set their own role to admin.
- Use Zod validation and allowlisted update fields.
- Sanitize/limit text and render user input as text; do not use unsafe HTML rendering.
- Rate-limit AI, feedback and collection endpoints.
- Limit image size and accepted formats; clean up temporary files if disk-based upload middleware is used.
- CORS allowlist in production.
- Avoid logging tokens, API keys, uploaded image data, or full contact details.
- Minimize personal data and explain collection purpose.
- Do not publicly expose phone/email/address on device passport pages.
- Use generic client-facing errors and detailed server-side request IDs without secret data.
- Add security headers such as Helmet where compatible.
- Keep dependencies maintained and run an audit where supported; investigate issues rather than blindly applying breaking updates.

---

# 9. Testing and quality gates

## Frontend tests
- Navigation routes and mobile menu.
- Assessment form validation and result display.
- Manual fallback when AI is unavailable.
- Image preview, invalid type/size, and removal.
- Product card order and price formatting.
- Search/filter and empty results.
- Cart quantities/subtotal/persistence.
- Collection consent validation.
- Feedback rating validation.
- Auth-protected pages.
- QR passport visibility rules.

## Backend tests
- Health endpoint.
- Product/idea list and detail.
- Seed idempotency.
- Assessment invalid and valid payloads.
- Recommendation safety overrides.
- Image endpoint rejects oversized/invalid uploads.
- AI quota/timeout/invalid response fallback.
- Collection consent and quantity validation.
- Feedback rating/message validation.
- Unauthenticated `/me` endpoints return 401.
- User A cannot access User B's records.
- Passport public response excludes private fields.
- Rate limits and safe error responses.

## E2E flows (Playwright if available)
1. Home → assessment → recommendation.
2. Shop → product details → cart → demo checkout.
3. Sign in → submit collection request → My Requests.
4. Submit feedback.
5. Upload a valid sample image and handle AI success.
6. Simulate AI failure and confirm manual fallback.
7. Create passport and open its QR URL.
8. Test mobile viewport for horizontal overflow.

## Quality commands
Inspect the actual package scripts and document their exact names. Aim for:
- lint
- typecheck
- unit tests
- API tests
- production build
- E2E smoke tests if available

Run checks after each phase, fix failures, then rerun. Never claim a check passed if it was not executed. If external credentials are missing, use mocked tests for the code path but clearly distinguish mocked tests from live integration tests.

---

# 10. Deployment guide — ₹0-budget-first approach

Provider plans and quotas change. Verify the current free-tier eligibility, usage limits, service sleep behaviour, regions, and terms before relying on them for the competition. No free service is guaranteed to provide unlimited usage or permanent uptime.

## A. Accounts to create
- GitHub: source control repository.
- MongoDB Atlas: free-eligible cluster, database user, network access configuration.
- Supabase: authentication project and redirect URLs.
- Google AI Studio: Gemini API key if free-tier access is available for the selected model/account.
- Render: Express backend.
- Vercel: React frontend.

Do not enter passwords, secret API keys, or account recovery codes into Copilot chat. Enter secrets only in local environment files or provider dashboards.

## B. Local environment variables

### `client/.env.example`
```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

### `server/.env.example`
```env
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://REPLACE_WITH_REAL_URI
MONGODB_DB_NAME=powercycle
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_JWT_AUDIENCE=authenticated
GEMINI_API_KEY=REPLACE_WITH_SERVER_SIDE_KEY
GEMINI_MODEL=REPLACE_WITH_CURRENT_VISION_MODEL
```

Use the exact Supabase verification configuration supported by the selected library/version. Add any required public key or JWT verification settings only if actually required. Never put `MONGODB_URI` or `GEMINI_API_KEY` in client variables.

The `.env.example` files must contain placeholders only. Real `.env` files must be ignored by Git.

## C. MongoDB Atlas setup
1. Create an Atlas account and a free-eligible cluster if currently offered.
2. Create a database user with a strong password; do not use your Atlas account password.
3. Configure Network Access. For a competition demo, choose the narrowest configuration compatible with the hosting provider. Avoid broad `0.0.0.0/0` access unless there is no practical alternative; if temporarily required, use a strong database user, least privilege, and review/remove the broad rule after the demo.
4. Copy the application connection string, replace placeholders, and store it in the backend environment only.
5. Create database name `powercycle`.
6. Run migrations/index setup and the idempotent seed script.
7. Test product reads and user-specific writes from the API.

Do not expose database credentials in the frontend or GitHub.

## D. Supabase Auth setup
1. Create a project and enable the selected sign-in method (email/password is enough for the prototype).
2. Configure local and production redirect URLs.
3. Put the public project URL and anon/publishable key in the frontend env.
4. Implement sign-in/sign-up/sign-out and session refresh.
5. Backend verifies access tokens; client-supplied identity alone is not trusted.
6. Test with two separate accounts and verify they cannot access one another's requests or private passport controls.

Supabase Auth free-tier availability and limits should be confirmed in the current dashboard/docs.

## E. Gemini API setup
1. Create an API key through Google AI Studio if the selected model is available to the account.
2. Verify model vision capability, free-tier quota, rate limits, data-use terms, and regional availability.
3. Put `GEMINI_API_KEY` only in the backend environment.
4. Test valid image, invalid image, oversized image, timeout, quota exceeded, malformed response, and manual fallback.
5. Add clear consent before transmitting user images to the external AI provider.
6. Do not assume API access is unlimited or guaranteed free.

## F. Deploy backend on Render
1. Push the complete repository to GitHub.
2. Create a Render Web Service connected to the repository.
3. Set root directory to `server` if using the proposed monorepo.
4. Configure the correct install/build/start commands based on the actual server package scripts, for example:
   - Build: `npm install && npm run build`
   - Start: `npm start`
   Do not copy these blindly if the scripts differ; inspect and document exact commands.
5. Add server environment variables in the Render dashboard:
   - `NODE_ENV=production`
   - `MONGODB_URI`
   - `MONGODB_DB_NAME`
   - `CLIENT_ORIGIN` (update after Vercel deploy)
   - Supabase verification settings
   - `GEMINI_API_KEY` and selected model
   - `PORT` should use the port supplied by the platform if required.
6. Ensure the server listens on `0.0.0.0` and `process.env.PORT`.
7. Add/verify `GET /health` and wait for a successful deployment.
8. Copy the deployed API URL.
9. Test `/api/v1/health`, products, assessment and validation with the deployed API.
10. If the service sleeps on the free plan, document cold-start latency and test before the competition.

## G. Deploy frontend on Vercel
1. Import the GitHub repository into Vercel.
2. Set root directory to `client`.
3. Configure framework/build settings based on the actual Vite scripts (commonly `npm run build`; output directory commonly `dist`).
4. Set environment variables:
   - `VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api/v1`
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
5. Deploy and copy the production URL.
6. Add the Vercel production URL to backend `CLIENT_ORIGIN`/CORS allowlist.
7. Redeploy backend if the environment changed.
8. Configure Supabase production redirect URLs to include the Vercel URL.
9. Retest login, API calls, forms, cart, image analysis, and protected routes on the live site.
10. If using client-side routing, configure Vercel SPA rewrites so direct navigation to `/assess`, `/shop`, `/my-requests`, etc. works after refresh.

## H. Final production smoke test
- Open the site in an incognito/private window.
- Test signup/signin/signout.
- Complete an assessment and verify the response.
- Browse all 10 products.
- Add/remove cart items and verify totals.
- Submit a collection request and confirm persistence.
- Confirm My Requests shows only the current user's records.
- Submit feedback.
- Upload a test image; confirm both AI success and fallback behaviour.
- Open a QR passport URL and verify no private data leaks.
- Test mobile navigation and refresh nested routes.
- Check browser console, server logs, CORS, failed network requests, and image errors.
- Confirm no secret key appears in browser source/network responses or Git history.
- Test the production build and write down any known limitations.

## I. Free-tier reliability precautions
- Keep a manual assessment route when Gemini is unavailable.
- Do not rely on a backend warm-up ping to bypass hosting-provider limits.
- Prepare a short local demo and screenshots/video as a backup.
- Avoid large uploads and unnecessary AI calls.
- Add clear messages for rate limit, cold start, and service unavailable.
- Do not enable real payment collection for the prototype.
- Check current pricing/quotas immediately before the competition.

---

# 11. Implementation phases — do not skip

## Phase 0: Inspect first
- Inspect repository, package files, logo/assets, current scripts, Git status, and existing functionality.
- Summarize architecture, missing pieces, potential conflicts, and plan.
- Do not overwrite existing work.
- Ask before any destructive changes.

## Phase 1: Foundation
- Set up typed frontend/backend structure.
- Configure scripts, environment validation, lint/typecheck, route skeleton, and centralized error handling.
- Add README baseline and `.gitignore`.
- Confirm both client and API start.

## Phase 2: Design system
- Implement design tokens, layout containers, typography, buttons, form fields, cards, badges, dialogs, toasts, skeletons, empty/error states, header, mobile navigation, and footer.
- Use the supplied logo.
- Verify keyboard and mobile behaviour.

## Phase 3: Database/auth/API
- Connect MongoDB safely.
- Add models/schemas, indexes, idempotent seed scripts, auth verification middleware, ownership checks, and API tests.
- Seed all 10 products and at least 8 ideas.
- Test with two users.

## Phase 4: Main pages
- Home, About, assessment form/result, ideas gallery/detail, shop/detail, cart/demo checkout, collection, My Requests, feedback.
- Connect every form to the API where specified.
- Do not fake successful persistence.

## Phase 5: AI image analysis
- Add safe upload validation, Gemini service, structured output validation, safety overrides, rate limits, timeout/error handling, consent, and manual fallback.
- Test quota and failure scenarios.

## Phase 6: Impact + device passport
- Add data-backed impact summary.
- Add passport creation, QR generation, safe public route, owner-only actions, and event history.
- Label unverified records accurately.

## Phase 7: Polish and accessibility
- Responsive refinement, keyboard navigation, contrast, reduced motion, alt text, metadata, image fallbacks, loading/error/empty states.
- Remove dead links, console warnings, and duplicate logic.

## Phase 8: Verification
- Run lint, typecheck, unit tests, API tests, production build, and E2E tests if available.
- Fix failures and rerun.
- Report exact commands and results.
- Clearly identify mocked versus live external API tests.

## Phase 9: Deployment
- Configure Atlas, Supabase Auth, Gemini, Render, and Vercel.
- Add deployment documentation and environment checklist.
- Deploy only if required account access/credentials are available.
- Verify the live URL; otherwise provide exact manual steps and mark deployment incomplete.

After every phase report:
1. What changed.
2. Important files.
3. Commands run.
4. Test/build results.
5. Known issues.
6. Next phase.

---

# 12. Definition of done

The project is complete when:
- All required pages render and are navigable.
- Every key button has a real, tested action.
- All 10 products and the specified prices are seeded correctly.
- Assessment works without AI; AI adds image observations when available.
- Recommendations are explainable and safety-conscious.
- User-specific requests are private and protected by backend ownership checks.
- Collection and feedback data persist.
- Cart works and checkout is clearly a demo.
- Impact metrics are real or explicitly marked as sample data.
- Passport QR links work and reveal no private information.
- Mobile/tablet/desktop layouts are usable.
- No known critical runtime errors or dead links remain.
- Lint/typecheck/tests/build have been run and results are documented honestly.
- README and deployment guide are complete.
- Live deployment is verified or clearly marked as not yet deployed.

---

# 13. Final instructions to the coding agent

Work like a senior full-stack engineer and product designer:
- Inspect before editing.
- Build in small, reversible phases.
- Prefer clean, efficient, typed, modular code over giant components or duplicated logic.
- Avoid premature abstractions and unnecessary dependencies.
- Keep business logic out of React presentation components and Express route handlers.
- Use reusable components and design tokens.
- Make every async interaction understandable to the user.
- Do not claim features, tests, security, AI analysis, or deployment are complete unless they are actually verified.
- If blocked by missing credentials, finish independent work, explain the missing step, and keep a safe fallback.
- Never expose secrets.
- Finish with a concise handover containing setup instructions, environment variables, exact test results, deployment status, and known limitations.

**Start at Phase 0. Inspect the current project and report the plan before implementing major changes.**
