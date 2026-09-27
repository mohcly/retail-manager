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
