/**
 * SyncDiagnosticsPanel — Admin-only sync monitoring panel.
 *
 * Copy into frontend/src/components/master/SyncDiagnosticsPanel.tsx
 *
 * Usage:
 *   <SyncDiagnosticsPanel storeId={activeStoreId} token={authToken} />
 *
 * Shows: outbox queue stats, sync state, server capabilities, and a manual refresh button.
 * Designed for the PRD-014 "hidden Sync Diagnostics panel for admins".
 */

import React from 'react';
import { useSync } from '../hooks/useSync';
import { SyncStatusBadge } from './SyncStatusBadge';

interface SyncDiagnosticsPanelProps {
  storeId: string;
  token: string;
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
}

function timeAgo(ts: string | null): string {
  if (!ts) return '';
  try {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
  } catch {
    return '';
  }
}

export const SyncDiagnosticsPanel: React.FC<SyncDiagnosticsPanelProps> = ({
  storeId,
  token,
}) => {
  const { status, diagnostics, handshake, loading, error, refresh } = useSync(
    storeId,
    token,
    { pollInterval: 15_000 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Sync Diagnostics
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor offline→online sync queue and status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SyncStatusBadge status={status} />
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-300">
              {error}
            </span>
          </div>
        </div>
      )}

      {/* Outbox Queue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Pending"
          value={diagnostics?.outbox.pending ?? 0}
          color="text-orange-600"
          bgColor="bg-orange-50 dark:bg-orange-900/20"
          description="Waiting to sync"
        />
        <StatCard
          label="Sent"
          value={diagnostics?.outbox.sent ?? 0}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
          description="In transit"
        />
        <StatCard
          label="Acknowledged"
          value={diagnostics?.outbox.acked ?? 0}
          color="text-green-600"
          bgColor="bg-green-50 dark:bg-green-900/20"
          description="Successfully synced"
        />
        <StatCard
          label="Failed"
          value={diagnostics?.outbox.failed ?? 0}
          color="text-red-600"
          bgColor="bg-red-50 dark:bg-red-900/20"
          description="Needs attention"
        />
      </div>

      {/* Sync State Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sync Timeline */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
            Sync Timeline
          </h3>
          <dl className="space-y-3">
            <InfoRow
              label="Last Push"
              value={formatTimestamp(
                diagnostics?.sync_state.last_push_at ?? null
              )}
              secondary={timeAgo(
                diagnostics?.sync_state.last_push_at ?? null
              )}
            />
            <InfoRow
              label="Last Success"
              value={formatTimestamp(
                diagnostics?.sync_state.last_success_at ?? null
              )}
              secondary={timeAgo(
                diagnostics?.sync_state.last_success_at ?? null
              )}
            />
            <InfoRow
              label="Pull Cursor"
              value={diagnostics?.sync_state.last_pull_cursor ?? '—'}
            />
            <InfoRow
              label="Oldest Pending"
              value={formatTimestamp(
                diagnostics?.outbox.oldest_pending_at ?? null
              )}
              secondary={timeAgo(
                diagnostics?.outbox.oldest_pending_at ?? null
              )}
            />
          </dl>
        </div>

        {/* Server Capabilities */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
            Server Capabilities
          </h3>
          {handshake ? (
            <dl className="space-y-3">
              <InfoRow
                label="Server Time"
                value={formatTimestamp(handshake.server_time)}
              />
              <InfoRow
                label="Min Client Version"
                value={handshake.min_supported_client}
              />
              <InfoRow
                label="Push"
                value={
                  handshake.feature_flags.push_enabled
                    ? '✅ Enabled'
                    : '❌ Disabled'
                }
              />
              <InfoRow
                label="Pull"
                value={
                  handshake.feature_flags.pull_enabled
                    ? '✅ Enabled'
                    : '❌ Disabled'
                }
              />
              <InfoRow
                label="Conflict Resolution"
                value={handshake.feature_flags.conflict_resolution}
              />
            </dl>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Handshake not yet completed
            </p>
          )}
        </div>
      </div>

      {/* Last Error */}
      {diagnostics?.sync_state.last_error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 p-5">
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">
            Last Sync Error
          </h3>
          <pre className="text-sm text-red-600 dark:text-red-300 font-mono whitespace-pre-wrap break-words">
            {diagnostics.sync_state.last_error}
          </pre>
        </div>
      )}

      {/* Queue total */}
      <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Total outbox entries: {diagnostics?.outbox.total ?? 0} · Store:{' '}
        {storeId}
      </div>
    </div>
  );
};

/* ── Sub-components ── */

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  color,
  bgColor,
  description,
}) => (
  <div className={`rounded-lg p-4 ${bgColor}`}>
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {label}
    </p>
    <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
      {description}
    </p>
  </div>
);

interface InfoRowProps {
  label: string;
  value: string;
  secondary?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, secondary }) => (
  <div className="flex items-baseline justify-between">
    <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
      {value}
      {secondary && (
        <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
          {secondary}
        </span>
      )}
    </dd>
  </div>
);

export default SyncDiagnosticsPanel;
