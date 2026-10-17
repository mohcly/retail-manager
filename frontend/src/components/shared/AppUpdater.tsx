import React, { useEffect, useState } from 'react';
import { Sparkles, Download, CheckCircle2, AlertCircle, X, Loader2, ArrowUpCircle } from 'lucide-react';
import type { Update, DownloadEvent } from '@tauri-apps/plugin-updater';

type UpdateStatus = 'idle' | 'available' | 'downloading' | 'installing' | 'error';

export function AppUpdater() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Only applies inside Tauri desktop shell - no-op in plain browser preview
    if (!('__TAURI_INTERNALS__' in window)) return;

    let isMounted = true;

    const runCheck = async () => {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const updateFound = await check();

        if (updateFound && isMounted) {
          setUpdate(updateFound);
          setStatus('available');
        }
      } catch (e) {
        console.error('[AppUpdater] update check failed:', e);
      }
    };

    // Small delay so the app dashboard can load cleanly before showing the bubble
    const timer = setTimeout(runCheck, 3000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (!update || isDismissed || status === 'idle') {
    return null;
  }

  const handleInstall = async () => {
    if (!update) return;

    try {
      setStatus('downloading');
      setProgress(0);

      let downloadedBytes = 0;
      let totalBytes = 0;

      await update.downloadAndInstall((event: DownloadEvent) => {
        if (event.event === 'Started') {
          totalBytes = event.data.contentLength || 0;
        } else if (event.event === 'Progress') {
          downloadedBytes += event.data.chunkLength;
          if (totalBytes > 0) {
            setProgress(Math.min(100, Math.round((downloadedBytes / totalBytes) * 100)));
          }
        } else if (event.event === 'Finished') {
          setStatus('installing');
        }
      });

      setStatus('installing');

      // Relaunch the application with the new version
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (e) {
      console.error('[AppUpdater] install failed:', e);
      setStatus('error');
      setErrorMessage(e instanceof Error ? e.message : 'Échec du téléchargement');
    }
  };

  return (
    <aside
      aria-label="Notification de mise à jour"
      className="fixed bottom-5 right-5 z-[9999] w-[350px] max-w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl p-4 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {status === 'downloading' || status === 'installing' ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          ) : status === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : (
            <Sparkles className="w-5 h-5 text-emerald-400" />
          )}
          {status === 'available' && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white tracking-tight">
              Mise à jour disponible
            </h4>
            {status !== 'downloading' && status !== 'installing' && (
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="text-slate-400 hover:text-white p-1 -mr-1 rounded-lg hover:bg-slate-800 transition"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-xs text-slate-300 mt-0.5">
            Version <span className="font-semibold text-emerald-400">v{update.version}</span> prête à être installée.
          </p>

          {/* Progress bar when downloading */}
          {status === 'downloading' && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Téléchargement...</span>
                <span className="font-medium text-emerald-400">{progress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Installing status */}
          {status === 'installing' && (
            <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Finalisation et redémarrage...</span>
            </div>
          )}

          {/* Error status */}
          {status === 'error' && (
            <div className="mt-2.5 text-xs text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg p-2">
              <p className="font-medium">Erreur lors de la mise à jour</p>
              <p className="text-[11px] text-red-300 mt-0.5 truncate">{errorMessage}</p>
            </div>
          )}

          {/* Action buttons */}
          {status === 'available' && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Installer maintenant
              </button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                Plus tard
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
              >
                <ArrowUpCircle className="w-3.5 h-3.5" />
                Réessayer
              </button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
