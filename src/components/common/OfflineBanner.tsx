"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none no-print transition-all duration-300 animate-in fade-in slide-in-from-top-4"
    >
      {!isOnline ? (
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border border-amber-500/40 bg-amber-500/10 text-charcoal-900 dark:text-ivory-100 shadow-elevated text-xs font-semibold backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <WifiOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span>Offline Mode — Institutional Local Cache Active</span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border border-green-500/40 bg-green-500/10 text-charcoal-900 dark:text-ivory-100 shadow-elevated text-xs font-semibold backdrop-blur-md animate-out fade-out duration-500">
          <Wifi className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          <span>Connection Restored — Realtime Sync Operational</span>
        </div>
      )}
    </div>
  );
}
