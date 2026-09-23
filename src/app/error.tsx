"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Institutional ERP Runtime Crash Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-charcoal-950 flex flex-col items-center justify-center p-6 text-center select-none transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-charcoal-900 rounded-3xl border border-red-200 dark:border-red-900/50 p-8 shadow-elevated flex flex-col items-center">
        <div className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mb-6 shadow-sm border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-red-600 mb-2">
          RUNTIME DEFENSE BOUNDARY
        </span>

        <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mb-2">
          System Execution Interrupted
        </h1>

        <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mb-4 leading-relaxed">
          An unexpected runtime exception was isolated by the institutional application boundary. No academic ledger records were corrupted.
        </p>

        {error?.message && (
          <div className="w-full p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-950 border border-border dark:border-charcoal-800 font-mono text-[11px] text-red-700 dark:text-red-400 text-left mb-6 break-all">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-deep text-white text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Attempt Recovery</span>
          </button>
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 text-xs font-bold hover:bg-ivory-100 dark:hover:bg-charcoal-700 transition-all"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="mt-8 pt-4 border-t border-border/60 dark:border-charcoal-800 w-full flex items-center justify-center gap-2 text-[10px] text-charcoal-400">
          <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
          <span>Automated Crash Telemetry Logged</span>
        </div>
      </div>
    </div>
  );
}
