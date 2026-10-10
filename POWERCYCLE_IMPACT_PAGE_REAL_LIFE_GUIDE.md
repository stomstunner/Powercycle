# POWERCYCLE Impact Page — Real-World Implementation Guide

## Purpose

Build the Impact page as a functional part of POWERCYCLE, not a static infographic. It should help each signed-in user understand their actual activity on the platform, take the next useful action, and see sustainability metrics only when the underlying records support them.

**Primary user outcomes**
- See how many devices they have assessed.
- Track actual repair/reuse/upcycling actions recorded by the app.
- Follow collection requests and their statuses.
- Open their recent assessments, ideas, purchases/orders, and collection requests.
- Start a new assessment, publish an upcycling idea, or request a collection directly from the page.
- Understand which figures are verified, estimated, pending, or unavailable.

**Important:** Never show invented numbers or demo activity as a real user's impact. A zero means no matching records; “Not enough data yet” means a metric cannot responsibly be calculated from current records.

---

## 1. Page layout

Route suggestion: `/impact`

Reuse the existing PowerCycle navbar, theme, authenticated user, API client, and layout. Do not build a second login system or duplicate shared components.

### A. Hero — “Your impact, made tangible”
- Explain in one sentence that the page summarizes actions recorded on PowerCycle.
- Optional illustration of circular economy: assess → repair/reuse → upcycle → recycle.
- Primary CTA: **Assess a device**
- Secondary CTA: **Share an upcycling idea**
- Keep the copy honest: platform activity is not automatically proof of environmental impact.

### B. Real metric cards

Use backend-returned values only:

1. **Devices assessed** — count of the current user's persisted assessment records.
2. **Items given a second life** — count only when a real repair, reuse, resale, or upcycling completion record exists. Do not infer from a device assessment alone.
3. **Collection requests** — count of the user's real collection requests; optionally show status breakdown.
4. **Verified e-waste diverted** — show weight only if collected/recycled weight is recorded and verified by an appropriate source. Otherwise show “Awaiting verified data” / “Not measured yet”.

Each card should include:
- Number and unit where meaningful.
- A short description.
- Optional trend only if the comparison period can be computed from real timestamps.
- Link to the relevant filtered section in My Activity.

### C. Circularity Journey

Show four actionable stages:
1. **Assess** — inspect device condition through the existing Device Assessment flow.
2. **Repair & Reuse** — offer practical next steps from actual assessment results; mark complete only when a real user action/record confirms it.
3. **Upcycle** — link to Ideas and let users create/view their own projects.
4. **Recycle** — link to a real collection request workflow or verified recycler information.

Each stage needs a functional button/link. Stage progress must be based on stored user activity, not decorative percentages.

### D. Eco Impact Passport

A personal summary panel:
- “Your activity summary” based on actual records.
- Assessment contribution: count of completed assessments.
- Reuse/repair contribution: count of recorded completed actions.
- Idea contribution: count of published ideas.
- Recycling contribution: count of completed/verified collection or recycling events.
- Show **Pending** or **Not enough data yet** if the app lacks sufficient records.
- If a numerical impact score is introduced later, document its formula, inputs, units, and assumptions. Avoid a mysterious score with no methodology.

### E. Impact Activity Feed

Show the user's latest activity from real collections, such as:
- Device assessment completed/failed.
- Idea created/published.
- Purchase/order created or updated, if marketplace checkout is implemented.
- Collection request submitted/scheduled/completed.
- Repair/reuse completion recorded, if supported.

Each feed item should include:
- Type, title, server-generated timestamp, and current status.
- A working **View details** link to the corresponding record.
- Empty state: “Your journey starts with your first device assessment.”
- “View all activity” link to `/my-activity`.

Do not invent activities or timestamps. If an action isn't stored in the database, it cannot appear as historical activity.

### F. Action cards

Functional quick actions:
- **Assess a device** → existing assessment route.
- **Share an upcycling idea** → existing idea create route.
- **Request e-waste pickup** → existing collection request route.
- Optional **Browse marketplace** → marketplace route.

Buttons must navigate to actual routes. If a route is not implemented, show a disabled state with a clear “Coming soon” message instead of a dead button.

### G. Measurement and trust section

Explain:
- **Recorded:** directly counted from saved application records.
- **Estimated:** calculated from documented assumptions and labelled as an estimate.
- **Verified:** supported by an appropriate proof/confirmation record.
- **Not measured:** source data is missing or insufficient.

Do not claim carbon saved, kilograms diverted, trees saved, or other environmental benefits without a defensible methodology and the necessary real data.

---

## 2. Data architecture

Use the current models/collections already present in the project. Inspect the repository before adding new models or endpoints.

Likely sources:
- `DeviceAssessment` or current assessment history collection.
- Existing `Idea`/blog collection.
- Existing `CollectionRequest` collection.
- Existing `Order`/purchase collection, if checkout is implemented.
- Optional `CircularAction` collection for explicit completed repair/reuse/upcycling events.

### Suggested optional CircularAction schema

Only add this if there is no existing model that represents a completed repair/reuse/upcycling action.

```ts
type CircularActionType = "repair" | "reuse" | "upcycle" | "recycle";

interface CircularAction {
  _id: string;
  userId: string;             // verified Supabase auth user ID
  type: CircularActionType;
  title: string;
  description?: string;
  relatedAssessmentId?: string;
  status: "planned" | "in_progress" | "completed" | "verified";
  completedAt?: string;       // server timestamp
  proofImagePath?: string;    // optional private Storage object path
  verificationSource?: string;
  createdAt: string;          // server timestamp
  updatedAt: string;
}
```

Rules:
- Do not treat an idea post as proof that a physical device was actually upcycled.
- Do not treat a submitted pickup request as proof that e-waste was collected.
- Do not treat an AI estimate as a verified recycling outcome.
- If users self-report an action, label it “User-reported”; do not call it externally verified.
- Store quantities and units explicitly if weights are recorded.

---

## 3. Backend API

Adapt these endpoints to the project's existing `/api/v1` prefix and route conventions. Do not create duplicate endpoints if equivalents already exist.

### Summary
```http
GET /api/v1/me/impact/summary
```

Example response shape (illustrative schema only; populate values from real database queries):

```json
{
  "data": {
    "devicesAssessed": 0,
    "secondLifeItems": 0,
    "collectionRequests": {
      "total": 0,
      "submitted": 0,
      "scheduled": 0,
      "completed": 0
    },
    "verifiedEwasteKg": null,
    "publishedIdeas": 0,
    "completedAssessments": 0,
    "recentActivity": [],
    "dataQuality": {
      "verifiedEwasteKg": "not_measured"
    }
  }
}
```

`null` means no valid measurement; do not convert it to `0 kg` unless the system has enough information to know the true amount is zero.

### Recent activity
```http
GET /api/v1/me/impact/activity?limit=10&cursor=<optional>
```

Return a normalized feed shape:
```ts
interface ImpactActivityItem {
  id: string;
  type: "assessment" | "idea" | "order" | "collection" | "circular_action";
  title: string;
  createdAt: string;  // ISO-8601 UTC from server
  status: string;
  href: string;       // internal route from an allowlisted mapping, not arbitrary user input
}
```

### Optional actions
If circular actions are supported:
```http
GET    /api/v1/me/circular-actions
POST   /api/v1/me/circular-actions
PATCH  /api/v1/me/circular-actions/:id
DELETE /api/v1/me/circular-actions/:id
```

Validate allowed types/statuses, limit payload size, and verify ownership on every update/delete.

### API security
- Require a valid Supabase session for private per-user metrics.
- Verify the access token on the backend; get user ID from the verified JWT `sub`.
- Never trust an email or userId passed in the request body/query as the owner identity.
- Every database query must be scoped to the verified user ID.
- Return safe error messages; don't expose API keys, stack traces, or raw secrets.
- Add indexes such as `{ userId: 1, createdAt: -1 }` to relevant collections if needed.
- Rate-limit write endpoints where appropriate.

If the Impact page is intended to show public aggregate community statistics, build a separate aggregate endpoint with privacy-safe aggregation; don't mix it with the private current-user page.

---

## 4. Frontend implementation

### Suggested files (adapt to current codebase)

```text
client/src/
  pages/ImpactPage.tsx
  components/impact/
    ImpactMetricCard.tsx
    CircularityJourney.tsx
    EcoImpactPassport.tsx
    ImpactActivityFeed.tsx
    ImpactActionCards.tsx
    ImpactDataMethodology.tsx
    ImpactLoadingState.tsx
    ImpactEmptyState.tsx
  services/impactApi.ts
  types/impact.ts
```

Reuse existing UI components, icon library, button/link components, Supabase client, and query/cache library if present.

### Page states
- **Loading:** skeleton cards and feed rows.
- **Loaded:** show real metrics and actions.
- **Empty:** explain what the user can do first, with a CTA to assess a device.
- **Partial data:** show available metrics and “Not measured yet” for missing metrics.
- **Error:** show a friendly error plus Retry button; do not silently substitute fake demo values.
- **Signed out:** redirect to login or show a sign-in prompt according to the existing auth guard.

### Date display
Use backend-generated ISO timestamps and localize for display:

```ts
export function formatActivityDate(value: string, locale = "en-IN") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
```

Store timestamps in UTC; render in the user's local timezone. Don't invent dates for old records without timestamps.

### Example frontend API call

Adapt import paths to existing project files and avoid creating another Supabase client:

```ts
import { supabase } from "../lib/supabase"; // replace with existing client path

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getMyImpactSummary() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in to view your impact.");

  const response = await fetch(`${API_BASE_URL}/me/impact/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Could not load your impact summary.");
  return response.json();
}
```

If `VITE_API_BASE_URL` already includes `/api/v1`, keep the endpoint path consistent to avoid a duplicate prefix.

---

## 5. Impact methodology

Start with factual platform activity. Add environmental estimates only after the team selects and documents a reliable methodology.

| Metric | Safe source | When to display |
|---|---|---|
| Devices assessed | Saved assessment records | Count persisted records for the signed-in user |
| Published ideas | Saved idea records | Count published ideas owned by the user |
| Collection requests | Saved request records | Count actual requests and show status |
| Items given a second life | Completed repair/reuse/upcycle records | Count only recorded completed actions |
| E-waste collected (kg) | Recorded collection weight and confirmation | Display only when weight and completion are recorded |
| Carbon/CO₂ estimate | Documented calculation using suitable source factors | Display only with formula, source, unit, and “estimate” label |

Never add unrelated counts together into a single “impact score” unless there is a transparent, meaningful formula.

---

## 6. Implementation plan

### Phase 1 — Inspect before coding
Ask Copilot Agent to identify:
- Existing Impact route and page.
- Existing API base URL and backend route prefix.
- Current Supabase auth/session mechanism.
- MongoDB models and existing collection names.
- Existing assessment, idea, order, and collection-request endpoints.
- Which data is currently persisted and which is only held in frontend state.
- Which navigation routes are actually available.

Have it report the findings before editing. Keep the current architecture.

### Phase 2 — Backend
1. Implement or reuse the authenticated impact summary endpoint.
2. Query existing collections using verified `req.user.id`.
3. Return counts, status breakdowns, recent activity, and data-quality flags.
4. Add explicit circular-action records only if the app needs them.
5. Normalize recent activity links from a safe type-to-route mapping.
6. Add validation, indexes, safe errors, and ownership tests.

### Phase 3 — Frontend
1. Replace hard-coded values and illustrative percentages with API-driven values.
2. Build hero, metrics, journey, passport, activity feed, action cards, and methodology.
3. Connect every button to a real route or disable it honestly.
4. Add loading/empty/partial/error states and retry.
5. Make the page responsive and accessible.
6. Link metric cards to relevant filtered My Activity views where supported.

### Phase 4 — Verify real-life use
- Log in as user A and confirm the page only shows A's data.
- Log in as user B and confirm A's data is not visible.
- Complete an assessment; reload Impact and verify the count/feed update.
- Publish an idea; confirm it appears in the feed.
- Submit a collection request; confirm its real status appears.
- Change a request status in the backend; verify the new status is displayed.
- Test no-data, partial-data, and API-down cases.
- Confirm no demo percentages or invented carbon/weight claims remain.
- Test all CTAs, mobile layout, keyboard navigation, and date formatting.

---

## 7. Copilot Agent prompt

Paste into GitHub Copilot Agent after opening the existing POWERCYCLE repository:

> Inspect the existing POWERCYCLE codebase first and report the current Impact page, routes, auth mechanism, API prefix, MongoDB models, and which user activities are actually persisted. Then modify the existing Impact page to match the supplied PowerCycle visual reference while making it fully functional for real users. Reuse the existing React/Vite/TypeScript/Tailwind setup, shared navbar, Supabase auth, Express API, MongoDB models, assessment flow, ideas/blog, marketplace/order and collection-request features. Do not create duplicate clients, auth, models, or endpoints.
>
> Fetch the signed-in user's actual summary and recent activity from the backend. Verify the Supabase access token on the server and scope every query by the verified user ID (`sub`); never trust client-provided email/userId. Make metric cards, circularity journey, eco passport, activity feed, and action cards functional. Link to existing assessment, idea creation, collection request, marketplace, and My Activity routes. Every timestamp and count must come from saved records/server data. Remove illustrative percentages and fake demo activity. Show “Not measured yet” for unavailable environmental metrics. Only count repair/reuse/upcycle as completed when a real completion record exists; only show e-waste weight when it is recorded and appropriately confirmed. Add loading, empty, partial-data, retry/error, responsive, accessible states.
>
> First report the inspection findings. Then implement in small steps, run typecheck/build/tests, fix errors, and list modified files, endpoint contracts, environment/config requirements, and manual test steps. If required data isn't stored yet, implement the smallest secure persistence/API addition and clearly state that historical activity that was never saved cannot be reconstructed. Never fabricate real-life outcomes.

---

## 8. Definition of done

- [ ] Impact page uses actual API responses, not hard-coded metrics.
- [ ] User sees only their own private activity.
- [ ] Metric cards link to relevant app actions/history.
- [ ] Circularity journey links to real workflows and reflects real records.
- [ ] Activity feed shows saved activities with real timestamps and status.
- [ ] Every CTA works or is honestly marked unavailable.
- [ ] Missing metrics say “Not measured yet”; no fabricated environmental claims.
- [ ] Loading, empty, partial, error, and signed-out states work.
- [ ] API verifies identity and scopes every query by user ID.
- [ ] Production build passes and two-user isolation is tested.

## Important historical-data limitation

If old assessments, ideas, orders, or requests were never persisted in MongoDB (or another source of truth), the page cannot accurately reconstruct them from the UI. Persist each new action as it happens, and show only retrievable existing records.
