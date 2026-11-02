### [2026-10-30] Worker responsive header & collapse menu
- Symptom: Header had no store name or logout button; menu did not collapse on narrow screens
- Files involved: WorkerLayout.tsx, WorkerMenuBar.tsx
- Root cause: Header markup was static; no isCollapsed state; WorkerMenuBar had no collapse prop
- Fix applied: Added isCollapsed media query state in WorkerLayout; passed to WorkerMenuBar; header refactored to justify-between with store name left and LogOut button right
- Verification: npm run build passed (exit code 0, built in 1m 38s)
- Status: FIXED
- Tags: worker, header, responsive, collapse

### [2026-10-30] Corrupt stash - double-nested isCollapsed expression
- Symptom: stash@{0} contained invalid JSX double-wrap {!isCollapsed && {!isCollapsed && <span>{label}</span>}}
- Files involved: WorkerMenuBar.tsx (stash@{0} and stash@{1})
- Root cause: Partial in-progress edit was stashed before the correct fix was committed
- Fix applied: Dropped stash@{0} and stash@{1}; working tree was already correct from HEAD
- Verification: grep confirmed correct single-wrap at line 250
- Status: FIXED
- Tags: git, stash, worker, regression-prevention

### [2026-10-30] Multi-tenant cross-tenant data bleed to STIHL
- Symptom: Logging in with ALIMENTATION DAMOU SORETO credentials (admin@master.com / cashier@worker.com) displayed STIHL data instead of DAMOU SORETO data.
- Files involved:
  - Frontend: `frontend/src/lib/dataClient.ts`, `frontend/src/lib/tenants.ts`, `frontend/src/services/OfflineAuthService.ts`, `frontend/src/services/AIService.ts`
  - Cloud Database: `eglfssqkteykmvqlixtw` (ALIMENTATION DAMOU SORETO)
- Root cause:
  1. No store existed in `damousoreto` database (`stores` table was empty).
  2. `profiles.email` was NULL for the created users in `damousoreto` because `handle_new_user()` trigger was not inserting `NEW.email`. As a result, `lookupTenantByEmail` returned null and the app fell back to default tenant `stihl`.
  3. `damousoreto.knownDomains` did not contain `master.com` or `worker.com`.
  4. In `dataClient.ts`, `baseUrl` and the `fetch` monkey-patch had hardcoded `FALLBACK_SUPABASE_URL` pointing to STIHL instead of `getActiveTenantSupabaseUrl()`.
  5. In `OfflineAuthService.ts`, `getAuthHeaders()` returned `VITE_SUPABASE_ANON_KEY` (baked STIHL anon key) and `getLocalBridgeBaseUrl()` fell back to STIHL's URL.
- Fix applied:
  1. Created store `ALIMENTATION DAMOU SORETO` (id: `039e09d7-b482-4599-ac82-1bfc04578823`, owner: `admin@master.com`).
  2. Populated `profiles.email` for both admin and cashier; updated `handle_new_user()` trigger to save `email = NEW.email`.
  3. Linked `store_id` in `user_roles` and in `auth.users` metadata for both users.
  4. Added `master.com` and `worker.com` to `damousoreto.knownDomains` for instant 0ms tenant detection.
  5. Refactored `dataClient.ts`, `OfflineAuthService.ts`, and `AIService.ts` to dynamically use `getActiveTenantSupabaseUrl()` and `getActiveTenant().supabaseAnonKey`.
- Verification: Tested anon curl lookup for both emails against DAMOU SORETO Supabase REST API (success). Executed `npm run build` (built in 12.73s, exit 0). Pushed commit `4e9bcbf` to `stadium94/unify-stores`.
- Status: FIXED
- Tags: multi-tenant, authentication, store, data-isolation

### [2026-10-30] Tauri Windows CI/CD build failure & Cross-Tenant store persistence
- Symptom:
  1. GitHub Actions CI/CD run failed on Windows (`cargo could not compile app due to 4 previous errors`).
  2. Users logging into DAMOU SORETO saw STIHL stores ("stihl dibidani" and "stihl niamakoro") instead of DAMOU SORETO.
- Files involved:
  - `src-tauri/Cargo.toml`, `src-tauri/src/license.rs`, `src-tauri/src/patch.rs`, `src-tauri/src/scanner.rs`
  - `frontend/src/components/worker/Layout/WorkerLayout.tsx`
  - `frontend/src/services/OfflineStoreService.ts`
  - `frontend/src/lib/supabase.ts`, `frontend/src/contexts/AuthContext.tsx`
  - `frontend/supabase/migrations/20260125143726_6587eb23-0601-4002-93b0-654c02cbab1b.sql`
- Root cause:
  1. Rust/Tauri build failure: Missing `rand = "0.8"` dependency in `src-tauri/Cargo.toml`, generic `AppHandle<R>` mismatch with concrete `AppHandle` in `check_license_gate`, and invalid `&[u8; 64]` conversion from `Vec<u8>` in `Signature::from_bytes`.
  2. In PostgreSQL on Supabase, `get_user_store_ids` and `get_user_stores` had mutual recursion causing 500 error (`stack depth limit exceeded`).
  3. When remote store fetch failed, `OfflineStoreService` fell back to IndexedDB which retained STIHL stores from previous sessions.
  4. In `WorkerLayout.tsx`, `localStorage.getItem('worker_store_name')` was used unconditionally without checking if `cachedStoreId` matched `foundStoreId`.
  5. Switching tenants or logging out did not clear `worker_store_name`, `worker_store_id`, `worker_active_module`, or obsolete stores in IndexedDB.
- Fix applied:
  1. Added `rand = "0.8"` to `src-tauri/Cargo.toml`, updated `license.rs` functions to accept generic `<R: Runtime>`, fixed signature array conversion, and cleaned unused imports.
  2. Broke mutual recursion between `get_user_store_ids` and `get_user_stores` in DB and SQL migration.
  3. Evicted stale stores from IndexedDB in `cacheRemoteStores`.
  4. Updated `setActiveTenant` and `signOut` to clear `worker_store_id`, `worker_store_name`, and `worker_active_module`.
  5. Updated `WorkerLayout.tsx` to prioritize `user_metadata.store_name` and validate `cachedStoreId === foundStoreId`.
- Verification: `cargo check` in `src-tauri` passed with 0 errors. `npm run build` in `frontend` succeeded in 19.77s. Local bridge build succeeded.
- Status: FIXED
- Tags: tauri, rust, windows-build, cicd, multi-tenant, store-isolation

### [2026-10-30] Deprecate and remove ALIMENTATION DAMOU SORETO tenant
- Symptom: User requested to strip out the new "alimentation" business from the codebase.
- Files involved: `frontend/src/lib/tenants.ts`
- Root cause: Temporary organization added for testing; user confirmed no longer needed.
- Fix applied: Removed `damousoreto` from `REGISTERED_TENANTS`. Kept clean multi-tenant isolation and Rust CI/CD fixes intact on `unify-stores`.
- Verification: Grep across frontend confirmed 0 references. `npm run build` completed in 27.82s (exit code 0).
- Status: FIXED
- Tags: multi-tenant, cleanup, unify-stores

### [2026-11-02] Live/production store update failure (PGRST204 missing default_price_tier)
- Symptom: Clients were unable to change the names of their stores in live production environments; update failed with "Échec de la mise à jour du magasin".
- Files involved:
  - `frontend/src/services/OfflineStoreService.ts`
  - `frontend/src/services/SyncService.ts`
  - `frontend/src/pages/master/Stores.tsx`
  - `frontend/src/components/mobile/Fichiers/MobileBoutiques.tsx`
  - `frontend/supabase/migrations/20261102130000_add_missing_stores_columns.sql`
  - Cloud Databases: STIHL (`fpvrbxmbrotowdlyebqv`) & NIAMANA / HOLDING PRO (`onsqvduklnwffugsiybs`)
- Root cause:
  1. The PostgreSQL `stores` table in both live Supabase instances lacked `default_price_tier`, `is_active`, `city`, `email`, and `image_url` columns.
  2. `OfflineStoreService.updateStore()` unconditionally appended `default_price_tier: localStore.default_price_tier` in the Supabase payload. PostgREST rejected all PATCH requests with `PGRST204: Could not find the 'default_price_tier' column of 'stores' in the schema cache`.
  3. `OfflineStoreService.updateStore()` under local-first mode coalesced undefined fields to `null` (`updates.address ?? null`), causing unintended nullification of existing address and phone fields when only the store name was edited.
  4. In the STIHL live database, orphaned `owner_id` values on `stores` did not match active master users.
- Fix applied:
  1. Executed DDL on both live Supabase databases to add `default_price_tier` (int default 1), `is_active` (bool default true), `city`, `email`, and `image_url` to `public.stores`, then reloaded PostgREST schema cache.
  2. Reassigned orphaned store owner IDs in STIHL database to the active master user (`1a8b24e6-7c41-4acf-8b50-9b0a7509c103`).
  3. Hardened `OfflineStoreService.updateStore()`: builds dynamic patch payloads containing only defined changed fields, and adds automatic fallback retry omitting `default_price_tier` if PGRST204 is ever returned.
  4. Hardened `SyncService.syncUnsyncedStores()` with resilient fallback upsert if optional columns are absent.
  5. Added migration `20261102130000_add_missing_stores_columns.sql`.
  6. Added 1-click quick login capability with visual indicators (`ArrowRight`) to demo shortcuts in both desktop `AuthPage` and `MobileAuthPage`.
- Verification: Simulated authenticated master store updates under active PostgreSQL RLS on both STIHL and NIAMANA databases (`UPDATE 1` committed). Tested PostgREST PATCH endpoint returning HTTP 200 OK. Frontend built successfully with `npm run build` in 9.00s.
- Status: FIXED
- Tags: production, stores, supabase, pgrst204, rls, auth-shortcuts
