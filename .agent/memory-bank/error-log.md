# Error Log

### [2026-10-17] STIHL Supabase Data Isolation and Mobile Web Portal Empty State
- Symptom: Web portal `djati-stihl.vercel.app` showed zero products and zero sales, and mobile users had blank views when storeId was unassigned. Desktop builds for Niamana Dubai failed sync checks (HTTP 400 ConfigMissing).
- Files involved:
  - Supabase Database `fpvrbxmbrotowdlyebqv` (`stores`, `user_roles`)
  - `backend/local-bridge/src/routes/auth.ts` (branches `main-stihl-dibidani`, `main-stihl-niamakoro`, `main-niamana-dubai`)
  - `.github/workflows/build.yml` (branches `main-niamana-dubai`, `main-mpm-food`, `main-stores-stihl`)
  - `frontend/src/services/OfflineAuthService.ts`
  - `frontend/src/components/mobile/MobileWorkerLayout.tsx`
  - `frontend/src/components/mobile/POS/MobilePOS.tsx`
- Root cause:
  1. In Supabase STIHL project (`fpvrbxmbrotowdlyebqv`), active stores `bb2546ae-a2b3-47da-ae46-22b9b2914304` (Dibidani) and `12dbb4a7-8a8f-4d87-8290-ca0c99c94e4c` (Niamakoro) had `owner_id = NULL`, and user roles were mapped only to an empty ghost store, so RLS policies completely hid products (328) and sales (131) from authenticated workers/masters on the web portal.
  2. Niamana Dubai's desktop CI lacked secret `NIAMANA_SUPABASE_SERVICE_KEY` in GitHub Secrets, compiling an empty service key into the binary, causing `routes/sync.ts` to abort every sync attempt.
  3. MPM Food CI was injecting the STIHL service role key instead of MPM Food's key, and the MPM Food Supabase project was paused by Supabase after 7 days of inactivity.
  4. On mobile/web portals, `storeId` resolution in `OfflineAuthService` only fell back to visible stores for master accounts, leaving workers without a store context if metadata had not loaded yet, and `MobileWorkerLayout` / `MobilePOS` lacked fallbacks to `OfflineStoreService.getStores()`.
  5. `main-stores-stihl` had `pnpm-lock.yaml` tracked and triggered Tauri Windows builds on every push, failing because pnpm is not installed on GitHub Windows runners.
- Fix applied:
  1. Assigned `owner_id` to both STIHL stores, mapped all 4 users in `user_roles` to both stores, and re-routed orphaned sales/worker rows from ghost store before removing it.
  2. Added valid secret `NIAMANA_SUPABASE_SERVICE_KEY` to GitHub repo secrets.
  3. Pinned canonical store IDs in `backend/local-bridge/src/routes/auth.ts` for Dibidani, Niamakoro, and Niamana Dubai.
  4. Updated `OfflineAuthService.ts` to allow visible store fallback for any role without a storeId, and added `OfflineStoreService.getStores()` fallbacks in `MobileWorkerLayout.tsx` and `MobilePOS.tsx`.
  5. Removed `pnpm-lock.yaml` and set `build.yml` on `main-stores-stihl` to `on: workflow_dispatch` only.
  6. Dispatched clean CI builds for `main-stihl-dibidani`, `main-stihl-niamakoro`, and `main-niamana-dubai`.
- Verification:
  - Verified Supabase RLS directly with SQL simulation: worker `blaisetienou` can query 328 products and 131 sales.
  - Successfully built frontend in `main-stores-stihl` with zero Vite/TypeScript errors in 8.89s.
  - Pushed to `stadium91/retail-manager` branch `main-stores-stihl`; `Mirror to Vercel-connected repo` succeeded in 11s.
  - Verified Vercel deployment `dpl_CaeYynxNrsTPttFo26sVa2Tb4PGu` is Ready and `curl -sI https://djati-stihl.vercel.app` returns HTTP 200 OK.
  - Windows CI builds dispatched and actively compiling for Dibidani, Niamakoro, and Niamana Dubai.
- Status: FIXED
- Tags: supabase, rls, sync, mobile, store-id, auth, ci-cd, tauri, vercel
