# Error Log

### [2026-09-23] Windows Sidecar Spawn Failure on main-stihl-niamakoro
- Symptom: App starts on Windows with error toast "Cloud: Invalid login credentials. Local: Failed to fetch (127.0.0.1:8787)". No Windows Defender Firewall prompt appears.
- Files involved: `src-tauri/src/lib.rs`
- Root cause:
  1. `tauri_plugin_shell::Shell::sidecar()` constructs command paths relative to `exe_dir` without validating file existence on disk at creation time.
  2. Calling `.sidecar("binaries/local-bridge").or_else(...)` always returned `Ok(Command pointing to binaries\local-bridge.exe)`, bypassing the `or_else` branch.
  3. In Windows NSIS installations, Tauri flattens external binaries directly into `exe_dir\local-bridge.exe`.
  4. At runtime, `cmd.spawn()` on `binaries\local-bridge.exe` threw `os error 2: The system cannot find the file specified`. The sidecar process never launched, port 8787 never opened, and no firewall prompt was triggered.
  5. The cloud login failure occurred because credentials typed did not match accounts assigned to STIHL Niamakoro in Supabase project `fpvrbxmbrotowdlyebqv`.
- Fix applied: Updated `src-tauri/src/lib.rs` to dynamically verify on-disk existence of `direct_sidecar` (`exe_dir\local-bridge.exe`) vs `binaries_sidecar` (`exe_dir\binaries\local-bridge.exe`), select the correct target, add a retry on the alternate target if spawn fails, and include an emergency `std::process::Command` fallback.
- Verification: Ran `cargo check` in `src-tauri`; validated clean compilation without warnings or errors.
- Status: FIXED
- Tags: tauri, windows, sidecar, local-bridge, nsis, networking

### [2026-09-25] Store Attribution & Random Store UUID Fallback on New Client Installations
- Symptom: When installing the app on a new device (e.g. family laptop) and signing in with an account having no pre-configured store_id in user_roles (such as a master account), the system generated a random UUID and created a generic 'Retail Store', isolating the device from the target store (STIHL Niamakoro) and causing empty sync pulls.
- Files involved: `frontend/src/contexts/AuthContext.tsx`, `frontend/src/services/OfflineAuthService.ts`, `backend/local-bridge/src/routes/auth.ts`
- Root cause:
  1. `AuthContext.tsx` and `OfflineAuthService.ts` lacked logic to resolve default target store from Supabase when `store_id` was absent on the user metadata/role, defaulting instead to `crypto.randomUUID()`.
  2. `backend/local-bridge/src/routes/auth.ts` created fallback stores titled generic `'Store'` with random UUIDs.
- Fix applied:
  1. Updated `AuthContext.tsx` to query cloud stores from Supabase and specifically resolve to the Niamakoro store (`/niamakoro/i`) before falling back.
  2. Updated `OfflineAuthService.ts` (`localBridgeSignIn` and session restore) to resolve the Niamakoro store from Supabase when `store_id` is missing.
  3. Updated `backend/local-bridge/src/routes/auth.ts` fallback store names to `'STIHL Niamakoro'`.
- Verification: Ran both `npm --prefix frontend run build` (vite build passed in 12.32s) and `npm --prefix backend/local-bridge run build` (tsc passed cleanly).
- Status: FIXED
- Tags: auth, multi-device, store-attribution, niamakoro, supabase, local-bridge

