# Handoff — 2026-07-19

Supersedes `HANDOFF_2026-07-17_saas-roadmap-and-system-state.md` (keep that file for archival
detail on the 7-branch restructuring/CI-CD build-out; everything operationally relevant from it is
folded in here). Read this file first in a fresh session before touching anything.

## 1. What this repo is

**Djati** — an offline-first POS/retail-management platform for businesses in Mali (French UI).
Desktop app (Tauri, local-bridge Node backend + SQLite) and mobile/web (Vite/React + Supabase
cloud). One monorepo (`retail-manager`), **7 branches**, each a distinct client/product
deployment — not feature branches, don't merge them into each other:

| Branch | Product family | Deploy target | Push rule |
|---|---|---|---|
| `main-restaurants` | restaurant | web, Vercel (`mpm-food-portal`) | push freely |
| `main-stores-dubai` | stores | web, Vercel (`djati-stores-mobile`) | push freely |
| `main-stores-stihl` | stores | web, Vercel (`djati-stihl`) | push freely |
| `main-mpm-food` | restaurant | desktop `.exe` (Tauri CI) | **ask first** |
| `main-stihl-dibidani` | stores | desktop `.exe` | **ask first** |
| `main-stihl-niamakoro` | stores | desktop `.exe` | **ask first** |
| `main-niamana-dubai` | stores | desktop `.exe` | **ask first** |

"stores" vs "restaurant" family matters: they share a LOT of component code but have real content
differences (e.g. `MobileMenuScreen.tsx` — stores has `Boutiques`/no ingredients, restaurant has
`Restaurants`/ingredients; `MobilePOS.tsx` structurally diverged too — restaurant uses
`min-h-screen`, stores uses `h-dvh`). **Always diff-check a file between branches before
cherry-picking a fix across them — do not assume identical.** A prior session nearly overwrote
stores-specific content with restaurant content this way; caught only because git flagged a merge
conflict, not because it was checked first.

Within the "stores" family, all 5 branches (`main-stores-stihl`, `main-stores-dubai`,
`main-stihl-dibidani`, `main-stihl-niamakoro`, `main-niamana-dubai`) share byte-identical mobile
component files as of this writing — confirmed repeatedly by diff, safe to cherry-pick among them
directly. `main-restaurants`/`main-mpm-food` are likewise identical to each other.

## 2. Standing rules (do not relitigate these)

- **Desktop branches never get pushed to trigger a build without the user's explicit go-ahead** —
  `.github/workflows/build.yml` has no path filter, so *any* push (even a docs-only commit)
  triggers a full Windows Tauri build. Exception: confirmed-critical, production-breaking bugs.
- **Branch-porting workflow**: fix once on a representative branch → diff-check siblings → cherry-
  pick → push web branches, hold desktop branches locally as commits.
- **The GitHub Actions mirror-to-Vercel CI (`mirror-to-vercel-repo.yml`) has been silently
  `startup_failure`-ing on the `mohcly` account for the entire session** (same signature as an
  earlier `stadium93` billing block, never confirmed root-caused — I don't have the OAuth scope to
  read the billing page). **Every web-branch push must ALSO be force-pushed directly to the
  Vercel-connected mirror repo**, or it will not go live no matter how confident a normal `git
  push` looks:
  ```
  TOKEN="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"   # mohcly OAuth token, see §4
  git push "https://mohcly:${TOKEN}@github.com/mohcly/djati-stihl.git" "HEAD:main" --force          # main-stores-stihl
  git push "https://mohcly:${TOKEN}@github.com/mohcly/djati-stores-mobile.git" "HEAD:main" --force  # main-stores-dubai
  git push "https://mohcly:${TOKEN}@github.com/mohcly/mpm-food-portal.git" "HEAD:main" --force      # main-restaurants
  ```
  Verify via Vercel MCP tools (`list_deployments` on the relevant project) that the latest
  production deployment's `githubCommitSha` actually matches your push — don't just trust the push
  succeeded. **Ask the user to check/fix the `mohcly` GitHub Actions billing settings** — this is
  the one thing in this whole workaround that actually needs fixing upstream, not routing around.
- **`retail-manager/.env.local`** (repo root, gitignored) holds real credentials for two Supabase
  projects — see §4. Never let this file get committed; it's already been at risk once (found
  untracked-but-not-gitignored, fixed).
- **Keep `memory-bank/core/activeContext.md` and `progress.md` current** after substantive work —
  standing instruction, not optional.
- When testing mobile screens locally (dev server or a local production build), you'll hit a
  license-activation gate → trial-continue link → license-agreement checkbox+confirm → a marketing
  landing page's "Commencer" button before reaching the real `/auth` login form. The app uses
  `HashRouter`, so `AuthContext.tsx`'s `devLogin()` bypass — not currently wired to any UI button —
  needs a temporary `useEffect` in `AuthPage.tsx` (`if (searchParams.get('devlogin')) devLogin(...)`)
  triggered via a query param **embedded inside the `#/...` hash fragment**, not the outer URL's
  query string. Also: `getDataClient()` in `dataClient.ts` defaults to local-first/desktop mode
  whenever not on HTTPS, unless `?force_cloud=true` is present — needed locally to reach the same
  cloud-mode code path production (HTTPS) uses automatically. **Always remove the temp `useEffect`
  before committing** — it's been re-added and removed probably six times this session, always
  clean afterward (verify with `git diff --stat` on `AuthPage.tsx` before every commit).
- Headless Chromium (`playwright-core`, installed under `/Users/mohamedcoulibaly/.claude/jobs/*/tmp/node_modules`
  and `/private/tmp/plan-scratch/node_modules` — the latter has a broken `playwright` package
  missing `package.json`, use `playwright-core` instead and it'll find the cached browser at
  `~/Library/Caches/ms-playwright/chromium-1228`) **cannot reproduce a real mobile browser's
  address-bar collapse during scroll** — this class of bug needs the user's own device to confirm,
  no amount of Chrome DevTools Protocol emulation (`Emulation.setSafeAreaInsetsOverride` works fine
  for safe-area testing, but there's no equivalent for the dynamic browser-chrome-collapse
  animation itself). Be upfront about this limitation rather than claiming false confidence.

## 3. This session's work, most recent first

1. **Mobile tab bar "not level" / different font size vs Caisse** (fixed, shipped) — side effect
   of the `h-[100svh]` fix below: once the tab bar was fused into MobilePOS's own panel, the static
   `svh` reference caused the whole screen to sit shorter than the true viewport when the browser
   chrome was hidden, floating the fused block above the real bottom edge (out of level with
   Dashboard/Menu's `fixed bottom:0` nav, which always tracks the live viewport). Reverted to
   `h-dvh` — safe now because there's only one positioning system left (the fused block moves as
   one unit), not two independent ones to desync. Verified: Caisse and Tableau tab labels now
   measure to the identical Y position and font size.

2. **Scroll-triggered gap between net-à-payer panel and tab bar** (fixed, shipped, after 2 failed
   attempts) — user reported (with photo evidence) a gap opening between the checkout panel and
   the bottom tab bar specifically while scrolling, plus the phone's own status bar clock
   overlapping the app header — both symptoms of the mobile browser's address bar collapsing
   mid-scroll. **Two sound, standard-technique fixes in a row didn't hold on the user's real
   device** (a shared `--mobile-tabbar-h` CSS variable; then switching the root to `h-[100svh]` for
   stability) — this environment structurally cannot reproduce the failure mode to verify against,
   which is exactly why both misses happened. The user's own suggestion — "fuse it to the footer
   tab" — was the fix that actually worked: extracted the tab row into `MobileBottomTabRow` (no
   positioning of its own, lives in `MobileWorkerLayout.tsx`), and `MobilePOS.tsx` now renders it
   as the literal last flex child of its own already-fixed panel — one continuous DOM box instead
   of two independently-positioned elements. `MobileWorkerLayout` suppresses its own separately-
   fixed `<nav>` only when the POS tab is active; every other screen is unchanged. Verified
   *structurally* (nav is no longer `position: fixed`, is a DOM descendant of the same screen root
   as the panel), not just by a numeric gap measurement that happened to read zero. **Lesson**:
   when two independently-positioned elements resist two separate, individually-sound alignment
   fixes, stop calculating a matching offset and fuse them into one element — it's a different
   *class* of fix, not a third attempt at the same one.

3. **CRITICAL — privilege escalation via `user_roles` RLS, fixed live on both Supabase projects**
   (`fpvrbxmbrotowdlyebqv` STIHL, `onsqvduklnwffugsiybs` shared-stores). The `INSERT` policy
   allowed any authenticated user (worker, cashier) to grant themselves `master` role via a direct
   REST call — it checked *whose* row was being inserted, never *what role* was requested, and the
   unique constraint is `(user_id, role, store_id)`, not `user_id` alone. Found via migration-file
   analysis; the **live** databases had a *third*, undocumented policy not in any committed
   migration, with the same gap via a `role = role` tautology bug. Fixed both policies on both
   projects directly via `psql` (see §4 for the connection recipe — the `aws-0` vs `aws-1` pooler
   host distinction cost real time to find). Every other policy (`profiles`, `stores`, `products`)
   was already correctly scoped — this was an isolated oversight, not a systemic pattern.
   **Deploying arbitrary-SQL-execution capability (even read-only, even temporary, via a throwaway
   edge function) to verify this got correctly blocked by the permission classifier — direct
   `psql` with a real DB password is the sanctioned path for ad-hoc production DB access, don't try
   to route around a classifier block for this class of action.**

4. **Full security audit** (this session, on request) — also found: `system-hard-reset` local-
   bridge endpoint (wipes the entire desktop SQLite DB) has only a client-side `confirm()` guard,
   no server-side confirmation (not yet hardened); `system-repair` has a permanent hardcoded
   `DELETE FROM products WHERE name LIKE '%Vody%'` that runs on every repair call (not yet
   removed); `backend/local-bridge/src/routes/emergency.ts` is dead code, never registered in
   `index.ts` (not yet deleted); `npm audit fix` applied across all 7 branches (resolved 1
   critical + 2 high + 4 moderate; `esbuild`/`vite` breaking-change bump and `xlsx` no-fix-
   available deferred, both assessed low real-world risk — `xlsx` confirmed only used for writing
   exports, never parsing untrusted files).

5. **Mobile menu icon-chip bug** (fixed, shipped) — `SECTION_ACCENTS` stored full `hsl(H,S%,L%)`
   strings; appending a hex alpha suffix (`1f`) directly onto that string isn't valid CSS, silently
   rendered as an opaque flat-colored blob with the icon camouflaged against its own background
   (not literally invisible — same color as its background, zero contrast). This is what the user
   flagged as looking like "AI slop." Fixed by storing accents as bare `"H S% L%"` triplets,
   building both a solid color and a `hsl(${a} / 16%)` tint with valid CSS Color 4 syntax.

6. **STIHL edge functions — the real production project had ZERO working Edge Functions,
   ever** — first attempted fix deployed `get-team`/`delete-user` to `onsqvduklnwffugsiybs` (the
   project the *source code's hardcoded fallback* points to), but production actually runs on
   `fpvrbxmbrotowdlyebqv` (confirmed by grepping the live JS bundle for the embedded project ref —
   **always verify a live deployment's actual bundled env vars this way before trusting a source
   file's fallback constant, they silently diverge**). Once given real access (a Supabase Personal
   Access Token, `sbp_...` — a completely different credential class from the project-scoped
   anon/service_role/secret keys, needed specifically for Management API / CLI deploys), checked
   *all 8* edge functions that exist in source against the real project and every single one was
   404. Deployed all 8; this likely also silently fixes several other never-separately-reported
   STIHL issues (master-password verification, AI product suggestions, invitation emails) sharing
   the identical root cause.

7. Preceding this (already covered in the superseded 07-17 handoff, still true): the 7-branch
   monorepo restructuring with `git subtree`-preserved history, dedicated single-branch Vercel
   repos (Vercel Hobby has no per-project production-branch override), the mirror-CI build-out,
   the desktop Tauri CI rebuild on `stadium92` after a `stadium93` billing block, the source-free
   "fictif" release repo (`stadium94/app-releases`), a critical payment-dialog crash fix
   (`setSelectionRange` on a `type="number"` input) shipped same-day to all 7 branches, an
   account-level-master store-resolution bug fixed across all 7 branches, and a Google-Fonts-CDN
   icon-font bug fixed across the 3 stores web branches.

## 4. Credentials and access (current, live-verified)

All in `retail-manager/.env.local` (gitignored, repo root — NOT `frontend/.env`):

- **STIHL Dibidani** (`fpvrbxmbrotowdlyebqv`) — anon/publishable/service_role/secret keys, DB
  password. Pooler: `postgresql://postgres.fpvrbxmbrotowdlyebqv@aws-1-us-west-2.pooler.supabase.com:6543/postgres`
  (port **6543**, not 5432 — 5432 gets "server closed the connection unexpectedly"; host is
  `aws-1`, not `aws-0` — get the exact correct string via `supabase link --project-ref <ref>` then
  read `supabase/.temp/pooler-url`, don't guess).
- **Niamana-Dubai / shared stores** (`onsqvduklnwffugsiybs`) — DB password only currently saved.
  Pooler: same pattern, `aws-1-us-east-1`, port 6543.
- `CLAUDE_SUPABASE_ACCESS_TOKEN` (`sbp_...`) — account-level Management API / CLI deploy access,
  scoped to whatever org owns `fpvrbxmbrotowdlyebqv`. Does NOT cover `onsqvduklnwffugsiybs` —
  for that one, `supabase login`'s separately-authenticated default CLI session works (unset
  `SUPABASE_ACCESS_TOKEN` first).
- `mohcly` GitHub OAuth token (`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`) — used for direct mirror
  pushes (§2) and is also embedded in the `mohcly-origin` git remote already configured in every
  worktree.
- Live Vercel projects (team `mohclys-projects`, `team_7dNQ7xL96BO010UcxL3Jl1M6`): `djati-stihl`,
  `djati-stores-mobile`, `mpm-food-portal` (the 3 dedicated repos above), plus older/unrelated
  ones from before this session's restructuring.

## 5. Audit — improvements and features worth considering next

Grounded in what actually surfaced this session, not speculative:

**Highest-leverage, technical:**
- **No automated test suite exists anywhere in this repo.** Every single bug this session — the
  critical payment crash, the RLS privilege escalation, three rounds of mobile layout bugs — was
  caught reactively, by a human noticing it live or a real-time manual audit. A Playwright E2E
  suite covering the core sale flow (login → add item → checkout → payment) across both product
  families would have caught at least 2 of the 3 mobile layout regressions from this session
  before they shipped. This session proved the tooling works in this environment (built a full
  screenshot-verification harness from scratch, including the license/trial gate chain, HashRouter
  quirks, and CDP safe-area emulation) — formalizing it into a real CI-run suite is now a much
  smaller lift than it would have been before this session started.
- **`devLogin()` exists but isn't wired to any UI** — every verification this session needed a
  disposable temp `useEffect` hack in `AuthPage.tsx`, added and removed by hand each time. Wiring
  it behind a real, build-flag-gated "Dev Mode" button (or at minimum keeping the query-param
  trigger permanently, gated by `import.meta.env.DEV`) would make all future debugging and any
  future E2E suite dramatically less fragile.
- **No systematic RLS audit has ever been done** — every fix this session (including the critical
  one) was reactive, triggered by a specific bug report or a specific ask. Given how severe the
  `user_roles` finding was, and that it existed silently for an unknown period, a deliberate
  policy-by-policy audit across every table on both live projects is warranted, not just "wait for
  the next symptom."
- **CI/CD reliability**: the GitHub Actions mirror pipeline has now silently failed on *two
  different accounts* this session's overall arc (`stadium93` then `mohcly`) with the same
  `startup_failure` signature, and the current state is a manual-workaround band-aid (direct
  mirror pushes). This needs the user to actually resolve the billing/spending-limit setting — I
  don't have the account access to self-serve it.
- **Consolidate the mobile screen shell.** Three consecutive bugs this session (icon-chip
  contrast, the tab-bar gap, the leveling regression) all trace back to individual mobile screens
  each independently reimplementing "how do I size myself and coordinate with the tab bar" rather
  than sharing one proven pattern. `MobileBottomTabRow` (just extracted) is a first step; a shared
  `MobileScreenShell` wrapper encoding the dvh-rooted, safe-area-aware, tab-bar-fused pattern once
  would prevent whichever mobile screen gets built next from rediscovering the same class of bug.
- **Broad-scope PATs not narrowed/rotated**: `stadium93`'s `SUBMODULE_PAT`, `stadium94`'s release
  token — flagged repeatedly across sessions, never actioned.

**Product-level (flagged, not yet resourced):**
- The SaaS roadmap the user asked for earlier this session (self-serve multi-tenant core +
  strict-isolation bespoke tier for clients unwilling to share data/infra) was scoped in
  conversation but never actually written up — the 7-branch/dedicated-repo architecture already
  *is* the isolated/bespoke side; the shared multi-tenant side doesn't exist in any form yet, not
  even a design doc. This is probably the single highest-value next deliverable if the business
  direction is still "grow this into a SaaS."
- Git history on `Djati-stores`/`Djati-restaurant` (the pre-monorepo repos) still has real
  committed secrets from before this session's restructuring, never scrubbed (lower urgency now
  that the one confirmed-live leak — `test_supa_logins.mjs`'s password list — is being closed by
  the user rotating those accounts directly, but the history itself is still there).
