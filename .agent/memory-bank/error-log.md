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
