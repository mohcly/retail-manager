# Handoff — Production Fix Status (2026-07-16)

Written for a fresh agent picking this up. Everything below was verified directly
(git log on `origin/<branch>`, GitHub Contents API reads of the actual deployed
repos, live Vercel project/deployment lookups) at the time of writing — not
recalled from memory. Timestamps are UTC.

## TL;DR

The user asked for 4 app bug fixes + a Supabase schema/RLS audit, applied across
4 branches in 2 repos. All the code fixes are **committed and pushed** to the
source repos. But production for this app does **not** deploy directly from
those source repos — it goes through a 2-hop mirror pipeline the user and I
hadn't mapped out until this session. That's why "are the fixes live" kept
being unclear. As of right now:

- **3 of 4 fixes are verified live in production** (mobile NaN pricing, mobile
  sales infinite-loading fallback, favicon).
- **1 fix (Team role-promotion) is committed to source but NOT yet mirrored
  into production** on the two Djati-stores-derived portals.
- All Supabase/RLS fixes are live immediately (direct DB changes, not part of
  any git pipeline) — except one FK fix that was never applied at all (see
  below).

## 1. The fixes, and their actual git state

### Djati-stores (`mohcly/Djati-stores`)
- `main`: `6e39d54` favicon, `9eb0c3d` mobile NaN pricing + empty-array
  truthiness bug, `6d2e016` Team role-promotion. All pushed to origin.
- `feat/stihl-dibidani-v3`: has all three via merge commits `0ffc5b1` and
  `38ddd65` (the latter closed a gap where the favicon fix had been merged in
  late). Verified pushed, no gap remaining.

### Djati-restaurant (`mohcly/Djati-restaurant`)
- `main`: `56fbeb0` mobile NaN pricing + truthiness fix. Pushed.
- `main-mpm-food`: `51ee0e0` same fix. Pushed.
- Favicon fix does **not** apply here (that was specific to the renamed STIHL
  Djati-stores production domain). Team role-promotion fix does **not** apply
  here either — this repo's Team feature doesn't have the same offline-stub
  bug (confirmed in the prior session by reading `Team.tsx` /
  `OfflineTeamService.ts` here — no matching code path exists).

All of the above is confirmed pushed via `git log origin/<branch>` directly
against each remote, not just local branches.

## 2. THE DISCOVERY: how code actually reaches production

Production for these apps is **not** a direct Vercel↔source-repo git
connection. It's two hops:

**Hop 1 — monorepo → personal deploy repos.** The parent monorepo
(`stadium91/retail-manager`, submodules resolved so `Djati-stores`/
`Djati-restaurants` become plain directories) is mirrored by some CI process
(not fully located this session — lives under a `stadium9x` account this
session's `gh` auth doesn't have read access to) into three separate personal
GitHub repos, using a `MOHCLY_DEPLOY_TOKEN` secret:
  - `mohcly/djati-stores-mobile`
  - `mohcly/djati-stihl`
  - `mohcly/mpm-food-portal`

These three repos still use the **old pre-rename layout** (`frontend/` at
root, not `Djati-stores/`) — i.e. they mirror whatever the monorepo's
submodule pointer resolves to, flattened.

**Hop 2 — promote to `main` inside each deploy repo.** Each of the three repos
has its own `.github/workflows/mirror-to-vercel-repo.yml`:
```yaml
on:
  push:
    branches: [main-stores-dubai]   # (repo-specific trigger branch name)
jobs:
  mirror:
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0, persist-credentials: false }
      - run: git push "https://mohcly:${{ secrets.MOHCLY_DEPLOY_TOKEN }}@github.com/mohcly/<repo>.git" "HEAD:main" --force
```
Vercel's git integration for each project deploys **only** from that repo's
`main`. So a fix isn't "live" until it's landed in Hop 1's target branch,
triggered Hop 2, and Hop 2 has force-pushed onto `main`.

**Vercel projects** (team `team_7dNQ7xL96BO010UcxL3Jl1M6`):
| Project | Domain | Source repo |
|---|---|---|
| `djati-stores-mobile` | djati-stores-mobile.vercel.app | `mohcly/djati-stores-mobile` |
| `djati-stihl` | djati-stihl.vercel.app (renamed from djati-dibidani) | `mohcly/djati-stihl` |
| `mpm-food-portal` | mpm-food-portal.vercel.app | `mohcly/mpm-food-portal` |

**Important timing note**: all three deploy repos' `main` branches were pushed
to and redeployed at ~2026-07-16 14:43–14:45 UTC — i.e. essentially *during*
this investigation, most likely by the concurrent session that's also active
in this repo, which landed a CI fix (`fix(ci): disable checkout credential
persistence in mirror workflow` — `actions/checkout`'s default
`persist-credentials: true` was clobbering the embedded PAT with the
workflow's own scoped `GITHUB_TOKEN`, breaking the Hop-1→Hop-2 push with a
false "Repository not found"). So the pipeline had likely been silently
broken until minutes before this doc was written.

## 3. Verified current production content (via GitHub Contents API, live, just now)

Checked the actual file contents on each deploy repo's `main` branch — not the
source repos, not assumptions:

| Fix | djati-stores-mobile | djati-stihl | mpm-food-portal |
|---|---|---|---|
| Mobile NaN pricing (`unit_price ?? 0`) | ✅ live | ✅ live | ✅ live |
| Mobile sales fallback (`todaySales.length > 0 ? ...`) | ✅ live | ✅ live | ✅ live |
| Favicon | ✅ live | ✅ live | N/A (not needed) |
| Team role-promotion (`OfflineTeamService.ts` real `user_roles` update) | ❌ **missing** | ❌ **missing** | N/A (feature doesn't exist here) |

**Open gap**: the Team role-promotion commit (`6d2e016` and its descendants)
has not propagated through Hop 1 yet, even though it's an ancestor of commits
that DID make it through (`9eb0c3d`, `6e39d54`). This means Hop 1's source
pointer (whatever branch/submodule-commit it reads from) is pinned somewhere
that predates `6d2e016`, or reads from a different ref entirely than
`Djati-stores:main`. **Next step for whoever picks this up**: find what
Hop 1 actually reads from (check `stadium91/retail-manager`'s workflows and
its `Djati-stores` submodule pointer/branch — this session's `gh` auth
couldn't read that org/account) and either bump the submodule pointer or
re-trigger the mirror with the current `Djati-stores:main` HEAD.

## 4. Supabase / RLS fixes — separate from the above, already live

These were applied directly against Postgres via `psql` (not part of any git
pipeline), so they've been live since the moment they were run:
- `fpvrbxmbrotowdlyebqv` ("stihl" Supabase project) given the full
  `profiles`/`user_roles`/`role_audit_log` auth schema (tables + `has_role`/
  `get_user_stores`/`assign_role_from_email`/`auto_assign_role_on_profile_create`/
  `log_role_assignment` functions + triggers), matching `main`'s live schema.
- Missing tables added to match `main`: `categories`, `deliverers`,
  `deliveries`, `inventory`, `offline_users`, `product_families`,
  `purchase_items`, `purchase_orders`, `supplier_payments`, `suppliers`,
  `worker_invitations`.
- `stores` had RLS enabled with **zero policies** (default-deny trap) — added
  main's 8 policies.
- `role_audit_log` had its table but no policy — added.
- `products`/`sales`/`sale_items` had **RLS disabled entirely** (real security
  gap — 278 real products readable/writable by anyone with just the anon key).
  Fixed atomically: policies created first, RLS enabled last, in one
  transaction.
- Verified with rollback-wrapped `SET LOCAL role`/`request.jwt.claims`
  transactions (never committed) that worker/master INSERT/UPDATE/DELETE
  still work correctly under the new policies, and anon is now blocked.

### Known unresolved gap — NOT applied, needs explicit go-ahead
`sales.worker_id`'s foreign key points at the legacy `workers` table instead
of `auth.users(id)` (like `main` does). This would block every real worker
from ever recording a sale via a direct Supabase write, because their real
`auth.users` id doesn't exist in the placeholder `workers` table. Proposed fix
(null the one existing synthetic `worker_id`, drop/recreate the FK to
reference `auth.users`) was written out but **explicitly blocked by the safety
classifier** as an unauthorized schema+data change, and was never run. The
draft SQL is at
`/private/tmp/claude-501/-Users-mohamedcoulibaly/b90bf79d-18a4-4727-bb1e-f42653e3fc1a/scratchpad/fix_sales_worker_fk.sql`
(a scratchpad path — copy it out before that dir is cleaned up). **Needs the
user's explicit "yes, run it" before anyone applies it.**

## 5. Other open items (unrelated to the fixes above, still pending)

- **Store name**: production still shows a placeholder store name derived
  from an ID (`Store 5a992264...`) instead of the real store name. Asked the
  user twice for the correct name — never answered.
- **Desktop Master Sales page**: defaults to a 30-day date range
  (`subDays(new Date(), 30)`); the one real sale in the stihl project falls
  outside that window, so the page looks empty. This is working-as-designed
  filtering, not a bug — user hasn't said whether to widen the default or
  leave it (the in-app date picker already lets you widen it manually).
- **Worktree cleanup** (unrelated to the above, already done this session):
  `feat/stihl-dibidani` and `worktree-agent-a838f618a7c55a27a` worktrees
  removed (including a duplicate `feat/stihl-dibidani` worktree that had been
  recreated in the parent `retail-manager` repo by the concurrent session).
  Branches themselves are untouched — only the linked working directories
  were removed. Verified via `git worktree list`.

## 6. Housekeeping note (not urgent, flagging for hygiene)

`retail-manager`'s `mohcly-origin` git remote has a GitHub PAT embedded
directly in the remote URL in plaintext (visible via `git remote -v`). Not a
new leak — it's local git config, not something exposed externally — but
worth rotating/moving to a credential helper at some point.
