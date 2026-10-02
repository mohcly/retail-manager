# 🛠️ Branch Error Log: Stores Dubai / Niamana (`main-stores-dubai` / `main-niamana-dubai`)

*Organization: Magasin Niamana / Dubai*  
*Hardware: Windows 11 Touch POS Caisse Principale*

---

### [2026-07-31] Remise Theatre, Gros-Tier Pricing, & Cash Journal Discrepancies
- **Organization:** Stores Dubai / Niamana
- **Branch:** `main-niamana-dubai` / `main-stores-dubai`
- **Computer Role:** Caisse Principale
- **Operating System:** Windows 11 POS
- **Runtime Layer:** Frontend React / Fastify Local Bridge
- **Error Category:** PRICING_TIER / CASH_JOURNAL
- **Symptom:** Remise calculations displayed inaccurate amounts; gros-tier wholesale pricing failed to persist; cash journal sorting failed on missing `created_at` timestamps.
- **Files Involved:** `frontend/src/components/worker/Sales/`, `backend/local-bridge/src/db/repositories/sales.repo.ts`, `backend/local-bridge/src/db/repositories/cashJournal.repo.ts`
- **Root Cause:** Proforma sales grid failed to propagate secondary tier price coefficients, and cash journal queries fell back to string date comparison instead of timestamp ordering.
- **Fix Applied:** Enforced wholesale price mapping on multi-tier items, added fallback `created_at ?? date` in cash journal, and pinned store-scope ID on all sales queries.
- **Verification:** Verified end-to-end sales creation and `/settle` endpoint. Commit `ef532ca`.
- **Status:** FIXED

### [2026-09-25] Windows Desktop Sidecar Spawn Fallback & Niamana Dubai Store Attribution Port
- **Organization:** Stores Dubai / Niamana
- **Branch:** `main-niamana-dubai` / `main-stores-dubai`
- **Computer Role:** Caisse Principale
- **Operating System:** Windows 11 POS
- **Runtime Layer:** Tauri Desktop / Local Bridge
- **Error Category:** DESKTOP_SIDECAR / AUTH_STORE_ATTRIBUTION
- **Symptom:** In production NSIS builds, external binaries are flattened to root `exe_dir/local-bridge.exe`. Calling `.sidecar("local-bridge")` without checking disk existence failed. In addition, unassigned/master cloud logins generated arbitrary store UUIDs instead of binding to the Niamana Dubai store, and routes `/auth/sync-cloud-login` and `/auth/bootstrap-cloud` were missing.
- **Files Involved:** `src-tauri/capabilities/sidecar.json`, `src-tauri/src/lib.rs`, `scripts/prepare-sidecar-payload.ps1`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/services/OfflineAuthService.ts`, `backend/local-bridge/src/routes/auth.ts`
- **Root Cause:** Missing `local-bridge` permission in `sidecar.json`; single-target sidecar spawn without path existence checks; missing cloud sync login endpoints in `routes/auth.ts`; default unlinked store creation without regex matching `/niamana|dubai/i`.
- **Fix Applied:** Configured `sidecar.json` to permit both `local-bridge` and `binaries/local-bridge`; added dynamic on-disk existence detection and fallback spawn logic in `src-tauri/src/lib.rs` while preserving Sentry environment injection; added `npm prune --production` to payload script; implemented `/auth/sync-cloud-login` and `/auth/bootstrap-cloud` in `routes/auth.ts`; updated `AuthContext.tsx` and `OfflineAuthService.ts` to attribute cloud logins to Niamana Dubai.
- **Verification:** Built `backend/local-bridge` (`npm run build` -> exit 0), compiled frontend TypeScript and built bundle (`npx tsc --noEmit && npm run build` -> exit 0).
- **Status:** FIXED
- **Tags:** tauri, windows, sidecar, niamana, dubai, store-attribution

