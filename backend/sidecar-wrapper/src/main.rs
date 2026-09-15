use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::process::Command;
use std::env;
use std::path::PathBuf;

fn get_log_path() -> PathBuf {
    let path = if let Ok(local_app_data) = env::var("LOCALAPPDATA") {
        PathBuf::from(local_app_data).join("retail-manager-logs")
    } else {
        env::temp_dir().join("retail-manager-logs")
    };
    
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path.join("wrapper-debug.log")
}

fn main() {
    if let Err(e) = run() {
        let log_path = get_log_path();
        if let Ok(mut log_file) = OpenOptions::new().create(true).append(true).open(log_path) {
            let _ = writeln!(log_file, "CRITICAL ERROR: {}", e);
        }
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let log_path = get_log_path();
    let mut log_file = OpenOptions::new().create(true).append(true).open(log_path)?;

    writeln!(log_file, "--- Wrapper Starting (v2.2) ---")?;

    // Extract to a known temp directory
    let temp_dir = env::temp_dir().join("retail-manager-sidecar");
    writeln!(log_file, "Temp Dir: {:?}", temp_dir)?;
    
    // Create directory if it doesn't exist
    if !temp_dir.exists() {
        writeln!(log_file, "Creating temp dir...")?;
        fs::create_dir_all(&temp_dir)?;
    } else {
        writeln!(log_file, "Temp dir exists.")?;
    }

    // PROCESS & PORT CLEANUP
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let _ = writeln!(log_file, "Cleaning up existing sidecar processes and port 8787...");

        // 1. Terminate any stale processes running from temp_dir
        let mut sys = sysinfo::System::new_all();
        sys.refresh_all();
        for (_pid, process) in sys.processes() {
            if let Some(exe) = process.exe() {
                if exe.starts_with(&temp_dir) {
                    let _ = writeln!(log_file, "Killing stale process from temp_dir: {:?}", exe);
                    process.kill();
                }
            }
        }

        // 2. Kill any process holding port 8787 via PowerShell
        let _ = Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy", "Bypass",
                "-Command",
                "Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .status();
    }

    // Embed the architecture-specific payload zip
    // The PAYLOAD_FILE env var is set by the build script
    let payload = include_bytes!(env!("PAYLOAD_FILE"));
    let reader = std::io::Cursor::new(payload);
    let mut archive = zip::ZipArchive::new(reader)?;

    // Read version from zip if present
    let mut zip_version_str = None;
    if let Ok(mut zip_version_file) = archive.by_name("version.txt") {
        let mut ver = String::new();
        use std::io::Read;
        if zip_version_file.read_to_string(&mut ver).is_ok() {
            zip_version_str = Some(ver.trim().to_string());
        }
    }

    // VERSION CHECK: Compare version.txt in zip with version.txt in temp_dir
    let mut needs_extraction = true;
    let local_version_path = temp_dir.join("version.txt");
    let node_path = temp_dir.join("node.exe");
    let script_path = temp_dir.join("dist").join("index.js");
    
    if local_version_path.exists() && node_path.exists() && script_path.exists() {
        if let Some(ref z_ver) = zip_version_str {
            if let Ok(local_version) = fs::read_to_string(&local_version_path) {
                if z_ver == local_version.trim() {
                    needs_extraction = false;
                    writeln!(log_file, "Version matches ({}). Skipping extraction.", z_ver)?;
                } else {
                    writeln!(log_file, "Version mismatch (Local: {}, Zip: {}). Re-extracting...", local_version.trim(), z_ver)?;
                }
            }
        }
    }

    // EXTRACTION
    if needs_extraction {
        writeln!(log_file, "Extracting {} files...", archive.len())?;
        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let outpath = match file.enclosed_name() {
                Some(path) => temp_dir.join(path),
                None => continue,
            };

            // Don't extract version.txt during the loop; write it only when all files finish
            if outpath == local_version_path {
                continue;
            }

            // Check for directory (handles both / and \)
            if (*file.name()).ends_with('/') || (*file.name()).ends_with('\\') {
                let _ = fs::create_dir_all(&outpath);
            } else {
                if let Some(p) = outpath.parent() {
                    if !p.exists() {
                        let _ = fs::create_dir_all(p);
                    }
                }
                match fs::File::create(&outpath) {
                    Ok(mut outfile) => {
                        if let Err(e) = io::copy(&mut file, &mut outfile) {
                            let _ = writeln!(log_file, "Warning: failed to write {:?}: {}", outpath, e);
                        }
                    }
                    Err(e) => {
                        let _ = writeln!(log_file, "Warning: failed to create {:?}: {}", outpath, e);
                    }
                }
            }
        }

        // Write version.txt only after full extraction loop completes
        if let Some(ref z_ver) = zip_version_str {
            let _ = fs::write(&local_version_path, z_ver);
            let _ = writeln!(log_file, "Extraction complete. Wrote version: {}", z_ver);
        }
    }

    writeln!(log_file, "Node Path: {:?}", node_path)?;
    writeln!(log_file, "Script Path: {:?}", script_path)?;

    if !node_path.exists() {
        writeln!(log_file, "CRITICAL: node.exe not found at {:?}", node_path)?;
        return Err(format!("Critical Error: node.exe not found at {:?}", node_path).into());
    }

    if !script_path.exists() {
        writeln!(log_file, "CRITICAL: script not found at {:?}", script_path)?;
        return Err(format!("Critical Error: script not found at {:?}", script_path).into());
    }

    // Collect args passed to this executable
    let args: Vec<String> = env::args().skip(1).collect();
    writeln!(log_file, "Args: {:?}", args)?;

    writeln!(log_file, "Starting backend server via bundled Node...")?;
    writeln!(log_file, "Wrapper Architecture: {}", std::env::consts::ARCH)?;

    // Baked in at compile time from the SUPABASE_SERVICE_KEY_BUILD build-time
    // env var (set by CI from a repo secret) — the sidecar has no other way
    // to reach a key on a machine it's freshly installed on. See env.ts for
    // the corresponding fallback SUPABASE_URL (no secret needed there).
    let supabase_service_key = option_env!("SUPABASE_SERVICE_KEY_BUILD").unwrap_or("");

    // Spawn the node process
    #[cfg(windows)]
    use std::os::windows::process::CommandExt;
    #[cfg(windows)]
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let mut cmd = Command::new(&node_path);
    cmd.arg(&script_path)
       .args(args)
       .current_dir(&temp_dir) // Important for require() resolution
       .env("SUPABASE_SERVICE_KEY", supabase_service_key);

    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let child = cmd.spawn();

    match child {
        Ok(mut child) => {
            let child_id = child.id();
            writeln!(log_file, "Node process spawned successfully (PID: {:?})", child_id)?;
            
            // Get current process info to find parent
            let current_pid = std::process::id();
            
            // WATCHDOG thread: Terminate if parent process dies
            std::thread::spawn(move || {
                use sysinfo::{System, Pid};
                let mut sys = System::new_all();
                
                // Find our parent PID
                let parent_pid = sys.process(Pid::from_u32(current_pid))
                    .and_then(|p| p.parent());

                if let Some(ppid) = parent_pid {
                    loop {
                        std::thread::sleep(std::time::Duration::from_secs(3));
                        sys.refresh_all();
                        if sys.process(ppid).is_none() {
                            // Parent is gone! Kill children and exit.
                            std::process::exit(0);
                        }
                    }
                }
            });

            #[cfg(windows)]
            {
                use windows_sys::Win32::System::JobObjects::*;
                use windows_sys::Win32::Foundation::*;
                use std::mem;
                use std::os::windows::io::AsRawHandle;

                unsafe {
                    let job = CreateJobObjectA(std::ptr::null(), std::ptr::null());
                    if job != 0 {
                        let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = mem::zeroed();
                        info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
                        
                        SetInformationJobObject(
                            job,
                            JobObjectExtendedLimitInformation,
                            &info as *const _ as *const _,
                            mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
                        );

                        let handle = child.as_raw_handle();
                        AssignProcessToJobObject(job, handle as HANDLE);
                    }
                }
            }

            // Wait for it to finish (keep this process alive)
            let status = child.wait()?;
            writeln!(log_file, "Node process exited with status: {:?}", status)?;
        }
        Err(e) => {
             writeln!(log_file, "FAILED to spawn node process: {}", e)?;
             return Err(e.into());
        }
    }

    Ok(())
}