Section "Uninstall"
  ; Remove Registry Keys
  DeleteRegKey HKCU "Software\RetailManager"
  
  ; Remove AppData local temporary/cache folders
  RMDir /r "$LOCALAPPDATA\retail-manager"
  RMDir /r "$LOCALAPPDATA\com.retailmanager.app"
  RMDir /r "$LOCALAPPDATA\retail-manager-logs"
  ; NOTE: We deliberately DO NOT delete "$APPDATA\retail-manager" because it contains
  ; the client's local SQLite trading database (localbridge.sqlite) and backups.
  ; Client data must be preserved across updates and re-installs.
  
  ; Note: $INSTDIR is handled by Tauri automatically
SectionEnd
