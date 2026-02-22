# Frontend Sync Integration

Ready-to-integrate React components, hooks, and services for the Offline→Online Sync MVP (PRD-014).

These files are designed to be copied into the `retailscope-pro` frontend repository.

## Files

| Source File | Copy To | Purpose |
|---|---|---|
| `types/sync.types.ts` | `src/types/sync.types.ts` | TypeScript interfaces for sync API responses |
| `services/SyncService.ts` | `src/services/SyncService.ts` | API client for `/sync/handshake` and `/sync/diagnostics` |
| `hooks/useSync.ts` | `src/hooks/useSync.ts` | React hook with polling, state management, and aggregated status |
| `components/SyncStatusBadge.tsx` | `src/components/shared/SyncStatusBadge.tsx` | Compact status indicator (dot + label + pending count) |
| `components/SyncDiagnosticsPanel.tsx` | `src/components/master/SyncDiagnosticsPanel.tsx` | Full admin diagnostics panel |

## Quick Integration

### 1. Copy files into the frontend repo

```bash
# From the retail-manager root:
cp frontend-sync/types/sync.types.ts    frontend/src/types/
cp frontend-sync/services/SyncService.ts frontend/src/services/
cp frontend-sync/hooks/useSync.ts       frontend/src/hooks/
cp frontend-sync/components/SyncStatusBadge.tsx frontend/src/components/shared/
cp frontend-sync/components/SyncDiagnosticsPanel.tsx frontend/src/components/master/
```

### 2. Fix import paths

After copying, update the relative imports in each file to match your project structure:

```typescript
// In SyncService.ts, update:
import type { ... } from '@/types/sync.types';

// In useSync.ts, update:
import { SyncService } from '@/services/SyncService';
import type { ... } from '@/types/sync.types';

// In SyncStatusBadge.tsx, update:
import type { SyncStatus } from '@/types/sync.types';

// In SyncDiagnosticsPanel.tsx, update:
import { useSync } from '@/hooks/useSync';
import { SyncStatusBadge } from '@/components/shared/SyncStatusBadge';
```

### 3. Add the status badge to your header/navigation

```tsx
// In your MasterLayout or Header component:
import { SyncStatusBadge } from '@/components/shared/SyncStatusBadge';
import { useSync } from '@/hooks/useSync';

function Header() {
  const { status } = useSync(activeStoreId, authToken);
  
  return (
    <header>
      {/* ... existing header content ... */}
      <SyncStatusBadge 
        status={status} 
        onClick={() => navigate('/master/sync')} 
      />
    </header>
  );
}
```

### 4. Add the diagnostics page/route

```tsx
// In your master routes:
import { SyncDiagnosticsPanel } from '@/components/master/SyncDiagnosticsPanel';

// Add route:
<Route 
  path="sync" 
  element={<SyncDiagnosticsPanel storeId={activeStoreId} token={authToken} />} 
/>
```

## Backend Requirements

These components require the following backend endpoints (already implemented in `local-bridge`):

- `GET /sync/handshake` — Returns server time, min client version, feature flags
- `GET /sync/diagnostics?store_id=...` — Returns outbox stats and sync state (requires `master` role JWT)

## Dependencies

- React 18+
- TypeScript 5+
- Tailwind CSS 3+ (for styling)
- No additional npm packages required

## API Response Shapes

### GET /sync/handshake
```json
{
  "server_time": "2026-02-22T15:13:18.360Z",
  "min_supported_client": "0.1.0",
  "feature_flags": {
    "push_enabled": true,
    "pull_enabled": true,
    "conflict_resolution": "server_wins"
  }
}
```

### GET /sync/diagnostics?store_id=abc123
```json
{
  "store_id": "abc123",
  "outbox": {
    "pending": 5,
    "sent": 0,
    "acked": 42,
    "failed": 1,
    "total": 48,
    "oldest_pending_at": "2026-02-22T14:30:00.000Z"
  },
  "sync_state": {
    "store_id": "abc123",
    "last_push_at": "2026-02-22T15:00:00.000Z",
    "last_pull_cursor": "1234",
    "last_success_at": "2026-02-22T15:00:00.000Z",
    "last_error": null
  }
}
```
