"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-[#231E21] rounded-2xl border border-dashed border-border dark:border-charcoal-800 ${className}`}
    >
      <div className="h-14 w-14 rounded-2xl bg-rose-container/70 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100">
        {title}
      </h4>
      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 max-w-sm mt-1 mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
