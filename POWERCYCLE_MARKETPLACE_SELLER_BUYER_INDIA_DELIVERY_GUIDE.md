# POWERCYCLE Marketplace + Circular Products + India Delivery
## Detailed production implementation guide

**Goal:** Let users sell self-made upcycled products and reusable items through the marketplace, buy products from other users, choose delivery or pickup addresses, track orders, and see seller/buyer activity in My Activity. The collection workflow must remain distinct from a purchase/shipping workflow.

**Stack assumed from the existing POWERCYCLE project:** React + Vite + TypeScript + Tailwind CSS, Node.js + Express + TypeScript, MongoDB, Supabase Auth and Supabase Storage. Inspect the repository and reuse its current architecture before changing anything.

---

## 1. Product vision and core flows

PowerCycle becomes a circular marketplace where users can:
- Turn a completed upcycling idea/project into a real marketplace listing.
- List a reusable or refurbished product, upload photos, enter details, set their own price, choose item condition, and set a pickup/dispatch location.
- Browse and buy another user's listing.
- Select a saved address or enter a delivery address at checkout.
- Choose delivery/shipping or local pickup, depending on supported options.
- See order, seller, buyer, address and status information according to role and privacy rules.
- Track their own listings, orders, sales, and collection requests in My Activity.

### Important distinction: three different actions

1. **Sell a product:** Seller creates a marketplace listing; buyer orders it. This is a commerce transaction.
2. **Arrange delivery/pickup:** An order fulfilment choice. Pickup from seller is not the same as an e-waste collection request.
3. **Request e-waste collection:** User requests a collection for an item they want to hand over for reuse/recycling. It may have a pickup address and status, but is not a purchase unless the app explicitly supports a paid collection/recycling service.

Do not mix these three workflows into one form or one status field.

---

## 2. User stories

### Seller
- As a seller, I can create a listing with title, description, category, photos, condition, price, quantity, city/state/PIN code, and fulfilment options.
- I can publish, edit, pause, mark sold, or delete/cancel my listing according to its order state.
- I can turn my own saved/published upcycling idea into a listing by pre-filling the product details and linking the source idea.
- I can see orders placed for my listings, buyer name/contact information that is needed to fulfil the order, the delivery address for that order, and status.
- I can contact the buyer only for legitimate fulfilment purposes and only when an order is placed.
- I can see sold products and revenue/fees/refunds based on actual order records, not guesses.

### Buyer
- I can browse listings, filter by product category, price, condition, availability, location, delivery/pickup options, and shipping serviceability.
- I can open a listing to see the product photos/details, seller display name, seller's public profile or marketplace contact option, approximate location, fulfilment choices, and return/refund rules.
- I can choose quantity, delivery address, shipping/pickup option, and see the total price before placing an order.
- I can see seller contact details required for fulfilment after a confirmed order, subject to the privacy policy.
- I can see order confirmation, order status, seller information, delivery/pickup information, and any tracking/reference number that really exists.

### Collection requester
- I can select the item(s) to be collected, describe condition/quantity, upload photos, choose a pickup address, select a preferred time window, and submit a request.
- I can track submitted, confirmed, scheduled, collected, cancelled, or rejected status.
- I see collection details only for my request.
- Collection partners/staff can see the address and contact information required to perform the collection, subject to role permissions.

---

## 3. Main screens

### A. Marketplace listing details
Display:
- Product title, description, multiple photos.
- Seller-created product story and linked upcycling idea/project, if any.
- Category and condition (new upcycled, refurbished, used/reusable; use the project's chosen vocabulary).
- Price, currency, quantity/stock, availability.
- Seller public display name, seller profile, rating/review only if a real review system exists.
- Pickup/delivery options.
- Location shown publicly at an appropriate granularity (e.g. city + state); do not reveal a seller's full home address publicly.
- Estimated delivery range only when supported by a real shipping-rate/serviceability provider; otherwise say “Delivery availability confirmed at checkout”.
- “Buy now” / “Add to cart” / “Contact seller” buttons that actually work. Do not show buttons for workflows that are not implemented.

### B. Create/edit listing
Form fields:
- Product title (required)
- Description (required)
- Category (required)
- Product condition (required)
- Photos (required; validate file type/size; private or controlled Storage policy)
- Price in INR (required, >= 0; use 2 decimal places only if the product rules need it)
- Quantity/stock (required positive integer)
- Pickup/dispatch PIN code (required if shipping/pickup is offered)
- State, district/city, locality (validate against a trusted India PIN code/place dataset or address provider)
- Pickup available (boolean)
- Delivery/shipping requested (boolean, only if fulfilment integration/operations support it)
- Shipping weight and dimensions if the shipping provider requires them
- Return/cancellation policy selection from platform-approved options
- Optional: materials used, time spent, upcycling instructions, care instructions, source idea/project ID
- Optional “Offer to sell the product created from my idea” action on the idea details page; prefill title, description and cover image but require the user to review before publishing.

Do not trust the browser's price, stock, seller ID, delivery charge, or order total. Validate and calculate sensitive values on the server.

### C. Checkout
- Cart/listing summary, seller identity, quantity, stock availability.
- Buyer selects a saved address or enters a new one.
- Address fields: recipient name, phone, address line(s), locality, city/district, state, six-digit PIN code, optional delivery instructions.
- Fulfilment choice: shipping/delivery or local pickup if seller supports it.
- Show item subtotal, shipping charge, applicable taxes/fees if implemented, discounts if implemented, and final total.
- Confirm stock and price on the server at order creation.
- Use an idempotency key or equivalent to avoid duplicate orders on repeated clicks/retries.
- Show a review step before final order placement.
- Do not claim an order is paid unless a payment provider has confirmed it.

### D. My Activity — seller and buyer views
Add role-aware sections:
- **My Listings:** products the current user listed; status, price, available stock, created date, views only if tracked, and edit/pause/sold actions.
- **Orders I Bought:** products purchased by the current user; order date, seller, item snapshot, quantity, total, fulfilment, shipping/pickup status.
- **Orders to Fulfil / My Sales:** orders for the current user's listings; buyer details and delivery/pickup address only for those orders.
- **My Ideas:** existing user ideas; “Create listing from this idea” where appropriate.
- **Collection Requests:** separate e-waste collection requests and their pickup status.
- **Notifications:** new order, order status changes, cancellation/refund status, pickup scheduling—only if notification infrastructure exists.

Every record links to a real detail page. Each delete/cancel action must follow order state and permissions.

---

## 4. India locations, PIN codes and delivery estimates

### Do not hard-code the entire country into the frontend

India has a large and changing set of postal PIN codes, localities, post offices, and serviceability rules. A hand-written list will become incomplete and inaccurate. Use a maintained source/provider and cache validated results server-side.

### Recommended address approach
- Store user-entered structured address fields, but validate the six-digit PIN code.
- Use a trusted India PIN/post office dataset or an address lookup provider that can return post office/locality, district, and state. Verify provider licensing, uptime, freshness, API limits, and whether commercial use is permitted.
- If a provider is unavailable, allow manual address entry with format validation and label it unverified; do not invent a city/district from a PIN.
- Keep PIN code as a string, not a number, so leading zeros are not lost.
- Normalize state/district names from provider output but preserve the user-confirmed address.
- Address lookup helps validate a destination; it does **not** establish that a courier can ship there.

### Delivery availability
A delivery estimate requires more than a list of Indian places:
- Seller dispatch PIN code.
- Buyer destination PIN code.
- Parcel weight and dimensions.
- Product category and carrier restrictions.
- Courier partner/serviceability response.
- Pickup/dispatch operating rules and actual business days.

If the project has no courier integration, show:
- “Local pickup available” if seller enabled it.
- “Delivery must be confirmed by the seller” if the platform supports manual arrangements.
- Or disable shipping and clearly explain why.
Do not show fake “delivery in 2 days” or shipping charges without a real rate/serviceability source.

### Suggested shipping integration
Select a courier/shipping aggregator only after comparing current provider coverage, API access, pricing, reverse pickup support, COD/prepaid options, tracking and terms. Keep provider calls server-side. Store provider shipment/tracking IDs and use webhook verification for status changes. Provider examples to evaluate—not endorsements or guarantees—include Shiprocket, Delhivery, and India Post/Speed Post where a suitable API/contract is available. Confirm current availability, costs, and commercial terms before choosing.

---

## 5. Data model and ownership

Reuse current MongoDB collections if present. Use server-generated timestamps and verified Supabase user ID (`sub`) as the ownership key; never use email alone.

### MarketplaceListing

```ts
interface MarketplaceListing {
  _id: string;
  sellerUserId: string;
  sourceIdeaId?: string;
  title: string;
  description: string;
  category: string;
  condition: "upcycled" | "refurbished" | "used_reusable";
  imagePaths: string[];           // Storage object paths; don't trust arbitrary URLs
  pricePaise: number;             // INR stored as integer paise to avoid floating-point money errors
  currency: "INR";
  stockQuantity: number;
  status: "draft" | "active" | "paused" | "sold_out" | "removed";
  pickupAvailable: boolean;
  shippingAvailable: boolean;
  dispatchAddressId?: string;     // private reference, not public
  dispatchPinCode?: string;       // private/limited access; never return full address publicly
  publicCity?: string;
  publicState?: string;
  weightGrams?: number;
  dimensionsCm?: { length: number; width: number; height: number };
  createdAt: Date;
  updatedAt: Date;
}
```

### Address

```ts
interface UserAddress {
  _id: string;
  userId: string;
  label?: string;                 // Home, Hostel, Work
  recipientName: string;
  phoneEncryptedOrProtected: string; // use suitable protection and access controls
  line1: string;
  line2?: string;
  locality: string;
  city: string;
  district?: string;
  state: string;
  pinCode: string;                // six-digit string
  landmark?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Treat addresses and phone numbers as sensitive personal data. Restrict access, avoid unnecessary logs, and define retention/deletion rules.

### Order

```ts
interface MarketplaceOrder {
  _id: string;
  orderNumber: string;
  buyerUserId: string;
  sellerUserId: string;
  items: Array<{
    listingId: string;
    titleSnapshot: string;
    imagePathSnapshot?: string;
    quantity: number;
    unitPricePaise: number;
  }>;
  subtotalPaise: number;
  shippingPaise: number | null;    // null until a real quote is available; do not silently treat as zero
  totalPaise: number | null;       // null until all required components are known
  currency: "INR";
  paymentStatus: "not_required" | "pending" | "paid" | "failed" | "refunded";
  orderStatus: "pending_confirmation" | "confirmed" | "processing" | "ready_for_pickup" | "shipped" | "delivered" | "cancelled" | "disputed";
  fulfilmentMethod: "local_pickup" | "shipping" | "manual_delivery";
  shippingAddressSnapshot?: {
    recipientName: string;
    phone: string;
    line1: string;
    line2?: string;
    locality: string;
    city: string;
    district?: string;
    state: string;
    pinCode: string;
  };
  pickupInstructions?: string;
  shipmentProvider?: string;
  shipmentReference?: string;
  trackingUrl?: string;            // only trusted provider URL
  createdAt: Date;
  updatedAt: Date;
}
```

Order address snapshots preserve the destination at the time of purchase if the buyer later edits their saved address. Restrict who can view them.

### CollectionRequest (separate workflow)

```ts
interface CollectionRequest {
  _id: string;
  requesterUserId: string;
  itemDescription: string;
  category: string;
  condition: string;
  quantity: number;
  photoPaths: string[];
  pickupAddressSnapshot: {
    recipientName: string;
    phone: string;
    line1: string;
    line2?: string;
    locality: string;
    city: string;
    district?: string;
    state: string;
    pinCode: string;
  };
  preferredPickupWindow?: { start: Date; end: Date };
  status: "submitted" | "confirmed" | "scheduled" | "collected" | "cancelled" | "rejected";
  collectionPartnerId?: string;
  weightKg?: number;               // record only when measured
  weightVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Indexes
Examples to adapt to current query patterns:
- Listings: `{ status: 1, category: 1, createdAt: -1 }`
- Seller listings: `{ sellerUserId: 1, createdAt: -1 }`
- Buyer orders: `{ buyerUserId: 1, createdAt: -1 }`
- Seller orders: `{ sellerUserId: 1, createdAt: -1 }`
- Requests: `{ requesterUserId: 1, createdAt: -1 }`
- Unique order number and idempotency key where supported.

---

## 6. API endpoints

Adapt to the current API prefix; avoid duplicate routes.

### Listings
```http
GET    /api/v1/marketplace/listings
GET    /api/v1/marketplace/listings/:listingId
POST   /api/v1/marketplace/listings
PATCH  /api/v1/marketplace/listings/:listingId
POST   /api/v1/marketplace/listings/:listingId/pause
POST   /api/v1/marketplace/listings/:listingId/resume
POST   /api/v1/marketplace/listings/:listingId/mark-sold
DELETE /api/v1/marketplace/listings/:listingId
```

- Public list/detail responses must never include seller home address or private phone number.
- Only the owner can edit/pause/delete their listing.
- Do not delete a listing if an active order requires it; mark unavailable/archived instead.

### Addresses
```http
GET    /api/v1/me/addresses
POST   /api/v1/me/addresses
PATCH  /api/v1/me/addresses/:addressId
DELETE /api/v1/me/addresses/:addressId
POST   /api/v1/locations/lookup-pin
```

PIN lookup must use a trusted provider/dataset and return a clearly defined not-found/provider-unavailable result.

### Orders
```http
POST   /api/v1/marketplace/orders
GET    /api/v1/me/orders/buying
GET    /api/v1/me/orders/selling
GET    /api/v1/marketplace/orders/:orderId
POST   /api/v1/marketplace/orders/:orderId/confirm
POST   /api/v1/marketplace/orders/:orderId/cancel
POST   /api/v1/marketplace/orders/:orderId/mark-ready
POST   /api/v1/marketplace/orders/:orderId/mark-dispatched
POST   /api/v1/marketplace/orders/:orderId/mark-delivered
```

The order detail endpoint must authorize the buyer or seller; do not allow any signed-in user to fetch arbitrary orders.

### Collection requests
```http
POST   /api/v1/collection-requests
GET    /api/v1/me/collection-requests
GET    /api/v1/collection-requests/:requestId
POST   /api/v1/collection-requests/:requestId/cancel
```

Restrict request detail to the requester and authorized collection staff/partner.

### India location and shipping serviceability
```http
POST /api/v1/locations/lookup-pin
POST /api/v1/shipping/quote
GET  /api/v1/shipping/serviceability?originPin=...&destinationPin=...
```

- Validate input and protect provider credentials on the server.
- Return “unavailable/needs manual confirmation” when no provider result is available.
- A PIN lookup result is not proof of courier serviceability.
- Add timeouts, error handling, caching where permitted, and rate limiting.

---

## 7. Order placement workflow

1. Buyer signs in and opens an active listing.
2. Backend returns public product information and safe seller display information.
3. Buyer chooses quantity, address, and fulfilment method.
4. Backend re-reads the listing from MongoDB, checks status and stock, and calculates the item subtotal.
5. If shipping is selected, backend requests a real quote or follows a clearly disclosed manual-delivery flow. Do not accept shipping charges from the browser.
6. Backend creates a pending order using an idempotency mechanism and an immutable item/address snapshot.
7. Stock is reserved/decremented atomically to prevent two buyers purchasing the last item.
8. Seller sees a new order in “Orders to Fulfil / My Sales”; buyer sees it in “Orders I Bought”.
9. Reveal the minimum necessary buyer/seller contact and address details to the opposite party only after the order is accepted/confirmed, or at the exact stage required for fulfilment.
10. Seller confirms, prepares, and either marks ready for pickup or creates a shipment through the integrated provider.
11. Status updates come from authorized actions or verified provider webhooks.
12. Completion updates both parties' activity feeds.

If online payment is not implemented, explicitly call the workflow “Request to buy” or “Order request” and do not mark it paid. A manual arrangement is not a completed online transaction.

---

## 8. Seller and buyer contact privacy

The user wants buyer/seller details to be available for fulfilment. Implement this with role-based access, not by exposing personal details on every public listing.

### Public listing
May show:
- Seller display name.
- Public seller profile link.
- City/district/state or another coarse location.
- Verified marketplace contact mechanism if available.

Never show publicly:
- Full home address.
- Personal phone number by default.
- Private email.
- Delivery addresses of other buyers.

### After an order
- Seller can see the buyer's order-specific delivery/pickup contact details for orders assigned to that seller.
- Buyer can see the seller's agreed fulfilment contact details for that order.
- Only the buyer and seller for that order, plus authorized support/operations roles, can access the sensitive order details.
- Never return every seller's or buyer's private contact details in list APIs.
- Prefer in-app messaging or masked contact if available.
- Audit access to sensitive order details where appropriate.
- Define privacy notice, purpose limitation, retention, account deletion, and support processes. Ask users for only data necessary for fulfilment.

---

## 9. Convert an idea into a sellable product

On an idea/project detail page add **“List this product on Marketplace”** only when the signed-in user owns the idea/project and it contains sufficient product information.

Flow:
1. User clicks the button.
2. Navigate to create-listing form with source idea ID.
3. Prefill title, description, images, materials, and steps from the idea where available.
4. User reviews/edits the fields and sets price, quantity, condition, dispatch PIN/location, and pickup/delivery choices.
5. Server validates ownership of the source idea and saves a listing linked to it.
6. Listing is visible in the Marketplace only after it passes validation and is set active.
7. Idea page and My Activity show a link to the listing.

An idea post is not itself inventory. The user must confirm they actually made the physical item and have the quantity available before listing it for sale.

---

## 10. My Activity integration

Add sections:
- **My Listings:** title/image/price/stock/status/date; edit, pause, mark sold; view listing.
- **Orders I Bought:** order number/date, item snapshot, seller profile/contact after confirmation, delivery/pickup status, address snapshot.
- **Orders to Fulfil / My Sales:** item, quantity, buyer name/contact/address required for fulfilment, order status, fulfilment actions.
- **My Ideas:** existing ideas and “List this product” link.
- **My Collection Requests:** requested items, pickup address (only to the requester and authorized operations), scheduled time/status.
- **Recent activity:** listing created, order placed, seller confirmed, shipment dispatched, delivered/cancelled, collection scheduled—each with server timestamp.

Counts and dates must come from backend data. Never use fake orders or sample buyer details in production.

---

## 11. Pricing, payment, refunds and seller responsibilities

- Seller sets the product price in INR.
- Use integer paise in storage for money; format to rupees on display.
- Server calculates subtotal, shipping, taxes/fees if implemented, discounts if implemented, and final total.
- Show a clear breakdown before order placement.
- Don't claim payment succeeded without a payment gateway confirmation.
- If payment gateway is not integrated, use an order-request/manual-payment workflow with explicit status.
- Define cancellation, refund, return, damaged-item, non-delivery, and dispute policies before launching real sales.
- Avoid displaying seller “earnings” until payment settlement and fees are accurately recorded.
- Add stock validation and concurrent-order protection.
- Make seller responsibility and prohibited item categories clear; implement moderation/reporting before public marketplace launch.

---

## 12. Security and abuse prevention

- Verify Supabase JWT on backend; `userId` comes from verified token `sub`.
- Do not trust seller ID, buyer ID, price, stock, shipping charge, total, status, or role from the client.
- Every edit/delete/order access must check ownership/role.
- Use Zod or the project's current validation library for request schemas.
- Validate images by MIME type, file signature where possible, file size, and count.
- Use private Supabase Storage buckets or carefully scoped policies; generate signed URLs when appropriate.
- Keep MongoDB, Supabase service-role, Gemini, shipping-provider, and payment-provider secrets server-only.
- Rotate any credentials previously exposed in screenshots or Git.
- Rate-limit listing creation, address lookup, order creation, and contact endpoints.
- Add anti-spam/reporting/moderation controls.
- Protect against IDOR: changing an order ID in the URL must not reveal another user's order.
- Use safe logging; never log full addresses, phone numbers, tokens, or payment secrets.
- Store address and contact data only for the purpose and duration needed.

---

## 13. Testing checklist

### Seller
- [ ] Create listing with valid data and photos.
- [ ] Price and stock validation works.
- [ ] Seller's full address is not visible to public visitors.
- [ ] Edit/pause/resume works only for the owner.
- [ ] Idea-to-listing prefills details but requires seller confirmation.

### Buyer
- [ ] Browse/filter/search listings.
- [ ] View seller public profile and fulfilment choices.
- [ ] PIN lookup handles valid, invalid, and provider-down cases.
- [ ] Checkout shows real shipping availability or honest manual-confirmation status.
- [ ] Order totals are recalculated on server.
- [ ] Duplicate click/retry does not create duplicate orders.
- [ ] Stock cannot be oversold.
- [ ] Buyer sees the right seller information after order confirmation.

### Order and privacy
- [ ] Seller sees only orders for their own listings.
- [ ] Seller sees buyer fulfilment details only for relevant orders.
- [ ] Buyer sees only their own orders and relevant seller information.
- [ ] A third user cannot access either party's private details.
- [ ] Cancel/refund/delivery transitions follow allowed state transitions.
- [ ] Order address snapshot remains stable if saved address changes.

### Collection
- [ ] Collection request address is saved to the correct user/request.
- [ ] Collection request is separate from buying/shipping.
- [ ] Status updates and notifications are truthful.
- [ ] Measured weight is not fabricated.

### Production
- [ ] Mobile layout and accessibility.
- [ ] Loading/empty/error states.
- [ ] MongoDB indexes and API rate limits.
- [ ] Secrets are server-side and Gitignored.
- [ ] No demo data in production.
- [ ] Build/typecheck/tests pass.

---

## 14. Implementation sequence

### Phase A — inspect
Before writing code, inspect current:
- Marketplace listing/product model and routes.
- Cart/checkout/order/payment status.
- Ideas/project model and detail route.
- Collection request model.
- My Activity implementation.
- Supabase auth, Storage bucket/policies, Express auth middleware.
- API prefix, validation, error handling, environment variable names.

Report what already exists and reuse it. Do not create duplicate models/routes just because the guide names them.

### Phase B — listings
Implement listing schema/validation, image upload, create/edit/list/detail, ownership rules, search/filter/sort/pagination, and public/private field separation.

### Phase C — India addresses
Implement structured address form, PIN validation/lookup, saved addresses, and clear provider error states. Select a current, supported location source. Do not hard-code all Indian places into the client.

### Phase D — orders
Implement request-to-buy/order creation, stock reservation, immutable order snapshots, seller/buyer order lists, permitted status transitions, and role-scoped order details. Add payment/shipping providers only after configuration and testing.

### Phase E — idea conversion and activity
Connect idea detail to listing form; add My Listings, Orders I Bought, Orders to Fulfil, and separate Collection Requests in My Activity.

### Phase F — production readiness
Run tests, security review, staging flow with two separate test users, and build/deployment checks. Do not accept real money or promise delivery until payment and fulfilment workflows are genuinely configured.

---

## 15. Copilot Agent prompt

Paste this into GitHub Copilot Agent in VS Code:

> Inspect the existing POWERCYCLE repository before editing. Report existing marketplace/listing, idea, collection request, cart/order/payment, My Activity, Supabase auth/storage, and API structures. Then implement a secure circular marketplace workflow using the existing React/Vite/TypeScript/Tailwind, Express/TypeScript, MongoDB, and Supabase stack. Reuse existing code/models/endpoints and avoid duplicates.
>
> Users should be able to list a real physical product they made from their own upcycling idea, prefill listing details from that idea, upload photos, set INR price/stock/condition, and set a pickup/dispatch location. Other signed-in users should be able to browse, view safe seller details, select quantity and a validated Indian address, choose only supported delivery/pickup options, and create a real order/request. The server must validate price/stock, calculate totals, reserve stock safely, create immutable item and address snapshots, and prevent duplicate orders. Add buyer and seller order history and show each party only the contact/address details needed for that specific confirmed order. Public listing APIs must never expose full home addresses or private phone/email.
>
> Implement India PIN/address lookup through a maintained trusted dataset/provider with server-side validation, caching if permitted, timeouts and honest provider-failure states. Do not hard-code every Indian location or invent delivery dates/rates. If no courier/payment integration exists, label the flow as a request/manual confirmation and never claim shipment or payment is confirmed. Keep e-waste collection separate from marketplace purchasing. Add listing creation/edit/pause, idea-to-listing conversion, My Activity seller/buyer sections, status transitions, validation, indexes, rate limits, and tests for ownership/IDOR/stock concurrency/privacy.
>
> First inspect and report the existing files and missing prerequisites. Implement in phases, run typecheck/build/tests, fix errors, and report changed files, environment variables, provider setup and manual test steps. Never use mock products/orders/addresses as real production records and never expose secrets.

---

## Final product rule

Build a working marketplace in stages. First make listing creation, address capture, and request-to-buy safe and reliable. Add real shipping quotes/tracking and online payments only after selecting and configuring providers. A list of all Indian PIN codes is not enough to calculate delivery; actual serviceability, parcel data, fulfilment operations, and provider rules are required.
