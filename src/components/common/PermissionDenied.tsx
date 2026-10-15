"use client";

import React from "react";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

interface PermissionDeniedProps {
  moduleName?: string;
  requiredRoles?: string[];
  className?: string;
}

export function PermissionDenied({
  moduleName = "this resource",
  requiredRoles,
  className = "",
}: PermissionDeniedProps) {
  const router = useRouter();
  const { currentRole } = useApp();

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 sm:p-14 text-center glass-panel rounded-3xl border border-rose-500/30 dark:border-rose-500/20 shadow-elevated max-w-xl mx-auto my-12 ${className}`}
    >
      <div className="h-16 w-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 border border-rose-500/20 shadow-xs">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mb-3">
        403 Access Denied
      </span>

      <h2 className="text-xl sm:text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
        Restricted Institutional Domain
      </h2>

      <p className="text-xs sm:text-sm text-charcoal-600 dark:text-charcoal-400 mt-2 max-w-md leading-relaxed">
        Your current session role (<strong className="text-charcoal-900 dark:text-ivory-200">{currentRole}</strong>) is not authorized to access {moduleName}.
      </p>

      {requiredRoles && requiredRoles.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-ivory-200/60 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 text-[11px] text-charcoal-600 dark:text-charcoal-400 max-w-sm">
          <p className="font-semibold mb-1 text-charcoal-700 dark:text-ivory-200">
            Authorized Enterprise Roles:
          </p>
          <div className="flex flex-wrap gap-1 justify-center">
            {requiredRoles.map((r) => (
              <span
                key={r}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 font-mono text-[10px]"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-200/60 dark:hover:bg-charcoal-700 text-xs font-bold transition-all shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Go Back</span>
        </button>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold transition-all shadow-sm btn-primary-glow"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
