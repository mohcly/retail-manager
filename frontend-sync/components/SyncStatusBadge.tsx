/**
 * SyncStatusBadge — Compact sync status indicator for header/navigation.
 *
 * Copy into frontend/src/components/shared/SyncStatusBadge.tsx
 *
 * Usage:
 *   <SyncStatusBadge status={syncStatus} onClick={() => navigate('/master/sync')} />
 *
 * Displays a small colored dot with pending queue count.
 */

import React from 'react';
import type { SyncStatus } from '../types/sync.types';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  onClick?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<
  SyncStatus['connection'],
  { color: string; bgColor: string; label: string }
> = {
  connected: {
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    label: 'Synced',
  },
  disconnected: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-400',
    label: 'Offline',
  },
  syncing: {
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    label: 'Syncing...',
  },
  error: {
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    label: 'Sync Error',
  },
};

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status,
  onClick,
  className = '',
}) => {
  const config = STATUS_CONFIG[status.connection];
  const hasPending = status.queueLength > 0;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      title={`${config.label}${hasPending ? ` — ${status.queueLength} pending` : ''}${status.lastError ? ` — ${status.lastError}` : ''}`}
    >
      {/* Status dot */}
      <span className="relative flex h-2.5 w-2.5">
        {status.connection === 'syncing' && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.bgColor} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.bgColor}`}
        />
      </span>

      {/* Label */}
      <span className={config.color}>{config.label}</span>

      {/* Pending count badge */}
      {hasPending && (
        <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold text-white bg-orange-500 rounded-full">
          {status.queueLength > 99 ? '99+' : status.queueLength}
        </span>
      )}
    </button>
  );
};

export default SyncStatusBadge;
