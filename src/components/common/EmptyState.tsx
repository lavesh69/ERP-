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
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center glass-panel rounded-3xl border border-dashed border-border/80 dark:border-charcoal-700/80 shadow-soft transition-all ${className}`}
    >
      <div className="h-16 w-16 rounded-3xl bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center mb-4 border border-rose-primary/20 dark:border-rose-accent/20 shadow-xs">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
        {title}
      </h4>
      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 max-w-sm mt-1.5 mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm btn-primary-glow"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
