/**
 * useSync — React hook for managing sync diagnostics state.
 *
 * Copy into frontend/src/hooks/useSync.ts
 *
 * Usage:
 *   const { status, diagnostics, loading, error, refresh } = useSync(storeId, token);
 *
 * The hook polls /sync/diagnostics every `pollInterval` ms (default 30s)
 * and performs a one-time /sync/handshake on mount.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SyncService } from '../services/SyncService';
import type {
  SyncDiagnosticsResponse,
  SyncHandshakeResponse,
  SyncStatus,
} from '../types/sync.types';

interface UseSyncOptions {
  /** Polling interval in ms. Default: 30000 (30s). Set to 0 to disable polling. */
  pollInterval?: number;
  /** Whether the hook is enabled. Default: true. */
  enabled?: boolean;
}

interface UseSyncReturn {
  /** Aggregated sync status for UI badges / indicators */
  status: SyncStatus;
  /** Full diagnostics response (outbox stats + sync state) */
  diagnostics: SyncDiagnosticsResponse | null;
  /** Handshake response (server capabilities) */
  handshake: SyncHandshakeResponse | null;
  /** Whether a fetch is in progress */
  loading: boolean;
  /** Last error message, if any */
  error: string | null;
  /** Manually trigger a refresh */
  refresh: () => void;
}

export function useSync(
  storeId: string | null | undefined,
  token: string | null | undefined,
  options: UseSyncOptions = {}
): UseSyncReturn {
  const { pollInterval = 30_000, enabled = true } = options;

  const [diagnostics, setDiagnostics] =
    useState<SyncDiagnosticsResponse | null>(null);
  const [handshake, setHandshake] =
    useState<SyncHandshakeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derive aggregated status
  const status: SyncStatus = {
    connection: error
      ? 'error'
      : loading
        ? 'syncing'
        : diagnostics
          ? 'connected'
          : 'disconnected',
    queueLength: diagnostics?.outbox.pending ?? 0,
    lastSuccessAt: diagnostics?.sync_state.last_success_at ?? null,
    lastError: diagnostics?.sync_state.last_error ?? error,
    serverTime: handshake?.server_time ?? null,
  };

  const fetchDiagnostics = useCallback(async () => {
    if (!storeId || !token) return;

    setLoading(true);
    const result = await SyncService.getDiagnostics(storeId, token);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setDiagnostics(result.data);
      setError(null);
    }
  }, [storeId, token]);

  const fetchHandshake = useCallback(async () => {
    const result = await SyncService.handshake();
    if (result.data) {
      setHandshake(result.data);
    }
  }, []);

  // One-time handshake on mount
  useEffect(() => {
    if (!enabled) return;
    fetchHandshake();
  }, [enabled, fetchHandshake]);

  // Initial fetch + polling
  useEffect(() => {
    if (!enabled || !storeId || !token) return;

    fetchDiagnostics();

    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchDiagnostics, pollInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, storeId, token, pollInterval, fetchDiagnostics]);

  const refresh = useCallback(() => {
    fetchHandshake();
    fetchDiagnostics();
  }, [fetchHandshake, fetchDiagnostics]);

  return { status, diagnostics, handshake, loading, error, refresh };
}
