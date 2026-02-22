/**
 * Sync Types — Shared TypeScript interfaces for sync feature.
 * Copy into frontend/src/types/sync.types.ts
 */

/** Response from GET /sync/handshake */
export interface SyncHandshakeResponse {
  server_time: string;
  min_supported_client: string;
  feature_flags: {
    push_enabled: boolean;
    pull_enabled: boolean;
    conflict_resolution: string;
  };
}

/** Outbox queue statistics from GET /sync/diagnostics */
export interface SyncOutboxStats {
  pending: number;
  sent: number;
  acked: number;
  failed: number;
  total: number;
  oldest_pending_at: string | null;
}

/** Per-store sync state from GET /sync/diagnostics */
export interface SyncStateInfo {
  store_id: string;
  last_push_at: string | null;
  last_pull_cursor: string | null;
  last_success_at: string | null;
  last_error: string | null;
}

/** Full response from GET /sync/diagnostics?store_id=... */
export interface SyncDiagnosticsResponse {
  store_id: string;
  outbox: SyncOutboxStats;
  sync_state: SyncStateInfo;
}

/** Sync connection status */
export type SyncConnectionStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

/** Aggregated sync status for UI display */
export interface SyncStatus {
  connection: SyncConnectionStatus;
  queueLength: number;
  lastSuccessAt: string | null;
  lastError: string | null;
  serverTime: string | null;
}
