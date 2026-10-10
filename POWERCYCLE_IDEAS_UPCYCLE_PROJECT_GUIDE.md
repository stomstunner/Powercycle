# POWERCYCLE Ideas — Upcycle Project Creation, Publishing, and Community Guide

## 1. Purpose

Build an **Ideas** section in POWERCYCLE where authenticated users can publish a project showing how they reused, repaired, repurposed, or upcycled an old electronic device.

Think of it as a practical project journal with a social feed: a user selects a device, explains what they are making and why, uploads a main photo of the final result, and creates a sequence of steps. Each step has its own image(s) and explanation so another person can follow the journey.

This guide describes:
- What the user sees and how they use the page.
- The end-to-end project creation and publishing path.
- Frontend routes, API endpoints, data model, image storage, and access rules.
- How readers view, like, bookmark, comment on, and share published projects.
- Validation, safety, deployment, and production-readiness requirements.

**Existing project architecture to preserve**
- Client: React + Vite + TypeScript + Tailwind CSS
- Server: Node.js + Express + TypeScript
- Database: MongoDB Atlas
- Authentication: Supabase Auth
- Existing visual style: dark navy/black with neon purple accents
- Hosting plan: Vercel for frontend, Render for backend, MongoDB Atlas for data, Supabase for authentication

Inspect the real repository before coding. Reuse existing route, auth, API, UI, and data-access patterns. Do not create a duplicate authentication system or duplicate API client.

---

## 2. Product experience in plain language

A logged-in user should be able to:

1. Open **Ideas** from the main navigation.
2. Browse projects shared by the community.
3. Click **Create an Upcycle Idea**.
4. Enter a title and short description.
5. Select the original device or material they used.
6. Choose a category/purpose such as Useful Gadget, Learning Project, Home Decor, Art & Creative, Environmental Impact, or Other.
7. Upload a main image showing the final result.
8. Add project steps one at a time. Every step has a step title, explanation, and its own image upload.
9. Reorder steps, edit them, remove them, and preview the full project.
10. Save as a draft or publish the project.
11. Open the published project page and share it with the community.
12. Edit or delete their own project later.
13. Browse other users' public projects, and use available engagement features such as like, bookmark, comment, or share.

A visitor who is not logged in should be redirected to login for protected app routes, according to the existing POWERCYCLE auth policy. If the product intentionally wants public reading of published ideas, the team can allow only the public feed/detail GET routes anonymously; creation, draft access, likes/bookmarks/comments, editing, and deletion still require authentication. Do not accidentally make all API routes public.

---

## 3. Suggested navigation and routes

Inspect the existing router first. Use existing paths if they already exist; these are suggested paths, not a mandate to duplicate routes.

### Frontend routes

| Route | Purpose | Access |
|---|---|---|
| `/ideas` | Community feed of published projects | Follow the product's public/private browsing policy |
| `/ideas/create` | Create a new project | Logged-in users only |
| `/ideas/:projectId` | Read a published project and all steps | Public only if deliberately allowed; otherwise login required |
| `/ideas/:projectId/edit` | Edit own project/draft | Authenticated owner only |
| `/my-ideas` | Current user's drafts and published projects | Authenticated owner only |

### Navigation entry points

- Main navbar: **Ideas**
- Ideas feed: **Create an Upcycle Idea** button
- User profile/menu: **My Ideas**
- Project detail page: **Edit** and **Delete** only for the owner
- After publish: link to **View Project** and **My Ideas**

Do not show edit/delete controls for someone else's project.

---

## 4. Create page UI structure

Match the generated reference: three main columns on a wide screen, collapsing to one column on smaller screens.

### Section A — Page heading

- Eyebrow: `SHARE YOUR CREATIVITY`
- Heading: `Create an Upcycle Idea`
- Supporting copy: `Show the world how you reuse old devices. Share your process, add images, and inspire others.`
- Keep the shared POWERCYCLE navbar and existing dark-purple design system.

### Section B — Basic Information

Fields:
1. **Project title** — required, clear and concise; enforce server-side maximum length.
2. **Select device** — required. Example choices: Mobile Phone, Laptop, Tablet, Desktop, Accessories, Other. Adapt to the existing product taxonomy.
3. **Short description** — required; explain what the user is making and why.
4. **Category / purpose** — required; e.g. Home Decor, Useful Gadget, Learning Project, Art & Creative, Environmental Impact, Other.
5. Optional tags — only if the product will use tags for search/discovery. Limit number and length.

UX details:
- Show required-field indicators and validation messages.
- Show character counts for fields with limits.
- Keep the selected device/category visible.
- Do not ask users to enter a different user's ID or any credentials.

### Section C — Final Result Image

- Required main image of the completed project.
- Accepted formats: JPEG, PNG, WebP, subject to server-side validation.
- Set a reasonable max file size, such as 5–8 MB, based on hosting limits.
- Preview the selected image before upload.
- Allow replace/remove before publishing.
- Display upload progress and a retry action.
- Add accessible alt text or a short caption if supported.
- Do not use a base64 image as a MongoDB document field.

The main image represents the final result and is used as the project's cover/thumbnail.

### Section D — Step-by-Step Process Builder

This is the core feature.

Every step card should contain:
- Step number (automatically generated from current order).
- Step title (required).
- What was done in this step (required explanation).
- One image for this step (required for publish; optionally allow draft steps without an image).
- Image preview.
- Replace/remove image controls.
- Move up/down or drag-to-reorder controls.
- Remove step control with confirmation if content would be lost.
- Character count for the explanation.
- Optional safety note/materials used if those fields are genuinely needed.

Example project: **Old Laptop to Smart Home Server**

| Step | Title | Explanation | Image purpose |
|---|---|---|---|
| 1 | Inspect and back up | Checked the laptop condition and backed up needed files before making changes. | Photo of the original device and preparation |
| 2 | Clean and prepare | Powered the laptop off, unplugged it, and cleaned it before upgrades. | Photo of the opened device/cleaning stage |
| 3 | Upgrade storage | Installed a compatible SSD after checking the laptop model and safe handling instructions. | Photo of the storage upgrade |
| 4 | Install software | Installed and configured a suitable operating system. | Photo of the setup screen |
| 5 | Test the result | Tested storage, network connectivity, and the intended server use. | Photo of the finished setup |

This is only an illustrative example. Do not tell users to perform unsafe electrical work. Include an appropriate reminder to disconnect power and seek qualified help for battery, mains-power, or damaged-device hazards.

### Section E — Add Another Step

- A clear **Add Another Step** button/card.
- Clicking it adds an empty step with a new temporary client-side ID.
- New steps can be edited immediately.
- Allow deletion of a step and reordering.
- Define a sensible maximum step count, for example 20, enforced on both client and server.
- Require at least one complete step to publish.
- Show which step is incomplete instead of silently blocking publication.

### Section F — Live Preview

Show a preview of how the project will appear to readers:
- Final result cover image.
- Project title and short description.
- Device category and tags.
- Creator's public display name/avatar if available.
- Ordered step list with each step's image, title, and explanation.
- Draft/publish state appropriate to the owner.
- No fake like counts, comment counts, or environmental metrics.

The preview should use current form state and not create a database record by itself.

### Section G — Actions

- **Save Draft**: persist an incomplete project as a draft, provided minimum draft validation is met.
- **Preview**: view the reader presentation before publishing.
- **Publish Project**: validate the complete project and make it visible according to the product's feed visibility policy.
- **Cancel**: return to Ideas or My Ideas; warn before discarding unsaved changes.
- Disable action buttons during network requests and prevent duplicate submissions.

If draft support is not implemented yet, do not show a non-functional Save Draft button. Either implement it properly or omit it for the first release.

---

## 5. Reader journey: how someone uses a published idea

### Ideas feed (`/ideas`)
Readers see:
- Project cover image.
- Title.
- Short description.
- Device type and category.
- Creator display name.
- Published date.
- Engagement controls if implemented.
- Search/filter controls based on actual supported fields.

Readers can search by title/description, filter by device/category, and sort by newest or a supported popularity metric. Pagination or cursor-based loading should be used as the feed grows.

### Project detail (`/ideas/:projectId`)
The detail page should display:
1. Cover image and project summary.
2. Creator name and published date.
3. Device/category/tags.
4. Ordered step-by-step instructions.
5. Each step's image and explanation together.
6. Safety notes when relevant.
7. Like/bookmark/comment/share actions if implemented.
8. Owner actions (edit/delete) only for the owner.

Keep each step image directly beside or above its corresponding explanation. Do not place all images in one unrelated gallery where readers cannot tell which text belongs to which step.

### Engagement features
Implement only features with real backend persistence:
- Like/unlike: one like per user per project.
- Bookmark/unbookmark: private to the current user.
- Comment: authenticated, validated, length-limited; provide moderation/reporting strategy before public launch.
- Share: use the canonical project URL with a safe copy/share action.
- Counts should be derived from actual records or maintained safely; do not hardcode counts.

These features can be phased after the creation, storage, publishing, and reading flow is working.

---

## 6. End-to-end creation and publishing flow

### Step 1 — Start a draft in the UI
- User clicks **Create an Upcycle Idea**.
- Frontend checks that a session exists; otherwise redirects to login.
- Create temporary form state with a unique client-side ID for each step.
- Do not create permanent records for every keystroke.

### Step 2 — Enter project details
- Validate required text fields in the client for fast feedback.
- Trim values and enforce reasonable character limits.
- User selects device/category and enters the description.
- The server must validate everything again when receiving data.

### Step 3 — Upload the cover image
Recommended production flow:
1. Frontend requests an authorized upload target from the backend.
2. Backend authenticates the user and issues a short-lived, scoped upload permission or a signed upload URL from the chosen storage provider.
3. Browser uploads the image directly to object storage.
4. Frontend receives the resulting object key/URL.
5. Backend verifies that the stored object belongs to the current user and is an allowed image.
6. Save only the storage key and safe metadata in the MongoDB project document.

For the current stack, choose one object storage provider and implement it consistently:
- Supabase Storage is a natural option because the project already uses Supabase, provided bucket policies and upload authorization are configured correctly.
- Another supported object-storage provider is also possible if already adopted by the repository.

Do not store binary images or large base64 strings inside MongoDB documents. Do not make all uploaded content publicly writable. Decide deliberately whether published project images are public-readable and drafts are private.

### Step 4 — Add step cards
For each step:
- User clicks **Add Another Step**.
- A new step appears with title, explanation, and an image uploader.
- The user uploads that step's image.
- The UI displays the image beside its matching step description.
- The user can replace an image, remove a step, or reorder steps.
- The frontend stores only temporary form data and object references, not image binaries in the final JSON request.
- On save, send the ordered array of step objects.

Suggested step payload:
```json
{
  "clientStepId": "temporary-ui-id",
  "title": "Install storage",
  "description": "Installed a compatible SSD after checking the device model.",
  "image": {
    "storageKey": "user-scoped/object-key",
    "altText": "SSD installed in the laptop"
  },
  "position": 2
}
```
`clientStepId` is only a UI correlation ID. The backend should assign or normalize permanent identifiers/order as needed and must not trust a client-supplied owner ID or storage path.

### Step 5 — Preview
- Build a preview from current form state.
- Validate that each step's image remains paired with its description.
- Allow editing without publishing.
- Do not increment published view/like counts just because the author previews the form.

### Step 6 — Save draft or publish
For Save Draft:
- Validate only fields required by the draft policy.
- Persist the draft privately.
- Only its owner and authorized moderators can read it.

For Publish:
- Validate title, device/category, description, cover image, and required step fields/images.
- Confirm all image storage keys belong to the current user and are valid.
- Persist the project with `status: "published"` and a server-generated `publishedAt`.
- Return a minimal response containing project ID, status, and timestamps.
- If saving fails, keep the form state so the user can retry.
- Prevent double submission using client-side pending state and an idempotency strategy where appropriate.

### Step 7 — View the published project
- Navigate to `/ideas/:projectId`.
- Fetch the project from the backend.
- Render steps in stored order.
- Publicly readable projects can be shared by canonical URL if public viewing is enabled.
- Private drafts must never be returned to a non-owner.

### Step 8 — Edit/delete later
- Owner opens My Ideas.
- Edit page loads the saved draft/published project.
- Server verifies ownership on every mutation.
- If a user removes/replaces an image, remove the old object only after the new project save succeeds and the object is no longer referenced anywhere.
- Deletion should clean up related image objects safely and handle failures/retries. Consider soft-delete/moderation retention requirements before permanent deletion.

---

## 7. Data model and where data should be stored

Use MongoDB Atlas for project metadata and Supabase Storage (or the repository's chosen object storage) for image files. Supabase Auth stores/manages identity; do not create a separate password collection.

Suggested MongoDB `ideas` collection document:

```ts
type IdeaStatus = "draft" | "published" | "archived" | "removed";

interface IdeaProject {
  _id: ObjectId;
  ownerId: string; // verified Supabase Auth user ID

  title: string;
  shortDescription: string;
  deviceCategory: "mobile" | "laptop" | "tablet" | "desktop" | "accessory" | "other";
  purposeCategory: "home_decor" | "useful_gadget" | "learning" | "art_creative" | "environmental_impact" | "other";
  tags: string[];

  coverImage: {
    storageKey: string;
    altText?: string;
    width?: number;
    height?: number;
    contentType: string;
    sizeBytes: number;
  };

  steps: Array<{
    stepId: string;
    position: number;
    title: string;
    description: string;
    image: {
      storageKey: string;
      altText?: string;
      width?: number;
      height?: number;
      contentType: string;
      sizeBytes: number;
    };
    safetyNote?: string;
  }>;

  status: IdeaStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

### Field-to-storage map

| Data | Store it in | Reason |
|---|---|---|
| Account identity | Supabase Auth | Secure login/session management |
| Project owner ID | MongoDB `ownerId` | Ownership and authorization |
| Title/description/device/category/tags | MongoDB `ideas` document | Search, feed, filtering and display |
| Cover image bytes | Object storage | Durable, scalable image file storage |
| Cover image object key/metadata | MongoDB `coverImage` | Connects project to stored image |
| Step titles/descriptions/order | MongoDB `steps[]` | Preserves the project process |
| Step image bytes | Object storage | Each step image stored independently |
| Step image object key/metadata | MongoDB `steps[].image` | Keeps image paired with its step |
| Draft/published status | MongoDB `status` | Access control and feed visibility |
| Publish/create/update timestamps | MongoDB dates | Sorting, moderation, auditing |
| Likes | Separate `ideaLikes` collection or existing supported relationship model | Enforce one like per user/project |
| Bookmarks | Separate private `ideaBookmarks` collection | Per-user saved projects |
| Comments | Separate `ideaComments` collection | Moderation, pagination, editing/deletion rules |
| Reports/moderation actions | Separate moderation collection if implemented | Abuse handling and auditability |

### Example engagement documents
Like:
```ts
interface IdeaLike {
  _id: ObjectId;
  ideaId: ObjectId;
  userId: string;
  createdAt: Date;
}
```
Create a unique compound index on `{ ideaId: 1, userId: 1 }` so a user cannot like the same idea multiple times.

Bookmark:
```ts
interface IdeaBookmark {
  _id: ObjectId;
  ideaId: ObjectId;
  userId: string;
  createdAt: Date;
}
```
Create a unique compound index on `{ ideaId: 1, userId: 1 }`.

Comment:
```ts
interface IdeaComment {
  _id: ObjectId;
  ideaId: ObjectId;
  userId: string;
  body: string;
  status: "visible" | "hidden" | "removed";
  createdAt: Date;
  updatedAt: Date;
}
```
Do not implement comments as an unbounded array embedded inside every project document.

### Do not store
- Passwords, auth tokens, session tokens, or Supabase service-role secrets.
- Image binaries/base64 inside MongoDB documents.
- Private draft content in public feed responses.
- Fake engagement counts, fake creator identities, or fake sustainability metrics.
- Unnecessary personal information about creators.
- Uploaded file paths supplied by the browser without validating ownership and storage permissions.

---

## 8. Suggested API design

Use the project's existing API prefix and conventions. These are suggested resources; inspect existing routes first.

### Project endpoints
- `POST /api/v1/ideas` — create a draft or publish a fully validated project.
- `GET /api/v1/ideas` — paginated feed of published projects (may be public only if explicitly intended).
- `GET /api/v1/ideas/:id` — get one published project, or draft only for owner/authorized moderator.
- `GET /api/v1/ideas/me` — current user's drafts and published projects.
- `PATCH /api/v1/ideas/:id` — update own project after ownership check.
- `DELETE /api/v1/ideas/:id` — delete/archive own project after ownership check.
- `POST /api/v1/ideas/:id/publish` — publish a valid draft after full server validation.
- `POST /api/v1/ideas/:id/like` and `DELETE /api/v1/ideas/:id/like` — like/unlike.
- `POST /api/v1/ideas/:id/bookmark` and `DELETE /api/v1/ideas/:id/bookmark` — bookmark/unbookmark.
- `GET /api/v1/ideas/:id/comments` — paginated comments.
- `POST /api/v1/ideas/:id/comments` — add a comment.
- `DELETE /api/v1/ideas/:id/comments/:commentId` — delete own comment or authorized moderation action.
- `POST /api/v1/uploads/idea-image` or a signed-upload preparation endpoint — create an authorized upload target.

### Authentication
- Verify the Supabase access token server-side for every mutation and private read.
- Derive `ownerId`/`userId` from the verified token, never from the request body.
- Return `401` for missing/invalid credentials.
- Return `403` where the user is authenticated but lacks permission, or use `404` for inaccessible resources to avoid revealing private records.
- Public GET endpoints must expose only published, non-removed records and safe fields.
- Keep upload credentials and storage service secrets on the server.

### Validation
- Enforce maximum title, description, tags, step count, per-step text, file size, image dimensions, and total project image count.
- Validate every category against allowlists.
- Validate MongoDB IDs before querying.
- Reject arbitrary external image URLs unless explicitly supported and safely validated.
- Never accept `ownerId`, `publishedAt`, moderation state, or engagement counts from the client as authoritative.
- Use the existing validation library if available; do not add redundant libraries.

---

## 9. Image upload and storage design

Images are a key part of the feature, so build this path deliberately.

### Recommended path
1. User selects a file for the cover or a step.
2. Frontend validates basic type/size and displays a preview.
3. Frontend asks the backend for an authorized upload target.
4. Backend verifies authentication and creates a user-scoped upload target or short-lived signed upload URL.
5. Browser uploads the file to the configured object-storage bucket.
6. Backend verifies that the uploaded object is owned by the current user and uses an allowed content type.
7. Frontend stores the resulting object key in temporary form state.
8. On save/publish, backend validates all keys and persists references in MongoDB.
9. Published project detail resolves the approved image URL or signed URL according to the bucket policy.

### Storage rules
- Separate draft/private image access from published/public image access where feasible.
- Never make a bucket publicly writable.
- Use unguessable object names and user-scoped paths, but do not rely on path obscurity alone for authorization.
- Check actual file content/magic bytes on the server or storage processing path; do not trust the extension alone.
- Set max file size and total image count.
- Consider generating optimized thumbnails and WebP variants in a later phase.
- Strip unnecessary EXIF metadata where practical, especially GPS coordinates.
- Clean up orphaned uploads if a draft is abandoned or an upload/project save fails.
- Use signed URLs for private draft images; use public read URLs only for intentionally public published assets.
- Do not send every project image to Gemini automatically. AI analysis is not needed to publish an idea unless the product explicitly adds that feature.

### Suggested limits for a first release
Choose limits that fit the current hosting/storage plan, for example:
- Cover image: one required for publishing.
- Step image: one required per published step.
- Maximum 20 steps per project.
- A reasonable per-image size limit such as 5–8 MB.
- Limit the total images per project and validate total upload size.
- JPEG/PNG/WebP only, unless other formats are intentionally supported.

Tune limits after testing actual hosting and storage constraints.

---

## 10. Security, safety, and moderation

- All project creation/edit/delete/upload mutations require authentication.
- Verify owner permissions on every mutation and private read.
- Do not rely only on hiding edit/delete buttons in React.
- Configure object-storage access policies so one user cannot overwrite or delete another user's files.
- Sanitize rendered text and avoid injecting user-generated HTML.
- Add rate limiting to create, upload-signing, like, comment, and report endpoints.
- Use upload quotas and request size limits to prevent abuse.
- Add reporting/moderation before allowing public comments and unrestricted uploads at scale.
- Provide a project report mechanism and clear community guidelines for public launch.
- Avoid dangerous repair instructions. Add safety notes for batteries, capacitors, mains-powered equipment, and damaged electronics; advise users to stop and seek qualified help where appropriate.
- Do not encourage puncturing, bending, heating, or opening swollen lithium batteries.
- Never publish a user's private draft or upload just because its URL is known.
- Do not log auth tokens, signed URLs, or private draft content.
- Set appropriate retention and deletion policies for user content and associated images.

---

## 11. Search, feed, and performance

For the initial release:
- Use server-side pagination or cursor-based pagination.
- Return only fields needed for feed cards.
- Load the full ordered step list only on project detail or preview.
- Add indexes based on actual queries, such as:
  - `{ status: 1, publishedAt: -1 }` for newest published feed.
  - `{ ownerId: 1, updatedAt: -1 }` for My Ideas.
  - `{ deviceCategory: 1, status: 1, publishedAt: -1 }` if filtering is common.
  - Unique `{ ideaId: 1, userId: 1 }` indexes for likes/bookmarks.
- Avoid loading every project and every image into the browser at once.
- Lazy-load off-screen images and serve appropriately sized thumbnails.
- Use optimistic UI for likes only if failures can be rolled back safely.

---

## 12. Production deployment notes

### Vercel frontend
- Set the production `VITE_API_BASE_URL`.
- Set the existing Supabase project URL and client publishable/anon key.
- Remember that Vite `VITE_*` variables are public in the built browser bundle.
- Never place MongoDB credentials, Gemini keys, or Supabase service-role keys in client variables.

### Render backend
- Configure `NODE_ENV=production`, the platform port, `CLIENT_ORIGIN`, MongoDB URI/database name, Supabase URL, token-verification configuration, and storage credentials as server environment variables.
- Use the exact names expected by the code.
- Restrict CORS to the deployed frontend origin.
- Use HTTPS and production-safe error responses.
- Add health checks that reveal service status but never secrets.

### MongoDB Atlas
- Use a least-privilege database user and appropriate network access.
- Create the needed indexes.
- Keep connection strings out of Git.
- Test backups and recovery expectations before production launch.

### Supabase Auth and Storage
- Configure production login/redirect URLs.
- Set bucket policies for authenticated uploads and intended published-image reads.
- Keep service-role credentials server-only.
- Test access with two separate accounts to verify storage isolation.

---

## 13. Copilot Agent prompt

Paste this prompt into GitHub Copilot Agent in VS Code:

> Build the POWERCYCLE Ideas / Upcycle Project feature based on the provided UI reference and this specification. First inspect the current repository: React/Vite/TypeScript/Tailwind structure, routing, navbar, Supabase auth, API client, Express routes/middleware, MongoDB data-access style, available storage integrations, validation packages, and tests. Reuse the existing architecture and design system. Do not rewrite unrelated screens.
>
> Create an authenticated project builder with a title, original device category, short description, purpose category, tags if supported, a required cover/final-result image, and a dynamic ordered step builder. Every step must have its own title, description, image upload, preview, replace/remove controls, and reorder controls. Keep each step image paired with its corresponding explanation. Support adding/removing steps, a live preview, draft saving if implemented, and publishing only after complete validation. Build responsive UI matching the dark navy/neon-purple PowerCycle reference.
>
> Implement the complete user flow: Ideas feed, create page, project detail page, and My Ideas/edit page where appropriate to existing routing. Users must be able to browse published projects and view each step in order. Only owners can view private drafts, edit, or delete their projects. Keep public reading optional and limited to published content according to the existing product policy. Do not show fake likes, comments, views, or environmental metrics.
>
> Store project metadata in MongoDB Atlas and image files in an object-storage solution already used by the project; if none exists, evaluate Supabase Storage because Supabase Auth is already integrated. Do not store image binaries or base64 in MongoDB. Add an authenticated upload-target flow with user-scoped permissions and safe file validation. Store only validated object keys and image metadata in MongoDB. Ensure draft images remain private and published images are readable only according to the deliberate visibility policy.
>
> Add protected APIs for create, list published, get detail, list current user's projects, update, publish, and delete/archive. Add like/bookmark/comment APIs only if they can be implemented fully with persistent storage and authorization; otherwise leave them out and document them as a later phase. Verify Supabase access tokens server-side, derive ownerId from verified auth, and enforce ownership on every private read and mutation. Validate field lengths, allowed categories, step count/order, image ownership/type/size, and publish requirements on the server. Do not trust ownerId, status, timestamps, or counts from the client.
>
> Handle upload progress, retry, validation, loading, empty/error/success states, unsaved-change warnings, duplicate submission prevention, and orphaned upload cleanup. Add appropriate MongoDB indexes and pagination. Sanitize user-generated text. Include safe handling notes for dangerous e-waste/battery work and do not encourage unsafe repair steps.
>
> Do not expose server secrets in the frontend or logs. Do not store passwords/tokens or image binaries in MongoDB. Do not automatically send user images to Gemini. Run the existing lint, type-check, tests, and production build; add tests for unauthenticated requests, ownership isolation, image validation, draft privacy, publishing validation, and step order where the test setup allows. Report files changed, routes, schema, storage bucket/policies, endpoints, tests run, deployment environment variables, and any feature that remains unimplemented. Do not claim deployment is complete unless it actually is.

---

## 14. Manual acceptance checklist

### Creation
- [ ] Login is required to create a project.
- [ ] Required title/device/description/category validation works.
- [ ] User can upload and preview a cover image.
- [ ] User can add multiple steps.
- [ ] Each step has its own image and corresponding text.
- [ ] User can edit, remove, and reorder steps.
- [ ] Removing/reordering a step does not mismatch its image and description.
- [ ] File type, size, and upload errors are clear.
- [ ] Preview reflects current unsaved form state.
- [ ] Publishing is blocked when required content is missing.
- [ ] Save/publish failure does not erase entered content.

### Storage and access
- [ ] Project metadata is persisted in MongoDB.
- [ ] Images are stored in object storage, not base64 in MongoDB.
- [ ] Drafts are private.
- [ ] User A cannot edit/delete User B's project.
- [ ] User A cannot overwrite/delete User B's uploaded images.
- [ ] Published detail displays images in the correct step order.
- [ ] Orphaned uploads have a cleanup strategy.
- [ ] No tokens, passwords, or storage secrets are exposed.

### Reading and community
- [ ] Feed shows only published projects.
- [ ] Feed pagination and filters work for actual data.
- [ ] Detail page pairs each image with the correct explanation.
- [ ] Owner-only edit/delete controls work correctly.
- [ ] Like/bookmark/comment controls are either fully functional or omitted.
- [ ] Public project links work according to the selected visibility policy.

### Deployment
- [ ] Production environment variables are configured securely.
- [ ] Frontend calls the deployed backend.
- [ ] CORS and HTTPS are configured.
- [ ] Storage policies work in production.
- [ ] MongoDB indexes exist.
- [ ] Build, type-check, and tests pass or failures are documented.
- [ ] Staging test covers at least two users and a complete publish flow.

---

## 15. Recommended build order

Implement in small verified phases rather than asking the coding agent to build everything in one giant edit.

### Phase 1 — Core creation flow
- UI layout and form state.
- Dynamic step cards.
- Cover and step image previews.
- Validation and live preview.
- Save/publish UI states.

### Phase 2 — Persistence and image storage
- Object-storage bucket and policies.
- Authenticated upload-target endpoint.
- MongoDB `ideas` model and indexes.
- Draft create/update and publish endpoint.
- Owner-only access tests.

### Phase 3 — Read experience
- Ideas feed.
- Project detail page with ordered steps.
- My Ideas page and edit/delete.
- Pagination and safe image delivery.

### Phase 4 — Community features
- Likes and bookmarks.
- Comments, reporting, moderation.
- Search improvements and notifications if required.

### Phase 5 — Deployment and hardening
- Production environment variables.
- CORS, HTTPS, rate limiting, file limits.
- End-to-end staging tests.
- Backup/retention policy and operational monitoring.

**Release rule:** Ship the core create → upload → save/publish → read flow first. Do not ship placeholder engagement buttons or claim that a draft is public. Add community features only after their backend behavior and permissions are complete.
