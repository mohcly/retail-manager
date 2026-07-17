# Handoff — SaaS Roadmap + Full System State (2026-07-17)

Paste this entire file as your first message in a new chat. It replaces the need
for prior conversation history — everything a fresh session needs is here.

## The immediate task

The user wants a **written business + technical roadmap** for turning this
POS/retail-management product (branded "Djati") into a SaaS. This was the very
next deliverable when the handoff was requested — **produce that roadmap now**
as the first substantive action in the new chat, using everything below as
grounding. Don't re-discover the architecture from scratch; it's already mapped
out here.

**The SaaS model, as the user explicitly defined it (do not deviate from this
without asking):**
- Goal: self-serve AND multi-tenant.
- **But not uniform pooled multi-tenancy.** Some clients will refuse to have
  their data mixed with other tenants in a shared database/schema. The
  architecture must support **both**: a shared multi-tenant tier (self-serve,
  cheap, fast onboarding) **and** an isolated/dedicated-deployment tier for
  clients who require strict separation — i.e., partially preserve the bespoke
  per-client deployment model that exists today, rather than force everyone
  into one shared pool.
- This is explicitly a *transition away from* pure bespoke-per-client
  deployment (today's model: new git branch + new Supabase project + new
  Vercel project + new CI build per client, all wired by hand) — but the
  transition target is a **hybrid**, not a full collapse to single-tenant-DB.

Open questions worth raising back to the user while drafting the roadmap
(don't block on them, but flag them): how isolated does "isolated" need to be
for the strict-separation tier — separate Postgres schema within one Supabase
project (cheaper, still one codebase) vs. fully separate Supabase project per
client (closer to today, more ops overhead but zero blast-radius risk)? And:
is pricing tiered by isolation level (e.g., shared tier priced per-seat/store,
dedicated tier priced as a premium/enterprise plan)?

## Why the roadmap matters more than any single code fix right now

Across this whole session, every bug fix had to be manually re-applied across
5-7 git branches and re-deployed through 3-4 separate CI/CD paths. That's the
bespoke-deployment tax. It's the single biggest thing standing between this
product and being a sellable SaaS - not missing features, not the UI.

## Full technical architecture (as of this handoff)

### Repo/account topology

- **`retail-manager`** (this repo) is the actual monorepo: `backend/local-bridge`
  (Node/Fastify, shared across all branches) + per-branch `frontend/` (a Vite/
  React app). Pushed to 4 GitHub mirrors under different accounts:
  `stadium91` (origin, the primary one to push to), `stadium92`, `stadium93`,
  `boop-moon`.
- **`Djati-stores`** (`github.com/mohcly/Djati-stores`) and **`Djati-restaurant`**
  (`github.com/mohcly/Djati-restaurant`) are the *original* standalone product
  repos this session flattened into `retail-manager` branches. They still
  exist independently and are NOT the deploy source anymore for the 3 web
  products, but are still used as upstream source when porting fixes into
  desktop-only branches sourced from STIHL-specific variants.

### The 7 `retail-manager` branches

| Branch | Content source | Deploy target | Push to |
|---|---|---|---|
| `main-restaurants` | Djati-restaurant `main-mpm-food` | Vercel web | `stadium91` |
| `main-stores-dubai` | Djati-stores `main` | Vercel web | `stadium91` |
| `main-stores-stihl` | Djati-stores `main` | Vercel web | `stadium91` |
| `main-stihl-dibidani` | Djati-stores `feat/stihl-dibidani-v3` | Desktop `.exe` CI | `stadium92` (+`stadium91` for consistency) |
| `main-stihl-niamakoro` | same as dibidani | Desktop `.exe` CI | `stadium92` (+`stadium91`) |
| `main-niamana-dubai` | Djati-stores `main` | Desktop `.exe` CI | `stadium92` (+`stadium91`) |
| `main-mpm-food` | = `main-restaurants` content | Desktop `.exe` CI | `stadium92` (+`stadium91`) |

Local worktrees for all 7 exist at `retail-manager.worktrees/<branch>/` (one is
detached-HEAD: `main-mpm-food`, since its branch name collides with whatever's
checked out in the primary directory — **always `pwd` before committing/pushing
there**, a real mistake was made once this session from being in the wrong
worktree).

### Web deploy pipeline (3 branches → Vercel)

Vercel's Hobby plan has **no per-project "production branch" override** —
production is simply whichever branch is the connected repo's *default*
branch. Since all 3 web branches shared one repo, this was structurally
impossible to satisfy for more than one branch at a time. Solution: 3
**dedicated single-branch repos** under `mohcly` (the only Vercel-connected
account), each containing *only* the one relevant branch as `main`:
- `mohcly/mpm-food-portal` → Vercel project `mpm-food-portal` → `mpm-food-portal.vercel.app`
- `mohcly/djati-stores-mobile` → Vercel project `djati-stores-mobile` → `djati-stores-mobile.vercel.app`
- `mohcly/djati-stihl` → Vercel project `djati-stihl` → `djati-stihl.vercel.app`

A GitHub Action (`.github/workflows/mirror-to-vercel-repo.yml`, present on each
of the 3 branches in `retail-manager`) auto-force-pushes to the matching
dedicated repo on every push to `stadium91`, using secret
`MOHCLY_DEPLOY_TOKEN` (a `mohcly` personal OAuth token). **Two real bugs were
hit and fixed building this**: (1) the git username must be `mohcly`, not
`x-access-token` (that's only for GitHub App installation tokens); (2)
`actions/checkout` must have `persist-credentials: false`, or its own ephemeral
`GITHUB_TOKEN` silently overrides the URL-embedded credentials on any
subsequent git command to github.com.

**To ship a fix to any of these 3 products**: edit in the `retail-manager.
worktrees/<branch>/` worktree, commit, `git push` to `stadium91` — the mirror
+ Vercel deploy is fully automatic from there. No manual `vercel deploy` needed
anymore (that was the old workaround before the mirror pipeline existed).

### Desktop `.exe` CI/CD pipeline (4 branches → Windows installers)

`stadium93` was the original build account but hit a **GitHub Actions billing/
spending-limit block** (jobs fail instantly with "recent account payments have
failed or your spending limit needs to be increased") — Windows runners bill
at 2x against the included-minutes quota and this session burned through it.
**Switched to `stadium92`**, confirmed to have ample headroom (~102 minutes
used across 2 months). All 4 desktop branches are now pushed to `stadium92`
(and mirrored to `stadium91` for consistency, though `stadium91` doesn't build
anything itself for these branches).

After a successful Tauri build, CI publishes the `.msi`/`.exe` as a GitHub
Release on **`stadium94/app-releases`** — a deliberately empty, source-free
repo (not even a workflow file) — using secret `STADIUM94_RELEASE_TOKEN`. This
exists specifically so a shared/client computer logged into `stadium94` to
download a build never has access to any source code, even if the session is
left open. `stadium94`'s token is a broad classic PAT (the narrower
fine-grained one the user tried first died within minutes of issuance,
possibly account-side auto-revocation - unresolved mystery, not chased
further). Consider narrowing this token's scope properly before scaling this
pattern to more products.

### Supabase projects (one per product line, not fully consistent)

| Project ref | Used by | Edge Functions deployed? |
|---|---|---|
| `fpvrbxmbrotowdlyebqv` (STIHL) | `main-stores-stihl`, `main-stihl-dibidani`, `main-stihl-niamakoro` | **None.** Zero Edge Functions ever deployed. No CLI access from this machine's Supabase login to fix it. |
| `onsqvduklnwffugsiybs` (shared Djati-stores) | `main-stores-dubai`, `main-niamana-dubai` | All 6 now deployed (fixed this session: `create-user`, `create-product`, `send-invitation-email`, `ai-suggestions`, `ai-chat`, `verify-master-password`) |
| `kvxqutffphaxlhjyyjsw` (restaurant) | `main-restaurants`, `main-mpm-food` | 5 of 6 deployed; missing `verify-master-password`. No CLI access from this machine. |

**To deploy an Edge Function**: `cd` into the relevant worktree's `frontend/`,
`supabase link --project-ref <ref>`, `supabase functions deploy <name>
--project-ref <ref>`. Only works for projects the logged-in Supabase CLI
session (`supabase projects list`) actually has access to - currently that's
only `onsqvduklnwffugsiybs` and 2 unrelated projects (GEDD, Niamana-Dubai's
own separate management-API-listed entry). **STIHL and restaurant projects
need either the user to `supabase login` with an account that owns them, or a
personal access token from `supabase.com/dashboard/account/tokens` with
access.**

## Known bugs fixed this session (all shipped to production where applicable)

1. Store rename silently failing (RLS `owner_id` mismatch + a code bug that
   treated an RLS-blocked zero-row UPDATE as success because `.select()` was
   never chained onto the Supabase `.update()` call — this pattern existed in
   `OfflineStoreService.ts` on all branches, fixed everywhere).
2. Payment dialog crashing instantly on open (`InvalidStateError` -
   `setSelectionRange()` doesn't work on `type="number"` inputs; the code
   called it redundantly since `NumericInput` already selects its own text on
   focus). Fixed on all 7 branches - this was blocking every sale.
3. Mobile icon font showing raw text (`arrow_back`, `point_of_sale`, etc.
   instead of icons) on `main-stores-stihl` - was relying on Google Fonts CDN
   instead of self-hosting like `main-restaurants` already correctly does.
   Fixed only on `main-stores-stihl` so far - **not yet checked/ported to
   `main-stores-dubai`/`main-niamana-dubai`, which likely have the identical
   gap**.
4. Account-level masters (a `user_roles` row with `role: master` but
   `store_id: null`, not the direct owner of any store either) got **zero**
   resolvable store ID from `getOfflineSession()`, silently breaking every
   store-scoped mobile query (products, cart, sales) - while an identical
   worker account worked fine. Fixed with a third fallback tier (first store
   visible via the "masters can manage all stores" RLS policy) on
   `main-stores-stihl`, `main-stores-dubai`, `main-stihl-dibidani`,
   `main-stihl-niamakoro`, `main-niamana-dubai`. **`main-restaurants`/
   `main-mpm-food` have a structurally different, older implementation of this
   same function with no owner-fallback logic at all - not yet fixed, needs
   its own tailored patch, not a blind copy of the other branches' fix.**
5. Added a date-range picker (quick-select chips + full calendar) to the
   mobile daily-sales tracker (`MobileSuiviVentesJour.tsx`), which was
   previously hardcoded to only ever show today's sales. Shipped on
   `main-stores-stihl` only so far.

## Real, live security concerns surfaced this session (not yet remediated)

- **Actual secrets committed to git history** on `Djati-stores`/
  `Djati-restaurant`: `.env`, `.env.production`, `.env.production.decrypted`,
  local-dev TLS private keys (`.pem`), and a script hardcoding real staff
  emails against a list of candidate passwords. These were excluded from
  everything copied into `retail-manager`, but **never scrubbed from the
  source repos' history** - still there today.
- Several broad-scope classic GitHub PATs are live as CI secrets (`stadium93`'s
  `SUBMODULE_PAT`, `stadium94`'s release token) - each does far more than the
  one narrow thing it's used for. Worth narrowing/rotating.
- RLS gaps were found and fixed *reactively*, one bug report at a time (stores,
  sales) - there has been no systematic audit of every table's policies. Given
  this is a POS handling real transactions, that audit should happen before
  any serious SaaS push, not after.
- A `service_role` key (bypasses all RLS) and a raw database password were
  both pasted into this chat at points to unblock live debugging. Recommend
  rotating both in the Supabase dashboard for `fpvrbxmbrotowdlyebqv` as
  routine hygiene, independent of any roadmap work.

## Operational conventions established this session (follow these)

- **Never `git add -A`** in this repo - always add specific files. The shared
  working directories/worktrees frequently have other uncommitted changes
  (from concurrent sessions or leftover build artifacts) that must not be
  swept into unrelated commits.
- **Cross-account pushes need explicit token URLs**, not bare `git push` -
  ambient credential helpers in this environment reliably fail with
  "Repository not found" even when the remote is correctly configured. Pattern:
  `git push https://<account>:$(gh auth token --user <account>)@github.com/
  <account>/<repo>.git <branch>:<branch>`.
- **zsh reserves `$status`** as a variable name - never use it as a shell
  variable; use `http_status` or similar instead.
- When applying the same fix across multiple branches, **verify byte-identical
  context first** (`diff`/`grep` the surrounding lines), then apply via a
  small Python find-replace script across all matching files in one pass,
  rather than repeating manual `Read`+`Edit` per branch - much cheaper and
  matches the user's explicit preference for this approach.
- A background GitHub Action workflow run typically takes ~10-15s for the
  lightweight mirror job, 15-25 minutes for a full Windows Tauri build. Use
  `Bash` with `run_in_background: true` + poll via `gh run list --json
  status`, don't block synchronously on builds.
- The user has, several times this session, explicitly pushed back when I
  made a judgment call on something security/architecture-relevant without
  asking first (e.g., loosening an RLS-adjacent check, deciding to delete a
  stale local branch). Default to asking before any access-control change or
  destructive git operation, even when the fix seems obviously correct.

## Where to find more detail

- `memory-bank/core/activeContext.md` and `memory-bank/core/progress.md` in
  this repo have the fuller dated history of this and prior sessions (note:
  multiple concurrent Claude Code sessions have worked on this repo across
  the last few days - entries are dated and attributed where possible, cross-
  check before assuming something is stale).
- `memory-bank/HANDOFF_2026-07-16_production-fixes.md` - the prior handoff,
  covering the sync-outbox fix, auth fixes, and the original 2-hop deploy
  pipeline discovery that led to building the mirror-workflow described above.
