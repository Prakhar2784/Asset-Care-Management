# AssetCare Pro — Detailed Work Log

This document records everything done to this codebase in this working
session, in the order it happened: what was changed, in which files, why,
and how it was verified. It covers four phases: a full visual rebrand, a
guided onboarding wizard, a series of bug-fix verification passes, and an
authentication security hardening pass.

Repository: `Prakhar2784/Asset-Care-Management`
Stack: React + Vite + MUI v9 (frontend), Node + Express + MongoDB, multi-tenant
(each registered company gets an isolated `assetcare_<slug>` database).

---

## Phase 1 — Black / White / Yellow Rebrand

### Starting point
The app used a dark purple/glassmorphic theme. The user asked to redesign it
end-to-end after sharing a reference screenshot (white background, black
sidebar, pastel stat cards). Scope was clarified via direct questions:
**full redesign including custom components**, and it should **replace** the
existing theme rather than sit alongside it as an option.

### Step 1.1 — Pure black/white pass
First pass converted the app to a light theme, then — after the user said
*"i want complete black and white theme only... no other colour"* — flipped
to **dark mode as the default**, made genuinely pure black (`#000000`) rather
than bluish-charcoal, and removed all decorative color.

Key file: `frontend/src/context/ThemeContext.jsx` — the single MUI theme
factory (`createTheme`) used app-wide via `ThemeProvider`. Rewrote the dark
palette:
```js
primary: { main: '#FFFFFF' },
background: { default: '#000000', paper: '#0A0A0A' },
text: { primary: '#FFFFFF', secondary: '#9CA3AF' },
divider: 'rgba(255,255,255,0.12)',
```
Also updated component-level `styleOverrides` for `MuiPaper`, `MuiButton`,
`MuiTextField`, `MuiTableHead/Body/Container`, `MuiTabs/Tab`, `MuiDivider`,
`MuiLinearProgress`, and `MuiCssBaseline` (custom scrollbar colors).

**Theme persistence caveat found and explained to the user:** the app stores
each user's mode preference in `localStorage` as `theme_${userId}`. Changing
the code default doesn't affect users who already have a stored value —
explained this so the user knew to toggle the moon/sun icon in the navbar
rather than assume the code change hadn't landed.

### Step 1.2 — Fixing the "invisible text" bug class
The biggest recurring bug this phase produced: bulk hex-color find/replace
(via `sed` across many `.jsx` files) repeatedly collapsed two originally
distinct colors (e.g. a bright purple icon and a darker purple badge
background) into the *same* target color, making foreground text invisible
against its own background. This happened **six separate times** in
different shapes:

1. `Contact.jsx` — `.contact-highlight-icon { color: X; background: X; }`
   (icon color equalled its own badge background)
2. `Navbar.jsx` — active nav-pill states after a purple accent was swapped in
3. `Pricing.jsx` — page-wide: local `ACCENT`/`DARK` consts both resolved to
   the same near-black, hiding headings
4. `Pricing.jsx` — "Most Popular" chip: `bgcolor: ACCENT, color: '#FFFFFF'`
   became white-on-white once `ACCENT` was flipped to white
5. `Pricing.jsx` — highlighted-plan CTA button: same white-on-white issue
6. `Footer.jsx` — four instances of `color: #111827` used as *hover text
   color* on a dark footer (dark text on dark background)

**Fix pattern used each time:** introduce a page-local bright constant
(`ACCENT`/`DARK`) for permanently-dark pages (the public marketing site and
auth pages use inline `<style>` blocks with hardcoded hex, not MUI theme
tokens, so they don't inherit from `ThemeContext.jsx`), and audit every
consumer of that constant for background-vs-foreground role before doing
bulk replacement — i.e., grep for `color:` vs `background:` separately
instead of blind string substitution.

**Self-inflicted regression caught by self-review (not the user):** while
fixing dark-purple backgrounds, a broad alpha-based `sed` (matching literal
`rgba(255,255,255,0.55)` etc.) also flipped legitimate white *foreground*
text to dark gray, because it didn't distinguish `color:` from `background:`
context. Found via `grep -rn "color: rgba(20,20,20\|color: rgba(25,25,25"`
and fixed 4 instances, including `Layout.jsx`'s `ACCENT_DIM` constant and the
sidebar's "Powered by AssetCare Pro" footer text.

### Step 1.3 — Monochrome status/priority system
User clarified further: *"i was saying these multiple colours"* — meaning
even **semantic** colors (green/amber/red warranty indicators, colored
priority chips, colored quick-action icons) needed to go, with meaning
conveyed through label text and fill-vs-outline instead of hue.

- `frontend/src/components/StatusChip.jsx` — rewritten from a 4-color-family
  switch (green/red/amber/blue) to a binary `filled`/`outlined` style driven
  by theme tokens.
- `frontend/src/pages/admin/AdminDashboard.jsx` — `PRIORITY_COLOR`,
  `STATUS_DOT`, all 9 KPI-card `accent:` values, the `DEPT_COLORS` array, the
  SVG hero chart colors, and the Asset-Health circular-progress color logic
  were all collapsed to neutral grayscale tiers.

### Step 1.4 — Yellow accent pivot
User then pointed at the amber "today" highlight in a dashboard calendar
widget and said *"i like this... i want this in my complete website"* —
reversing the monochrome-only directive to: **one yellow accent
(`#FBBF24`), used consistently, everywhere else stays black/white/gray.**

Wired the accent into the theme engine so it propagates automatically rather
than being hand-applied per page:
- `ThemeContext.jsx`: `primary.main: '#FBBF24'` (both light/dark), button
  hover `#F5A623`, focused-input border, active tab indicator, linear
  progress bar fill.
- `StatusChip.jsx`: "filled" variant now yellow bg + dark text.
- `Layout.jsx`: sidebar `ACCENT` constant → `#FBBF24` (active nav
  icon/border/chevron).
- **App-wide KPI sweep**: every stat-card icon accent across *every* admin
  page (`AdminDashboard`, `Assets`, `AssignedDevices`, `Approvals`,
  `Departments`, `InvoiceManagement`, `MaintenanceLogs`, `Reports`,
  `ServiceCenters`, `Tickets`, `TechnicianPortal`, `Analytics`,
  `SuperAdminPanel`) converted to the same `#FBBF24`, done via targeted
  `sed` substitutions verified line-by-line with `grep`.
- Found and fixed a follow-on bug: several buttons only overrode
  `background` in their `sx` prop without also setting `color`, so they
  inherited the theme's new dark button-text color and became invisible
  dark-text-on-dark-navy. Fixed 6 instances in `Settings.jsx` and
  `ServiceCenters.jsx`, plus the "Launch Workspace" button on
  `RegisterCompany.jsx` (same root cause, `#111827` bg + `#090909` text).

### Step 1.5 — Whole-site background continuity
User asked to keep the navbar/footer as-is but make the page background
between them continuous instead of showing a light strip. Root cause:
`frontend/src/index.css` set `--bg-root: #F5F4F0` on `html, body, #root`,
which peeked through wherever a page section didn't explicitly set its own
background. Changed `--bg-root`/`--bg-panel`/`--bg-card` to black —
one CSS variable change fixed it across the whole public site.

**Build verification method used throughout this phase:** after every batch
of edits, `npx vite build --mode development` followed by `rm -rf dist`
(build artifacts intentionally not committed).

---

## Phase 2 — Guided Onboarding Wizard

### Requirement
*"i want... when a new company register this should be like first it will go
to organization profile, then will go to add department page then will go
to add user and then asset."*

### Investigation before building
Spawned an Explore agent to map: what `RegisterCompany.jsx` does on success,
what the backend `registerCompany` controller creates, the existing
Settings/Departments/UserManagement forms and their APIs, the route table,
and `AuthContext`'s user shape — to reuse real endpoints rather than build
parallel ones.

Findings used: `User` model already had an unused `onboardingDone: Boolean`
field; `registerCompany` already auto-creates a default "IT" department.

### Backend changes
- `backend/controllers/authController.js` — added `onboardingDone` to the
  login and register-company JSON responses; added `PATCH
  /auth/complete-onboarding` (`completeOnboarding`) that flips the flag.
- `backend/routes/authRoutes.js` — wired the new route.
- `backend/scripts/backfillOnboardingDone.js` (new) — one-time migration.
  **Why needed:** the `onboardingDone` field already existed in the schema
  with `default: false`, so every *existing* user in every tenant database
  would suddenly read as "needs onboarding" the moment the gate went live.
  Ran this script against the live Atlas cluster before enabling the gate —
  it iterates the control-plane DB **and every per-tenant DB** (had to fix
  the script mid-session after discovering it initially only patched one
  DB, missing 6 other tenant databases), backfilling `onboardingDone: true`
  for pre-existing accounts.

### Frontend changes
- `frontend/src/pages/admin/OnboardingWizard.jsx` (new) — a 4-step MUI
  `Stepper`: **Organization Profile → Add Department → Add User → Add
  Asset**. Each step posts to the real production API
  (`PUT /settings/tenant`, `POST /departments`, `POST /users`), with a
  "Skip this step" escape hatch and, after user feedback, **support for
  adding multiple departments/users per step** (an "Add Another" button
  that saves the current entry as a chip and clears the form for the next
  one, rather than forcing exactly one).
- `RegisterCompany.jsx` — redirect target changed from `/settings?tab=org`
  to `/onboarding`.
- `frontend/src/routes/AdminRoute.jsx` — gate added: if the logged-in user
  is `role === 'admin'` and `onboardingDone === false`, redirect to
  `/onboarding` — **except** when the request is the wizard's own "Add
  Asset Now" outbound link (`?onboarding=1` query param), to avoid an
  infinite redirect loop.
- `frontend/src/pages/admin/AddAsset.jsx` — when reached via
  `?onboarding=1`, a successful asset save calls `complete-onboarding` and
  routes to `/admin/dashboard` instead of the normal `/admin/assets` list.
- `frontend/src/App.jsx` — `/onboarding` route added under the logged-in
  route group but outside the sidebar `Layout` wrapper (full-screen).

### Iteration on the wizard's own polish (user feedback loop)
1. *"there should be option to add more depat"* → added the
   multi-department "Add Another" pattern described above; then applied the
   same pattern to the Add User step for consistency, plus added an
   Employee ID field, password show/hide toggle, and converted the
   Department field from free text to a `Select` populated from
   already-added + pre-existing departments.
2. *"it should ask for complete details as in organization profile page"* →
   expanded the Org Profile step from 7 fields to the full set used by the
   real Settings page (Employee Count, Website, GST/PAN Number, PIN Code,
   Country).
3. *"background is not looking good... translucent should come in
   background"* → gave the wizard card a frosted-glass look
   (`backdrop-filter: blur(24px) saturate(150%)`, `rgba(255,255,255,0.06)`
   background) over a radial yellow glow — had to iterate twice: first pass
   was too subtle (glow opacity 0.10) and the user said it "doesn't look
   translucent," so opacity was raised to 0.35 and blur increased.
4. *"do one things keep these 2 on it [navbar/footer]... our pages that are
   filling"* → imported the real `Navbar`/`Footer` components into the
   wizard page.
5. *"in this do background white and text black"* — a request to force the
   card itself to always render light regardless of the app's dark-mode
   setting. Solved by nesting a **local MUI `ThemeProvider`** with a
   hardcoded light palette around just the wizard's `Paper`, so every
   `text.primary`/`text.secondary`/`divider` token resolves correctly
   without hand-overriding each element.
6. *"welcome to assetcare pro should be big and in center... there should
   not be places left"* — centered and enlarged the headline (36px), and
   widened the card 760px → 900px max-width to reduce unused viewport
   margin.

---

## Phase 3 — End-to-End Verification & Bug Fixes

At the user's request ("check everything end to end... fix any bug"), ran
four separate verification passes by actually **launching both servers and
driving the live app** (via the preview browser tooling, dispatching real
DOM events and `fetch` calls), not just re-running the build. 13 real bugs
were found and fixed this way — none of them would have been caught by
`vite build` or a type-checker.

### Pass 1 — Registration → onboarding → dashboard → auth lifecycle

**Bug: new company admins locked out after their first logout.**
`registerCompany` writes the new admin user into a per-tenant isolated
database (`assetcare_<slug>`), but `loginUser` (and forgot/reset-password)
only ever queried the control-plane database, because pre-login requests
carry no tenant context. Registering worked (auto-login stored the token
client-side), but any subsequent real login attempt returned 401.
**Fix:** added `findUserAcrossTenants()` in `authController.js` — searches
the control-plane DB first, then iterates every tenant's isolated DB via
`getTenantConnection(slug)`, always with `.setOptions({ bypassTenantFilter:
true })` (otherwise the ambient 'default' tenant context injects a
`tenantId: 'default'` filter into the tenant-DB query and silently returns
nothing). Applied to `loginUser`, `registerUser`'s dup-email check,
`forgotPassword`, `verifyOtp`, `resetPassword`, and `verifyResetToken`.

**Bug: admin-created users could never log in.**
`POST /users` manually bcrypt-hashed the password *and* the `User` model has
a `pre('save')` hook that hashes it again — a double-hash. Fixed by passing
the plaintext through and letting the model hook do it once.

**Bug: invite links (Add User "invite" mode, and CSV bulk import) were
always dead.** They stored the raw invite token, but `resetPassword`
compares against the token's SHA-256 hash. Every invite link ever sent
would fail with "invalid or expired." Fixed by hashing the token before
storing it (in `userRoutes.js`, both the `/invite` and `/bulk` routes), and
made completing a reset also flip `isActive: true` (invited accounts are
created deactivated).

**Bug: deactivated users could still log in.** `loginUser` never checked
`isActive`. Added a check that rejects with 403 if `isActive === false`.

**Migration safety:** since `onboardingDone` gating went live in this same
session, ran `backfillOnboardingDone.js` against the real Atlas cluster
*before* merging, confirmed via a direct script query that all 5
pre-existing users across the `assetcare` control-plane DB were unaffected.

### Pass 2 — Full ticket lifecycle (raise → repair → resolve → confirm)

**Bug: Raise Ticket dialog silently did nothing on empty submit.** Root
cause: the browser's native HTML5 validation blocked the submit, but
couldn't render its validation-bubble UI against MUI's hidden `<select>`
input, so the click appeared to do nothing with zero feedback. Confirmed via
`form.checkValidity() === false` while the dialog showed no error. Fixed by
adding `noValidate` to the form and JS-level validation with an error
`<Alert>` rendered *inside* the dialog (the old error alert rendered on the
page underneath the modal, invisible while the modal was open).

**Bug: adding a comment showed "User / Invalid Date" until reload.** The
`POST /tickets/:id/comments` API returns the ticket's **full** comments
array, but the frontend appended that array as if it were a single new
comment object. Fixed the reducer to detect and use the array directly.

**Bug: "Confirm Resolution" broke the ticket detail view** ("Unknown
Asset", Department "N/A"). The `confirmResolution` controller returned an
unpopulated `Ticket` document, but the frontend replaces its list/drawer
state with that response. Fixed by re-querying with the same
`.populate('asset')/.populate('raisedBy')` chain the list/detail views use.

All three fixes were verified by literally driving the flow: raising a real
ticket through the dialog, walking it through Under Repair → Resolved via
the drawer, posting two comments, and running Confirm Resolution on a
second ticket created purely via API calls — checking the actual rendered
DOM text each time.

### Pass 3 — SMTP, technician portal, exports, OCR

- Ran the existing `scripts/testEmail.js` against the real configured Gmail
  SMTP — connection verified, a real test email delivered.
- Created a technician user via the admin API, assigned them a ticket,
  **logged in as that technician** (not just the admin), drove their real
  portal, clicked "Mark Resolved" — confirmed the ticket state, counters,
  and Employee Portal role-routing.
- Exercised CSV export (Assets), and Excel + PDF export (Reports) by
  intercepting `URL.createObjectURL` in-page to confirm real, non-empty
  blobs of the correct MIME type were generated.
- **OCR:** synthesized a fake tax-invoice image on an in-page `<canvas>`,
  fed it into the real file input, and let `tesseract.js` actually run
  (~20s). It correctly extracted 9 of the intended fields, but:
  - Asset Name kept the literal "Item:" label prefix
  - Model Number dropped the "5420" suffix (a regex meant to strip trailing
    *years* was too aggressive and stripped any 4-digit trailing token)
  - Invoice Number captured the word "Invoice" itself instead of the real
    number, because the document's own "TAX INVOICE" header line matched
    before the real "Invoice No: ..." line

  **Fix (`AddAsset.jsx`, `parseInvoiceText`):** tightened the model-number
  year-guard to `/^(19|20)\d{2}$/` instead of `/^\d{4}$/`; added prefix/
  trailing-amount stripping to the asset-name extraction instead of a blunt
  "cut from any 4-digit token" rule; changed the invoice-number regex to
  require a digit *inside* the captured group
  (`[A-Z]{0,6}[-\/]?\d[A-Z0-9\/\-]{2,19}`) so a bare word can't satisfy it.
  Also added a `DEV`-only `window.__lastOcrText` hook that stashes the raw
  OCR text, used to diagnose the regex directly against real tesseract
  output rather than guessing — verified the corrected regex against the
  captured text before re-running the full scan end to end.

Each fix in this phase was committed and pushed separately with a message
explaining the exact defect found and the observed before/after behavior —
not paraphrased, but the literal DOM text seen during the run.

---

## Phase 4 — Authentication Security Hardening

The user gave five explicit, numbered security requirements. Each is
addressed below with the actual files changed.

### 1. Server-side validation & sanitization
New file `backend/validation/authSchemas.js` using **Zod**:
- `stripHtml()` — removes complete tags, stray angle brackets, and control
  characters from any free-text field before validation runs.
- `NAME_RE` — a Unicode-aware whitelist regex for names/company names
  (letters in any script, digits, spaces, and a small punctuation set);
  anything outside it is *rejected*, not silently stripped, so the caller
  learns their input didn't pass rather than being silently mangled.
- Distinct schemas per endpoint: `loginSchema` (bounds password length only
  — never restricts the charset of an *existing* secret), `newPassword`
  (8+ chars, upper/lower/digit — matches the strongest rule the client
  already enforced, now backstopped server-side), `registerSchema`,
  `registerCompanySchema`, `forgotPasswordSchema`, `verifyOtpSchema` (must
  be exactly 6 digits), `resetPasswordSchema`.
- A `validate(schema)` middleware factory replaces `req.body` with the
  parsed/sanitized result on success, or returns 400 with the first
  human-readable issue.
- Wired onto every route in `backend/routes/authRoutes.js`.

**Found in passing and fixed as part of this pass:** `registerUser` in
`authController.js` previously accepted `role` and `tenantId` directly from
the request body — meaning anyone could self-register as `role: "admin"`
of an arbitrary existing tenant. Removed both from the accepted schema;
public self-signup now always creates a `role: 'employee'` account in the
`'default'` tenant. Verified live with a crafted request
(`{"role":"admin","tenantId":"apple", name:"<script>alert(1)</script>..."}`)
— confirmed it landed as `employee`/`default` with the script tag stripped
to plain text.

### 2. Rate limiting & lockout
New file `backend/middleware/authRateLimiters.js` (`express-rate-limit`,
already a project dependency):
- `loginLimiter` — **10 requests / IP / minute** on `/auth/login`.
- `forgotLimiter` — 5 / IP / 15 min on forgot-password and verify-OTP.
- `registerLimiter` — 5 / IP / hour on register and register-company.

`backend/models/User.js` — added `failedLoginAttempts: Number` and
`lockUntil: Date` fields.

`backend/controllers/authController.js` — `loginUser` rewritten:
- On wrong password: increments `failedLoginAttempts`; at **5** sets
  `lockUntil = now + 15 minutes`; applies a **progressive delay**
  (`sleep(min(attempts * 400ms, 3000ms))`) before responding, so each
  consecutive failure answers a little slower.
- If `failedLoginAttempts >= 3`, a `captchaRequired: true` flag is returned
  and (when `RECAPTCHA_SECRET_KEY` is configured) a real Google reCAPTCHA
  token is verified server-side via `verifyCaptcha()`; without a configured
  key the check no-ops so local dev isn't blocked, but the flag is still
  surfaced for the frontend to react to.
- While `lockUntil` is in the future, **even the correct password is
  rejected** with a 429 and a "try again in N minutes" message.
- A successful login, or a successful password reset, clears both counters.

Documented in `backend/.env.example`: optional `RECAPTCHA_SECRET_KEY`.

**Verified live** (via direct HTTP calls against the running backend): 3
consecutive wrong-password attempts → 3rd response carries
`captchaRequired: true`; 5th attempt → 429 lockout; a 6th attempt with the
*correct* password still returns 429 while locked; 11 rapid requests to
`/auth/login` from the same origin → the 11th returns 429 with
`RateLimit-Remaining: 0`.

### 3. Password hashing
Already using bcrypt with `bcrypt.compare` (constant-time) — no MD5/SHA-1
anywhere in the codebase (checked). Bumped the work factor **10 → 12**
(current OWASP-recommended floor) in four places: `User.js`'s `pre('save')`
hook, `authController.js`'s manual reset-password hash and the timing-
equalizer dummy hash, `settingsController.js`, and `superAdminController.js`.
Confirmed no code path logs a password (grepped for
`console.log.*password` across the backend — the only hits were unrelated
script output about *environment variable* configuration, not user
credentials).

### 4. Generic error messages & timing equalization
- `loginUser` returns the exact same string, `"Incorrect email or
  password."`, whether the email doesn't exist or the password is wrong.
  For the unknown-email branch, it still runs one `bcrypt.compare()` against
  a precomputed dummy hash (`DUMMY_HASH`, cost 12) purely to burn the same
  ~CPU time a real comparison would — so the *response time* doesn't leak
  which case occurred either.
- `forgotPassword` responds **immediately** with one identical message
  (`"If that email is registered, you'll receive a one-time code to reset
  your password."`) regardless of whether the account exists; the actual
  lookup, OTP generation, and email send happen afterward inside a
  `setImmediate()` background task, so neither the response content nor its
  timing depends on account existence.
- `frontend/src/pages/auth/AuthPage.jsx` updated to surface the server's
  message verbatim for the forgot-password confirmation (previously had its
  own hardcoded copy).

**Verified live:** unknown-email vs wrong-password login attempts returned
identical message text at comparable elapsed time (~2.7s vs ~3.3s, both
dominated by the bcrypt work factor); forgot-password for an existing vs.
non-existent email returned byte-identical JSON in single-digit
milliseconds for both.

### 5. Managed auth provider (Clerk/Supabase/Firebase/Auth0)
**Not migrated — explicit recommendation instead**, because this app's auth
is structurally load-bearing for its **multi-tenant architecture**: each
registered company's users live in a fully separate, isolated MongoDB
database (`assetcare_<slug>`), resolved per-request from the JWT's
`tenantId` claim via `AsyncLocalStorage` (`tenantContext.js` /
`tenantModelProxy.js`). Swapping in an external auth provider would mean
re-architecting that tenant-resolution model around the provider's own user
store and migrating every existing user record — a project-sized effort on
its own, not a hardening-pass change. Documented **Auth0 or Clerk** as the
best fits (both support external ID mapping and custom claims, so
`tenantId`/`role`/`plan` could live as provider metadata while only
non-sensitive app data stays in AssetCare's own DB, matching the
requirement's intent) as a recommended follow-up project, not attempted in
this pass.

---

## Final Security Checklist (from Phase 4)

| # | Requirement | Status |
|---|---|---|
| 1 | Server-side validation & sanitization (Zod), whitelist chars, strip HTML | ✅ Done |
| 2 | Rate limiting (10/IP/min) + 15-min lockout after 5 fails + progressive delay + CAPTCHA after 3 | ✅ Done (CAPTCHA needs a real reCAPTCHA key to actively block; rate-limit store is in-memory, documented path to Redis if scaled to multiple instances) |
| 3 | bcrypt with appropriate work factor, salting, constant-time compare, no password logging | ✅ Done |
| 4 | Generic identical error for login; non-committal reset message; equalized timing | ✅ Done |
| 5 | Migrate to a managed auth provider | ⚠️ Recommended (Auth0/Clerk), not migrated — conflicts with existing per-tenant DB architecture; treated as its own future project |

---

## How verification was actually done (methodology note)

Every phase after the initial rebrand followed the same discipline: **run
the real app, drive it like a user or via real HTTP calls, and read the
actual response** — never just "the build passed" or "the code looks
right." Concretely this meant:
- Starting both the Express backend (port 5000, connected to the live
  MongoDB Atlas cluster) and the Vite dev server (port 5173) via
  `.claude/launch.json`.
- Using browser automation to fill real forms, click real buttons, and read
  the actual rendered DOM text back — not assuming a fix worked because the
  code diff looked correct.
- Using `fetch()` calls executed inside the live page (so they carry the
  same cookies/origin) to test API behavior directly when a UI flow would
  be slower to drive — e.g. hammering `/auth/login` 11 times to observe the
  429, or creating a technician user and testing their portal.
- Creating disposable test data (`e2everify` tenant, `technick@...`
  technician, several probe tickets/comments) rather than mutating the
  user's real production data.
- Writing one-off Node scripts (kept in `backend/scripts/`, or discarded
  after use) to query MongoDB directly when verifying backend state (e.g.
  confirming `onboardingDone` values across every tenant database) was
  faster and more certain than inferring it from the UI.
- Restarting the backend process after every backend code change (the dev
  server does not hot-reload Express) before re-testing.

## Git history note

Commits made through the session originally carried a `Co-Authored-By:
Claude ...` trailer. At the user's later request, the 4 most recent commits
were rewritten via `git filter-branch --msg-filter` to strip that trailer
(commit authorship was always solely `Prakhar2784` — only the trailer line
was removed), and force-pushed with `--force-with-lease`. All 41 commits in
the repository were then re-scanned to confirm no remaining Claude/Anthropic
reference exists anywhere in the message history.
