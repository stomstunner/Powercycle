# POWERCYCLE Home Page — Design, Purpose & Copilot Build Guide

## 1. Overview

**Page:** Home Page / Landing Page  
**Project:** POWERCYCLE  
**Frontend stack:** React + Vite + TypeScript + Tailwind CSS  
**Design direction:** Premium dark UI with purple/neon-violet highlights, glowing electronics imagery, subtle borders, and responsive cards.

The Home Page is the first page visitors see when they open POWERCYCLE. It should quickly explain the platform, build trust, and guide visitors to the most important actions: assess an electronic device, explore the marketplace, or learn how to reuse/recycle electronics responsibly.

> Treat the supplied purple PowerCycle mockup as the visual reference. Recreate its layout and visual style using real React components and responsive Tailwind CSS—not by placing the mockup image as the website background.

## 2. Importance of the Home Page

The Home Page acts as the main entry point to the platform. It should:

- Explain POWERCYCLE's mission: giving old electronics a useful second life.
- Help users understand the available options: assessment, resale/reuse, and responsible recycling.
- Direct users to the Device Assessment and Marketplace pages.
- Make the product look reliable, polished, and easy to use.
- Explain the process in a few simple steps.
- Work on desktop, tablet, and mobile.
- Avoid misleading visitors: do not display invented real-world statistics, verified impact numbers, or actual device valuations.

## 3. Visual Design Requirements

### Colour and appearance

- Page background: near-black / deep navy.
- Primary accent: vivid purple / violet.
- Secondary accent: restrained green for recycling and environmental elements.
- Text: white headings, light grey supporting text.
- Cards: dark surfaces, thin purple/grey borders, rounded corners.
- Buttons: purple gradient or solid purple primary buttons; outlined secondary buttons.
- Effects: subtle glow, hover transitions, and visible keyboard focus states.
- Use consistent spacing and typography; do not overuse gradients or animations.

### Responsive behaviour

- Desktop: full navigation bar, two-column hero, four feature cards in a row, four device category cards, horizontal four-step process.
- Tablet: cards wrap into two columns; hero visual scales down.
- Mobile: compact navigation or hamburger menu, stacked hero content, cards in one column or a horizontally scrollable category list, readable buttons, no horizontal page overflow.

## 4. Home Page Sections

### A. Navbar

**What it contains**
- POWERCYCLE logo/brand mark.
- Links: Home, Devices, Assessment, Marketplace, About.
- Search field or search icon if supported by the current project.
- Sign In button.

**Purpose**
- Gives visitors quick access to the main parts of the platform.
- Makes the application structure easy to understand.

**Behaviour**
- Links must navigate to routes that already exist.
- If a destination page/route is not implemented yet, use a sensible existing section anchor or leave it as a clearly marked TODO rather than linking to a broken URL.
- Sign In must use the existing authentication route/integration. Do not create fake authentication.

### B. Hero Section

**Suggested text**
- Eyebrow: `Recycle • Reuse • Resell • Make an Impact`
- Heading: `Give Your Devices a Second Life`
- Description: `PowerCycle helps you assess, recycle, resell or donate your old electronic devices while contributing to a cleaner and greener planet.`
- Primary button: `Get Started`
- Secondary button: `Explore Marketplace`

**Visual**
- Show a polished composition of a laptop, smartphone, tablet, headphones, or other electronics.
- Add restrained purple lighting/glow and subtle eco imagery.
- Use a real image asset or a suitable placeholder from the project's existing assets. Do not reference nonexistent asset paths.

**Purpose**
- Communicates the platform's main benefit immediately.
- Gives users a clear first action.

**Behaviour**
- `Get Started` navigates to the existing Device Assessment route.
- `Explore Marketplace` navigates to the existing Marketplace route.
- If routes do not exist, inspect the router and report the missing routes instead of inventing backend functionality.

### C. Quick Stats (Optional)

The mockup includes example counters such as devices processed and users. These are illustrative design elements, not verified project data.

**Rules**
- Prefer omitting these counters until real data exists.
- If included for a prototype, label them clearly as demo/sample data.
- Never imply real users, actual recycled-device totals, or environmental savings without a data source.

### D. Feature Cards

Four cards:
1. **AI Device Assessment** — helps users begin a device condition assessment.
2. **Reuse Marketplace** — browse refurbished/upcycled products or devices, depending on the implemented catalogue.
3. **Responsible Recycling** — helps users find the appropriate recycling/collection flow when implemented.
4. **Environmental Impact** — explains sustainability goals or displays real impact data only when available.

**Purpose**
- Explains the key value propositions in a fast, scannable format.

**Behaviour**
- Each card should navigate to its relevant implemented route or section.
- Do not claim AI analysis works until the Gemini/API integration is implemented and tested.

### E. Popular Device Categories

Categories shown in the design:
- Smartphones
- Laptops
- Tablets
- Accessories

**Purpose**
- Helps users quickly identify the type of device they want to assess or explore.

**Behaviour**
- Category selection should preselect the category in the assessment flow only if that feature exists.
- Otherwise navigate to the assessment page and pass category state only when the existing route supports it.

### F. How It Works

Show four simple steps:
1. **Select Your Device** — choose a supported device category.
2. **Provide Details** — enter the device model and condition; upload an image only if supported.
3. **Get Assessment** — receive results only when the assessment feature is implemented and available.
4. **Choose Next Step** — reuse, resell, repair, donate, or recycle depending on the available options.

**Purpose**
- Reduces confusion and sets expectations before users start.
- Explains the user journey without overwhelming visitors.

### G. Sustainability Call-to-Action

**Suggested heading:** `Together for a Greener Tomorrow`

**Suggested copy:** `Every device you reuse or recycle can help reduce e-waste and support a more sustainable future.`

**Button:** `Start Assessment`

**Purpose**
- Reinforces the platform mission and gives users another clear way to start.

### H. Footer

Include:
- POWERCYCLE branding and a short tagline.
- Quick links: Home, Devices, Assessment, Marketplace.
- Company links: About, Contact, Privacy Policy, Terms of Service—only link to implemented pages.
- Social links only if real project accounts/URLs exist.

**Purpose**
- Provides navigation and basic project information at the bottom of the page.

## 5. Implementation Plan

Use the existing repository. Do not create a second app or replace the current configuration.

### Step 1 — Inspect the project

Ask Copilot to inspect:
- `package.json` and available scripts.
- Current routing setup and routes.
- Existing page/component structure.
- Tailwind configuration and global CSS.
- Available images/icons and installed dependencies.
- Existing authentication and API configuration.

### Step 2 — Identify files to change

Before editing, Copilot should state which files it plans to modify. Reuse current conventions and existing components where possible.

Possible structure (adapt to the real repository):
- `client/src/pages/HomePage.tsx`
- `client/src/components/Navbar.tsx`
- `client/src/components/home/HeroSection.tsx`
- `client/src/components/home/FeatureCard.tsx`
- `client/src/components/home/DeviceCategoryCard.tsx`
- `client/src/components/home/HowItWorks.tsx`
- `client/src/components/home/SustainabilityCTA.tsx`
- `client/src/components/Footer.tsx`

These are examples, not mandatory paths. Do not create duplicates if equivalent components already exist.

### Step 3 — Build reusable components

Build the page from maintainable components rather than one giant JSX file. Use typed data arrays for repeated cards and steps where appropriate.

### Step 4 — Apply styling

Use the project's installed Tailwind version and configuration. Do not blindly install or reconfigure Tailwind. Match the mockup's dark background, purple accents, card borders, spacing, typography, and restrained glow.

### Step 5 — Wire up navigation

Connect buttons and links to real routes in the current router. Preserve existing Supabase authentication and API setup. Do not expose server secrets in frontend code.

### Step 6 — Verify

Run the scripts that actually exist in `package.json`, such as:
- lint
- typecheck
- production build

Then open the page in a browser and check desktop, tablet, and mobile layouts. Fix broken images, console errors, invalid routes, overflow, and unreadable text.

## 6. Copy-Paste Prompt for GitHub Copilot Agent

Paste this prompt into Copilot Agent in the existing POWERCYCLE workspace:

---

You are working in my existing POWERCYCLE repository. Implement **only the Home Page** based on the purple/neon-violet PowerCycle mockup supplied as the visual reference.

### First inspect
1. Inspect the current folder structure, `package.json`, routing, Tailwind setup, global styles, existing shared components, assets, and the master project specification if present.
2. Identify the current Home Page and avoid creating duplicate components or a second app.
3. Before editing, briefly list the files you plan to change and any routes that are missing.

### Design
- Premium dark near-black/deep-navy background.
- Bright purple/violet accents, with limited green accents for sustainability.
- White headings, light grey supporting copy, thin subtle card borders, rounded corners, tasteful glow, and restrained hover effects.
- Responsive layout with the same overall hierarchy as the reference mockup.
- Do not use the entire mockup screenshot as the page background. Build real semantic React components and use suitable individual image assets.
- Use accessible labels, image alt text, keyboard focus states, and sufficient contrast.

### Sections
1. Navbar with PowerCycle brand, Home, Devices, Assessment, Marketplace, About, and Sign In.
2. Hero with the text “Give Your Devices a Second Life”, a short platform description, an electronics visual, `Get Started`, and `Explore Marketplace`.
3. Four feature cards: AI Device Assessment, Reuse Marketplace, Responsible Recycling, Environmental Impact.
4. Four device categories: Smartphones, Laptops, Tablets, Accessories.
5. A four-step “How It Works” section: Select Your Device, Provide Details, Get Assessment, Choose Next Step.
6. A sustainability CTA: “Together for a Greener Tomorrow” and a `Start Assessment` button.
7. Footer with branding and useful links.

### Functionality
- Connect buttons and links only to routes that actually exist.
- Use the existing router and authentication integration.
- Do not add fake login, fake checkout, or pretend AI results are real.
- Do not invent real user counts, recycled-device totals, valuations, or environmental statistics.
- If a feature or route is not implemented, report it clearly and use a safe placeholder/section anchor where appropriate.
- Preserve the existing API configuration, Supabase integration, and unrelated pages.
- Never put MongoDB credentials or Gemini API keys in client code.

### Code quality
- React + Vite + TypeScript + the existing Tailwind setup.
- Reuse existing components and icon libraries.
- Keep components readable and strongly typed.
- Make the page responsive for desktop, tablet, and mobile.
- Avoid unnecessary dependencies or project configuration changes.

### Verification
- Run available lint, type-check, and build scripts from the correct folder.
- Fix errors caused by this implementation.
- Summarize changed files, working interactions, tests/build results, and remaining TODOs.
- Do not implement any other page in this task.

---

## 7. Acceptance Checklist

Before considering the Home Page complete, confirm:

- [ ] The page follows the purple PowerCycle reference design.
- [ ] Navbar and footer display correctly.
- [ ] Hero heading and both CTA buttons are visible.
- [ ] Feature cards and device categories are responsive.
- [ ] The four-step process is readable and consistent.
- [ ] Buttons navigate to valid routes or safe placeholders.
- [ ] No fake statistics or unsupported AI claims are presented as facts.
- [ ] Existing Supabase and API configuration remains intact.
- [ ] No broken images or horizontal overflow on mobile.
- [ ] Lint/type-check/build pass where scripts are available.

## 8. Important Notes

- This document describes the Home Page design and intended behaviour; it does not mean every linked feature is already implemented.
- Use the supplied mockup as a visual guide, not as production data.
- Complete and test the Home Page before starting the next page.
