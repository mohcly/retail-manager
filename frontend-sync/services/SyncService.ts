/**
 * SyncService — API client for sync endpoints on LocalBridge.
 *
 * Copy into frontend/src/services/SyncService.ts
 *
 * Usage:
 *   import { SyncService } from '@/services/SyncService';
 *   const handshake = await SyncService.handshake();
 *   const diagnostics = await SyncService.getDiagnostics('store-id', token);
 */

import type {
  SyncHandshakeResponse,
  SyncDiagnosticsResponse,
} from '../types/sync.types';

const LOCAL_BRIDGE_BASE =
  typeof window !== 'undefined' &&
  (window as any).__LOCAL_BRIDGE_URL__
    ? (window as any).__LOCAL_BRIDGE_URL__
    : 'http://127.0.0.1:8787';

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(`${LOCAL_BRIDGE_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        error:
          (body as any).message ??
          (body as any).error ??
          `HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as T;
    return { data };
  } catch (err: any) {
    return { error: err?.message ?? 'Network error' };
  }
}

export class SyncService {
  /**
   * GET /sync/handshake — no auth required.
   * Returns server time, min client version, and feature flags.
   */
  static async handshake(): Promise<{
    data?: SyncHandshakeResponse;
    error?: string;
  }> {
    return apiFetch<SyncHandshakeResponse>('/sync/handshake');
  }

  /**
   * GET /sync/diagnostics?store_id=...
   * Requires master role JWT.
   */
  static async getDiagnostics(
    storeId: string,
    token: string
  ): Promise<{ data?: SyncDiagnosticsResponse; error?: string }> {
    return apiFetch<SyncDiagnosticsResponse>(
      `/sync/diagnostics?store_id=${encodeURIComponent(storeId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }
}
