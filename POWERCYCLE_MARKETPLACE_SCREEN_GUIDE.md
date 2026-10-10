# POWERCYCLE Marketplace Screen — Implementation Guide

## 1. Screen Overview

**Screen name:** Eco-Shop / Marketplace  
**Route suggestion:** `/marketplace`  
**Project:** POWERCYCLE  
**Purpose:** Let users discover reusable and refurbished electronics, search and filter listings, inspect product details, and start listing their own assessed device.

This guide is for implementing a **functional responsive page** in the existing project, not a static screenshot. Preserve the current project structure, design system, routing, authentication, and API conventions.

## 2. Design Direction

Keep the established POWERCYCLE visual style:

- Dark navy / near-black background.
- Neon violet and purple accents, subtle gradients, and restrained glow.
- Glass-like cards with thin low-contrast borders.
- Clear typography and readable contrast.
- Consistent spacing, rounded corners, and polished hover/focus states.
- Responsive layout for desktop, tablet, and mobile.
- Reuse the existing header, navigation, buttons, cards, and shared components where possible.

Avoid redesigning other screens. Keep this task scoped to the Marketplace page and the minimum supporting code needed to make it work.

## 3. Main Page Layout

### Header
- Reuse the existing POWERCYCLE navbar.
- Include the existing logo and navigation links.
- Include search only if it fits the existing shared header design; otherwise place the marketplace search in the page content.
- Ensure the mobile menu remains usable.

### Marketplace Hero
- Heading: **Give Devices a Second Life**
- Supporting text: “Discover reusable electronics from the community.”
- Primary action: **Sell Your Device**
- Optional small trust note: “Explore devices by category, condition, and price.”

Do not claim sellers or products are verified unless the existing backend actually verifies them.

### Search and Controls
Provide:
- Search input for product name, brand, or model.
- Category filter: All, Mobiles, Laptops, Tablets, Accessories.
- Condition filter using only values supported by the current data model.
- Minimum and maximum price filters if prices exist in the model.
- Sort control: Featured/default, Price low-to-high, Price high-to-low, Newest (only implement options supported by available data).
- Clear filters action.
- A visible result count based on the actual filtered results.

Search and filters should work together, and changing a filter should update the visible products without a full page reload.

### Product Grid
Create a responsive grid:
- Desktop: 4 cards per row when space allows.
- Tablet: 2 cards per row.
- Mobile: 1 card per row (or 2 only if cards remain readable).

Each card may show, when available:
- Product/device image.
- Device name and brand/model.
- Asking price.
- Condition label.
- Category or key specifications.
- Location, if the backend provides it and it is appropriate to show.
- Wishlist/favourite control, only if supported.
- A clear **View Details** action.

Use actual API/database data when available. Do not create fake live listings or imply mock prices are real. If the backend has no listing data yet, use a clear empty state or explicitly labelled development fixtures that cannot be mistaken for real marketplace inventory.

### Empty, Loading, and Error States
Implement:
- Loading skeletons or a simple loading indicator while fetching.
- Empty state when no listings match the filters.
- API error state with a retry action.
- A helpful message if no products have been listed yet.
- Do not silently substitute invented listings when an API request fails.

### Product Details
- Reuse an existing product details route/component if one already exists.
- Otherwise, make each card link to a dedicated details route such as `/marketplace/:id`.
- Show only data actually returned by the backend.
- If the details route is outside the scope of this task, keep the View Details action routed to the existing supported destination and document the limitation instead of creating a fake action.

### Sell Your Device
- The **Sell Your Device** CTA should route to the existing device assessment/listing flow.
- Prefer reusing the current assessment route and passing data through the established mechanism, if supported.
- Do not publish a listing automatically without the user reviewing and confirming the listing details.
- If no listing creation endpoint exists yet, show a clear next step or route to the existing assessment flow; do not pretend a listing was created.

## 4. Functional Requirements

1. Fetch marketplace listings through the existing API client and configured backend base URL.
2. Inspect existing API routes, types, models, and frontend data-fetching patterns before implementing anything.
3. Reuse existing TypeScript types where possible.
4. Search by name, brand, and model.
5. Apply category, condition, and price filters using real data fields.
6. Sort using actual available fields.
7. Keep filter state in React and derive the displayed product list from the loaded results.
8. Handle loading, empty, and error states explicitly.
9. Ensure links and buttons perform real actions.
10. Never expose server secrets or call the Gemini API directly from the browser.
11. Do not invent product prices, seller details, availability, ratings, or environmental impact statistics.
12. Keep keyboard navigation, accessible labels, visible focus states, and sufficient color contrast.

## 5. Suggested Component Structure

Adapt these names to the project's existing conventions rather than duplicating components unnecessarily:

- `MarketplacePage`
- `MarketplaceSearch`
- `MarketplaceFilters`
- `MarketplaceProductGrid`
- `MarketplaceProductCard`
- `MarketplaceEmptyState`
- `MarketplaceLoadingState`

Keep components in the current client folder structure. Do not create a second routing system or duplicate the existing navbar.

## 6. Copilot Agent Prompt

Paste this prompt into GitHub Copilot Agent in VS Code:

> Implement the POWERCYCLE Eco-Shop / Marketplace screen using the existing project. First inspect the current client routes, shared layout/navbar, styling conventions, API client, listing types, backend listing routes, and database models. Then implement the page at the existing appropriate route (prefer `/marketplace` if it does not conflict with a route already present).
>
> Match the established POWERCYCLE dark navy and neon-purple visual theme. Build a polished, responsive marketplace with a hero section, search, category/condition/price filters where supported, sorting, result count, and product cards. Reuse shared components and existing dependencies.
>
> Fetch actual listing data using the existing API client and backend. Implement loading, empty, and retryable error states. Search, filters, and sorting must work together on the loaded data. Use existing TypeScript types or add accurate types based on the backend schema.
>
> The Sell Your Device CTA must navigate to the existing assessment/listing flow. Product details must use an existing details route or a real route backed by the existing API. If listing creation or details APIs do not exist, do not fake their success—document the missing endpoint and keep the action honest.
>
> Do not add fake live products, fake prices, fake ratings, fake seller verification, or fake impact statistics. If the database is empty, show a polished empty state. Do not redesign Home, Device Assessment, or Assessment Result pages. Do not change authentication, environment secrets, or unrelated backend functionality.
>
> After implementation, run the available lint, type-check, tests, and production build scripts. Fix issues caused by your changes. Report the files changed, route created, APIs used, tests run, and any missing backend endpoints.

## 7. Implementation Workflow

1. Open the POWERCYCLE project in VS Code.
2. Start GitHub Copilot Agent.
3. Paste the prompt above.
4. Let the agent inspect the repository before it edits files.
5. Review its plan and confirm it is reusing existing routes and components.
6. Review the diff before accepting changes.
7. Start the client and backend using the project's existing scripts.
8. Open the Marketplace route and test search, filters, sorting, card navigation, and responsive layout.
9. Check browser console and backend terminal for errors.
10. Run the existing build/test scripts and fix any failures caused by this page.

## 8. Acceptance Checklist

- [ ] Marketplace page uses the existing POWERCYCLE theme.
- [ ] Existing navbar/layout is reused.
- [ ] Layout works on desktop, tablet, and mobile.
- [ ] Search matches name, brand, and model.
- [ ] Filters work together and can be cleared.
- [ ] Sorting works for supported data fields.
- [ ] Result count updates correctly.
- [ ] Loading, empty, and error states are implemented.
- [ ] No invented live listings or prices appear.
- [ ] Sell Your Device navigates to the correct existing flow.
- [ ] Product detail actions work or clearly indicate what is missing.
- [ ] No secrets are exposed in frontend code.
- [ ] Build/type-check/tests pass, or remaining failures are documented.

## 9. Important Notes

- Use the generated Marketplace reference image as a **visual guide**, not as a source of real data.
- Any prices or device examples in a mockup are illustrative only; never present them as real inventory.
- Keep this implementation scoped to the Marketplace screen.
- If a backend API is missing, report that explicitly rather than silently creating fake functionality.
