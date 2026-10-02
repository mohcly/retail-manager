use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_log::{Target, TargetKind};

mod patch;
mod license;
mod printer;
mod scanner;
use patch::{install_patch, get_app_version};
use license::{
  validate_license_command, 
  activate_license_command, 
  get_license_status_command, 
  get_device_hash_command
};
use printer::{
  discover_printers,
  set_default_printer,
  print_receipt,
  download_receipt
};
use scanner::{
  start_hardware_scan_listener,
  list_connected_scanners,
  simulate_hardware_scan
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_log::Builder::default()
      .targets([
        Target::new(TargetKind::Stdout),
        Target::new(TargetKind::LogDir { file_name: None }),
        Target::new(TargetKind::Webview),
      ])
      .build())
    .invoke_handler(tauri::generate_handler![
      install_patch, 
      get_app_version,
      validate_license_command,
      activate_license_command,
      get_license_status_command,
      get_device_hash_command,
      discover_printers,
      set_default_printer,
      print_receipt,
      download_receipt,
      start_hardware_scan_listener,
      list_connected_scanners,
      simulate_hardware_scan
    ])
    .setup(|app| {
      use std::fs::{self, OpenOptions};
      use std::io::Write;
      use std::path::PathBuf;
      let shell = app.shell();
      
      let mut log_path = if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
          PathBuf::from(local_app_data).join("retail-manager-logs")
      } else {
          std::env::temp_dir().join("retail-manager-logs")
      };
      
      if !log_path.exists() {
          let _ = fs::create_dir_all(&log_path);
      }
      log_path.push("tauri-debug.log");

      let mut file = OpenOptions::new().create(true).append(true).open(log_path).unwrap();
      let _ = writeln!(file, "App starting... {}", std::env::consts::ARCH);

      let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_default();

      let direct_sidecar = exe_dir.join(if cfg!(windows) { "local-bridge.exe" } else { "local-bridge" });
      let binaries_sidecar = exe_dir.join("binaries").join(if cfg!(windows) { "local-bridge.exe" } else { "local-bridge" });

      let _ = writeln!(file, "Exe dir: {:?}", exe_dir);
      let _ = writeln!(file, "Direct sidecar ({}): exists={}", direct_sidecar.display(), direct_sidecar.exists());
      let _ = writeln!(file, "Binaries sidecar ({}): exists={}", binaries_sidecar.display(), binaries_sidecar.exists());

      // Target selection: On Windows NSIS installs, externalBin is placed directly in exe_dir (local-bridge.exe).
      // In dev mode or specific bundling setups, it may reside in exe_dir/binaries/local-bridge.exe.
      let primary_target = if binaries_sidecar.exists() && !direct_sidecar.exists() {
        "binaries/local-bridge"
      } else {
        "local-bridge"
      };
      let fallback_target = if primary_target == "local-bridge" {
        "binaries/local-bridge"
      } else {
        "local-bridge"
      };

      let spawn_res = match shell.sidecar(primary_target) {
        Ok(cmd) => match cmd.spawn() {
          Ok(res) => {
            let _ = writeln!(file, "Spawned sidecar successfully with primary target: {}", primary_target);
            Ok(res)
          }
          Err(e) => {
            let _ = writeln!(file, "Failed to spawn primary target '{}': {}. Trying fallback '{}'...", primary_target, e, fallback_target);
            log::warn!("Failed to spawn primary sidecar target '{}': {}", primary_target, e);
            match shell.sidecar(fallback_target) {
              Ok(fallback_cmd) => match fallback_cmd.spawn() {
                Ok(res) => {
                  let _ = writeln!(file, "Spawned fallback target '{}' successfully.", fallback_target);
                  Ok(res)
                }
                Err(e2) => {
                  let _ = writeln!(file, "Failed to spawn fallback target '{}': {}", fallback_target, e2);
                  Err(e2)
                }
              },
              Err(e2) => {
                let _ = writeln!(file, "Failed to create fallback command for '{}': {}", fallback_target, e2);
                Err(e)
              }
            }
          }
        },
        Err(e) => {
          let _ = writeln!(file, "Failed to create sidecar command for '{}': {}. Trying fallback '{}'...", primary_target, e, fallback_target);
          match shell.sidecar(fallback_target) {
            Ok(fallback_cmd) => fallback_cmd.spawn(),
            Err(e2) => Err(e2),
          }
        }
      };

      match spawn_res {
        Ok((mut rx, _child)) => {
          let _ = writeln!(file, "Sidecar process active and logging setup.");
          tauri::async_runtime::spawn(async move {
            while let Some(event) = rx.recv().await {
              match event {
                CommandEvent::Stdout(line) => {
                  log::info!("Sidecar: {}", String::from_utf8_lossy(&line).trim());
                }
                CommandEvent::Stderr(line) => {
                  log::error!("Sidecar Error: {}", String::from_utf8_lossy(&line).trim());
                }
                CommandEvent::Terminated(payload) => {
                  let _ = writeln!(file, "Sidecar terminated with exit code: {:?}", payload.code);
                  log::warn!("Sidecar terminated with exit code: {:?}", payload.code);
                }
                _ => {}
              }
            }
          });
        }
        Err(e) => {
          let _ = writeln!(file, "CRITICAL: shell.sidecar spawn failed: {}. Attempting emergency std::process::Command spawn...", e);
          log::error!("CRITICAL: shell.sidecar spawn failed: {}. Attempting emergency std::process::Command spawn...", e);

          let emergency_path = if direct_sidecar.exists() {
            Some(direct_sidecar)
          } else if binaries_sidecar.exists() {
            Some(binaries_sidecar)
          } else {
            None
          };

          if let Some(bin_path) = emergency_path {
            #[allow(unused_mut)]
            let mut cmd = std::process::Command::new(&bin_path);
            #[cfg(windows)]
            {
              use std::os::windows::process::CommandExt;
              cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
            }
            match cmd.spawn() {
              Ok(_child) => {
                let _ = writeln!(file, "Emergency direct spawn succeeded for {:?}", bin_path);
                log::info!("Emergency direct spawn succeeded for {:?}", bin_path);
              }
              Err(err) => {
                let _ = writeln!(file, "Emergency direct spawn FAILED for {:?}: {}", bin_path, err);
                log::error!("Emergency direct spawn FAILED for {:?}: {}", bin_path, err);
              }
            }
          } else {
            let _ = writeln!(file, "Emergency spawn aborted: neither sidecar binary path exists on disk!");
            log::error!("Emergency spawn aborted: neither sidecar binary path exists on disk!");
          }
        }
      }

      log::info!("Tauri core initialized.");
      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|_app_handle, event| match event {
      tauri::RunEvent::ExitRequested { .. } => {
        // Tauri cleans up sidecars automatically, but the build() -> run() 
        // pattern ensures we have a hook if we need manual cleanup.
      }
      _ => {}
    });
}
