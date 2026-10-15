"use client";

import React, { useState } from "react";
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, Home } from "lucide-react";
import Link from "next/link";

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Unable to load data",
  message = "A server or network error occurred while processing this request. Please verify your connection or try again.",
  error,
  onRetry,
  className = "",
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    try {
      setIsRetrying(true);
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const errorString =
    typeof error === "string" ? error : error instanceof Error ? error.message : null;

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center glass-panel rounded-3xl border border-dashed border-rose-500/30 dark:border-rose-500/20 shadow-soft ${className}`}
    >
      <div className="h-16 w-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20 shadow-xs">
        <AlertCircle className="h-7 w-7" />
      </div>

      <h4 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
        {title}
      </h4>

      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 max-w-md mt-1.5 mb-5 leading-relaxed">
        {message}
      </p>

      {errorString && (
        <div className="w-full max-w-md mb-5">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-center gap-1 text-[11px] font-bold text-charcoal-500 hover:text-charcoal-700 dark:text-charcoal-400 dark:hover:text-ivory-200 transition-colors mx-auto"
          >
            <span>{showDetails ? "Hide technical diagnostic" : "Show technical diagnostic"}</span>
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showDetails && (
            <div className="mt-2 p-3 rounded-xl bg-charcoal-950 text-rose-300 font-mono text-[11px] text-left overflow-x-auto border border-charcoal-800">
              {errorString}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm btn-primary-glow disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Retrying..." : "Retry Operation"}</span>
          </button>
        )}

        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-200/60 dark:hover:bg-charcoal-700 text-xs font-bold transition-all shadow-2xs"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
