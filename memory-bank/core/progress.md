# Progress Tracking - Retail Manager

*Last updated: 2026-07-17*
*Canonical core file. Consolidates and supersedes `core/progress/progress.md` (kept for history).*
*Granular task-by-task tracking lives in `core/tasks.md`.*

## 2026-07-17 additions (see `memory-bank/HANDOFF_2026-07-17_saas-roadmap-and-system-state.md` for full detail)
- [x] `Djati-stores`/`Djati-restaurants` consolidated as branches inside `retail-manager` (7-branch
      matrix), full history preserved via `git subtree`. 3 dedicated single-branch `mohcly` repos
      created to work around Vercel Hobby's lack of a per-project production-branch override.
- [x] Mirror-to-Vercel-repo CI built for the 3 web branches (2 bugs found/fixed: git username
      convention, `actions/checkout` credential-persistence override).
- [x] Desktop Tauri CI rebuilt end-to-end on `stadium92` (3 bugs found/fixed: stray lockfile,
      missing `tauri` package.json script, `stadium93` billing block) + source-free release repo
      `stadium94/app-releases` wired in as the publish target, with a bilingual EN/FR README.
- [x] Exposed live GitHub PAT on `stadium92` rotated/secured.
- [x] Local-bridge store-rename 403 bug fixed (`stores.ts` dropped a redundant `owner_id` check
      the `master`-role gate already covered).
- [x] Web-path store-rename silent-failure bug fixed: missing `.select()` on Supabase `.update()`
      calls meant an RLS-blocked write silently "succeeded" with nothing changed.
- [x] "Team module can't create accounts" root-caused to undeployed Supabase Edge Functions;
      deployed on the 1 of 3 projects with available CLI access. **Open**: `fpvrbxmbrotowdlyebqv`
      (STIHL) and `kvxqutffphaxlhjyyjsw` (restaurant) still missing them, need account access.
- [x] Calendar/date-range picker added to the mobile Sales tracking module (`main-stores-stihl`).
- [x] **Critical**: payment dialog crash (`InvalidStateError`, blocked 100% of sales) — fixed and
      shipped to all 7 branches same-day.
- [x] "Master can't see data on mobile" — `OfflineAuthService.getOfflineSession()` store-ID
      fallback fixed on all 7 branches now (5 earlier + `main-restaurants`/`main-mpm-food` just
      now, patched separately since that file's structure differs — see activeContext.md).
- [x] Icon-font CDN bug (Material Symbols as raw text on flaky mobile networks) fixed on all 3
      "stores" branches now (`main-stores-stihl` earlier + `main-stores-dubai`/`main-niamana-dubai`
      just now, self-hosted like `main-restaurants` already did).
- [x] Security audit of committed secrets completed — see activeContext.md for the one real
      finding (`test_supa_logins.mjs`) and its status.
- [ ] SaaS/business roadmap requested (self-serve multi-tenant + strict-isolation bespoke tier for
      clients who won't share data) — not yet written, may land in a fresh chat instead.
- [ ] Broad-scope PATs (`stadium93` `SUBMODULE_PAT`, `stadium94` release token) not narrowed/rotated.
- [ ] No systematic RLS audit across all tables — only reactive, per-bug-report fixes so far.
- [ ] `Djati-stores`/`Djati-restaurant` git history itself not scrubbed of old committed secrets
      (lower priority now that the one real leak — test account passwords — is being rotated by
      the user directly).
- [ ] `main-niamana-dubai`'s icon-font fix committed locally but **not pushed** (desktop CI branch —
      standing rule is no build-triggering push without explicit go-ahead).
- [x] STIHL "master can't open Team module" (`Failed to send a request to the Edge Function`)
      root-caused to `get-team`/`delete-user` never existing as source anywhere on the stores
      product line, hence never deployed. Ported from `main-restaurants`, deployed to the shared
      `onsqvduklnwffugsiybs` project (fixes all 5 stores-family branches at once), source ported to
      all 5. `main-stores-stihl`/`main-stores-dubai` pushed; 3 desktop branches held locally.

## 2026-07-16 additions (see `memory-bank/HANDOFF_2026-07-16_production-fixes.md` for full detail)
- [x] Mobile NaN pricing fix, mobile sales infinite-loading fallback fix — committed +
      pushed to `Djati-stores` (`main`, `feat/stihl-dibidani-v3`) and `Djati-restaurant`
      (`main`, `main-mpm-food`); **confirmed live in production** on all 3 deploy repos
      (`djati-stores-mobile`, `djati-stihl`, `mpm-food-portal`).
- [x] Favicon fix — committed/pushed to `Djati-stores`; **confirmed live** on
      `djati-stores-mobile` and `djati-stihl` (N/A for the restaurant portal).
- [ ] Team role-promotion fix — committed/pushed to `Djati-stores` (`main`,
      `feat/stihl-dibidani-v3`), but **NOT yet mirrored into production** — the
      2-hop deploy pipeline (monorepo → personal mirror repo → Vercel) hasn't
      picked up this commit yet. N/A for the restaurant portal (feature doesn't
      have this bug there).
- [x] **Mapped the actual production deploy pipeline for the first time** — Vercel
      does not deploy directly from `Djati-stores`/`Djati-restaurant`; it deploys
      from 3 separate personal mirror repos fed by a 2-hop CI process from the
      `stadium91/retail-manager` monorepo. Documented in the handoff file above.
- [x] Supabase RLS audit on `fpvrbxmbrotowdlyebqv` (stihl project): fixed `stores`
      (RLS-enabled/zero-policies), `role_audit_log` (missing policy),
      `products`/`sales`/`sale_items` (RLS was disabled entirely — real security
      gap). Verified via rollback-wrapped role-simulated SQL, zero regression.
- [ ] `sales.worker_id` FK still wrong (references legacy `workers` table, not
      `auth.users`) — fix drafted, **not applied**, needs explicit user go-ahead.
- [ ] Real store name (placeholder `Store 5a992264...`) still unanswered by user.
- [x] Removed `feat/stihl-dibidani` and `worktree-agent-a838f618a7c55a27a`
      worktrees (branches themselves untouched).

## 2026-07-15 additions (see activeContext.md for full detail)
- [x] `fpvrbxmbrotowdlyebqv` (STIHL Dibidani's own Supabase project) given the full `profiles`/
      `user_roles`/`role_audit_log` auth schema it was missing entirely; 3 real pre-existing accounts
      backfilled with profiles/roles/reset passwords.
- [x] `retail-manager`'s Tauri Windows CI build (`build.yml`) fixed (3 real bugs: cross-account
      private-submodule auth, orphaned gitlink, Tauri hook-command path resolution) and confirmed
      **building successfully** end-to-end on `stadium93/retail-manager`.
- [x] New Vercel project `djati-dibidani` stood up for the STIHL web portal, git-linked to
      `mohcly/Djati-stores`, production env vars wired to the correct Supabase project.
- [ ] Vercel "Production Branch" dashboard setting can't be changed via public API — open annoyance,
      not a blocker (CLI `vercel deploy --prod` works around it every time).
- [ ] **New bug, unresolved**: Master-side modules reportedly render empty in the deployed dibidani
      app. Not a branch/file/data-ownership issue (all ruled out) — likely in module code/data-fetching
      itself. `feat/stihl-dibidani-v3` (pure unmodified `main`) deployed to isolate whether this is a
      `main`-inherent bug or dibidani-specific.
- [x] Three dibidani branch variants exist on `Djati-stores` now: `feat/stihl-dibidani` (legacy,
      patched), `feat/stihl-dibidani-v2` (fresh from `main` + templates + stihl Supabase), and
      `feat/stihl-dibidani-v3` (pure `main`, diagnostic). Not yet consolidated into one — pick a
      canonical one once the empty-modules bug is understood.

## 2026-07-15 additions, session 2 (Djati-stores legacy-restore, auth/sync/mobile-UI fixes — see
activeContext.md "this is the other concurrent session" entry for full detail)
- [x] `retail-manager`'s own `main` promoted from `chore/monorepo-submodules` (old `main` kept as
      `main-pre-monorepo-submodules`); pushed + set as default on all 4 mirrors (`stadium91`/origin,
      `boop-moon`, `stadium92`, `stadium93`).
- [x] `Djati-stores` `main` replaced with the more complete legacy `retail-manager-mobile` codebase
      (old `main` kept as `main-pre-legacy-restore`); desktop-worker sidebar module-hiding bug fixed
      (`WorkerMenuBar.tsx` — the `!isMaster` filter belonged to mobile only, not desktop).
- [x] Backend `sync_outbox` dead-letter-queue bug fixed: `/sync/push` now drains `sync_outbox` (not just
      the legacy `pending_mutations`) plus a one-time idempotent historical backfill sweep on launch.
      `clients`/`cash_transactions` Supabase tables still don't exist — queues but won't land until
      created; worker/deliverer sync still unimplemented (needs real Supabase Auth provisioning).
- [x] Three auth bugs fixed on `Djati-stores`: session-persistence for store owners without a
      `user_roles` row, master-password verification (new `verify-master-password` Edge Function,
      replacing a Cloud-mode check that always failed), and password-change (was calling a nonexistent
      endpoint).
- [x] iOS Safari-autofill login crash fixed (`ShortcutsContext`/`ScannerContext` global keydown
      listeners threw on synthetic autofill events with no `.key` string).
- [x] Mobile sale/checkout widget overflow fixed in two passes: `MobilePOS.tsx` flexbox layout, then
      (real root cause, after user-reported the first pass wasn't enough) `max-h-[90dvh] overflow-y-auto`
      added to the shared `DialogContent`/`AlertDialogContent`/`SheetContent` primitives (34 call sites
      app-wide, including `CheckoutModal`).
- [x] `feat/stihl-niamakoro` data-safety fix: removed a `main.tsx` one-time full storage wipe
      (`localStorage.clear()` + IndexedDB delete-all) that would have hit a real client's already-running
      install with accumulated local data.
- [x] Two Windows `.exe` builds confirmed successful on `stadium93/retail-manager` CI:
      `feat/stihl-dibidani` and `feat/niamana-dubai` (branch itself also renamed from the earlier
      `feat/niamanan-dubai` typo, both locally and on remote, on both `Djati-stores` and this repo's own
      copy). **Open caveat**: `stadium93` has a full-admin classic PAT (`SUBMODULE_PAT` secret, broad
      scopes incl. `delete_repo`/`admin:org`) wired for cross-account submodule checkout — user accepted
      the risk explicitly, but it's a live powerful credential worth rotating/narrowing eventually.

## Snapshot
- **Branch**: `chore/monorepo-submodules` · **Frontend version**: 0.5.5 · **Tauri app**: 0.2.5 · **Root**: 1.0.0
- **Stage**: mature MVP under active refinement; migrating to a submodule monorepo and preparing
  client-branded (STIHL) deployments and full offline↔online sync.

## Done ✅
- [x] Framework migration Electron → **Tauri v2**.
- [x] Sidecar integration (Node.js LocalBridge) with universal x86/x64/ARM64 support.
- [x] Full i18n (fr / en / bm) across modules.
- [x] **Backend repository refactor**: `db.ts` split into `db/` + ~19 repositories (Phase 8 complete).
- [x] Currency support **GHS** + XOF/EUR/USD with dynamic denominations.
- [x] **Stock valuation fix** (COALESCE/CAST, carton multiplier).
- [x] **Product-family fix** (Master store-scoped selector + persisted `category_id`).
- [x] **Client Service & auto-discount** (tables, repos, routes, POS wiring, credit balances).
- [x] Keyboard shortcuts (PRD-013), FTS5 search, licensing/activation, supplier settlements.
- [x] Packaging price/stock math; POS delete (keyboard); DB repair/integrity tooling.
- [x] Windows 32-bit build via Rust self-extracting sidecar; frontend + sidecar obfuscation.
- [x] **Monorepo/submodule consolidation** (stores + restaurant submodules; mobile retired).

## In Progress 🚧
- [ ] **PRD-014 Offline→Online Sync**: `sync_outbox` + `sync_helpers` + `cash` repos scaffolded;
      version columns, cloud `/sync/*` endpoints, idempotency/conflict rules, background worker, and
      admin diagnostics still to complete and validate (48h-offline pilot).
- [ ] **EditionModule.tsx / SalesModule.tsx refactor** — reports + POS hardening in `retail-manager-stores`.
- [ ] **STIHL client-branded builds** — per-dealer branches maintained, not yet merged to `main`.
- [ ] **Backend security re-audit** against refactored routes/repositories.

## Backlog / Planned 📋
- [ ] Smart Replenishment (PRD-004), Multi-Price Tiers & Batch Tracking (PRD-005),
      Packaging deduction fixes (PRD-006).
- [ ] Edge-AI sales/inventory insights (activates after ~1 month of data).
- [ ] Deliverer & Customer interfaces maturation; GPS delivery tracking.

## Known Risks
- Branch divergence across many `fix/*`, `copilot/*`, and STIHL branded branches → drift risk.
- Sync conflict handling unproven at scale until the PRD-014 pilot completes.
- Anti-theft guarantees depend on the backend security re-audit landing.
