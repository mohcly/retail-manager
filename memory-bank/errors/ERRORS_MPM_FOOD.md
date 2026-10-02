# 🛠️ Branch Error Log: MPM Food Restaurant (`main-mpm-food`)

*Organization: Restaurant MPM Food*  
*Hardware: Windows POS Caisse Bar/Accueil, Tablettes Android Serveurs/Cuisine*

---

### [2026-07-31] Offline Data Service Missing Supabase Import & Fragment Syntax Errors
- **Organization:** MPM Food Restaurant
- **Branch:** `main-mpm-food`
- **Computer Role:** Caisse Bar / Salle
- **Operating System:** Windows 10 / Android
- **Runtime Layer:** Frontend React / OfflineDataService
- **Error Category:** NETWORK_OFFLINE / COMPILER_ERROR
- **Symptom:** Offline data syncing threw unresolved reference error for `supabase`. Dead fragment files under `GestionModuleComponents/` triggered syntax warnings.
- **Files Involved:** `frontend/src/services/OfflineDataService.ts`, `frontend/src/components/worker/Modules/GestionModuleComponents/GestionModuleMain.tsx`
- **Root Cause:** Missing `supabase` client import in `OfflineDataService.ts` after refactor. Dead fragment components referenced outdated re-exports.
- **Fix Applied:** Inlined missing `supabase` client instance; routed Gestion updates exclusively through `GestionModuleMain.tsx`.
- **Verification:** Verified with scoped tsconfig against baseline worktree: clean compilation. Pushed commit `375db8e` to stadium91.
- **Status:** FIXED

### [2026-09-25] Windows Desktop Sidecar Spawn Fallback & MPM Food Store Attribution Port
- **Organization:** MPM Food Restaurant
- **Branch:** `main-mpm-food`
- **Computer Role:** Caisse Bar / Salle
- **Operating System:** Windows 10 / Android
- **Runtime Layer:** Tauri Desktop / Local Bridge
- **Error Category:** DESKTOP_SIDECAR / AUTH_STORE_ATTRIBUTION
- **Symptom:** In production NSIS builds, external binaries are flattened to root `exe_dir/local-bridge.exe`. Calling `.sidecar("local-bridge")` without checking disk existence failed. In addition, unassigned/master cloud logins generated arbitrary store UUIDs instead of binding to the Restaurant MPM Food restaurant, and routes `/auth/sync-cloud-login` and `/auth/bootstrap-cloud` were missing.
- **Files Involved:** `src-tauri/capabilities/sidecar.json`, `src-tauri/src/lib.rs`, `scripts/prepare-sidecar-payload.ps1`, `backend/local-bridge/src/index.ts`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/services/OfflineAuthService.ts`, `backend/local-bridge/src/routes/auth.ts`
- **Root Cause:** Missing `local-bridge` permission in `sidecar.json`; single-target sidecar spawn without path existence checks; missing cloud sync login endpoints in `routes/auth.ts`; missing `isBootstrapped` check in `/health`; default unlinked store creation without regex matching `/mpm|food/i`.
- **Fix Applied:** Configured `sidecar.json` to permit both `local-bridge` and `binaries/local-bridge`; added dynamic on-disk existence detection and fallback spawn logic in `src-tauri/src/lib.rs`; added `npm prune --production` to payload script; implemented `/auth/sync-cloud-login` and `/auth/bootstrap-cloud` in `routes/auth.ts`; updated `/health` with `isBootstrapped`; updated `AuthContext.tsx` and `OfflineAuthService.ts` to attribute cloud logins to MPM Food.
- **Verification:** Built `backend/local-bridge` (`npm run build` -> exit 0), compiled frontend TypeScript and built bundle (`npx tsc --noEmit && npm run build` -> exit 0).
- **Status:** FIXED
- **Tags:** tauri, windows, sidecar, mpm, food, store-attribution

