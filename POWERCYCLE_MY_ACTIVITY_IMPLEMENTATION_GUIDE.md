# POWERCYCLE — My Activity / Current User Dashboard
## Production implementation guide (React + Vite + TypeScript + Tailwind + Express + MongoDB + Supabase)

> Goal: Build a polished, real, user-specific activity page where each authenticated user can review their own AI device assessments, uploaded photos, Gemini results, purchases, upcycling ideas/blog posts, and collection requests. Data must come from the database—not hard-coded demo values.

---

## 1. Product requirements

Create a protected route such as `/my-activity` (or `/account/activity`) with a premium, responsive PowerCycle dashboard.

### Main dashboard
- User profile summary: name/email/avatar from the authenticated Supabase user/profile.
- Summary cards with real counts: AI assessments, purchases/orders, published/draft ideas, collection requests.
- Tabs or separate sections:
  1. **AI Assessments** — each device photo, device name/type, upload date/time, assessment status, Gemini result, condition, estimated value/range (only if the AI actually returned it), recommendations, and detail view.
  2. **My Purchases** — order date, order number, product card/image/title/SKU or product ID, quantity, price paid, total, order/payment/delivery status. Product details should use a saved order-item snapshot so the card remains accurate if the live product listing changes.
  3. **My Ideas & Blog Posts** — title, excerpt, cover image, created/published/updated dates, status, and a clickable route to the existing idea/post detail page.
  4. **Collection Requests** — request number, device/items, submitted date, preferred pickup date, address summary (avoid exposing it unnecessarily), and current status.
- Search, filter by type/status/date range, sort newest/oldest, pagination or “Load more”.
- Every record has its own **Delete** action, confirmation dialog, loading state, success/error feedback.
- Optional “Delete all history” action must be a separate, strongly confirmed operation and explain exactly which records are affected. Do not silently delete purchases/orders required for legal, accounting, or operational records; consider hiding/archive instead.
- Empty/loading/error states; accessible keyboard controls; responsive layout; date formatting in the user’s locale/time zone.
- Do not show fake counts, fabricated orders, or invented AI results.

### AI history rule
For each Gemini assessment, persist one assessment record after the API call finishes (including failure state if useful). Save the uploaded photo reference/path and Gemini's parsed result in the same assessment record or a related collection. If there are multiple Gemini calls in one user workflow, decide whether they form one assessment with multiple steps or separate assessment events, and model that explicitly. Avoid storing raw secrets or unnecessary full prompts.

---

## 2. Suggested folder structure

Adapt this to the existing repository; don't create duplicate API clients or authentication systems if the project already has them.

```text
POWERCYCLE/
  client/
    src/
      pages/
        MyActivityPage.tsx
      components/
        activity/
          ActivitySummaryCard.tsx
          ActivityTabs.tsx
          AssessmentHistoryCard.tsx
          PurchaseHistoryCard.tsx
          IdeaHistoryCard.tsx
          CollectionRequestCard.tsx
          ActivityFilters.tsx
          DeleteRecordDialog.tsx
          ActivitySkeleton.tsx
          ActivityEmptyState.tsx
      services/
        activityApi.ts
      types/
        activity.ts
  server/
    src/
      routes/
        activity.routes.ts
      controllers/
        activity.controller.ts
      services/
        activity.service.ts
      middleware/
        requireUser.ts
      models/
        DeviceAssessment.ts
        Order.ts
        Idea.ts
        CollectionRequest.ts
```

If the project uses different file names or a different router structure, follow the current structure instead of forcing this one.

---

## 3. Data model: store the real history

Prefer dedicated MongoDB collections or the app's existing collections. Do not duplicate an existing `orders`, `ideas`, or `collectionRequests` collection merely to make the dashboard.

### DeviceAssessment document

```ts
{
  _id: ObjectId,
  userId: string,                 // verified Supabase auth user ID (sub)
  userEmail: string,              // optional display/audit snapshot; not the authorization key
  deviceName: string,
  deviceType: string,
  imagePath: string,              // private Supabase Storage object path; avoid public arbitrary URLs
  imageBucket: string,            // e.g. idea-images only if this is the actual bucket
  createdAt: Date,                // server-generated UTC timestamp
  status: "processing" | "completed" | "failed",
  model: string,                  // actual model ID used
  result: {
    summary?: string,
    condition?: string,
    estimatedValueMin?: number,
    estimatedValueMax?: number,
    recommendations?: string[],
    rawText?: string               // optional, length-limited; avoid secrets/personal data
  },
  errorCode?: string               // safe, non-secret diagnostic code
}
```

### Purchases / order items

Use the existing order collection and store a snapshot of the purchase-time data:

```ts
{
  _id: ObjectId,
  userId: string,
  orderNumber: string,
  createdAt: Date,
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded",
  items: [{
    productId: string,
    title: string,
    imageUrl: string,
    sku?: string,
    quantity: number,
    unitPrice: number,
    currency: "INR"
  }],
  totalAmount: number,
  paymentStatus: string
}
```

Do not invent checkout/payment functionality if the app does not have it yet. If the marketplace currently only supports browsing, label this section “Saved / Viewed Products” only if those events are truly recorded; otherwise show a truthful empty state.

### Ideas / blog posts

Reuse the existing idea model. Ensure it has:

```ts
{
  _id: ObjectId,
  userId: string,
  title: string,
  description: string,
  coverImagePath?: string,
  status: "draft" | "published",
  createdAt: Date,
  updatedAt: Date
}
```

### Collection requests

Reuse the current collection request model:

```ts
{
  _id: ObjectId,
  userId: string,
  requestNumber: string,
  items: [{ deviceType: string, quantity: number }],
  status: "submitted" | "scheduled" | "collected" | "cancelled",
  preferredPickupAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

Add indexes based on actual query patterns, for example:
- `{ userId: 1, createdAt: -1 }` for each history collection.
- Unique indexes for real order/request identifiers where applicable.
- Never use email alone as the trusted authorization key. Use the verified auth user ID; email can change.

---

## 4. Authentication and authorization (critical)

The browser must never be trusted to supply the user ID/email for access control.

1. Frontend gets the current Supabase session.
2. Frontend sends the access token in `Authorization: Bearer <access_token>`.
3. Express middleware verifies the JWT using the Supabase-supported verification approach/JWKS and validates signature, issuer, expiry, and audience as appropriate.
4. Middleware sets `req.user = { id: verified.sub, email: verified.email }`.
5. Every database query uses `req.user.id` from the verified token.
6. For reads, use filters like `{ userId: req.user.id }`.
7. For deletes, use both the record ID and verified user ID, e.g. `deleteOne({ _id: id, userId: req.user.id })`.
8. If no matching record exists, return a safe `404`; do not reveal whether another user's record exists.
9. Never authorize by an email sent from the frontend.
10. Do not expose `SUPABASE_SERVICE_ROLE_KEY`, MongoDB credentials, or Gemini API keys to the browser. Keep them server-side and rotate any key that has already been exposed.

---

## 5. API contract

Example REST endpoints; align names with the existing API prefix (`/api/v1` if that's what the project already uses).

```text
GET    /api/v1/me/activity/summary
GET    /api/v1/me/assessments?page=1&limit=12&search=&from=&to=&status=
GET    /api/v1/me/assessments/:id
DELETE /api/v1/me/assessments/:id

GET    /api/v1/me/orders?page=1&limit=12
GET    /api/v1/me/orders/:id
# Prefer cancellation/refund workflows for real orders rather than hard delete.

GET    /api/v1/me/ideas?page=1&limit=12
GET    /api/v1/me/ideas/:id
DELETE /api/v1/me/ideas/:id       # only if owner and product policy allows it

GET    /api/v1/me/collection-requests?page=1&limit=12
GET    /api/v1/me/collection-requests/:id
DELETE /api/v1/me/collection-requests/:id
# If pickup is already scheduled, cancel through a business workflow instead of raw deletion.

DELETE /api/v1/me/activity/history # optional; scoped, documented, strongly confirmed
```

Response envelope suggestion:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 0,
    "hasMore": false
  }
}
```

Summary counts should be computed from authorized server-side queries, not sent by the client. Dates should be returned as ISO-8601 UTC timestamps.

---

## 6. Gemini assessment: write the history on every call

A reliable sequence:

1. Verify the user session on the server.
2. Validate file type (JPEG/PNG/WebP), size limit, and any image dimensions policy.
3. Upload to a private Supabase Storage bucket with a user-scoped object path such as `userId/assessmentId/original.jpg`.
4. Create an assessment document with `status: "processing"`, verified `userId`, storage path, and server `createdAt`.
5. Call Gemini **only from the backend** using the server-only API key.
6. Parse and validate the returned JSON/schema; don't trust arbitrary model output as authoritative.
7. Update the same record with result/model/`status: "completed"`.
8. If the call fails, update the record to `status: "failed"` and a safe error code; don't lose the photo/attempt.
9. Return the saved assessment ID and safe result to the frontend.
10. If retries are needed, use a small retry cap, exponential backoff for retryable errors, and don't retry quota/billing errors indefinitely.

A result detail page should show:
- uploaded photo (using an authorized signed URL or authenticated image delivery),
- uploaded timestamp,
- device information,
- actual model name,
- real assessment result,
- safe error status if failed,
- “Try again” only if policy/quota allows it.

Never display a fabricated assessment as if Gemini generated it. If Gemini is unavailable, explain that the assessment is temporarily unavailable and preserve the record.

---

## 7. Purchases must be truthful

- Source order history from the real orders collection, filtered by authenticated `userId`.
- Show product cards from saved order-item snapshots, not a generic hard-coded catalog.
- Keep purchase-time title, image, price, quantity and status stable.
- For real orders, prefer “View order”, “Cancel order” or “Request refund” workflows; hard deletion can break audit trails.
- If purchases aren't implemented yet, show “No purchases yet” and a Marketplace link. Do not display mock orders in production.

---

## 8. Frontend UI and interactions

### Visual direction
- PowerCycle dark navy background, subtle blue/green highlights, rounded cards, clear contrast.
- Desktop: left navigation, central activity feed, right profile/quick actions; responsive single-column layout on mobile.
- Summary cards, section tabs, search and filters.
- Each record card includes a real date, preview image, meaningful title, status badge, details link, and per-record menu.
- Use skeleton loaders while fetching and helpful empty/error states.

### Date handling

Use server-generated `createdAt` and display in the user's local time zone:

```ts
export function formatDate(value: string, locale = "en-IN") {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
```

- Never use dates from sample designs or client device clock as the stored source of truth.
- If a record has no timestamp, show “Date unavailable” rather than fabricating one.
- Filter by UTC instants on the backend and convert display values locally.

### Deletion UX
- Per-record Delete button, with confirmation dialog showing the item title.
- Disable buttons while deletion is in progress.
- On success, remove the deleted record from the local list and refresh counts.
- On failure, preserve the record and show an error.
- For photos in Storage, delete the image only after confirming ownership and checking that no other record references it.
- “Delete all history” should show the exact data categories and require a deliberate confirmation; consider a typed confirmation word.
- Avoid hard-deleting orders needed for payments, refunds, audits, or legal requirements. Archive/redact where appropriate.
- Audit events should not retain unnecessary image data or secrets.

---

## 9. Example frontend API client

Adapt the API base URL and auth provider to the existing project. Do not create a second Supabase client if one already exists.

```ts
// client/src/services/activityApi.ts
import { supabase } from "../lib/supabase"; // change to the existing client path

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function authHeaders(): Promise<HeadersInit> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in to view your activity.");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function getMyAssessments(page = 1) {
  const headers = await authHeaders();
  const response = await fetch(
    `${API_BASE_URL}/me/assessments?page=${page}&limit=12`,
    { headers }
  );

  if (!response.ok) throw new Error("Could not load assessment history.");
  return response.json();
}
```

If existing API paths already include `/api/v1`, avoid accidentally duplicating the prefix.

---

## 10. Suggested implementation sequence

### Phase A — inspect existing code first
- Find current Supabase auth provider/client and route protection.
- Find current Gemini assessment handler.
- Find existing Mongo models/collections for ideas, orders, and collection requests.
- Find upload flow and bucket policies.
- Check current API prefix, error middleware, and date conventions.
- Reuse existing files/models/endpoints; avoid duplicates.

### Phase B — backend first
1. Verify Supabase access tokens in Express.
2. Ensure all records store verified `userId` and server `createdAt`.
3. Save every Gemini assessment attempt and update the result.
4. Build summary and paginated history endpoints.
5. Add per-record delete endpoints with ownership checks.
6. Test user A cannot read/delete user B's records.
7. Add validation, rate limiting, safe logging, and indexes.

### Phase C — frontend
1. Add protected `/my-activity` route and navigation link.
2. Build dashboard layout and summary cards.
3. Fetch real summary counts and histories.
4. Add tabs, filters, search, pagination, detail links.
5. Add delete confirmation and optimistic/refresh behavior.
6. Add loading, empty, error and mobile states.
7. Verify all cards use actual API data.

### Phase D — production QA
- Test a fresh account and an existing account.
- Sign in as two different users and verify strict separation.
- Upload a photo and confirm the image path, timestamp and result persist after reload.
- Simulate Gemini quota failure and confirm a failed record is shown safely.
- Confirm each idea opens its existing detail page.
- Confirm purchases show actual order snapshots only.
- Delete one record and verify the right item and count update.
- Test large history with pagination and filters.
- Check Vercel frontend environment variables and Render backend environment variables separately.
- Ensure production CORS only allows the actual frontend origin.
- Ensure no secret is in the frontend bundle or Git history.

---

## 11. Acceptance checklist

- [ ] Signed-out user cannot access private activity.
- [ ] Each user only sees their own records.
- [ ] All counts and dates come from the server/database.
- [ ] Each Gemini attempt is persisted with photo path, status, model, and actual result/error.
- [ ] Assessment cards link to a working detail view.
- [ ] Purchases are real and display saved product details.
- [ ] Ideas open the existing idea/blog detail route.
- [ ] Collection requests display real statuses.
- [ ] Search, filters, sorting and pagination work against real data.
- [ ] Per-record deletion is owner-scoped and confirmed.
- [ ] Bulk history deletion is explicit and does not silently erase required order records.
- [ ] Storage cleanup respects ownership and references.
- [ ] No mock data appears as real production history.
- [ ] Layout is responsive and accessible.
- [ ] Quota errors are handled without breaking the whole app.

## 12. Copilot Agent prompt

Paste this into GitHub Copilot Agent in VS Code after opening the POWERCYCLE repository:

> Inspect the existing POWERCYCLE repository before editing. Implement a production-ready, responsive My Activity page based on the supplied dashboard reference. Reuse the existing React/Vite/TypeScript/Tailwind components, Supabase auth client, Express API structure, MongoDB models, Gemini assessment flow, marketplace/order models, ideas/blog model, and collection-request model. Do not replace working app architecture or create duplicate auth clients/models/endpoints.
>
> Build a protected current-user dashboard with real summary counts, AI assessment history including uploaded image path and persisted Gemini result/status for every assessment attempt, purchase history using real order item snapshots, clickable idea/blog history, and collection request history. Use verified Supabase JWT `sub` as the authorization key, never trust a client-supplied email/userId, and filter every query/delete by the authenticated user ID. Add paginated/searchable/filterable endpoints and real server timestamps. Provide per-record delete confirmation and safe ownership-scoped deletion. Never hard-delete operationally necessary order/payment records; use archive/cancel workflows where appropriate. Keep Gemini/MongoDB/service-role secrets server-side. Handle Gemini quota failures, loading/error/empty states, mobile layout, accessible controls, and localized dates. Do not use mock data for production results.
>
> First report the existing files/models/routes and the implementation plan. Then implement in small phases, run available type checks/tests/build, fix errors, and summarize changed files, required environment variables, migrations/indexes, and manual verification steps. If an existing backend/model/auth prerequisite is missing, explain it and implement the smallest secure compatible solution rather than faking functionality.

---

### Final note

A UI-only page cannot show historical Gemini photos/results or real purchases unless those events were stored when they happened. Existing records can be shown only if the current database already contains enough information; older assessments that were never persisted cannot be reconstructed reliably. Implement the persistence flow first, then the dashboard.
