# POWERCYCLE Collection Request — Production-Grade Implementation Guide

## 1. Purpose and scope

Build the redesigned **Collection Request / E-waste Pickup** screen shown in the visual reference. The page lets an authenticated user submit an e-waste collection request, review its status, and later receive updates.

This is a real full-stack feature, not just a static form. Implement the UI, validation, authenticated API, database persistence, ownership checks, status lifecycle, and safe handling of pickup-address/contact data.

**Current architecture to preserve**
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: MongoDB Atlas
- Authentication: Supabase Auth
- AI/image analysis: Gemini, for the existing assessment feature only
- Planned deployment: Vercel frontend, Render backend, MongoDB Atlas, Supabase Auth

Inspect the repository first and follow its actual structure, naming, dependencies, routes, and conventions. Do not replace the stack or duplicate existing auth/API layers.

**Integration reality:** A submitted request is not a confirmed real-world pickup. Unless a collection provider has actually been integrated, the UI and API must say “Request submitted” or “Awaiting review,” not “Pickup confirmed,” “partner assigned,” or “pickup scheduled.”

---

## 2. Screen layout

Use the provided image as the visual guide. Keep the current POWERCYCLE dark navy/black theme with neon-purple accents, readable text, subtle gradients, bordered cards, and responsive spacing.

### A. Shared navigation
Reuse the existing authenticated app navbar. Do not create a duplicate header. Show the current authenticated user's safe display name/email only if already supported by the app. Provide a working sign-out action using the existing Supabase auth flow.

### B. Page heading and stepper
- Eyebrow: `RESPONSIBLE DISPOSAL, MADE EASY`
- Heading: `Schedule an e-waste pickup`
- Supporting text: explain that users can submit device and pickup details.
- Stepper: `Device details` → `Pickup details` → `Review`.

The stepper can organize the form visually, but do not pretend a provider has accepted the request before that has actually happened. Users should be able to review and correct their information before submitting.

### C. Collection request form
Fields in the visual reference:

1. Full name — required
2. Phone number — required
3. Email address — required or prefilled from the verified Supabase profile; allow correction only if the product requirements need it
4. Device category — required, e.g. mobile phone, laptop, tablet, desktop, accessories, other
5. Number of items — required positive integer with a reasonable server-enforced maximum
6. Pickup address — required
7. City — required
8. State — required
9. PIN/postal code — required and validated for the selected country/region
10. Preferred pickup date — required only if the service supports user-selected dates; validate it is not in the past
11. Preferred time slot — required only if supported; it is a preference, not a confirmed appointment
12. Notes / special instructions — optional, length-limited; warn users not to include passwords or sensitive personal information
13. Safety confirmation checkbox — required; the user confirms devices are ready for collection and personal data has been removed where possible

Do not collect more personal data than necessary. Do not collect government IDs, payment card data, passwords, or device unlock codes.

### D. Right-hand information panel
- “A Cleaner Tomorrow Starts Here” illustration/banner.
- “Your pickup at a glance” process explanation.
- “Before pickup” checklist: back up data, sign out of accounts, remove SIM/memory cards.
- Service availability panel.
- Disclaimer: request acceptance and final pickup timing depend on actual service/provider availability.

Make the checklist informational unless the product explicitly saves checklist completion. Do not persist these values as user facts if they are only UI guidance.

### E. Confirmation state
After a successful API response:
- Show a success message with the request reference/ID and status.
- Show the submitted summary with sensitive address/contact data appropriately masked where suitable.
- Offer a “View my requests” action if that page/route exists.
- Prevent duplicate submissions while a request is processing.
- Never show success if the API failed or the request was not persisted.

---

## 3. Where each field should be stored

Use **MongoDB Atlas as the application database** for the collection request record. Supabase Auth remains the identity provider. Do not put collection request records in browser localStorage as the source of truth.

Recommended `collectionRequests` document (adapt field names to the existing codebase):

```ts
type CollectionRequestStatus =
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected"
  | "scheduled"
  | "picked_up"
  | "completed"
  | "cancelled";

interface CollectionRequest {
  _id: ObjectId;

  // Identity / ownership
  userId: string; // verified Supabase Auth user ID

  // Contact details needed to coordinate the request
  contact: {
    fullName: string;
    phone: string;
    email: string;
  };

  // What needs collection
  device: {
    category: "mobile" | "laptop" | "tablet" | "desktop" | "accessory" | "other";
    itemCount: number;
    notes?: string;
  };

  // Personal pickup information — restrict access
  pickup: {
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode: string;
    preferredDate?: Date;
    preferredTimeSlot?: string;
  };

  // User consent / safety acknowledgement
  acknowledgements: {
    dataRemovalConfirmed: boolean;
    acceptedAt: Date;
    termsVersion?: string;
  };

  // Request lifecycle
  status: CollectionRequestStatus;
  statusHistory: Array<{
    status: CollectionRequestStatus;
    changedAt: Date;
    changedBy: string; // verified user ID or authorized staff/system actor
    note?: string;
  }>;

  // Provider fields should be optional until a real provider integration exists
  provider?: {
    providerId?: string;
    externalRequestId?: string;
    confirmedPickupAt?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

### Field-to-storage map

| UI section / field | Store it in | Why |
|---|---|---|
| Supabase user identity | `userId` in MongoDB | Connects request to the authenticated owner; derive it from the verified token, never trust a client-supplied `userId` |
| Full name | `contact.fullName` | Coordination with the requester |
| Phone | `contact.phone` | Contact about the request; restrict access |
| Email | `contact.email` | Request communication; consider using verified auth email when appropriate |
| Device category | `device.category` | Route/classify the e-waste request |
| Item count | `device.itemCount` | Estimate collection volume |
| Notes | `device.notes` | Optional logistics/condition details; sanitize/limit length |
| Address | `pickup.addressLine` | Pickup logistics; sensitive personal data |
| City/state/PIN/country | `pickup.*` | Service-area checks and pickup logistics |
| Preferred date/time | `pickup.preferredDate`, `pickup.preferredTimeSlot` | User preference only until provider confirms |
| Safety checkbox | `acknowledgements.dataRemovalConfirmed` and `acceptedAt` | Record acknowledgement and timestamp |
| Current status | `status` | Track lifecycle |
| Status changes | `statusHistory[]` | Audit trail for operational changes |
| Provider confirmation | `provider.*` | Only after a real provider response exists |
| Created/updated times | `createdAt`, `updatedAt` | Support sorting, audit and operational monitoring |

### What not to store
- Do not store passwords, auth tokens, session tokens, SIM contents, files from users' devices, or device unlock codes.
- Do not store the informational “Before pickup” checklist unless the user explicitly marks items and the product needs to save that progress.
- Do not create fake provider IDs, confirmed slots, environmental savings, or pickup tracking events.
- Avoid storing redundant copies of profile data. If contact details are prefilled from the profile, store a request-time snapshot only when it is needed for the request, and explain the purpose in the privacy notice.

---

## 4. Production-grade API design

Follow the existing API prefix. The project has used `http://localhost:4000/api/v1` for local development; verify the actual backend route structure before adding endpoints.

Suggested endpoints:

### `POST /api/v1/collection-requests`
Create a request.
- Requires a valid Supabase bearer token.
- Validate the body on the server.
- Derive `userId` from verified auth middleware.
- Persist the request to MongoDB.
- Set initial status to `submitted`.
- Add an initial status history entry.
- Return `201 Created` with a safe response DTO and request ID.
- Do not call the request “confirmed” unless a provider confirms it.

### `GET /api/v1/collection-requests/me`
List only the authenticated user's requests.
- Requires auth.
- Filter in MongoDB by the verified `userId`.
- Paginate results.
- Do not accept an arbitrary user ID to query another user's records.

### `GET /api/v1/collection-requests/:id`
Return one request only if the authenticated user owns it, or the caller has an explicit authorized staff role.
- Check ObjectId format before querying.
- Return a consistent `404` for missing/not-owned records when appropriate to avoid leaking record existence.

### `PATCH /api/v1/collection-requests/:id/cancel`
Cancel only if the current status permits it.
- Verify ownership.
- Enforce allowed status transitions server-side.
- Record the status change in `statusHistory`.
- Never allow a user to set arbitrary statuses like `completed` or `picked_up`.

### Optional admin/provider endpoints
Only add these when there is a real staff/admin/provider workflow. Require role-based authorization and audit changes. Do not treat a normal logged-in user as an administrator.

Use the project's existing validation library if one is already installed. Otherwise, consider a schema validation library such as Zod, but check dependencies before adding one.

---

## 5. Authentication and authorization

The page must be available only to logged-in users, consistent with the app's protected-route requirement.

- Reuse the existing Supabase client and auth context.
- Protect the frontend route so unauthenticated visitors are redirected to `/login`.
- Show a loading state while checking the session so protected content does not flash before auth resolves.
- On the backend, verify the Supabase access token for every protected collection endpoint.
- Return `401 Unauthorized` for missing/invalid/expired credentials.
- Derive request ownership from the verified token's user ID.
- Ensure one user cannot read, edit, or cancel another user's requests.
- Do not rely on frontend route protection as the only security layer.
- Do not expose service-role keys or MongoDB credentials to the frontend.

---

## 6. Validation and data quality

Validate in both frontend and backend; **backend validation is authoritative**.

- Trim whitespace from names and address fields.
- Enforce sensible maximum lengths on every string.
- Validate phone and email formats without assuming every country uses one pattern.
- Validate category against an allowlist/enum.
- Enforce `itemCount` as a positive integer with a reasonable maximum.
- Validate date and time-slot values; reject past dates if applicable.
- Validate postal/PIN code according to selected country.
- Bound optional notes and reject unexpected fields where practical.
- Require the safety acknowledgement to be `true`.
- Normalize dates to a consistent UTC storage format while preserving the intended local pickup timezone/region.
- Do not trust client-calculated prices, serviceability, user IDs, statuses, or provider confirmation.

Show field-level errors and preserve safe form values when validation fails. Do not echo untrusted HTML into the page.

---

## 7. Service availability and pickup scheduling

The screenshot includes “Check Availability.” Implement it honestly:

1. If service coverage is not integrated, show “Availability checks are not configured yet” or collect a city/PIN for a clearly labelled manual review.
2. Do not tell the user a pickup slot is available merely because a date was selected.
3. If a real provider API is added later, check service coverage and slot availability on the server.
4. Recheck availability when submitting because slots can change.
5. Save a provider confirmation only after receiving and verifying the provider's actual response.
6. Keep provider API credentials in backend environment variables only.

A preferred date/time is not a confirmed booking. Use a status such as `submitted` or `under_review` until a real acceptance flow exists.

---

## 8. Privacy, retention, and operational safety

Pickup address, phone, and email are personal data.

- Collect only what is necessary to fulfil the request.
- Explain why contact and address details are collected.
- Restrict access to the request owner and authorized operational staff.
- Never include full address/phone/email in application logs, analytics, error traces, or public URLs.
- Avoid sending personal data to Gemini or unrelated third-party APIs.
- Use HTTPS in production.
- Keep MongoDB Atlas network access and database users restricted appropriately.
- Use least-privilege credentials for database access.
- Define a retention/deletion policy suitable for the application's legal and operational requirements.
- Add rate limiting and abuse protection to request-creation endpoints.
- Add request IDs/correlation IDs to logs, but not secrets or full personal details.
- Ensure production error responses do not expose stack traces.

Do not claim legal compliance simply because these controls exist; review applicable privacy obligations before launch.

---

## 9. MongoDB indexes and lifecycle

Add indexes based on actual query patterns:
- `{ userId: 1, createdAt: -1 }` for a user's request history.
- `{ status: 1, createdAt: -1 }` for authorized operational queues if staff tooling exists.
- Optional provider external ID index only if a real provider integration needs it.

If using Mongoose, define schema validation, timestamps, enums, and indexes in the schema. If the project uses the native MongoDB driver, validate before writes and manage indexes in a controlled startup/migration path. Follow the existing data-access style; do not introduce both Mongoose and the native driver unnecessarily.

Keep status transitions explicit, for example:
- `submitted` → `under_review`
- `under_review` → `accepted` or `rejected`
- `accepted` → `scheduled` only when an actual slot/provider confirmation exists
- `scheduled` → `picked_up`
- `picked_up` → `completed`
- User cancellation only from allowed states

Document and test the actual allowed transitions. Do not let arbitrary client input bypass them.

---

## 10. Frontend architecture

Reuse current components and conventions. Suggested conceptual components:
- `CollectionRequestPage`
- `CollectionRequestForm`
- `DeviceCategorySelect`
- `ItemCountControl`
- `PickupAddressFields`
- `PickupDateTimeFields`
- `SafetyAcknowledgement`
- `PickupProcessPanel`
- `BeforePickupChecklist`
- `CollectionRequestConfirmation`

Avoid creating duplicate navbar/auth providers/API clients.

### Form state
- Keep temporary input in React component/form state.
- Do not persist sensitive address/contact values to localStorage by default.
- Submit through the existing API client with the current Supabase session token.
- Disable submit during requests and prevent double submission.
- Handle loading, validation errors, API errors, and success distinctly.
- Clear or reset sensitive form values after successful submission where appropriate.

### API response
Return a minimal response DTO, for example:
```json
{
  "id": "server-generated-request-id",
  "status": "submitted",
  "createdAt": "server-generated-ISO-date"
}
```

Do not return internal database fields, auth metadata, provider secrets, or other users' data.

---

## 11. Deployment configuration

### Frontend (Vercel)
Configure environment variables in the Vercel project settings, not in committed files:
- `VITE_API_BASE_URL` — production backend API base URL.
- `VITE_SUPABASE_URL` — Supabase project URL.
- `VITE_SUPABASE_ANON_KEY` or the existing publishable-key variable used by this project.

Vite client variables are public at build time. Never place `MONGODB_URI`, Gemini API keys, Supabase service-role keys, or other server secrets in `VITE_*` variables.

### Backend (Render)
Set server-only variables in Render environment settings:
- `NODE_ENV=production`
- `PORT` — use the platform-provided port when required by Render.
- `CLIENT_ORIGIN` — exact deployed frontend origin.
- `MONGODB_URI`
- `MONGODB_DB_NAME=powercycle`
- `SUPABASE_URL`
- The exact server-side JWT verification configuration required by the existing implementation.
- Provider API credentials only if a real provider integration is enabled.

Check the actual project's variable names before changing them. Do not create multiple competing variable names for the same setting.

### MongoDB Atlas
- Create a least-privilege database user.
- Configure network access for the deployed backend with the narrowest practical rules supported by the hosting/network setup.
- Do not commit connection strings.
- Verify backups/retention and production access controls.
- Add required indexes and test connectivity from the deployed backend.

### Supabase
- Configure production Site URL and allowed redirect URLs for login/reset flows.
- Verify production auth callbacks.
- Keep the client publishable/anon key public by design, but keep service-role keys server-only.
- Ensure the backend verifies tokens rather than trusting client-submitted user data.

### CORS and transport
- Restrict backend CORS to the exact production frontend origin(s).
- Allow the required `Authorization` and `Content-Type` headers.
- Use HTTPS for deployed traffic.
- Do not use `*` for credentialed CORS.
- Do not assume local URLs work in production.

---

## 12. Copilot Agent prompt

Paste this into GitHub Copilot Agent in VS Code:

> Implement the POWERCYCLE Collection Request screen based on the provided visual reference, and make it production-minded. First inspect the existing React/Vite/TypeScript/Tailwind client, Express/TypeScript server, MongoDB data-access layer, Supabase Auth integration, route protection, API client, environment variable names, and tests. Follow existing patterns and do not replace the stack or duplicate existing components.
>
> Build the responsive dark navy/neon-purple Collection Request UI with: full name, phone, email, device category, item count, pickup address, city, state, postal/PIN code, preferred date/time if supported, optional notes, mandatory safety acknowledgement, a three-step review flow, right-side process explanation, before-pickup checklist, honest availability message, and success/error states. Reuse the shared navbar and design system.
>
> Connect the form to a protected Express API. Validate all input on the server, derive `userId` from a verified Supabase access token, persist requests in MongoDB Atlas using the existing data-access approach, set the initial status to `submitted`, add timestamps and status history, and return a minimal safe response DTO. Implement authenticated `GET /collection-requests/me` and owner-checked request detail/cancel endpoints only if they fit the existing route conventions. Prevent users from accessing or modifying other users' requests. Enforce allowed status transitions server-side.
>
> Treat pickup dates/times as preferences until a real collection provider confirms them. If provider availability is not integrated, clearly say that requests await review; do not fake availability, partner assignment, pickup confirmation, environmental metrics, or tracking. Do not add provider IDs or confirmations unless an actual provider response exists.
>
> Store request records in MongoDB, not browser localStorage. Keep temporary form values in React state, avoid logging personal data, and restrict access to contact/address details. Do not store passwords, tokens, device unlock codes, or unnecessary personal information. Add useful loading, validation, empty, error, and success states. Add indexes for user request history and operational status queries where appropriate.
>
> Protect every collection API endpoint with server-side Supabase token verification, not only a frontend route guard. Never expose MongoDB credentials, Gemini keys, or Supabase service-role keys to the client. Use existing validation/dependencies when possible; inspect packages before adding any.
>
> Add tests for validation, unauthenticated access, ownership isolation, allowed status transitions, duplicate submissions, and success/error handling where the existing test setup supports them. Run the available lint, type-check, tests, and production build. Do not redesign unrelated pages. Report files changed, schema/endpoints, tests performed, missing provider integration, and deployment variables/configuration still required.

---

## 13. Testing checklist

### UI and usability
- [ ] Matches the POWERCYCLE design system.
- [ ] Works on desktop, tablet, and mobile without horizontal overflow.
- [ ] All fields have accessible labels and keyboard focus states.
- [ ] Stepper/review flow allows the user to correct input.
- [ ] Loading, field validation, server error, and success states are clear.
- [ ] Submit button cannot accidentally send repeated requests.

### Data and security
- [ ] Valid request is persisted in MongoDB.
- [ ] Request `userId` comes from verified auth, not the body.
- [ ] Unauthenticated create/list/detail/cancel requests return `401`.
- [ ] User A cannot read or cancel User B's request.
- [ ] Invalid category, negative/too-large item count, past date, oversized notes, and missing acknowledgement are rejected.
- [ ] User cannot set `accepted`, `scheduled`, `picked_up`, or `completed` directly.
- [ ] No contact/address/token/secret data appears in logs.
- [ ] Empty availability configuration does not pretend a real pickup is booked.

### Production readiness
- [ ] Environment variables are set in Vercel/Render dashboards.
- [ ] Production CORS allows only intended origins.
- [ ] MongoDB Atlas connectivity and indexes are verified.
- [ ] Supabase production redirect URLs are configured.
- [ ] HTTPS works.
- [ ] Lint, type-check, tests, and production build pass or failures are documented.
- [ ] A real end-to-end request is tested in staging before public launch.

---

## 14. Recommended implementation order

1. Inspect the existing project and write down current routes, models, auth middleware, and API conventions.
2. Implement/verify MongoDB schema and server-side validation.
3. Implement protected create/list/detail/cancel API routes and ownership checks.
4. Add tests for API validation, authentication, and ownership.
5. Build the UI to match the reference.
6. Connect the form to the API and display real persisted status.
7. Test with two separate user accounts to verify isolation.
8. Configure staging environment variables and test end-to-end.
9. Deploy backend, verify health/auth/database access, then deploy frontend with the correct API URL.
10. Test production login, request submission, user history, cancellation rules, and error handling.

**Do not ship a fake booking flow.** A persisted request in `submitted`/`under_review` state is honest and production-appropriate until a real collection partner or operations workflow can confirm a pickup.
