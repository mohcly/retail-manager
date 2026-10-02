# 🛠️ Branch Error Log: STIHL Dibidani (`main-stihl-dibidani`)

*Organization: Magasin STIHL Dibidani*  
*Hardware: Windows 11 Touch POS Caisse 1, Windows Desktop Bureau Gérant*

---

### [2026-09-14] Desktop Build Sync & Cloud Auth Endpoints Missing
- **Organization:** STIHL Dibidani
- **Branch:** `main-stihl-dibidani`
- **Computer Role:** Bureau Gérant / Caisse 1
- **Operating System:** Windows 11 POS
- **Runtime Layer:** Local Bridge Fastify / SQLite
- **Error Category:** NETWORK_OFFLINE / AUTH_SYNC
- **Symptom:** Multi-device login failed on secondary computers in Dibidani. Local SQLite database had no record of cloud-authenticated users.
- **Files Involved:** `backend/local-bridge/src/routes/auth.ts`, `backend/local-bridge/src/index.ts`
- **Root Cause:** Routes `/auth/sync-cloud-login` and `/auth/bootstrap-cloud` were not implemented in Dibidani branch, and `GET /health` lacked `isBootstrapped` flag.
- **Fix Applied:** Ported cloud sync login schemas and handlers into `routes/auth.ts` and updated `/health` endpoint to reflect master user bootstrap status.
- **Verification:** Fastify route injection tested (200 OK), clean local-bridge `npm run build` and frontend `npm run build`. Pushed commit `5ab4529` to `stadium91/retail-manager`. Windows CI Run [34842673413](https://github.com/stadium91/retail-manager/actions/runs/34842673413).
- **Status:** FIXED

### [2026-09-25] Windows Desktop Sidecar Spawn Fallback & Dibidani Store Attribution Port
- **Organization:** STIHL Dibidani
- **Branch:** `main-stihl-dibidani`
- **Computer Role:** Bureau Gérant / Caisse 1
- **Operating System:** Windows 11 POS
- **Runtime Layer:** Tauri Desktop / Local Bridge
- **Error Category:** DESKTOP_SIDECAR / AUTH_STORE_ATTRIBUTION
- **Symptom:** In production NSIS builds, external binaries are flattened to root `exe_dir/local-bridge.exe`. Calling `.sidecar("local-bridge")` without checking disk existence failed. In addition, unassigned/master cloud logins generated arbitrary store UUIDs instead of binding to the STIHL Dibidani store.
- **Files Involved:** `src-tauri/capabilities/sidecar.json`, `src-tauri/src/lib.rs`, `scripts/prepare-sidecar-payload.ps1`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/services/OfflineAuthService.ts`, `backend/local-bridge/src/routes/auth.ts`
- **Root Cause:** Missing `local-bridge` permission in `sidecar.json`; single-target sidecar spawn without path existence checks; default unlinked store creation without regex matching `/dibidani/i`.
- **Fix Applied:** Configured `sidecar.json` to permit both `local-bridge` and `binaries/local-bridge`; added dynamic on-disk existence detection and fallback spawn logic in `src-tauri/src/lib.rs`; added `npm prune --production` to payload script; updated `AuthContext.tsx`, `OfflineAuthService.ts`, and `routes/auth.ts` to attribute cloud logins to STIHL Dibidani.
- **Verification:** Built `backend/local-bridge` (`npm run build` -> exit 0), compiled frontend TypeScript and built bundle (`npx tsc --noEmit && npm run build` -> exit 0).
- **Status:** FIXED
- **Tags:** tauri, windows, sidecar, dibidani, store-attribution

