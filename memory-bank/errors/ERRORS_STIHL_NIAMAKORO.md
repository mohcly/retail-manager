# 🛠️ Branch Error Log: STIHL Niamakoro (`main-stihl-niamakoro`)

*Organization: Magasin STIHL Niamakoro*  
*Hardware: Windows 11 POS (Caisse 1 / Caisse 2 / Bureau Gérant)*

---

### [2026-09-14] Desktop Sidecar Launch Failure & Missing Port Binding (127.0.0.1:8787)
- **Organization:** STIHL Niamakoro
- **Branch:** `main-stihl-niamakoro`
- **Computer Role:** Caisse 1 / Caisse 2
- **Operating System:** Windows 11 POS
- **Runtime Layer:** Tauri Rust Wrapper (`src-tauri`) & Local Bridge
- **Error Category:** NETWORK_OFFLINE / LAUNCHER_CRASH
- **Symptom:** Windows desktop app failed on startup with `Cloud: Invalid login credentials. Local: Failed to fetch (127.0.0.1:8787)` and Windows Defender Firewall never prompted for port 8787 permissions.
- **Files Involved:** `src-tauri/capabilities/sidecar.json`, `src-tauri/src/lib.rs`, `backend/sidecar-wrapper/src/main.rs`, `scripts/prepare-sidecar-payload.ps1`
- **Root Cause:** Capability mismatch: `sidecar.json` authorized `"binaries/local-bridge"`, while `src/lib.rs` called `shell.sidecar("local-bridge")`, causing Tauri v2 to deny spawning before execution. Wrapper also had blocking process extraction issues.
- **Fix Applied:** Permitted both forms in `sidecar.json` and added runtime fallback in `src/lib.rs`. Hardened wrapper with `sysinfo` process cleanup and added `npm prune --production`.
- **Verification:** `cargo check` clean on wrapper, `npm run build` clean on local-bridge and frontend. Committed `2c345ce` and pushed to `stadium91/retail-manager`. Windows CI Run [34975549482](https://github.com/stadium91/retail-manager/actions/runs/34975549482).
- **Status:** FIXED

---

### [2026-09-25] Store Attribution & Random Store UUID Fallback on New Client Installations
- **Organization:** STIHL Niamakoro
- **Branch:** `main-stihl-niamakoro`
- **Computer Role:** Bureau Gérant / Laptop Famille
- **Operating System:** Windows 11 POS / Windows 10
- **Runtime Layer:** Frontend React/Vite & Local Bridge Fastify/SQLite
- **Error Category:** SQLITE_SYNC / MULTI_DEVICE_AUTH
- **Symptom:** When installing the app on a new device (e.g. family laptop) and signing in with an account having no pre-configured `store_id` in `user_roles` (such as a master account), the system generated a random UUID and created a generic `'Retail Store'`, isolating the device from STIHL Niamakoro and causing empty `/sync/pull` results.
- **Files Involved:** `frontend/src/contexts/AuthContext.tsx`, `frontend/src/services/OfflineAuthService.ts`, `backend/local-bridge/src/routes/auth.ts`
- **Root Cause:** `AuthContext.tsx` and `OfflineAuthService.ts` lacked logic to resolve the target branch store from Supabase when `store_id` was absent on the user metadata/role, defaulting instead to `crypto.randomUUID()`. Local bridge fallback also created generic `'Store'` rows.
- **Fix Applied:**
  1. Updated `AuthContext.tsx` to query cloud stores from Supabase and specifically resolve to the Niamakoro store (`/niamakoro/i`) before falling back.
  2. Updated `OfflineAuthService.ts` (`localBridgeSignIn` and session restore) to resolve the Niamakoro store from Supabase when `store_id` is missing.
  3. Updated `backend/local-bridge/src/routes/auth.ts` fallback store names to `'STIHL Niamakoro'`.
- **Verification:** `cd backend/local-bridge && npm run build` (exit 0), `cd frontend && npx tsc --noEmit && npm run build` (exit 0). Committed `d494c93` / `2f2c3cc`.
- **Status:** FIXED

