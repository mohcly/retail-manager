import { LocalDatabase } from './LocalDatabase';
import { getDataClient, smartFetch } from '@/lib/dataClient';
import { OfflineAuthService } from './OfflineAuthService';

interface SyncPushResult {
  pushed: number;
  failed: number;
  pending: number;
}

/**
 * LocalBridgeSyncService: The bridge between the local app and the Djati Cloud VPS.
 * It uses the Jati Sync Token (Private Key) to authenticate every request.
 */
export class LocalBridgeSyncService {
  
  private static async getCloudConfig() {
    try {
      const { localBridgeBaseUrl } = getDataClient();
      const headers = await OfflineAuthService.getAuthHeaders();
      if (!headers) return null;
      
      const res = await fetch(`${localBridgeBaseUrl}/rest/v1/system/env`, { headers });
      const data = await res.json();
      
      if (res.ok && data.config) {
        return {
          token: data.config.MASTER_TOKEN,
          machineId: data.config.MACHINE_ID,
          url: localStorage.getItem('jati_cloud_url') || 'https://djati-cloud-hub.moh-kuhh.workers.dev'
        };
      }
      return null;
    } catch (e) {
      console.error('Failed to get cloud config', e);
      return null;
    }
  }

  static async pushPendingMutations(): Promise<SyncPushResult> {
    const config = await this.getCloudConfig();
    const dataClient = getDataClient();
    
    if (!dataClient.isLocalFirst || !config || !config.token) {
      return { pushed: 0, failed: 0, pending: 0 };
    }

    await LocalDatabase.init();
    const queue = await LocalDatabase.getSyncQueue();
    const pendingLocal = queue.filter((item) => item.type === 'pending_mutation');

    let pushed = 0;
    let failed = 0;

    for (const item of pendingLocal) {
      const data = item.data || {};
      if (!data.entity || !data.payload) {
        await LocalDatabase.removeFromSyncQueue(item.id);
        continue;
      }

      try {
        const response = await fetch(`${config.url}/api/v1/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            store_id: data.store_id,
            machine_id: config.machineId || 'UNKNOWN',
            sync_token: config.token,
            sales: data.entity === 'sales' ? [data.payload] : [],
            inventory: data.entity === 'inventory' || data.entity === 'products' ? [data.payload] : []
          }),
        });

        if (response.ok) {
          await LocalDatabase.removeFromSyncQueue(item.id);
          pushed += 1;
        } else {
          failed += 1;
        }
      } catch (e) {
        failed += 1;
      }
    }

    const remainingLocal = (await LocalDatabase.getSyncQueue()).filter((item) => item.type === 'pending_mutation').length;

    return {
      pushed,
      failed,
      pending: remainingLocal,
    };
  }

  static async pullData(storeId?: string): Promise<{ pulled: number } | null> {
    try {
      const dataClient = getDataClient();
      const headers = await OfflineAuthService.getAuthHeaders();
      if (!headers) return null;

      // This branch pointed at `/rest/v1/sync/pull`, a path the local bridge
      // has never served - registerSyncRoutes mounts `/sync/pull` with no
      // prefix - so every pull 404'd here twice over: wrong path AND, on the
      // other branches, wrong method. Both are corrected; the backend now
      // answers GET and POST.
      const query = storeId ? `?store_id=${encodeURIComponent(storeId)}` : '';
      const response = await smartFetch(`${dataClient.localBridgeBaseUrl}/sync/pull${query}`, {
        method: 'POST',
        headers
      });

      if (!response.ok) return null;

      // The old code read `pulledSales`/`pulledInventory`, fields the route has
      // never returned, so a successful pull always reported 0 - which reads
      // exactly like a broken pull. Parse what the route actually sends.
      const result = await response.json().catch(() => null);
      const pulled = Number(result?.pulled) || 0;

      if (result?.tables?.length) {
        console.info('[LocalBridgeSyncService] pull:', result.tables);
      }
      if (result?.ok === false) {
        console.warn('[LocalBridgeSyncService] pull completed with failures:', result.tables?.filter((t: any) => t.error));
      }

      if (pulled > 0) {
        // Same event the modules already listen for after a local write, so a
        // pull that hydrates the catalogue does not leave every screen stale.
        window.dispatchEvent(new CustomEvent('localDbDataUpdated', { detail: { source: 'pull', pulled } }));
      }

      return { pulled };
    } catch (e) {
      console.error('Failed to pull data', e);
      return null;
    }
  }
}
