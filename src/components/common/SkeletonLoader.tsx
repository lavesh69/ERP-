"use client";

import React from "react";

export function SkeletonCard() {
  return (
    <div className="glass-panel shimmer-wave p-5 rounded-2xl shadow-soft flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-charcoal-200/80 dark:bg-charcoal-800 rounded"></div>
        <div className="h-8 w-8 bg-charcoal-200/80 dark:bg-charcoal-800 rounded-xl"></div>
      </div>
      <div className="mt-4 h-8 w-20 bg-charcoal-200/80 dark:bg-charcoal-800 rounded"></div>
      <div className="mt-3 h-3 w-full bg-charcoal-100/80 dark:bg-charcoal-800/60 rounded"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full glass-panel shimmer-wave rounded-2xl shadow-soft overflow-hidden">
      <div className="p-4 border-b border-border/80 dark:border-charcoal-800 flex justify-between">
        <div className="h-4 w-32 bg-charcoal-200/80 dark:bg-charcoal-800 rounded"></div>
        <div className="h-4 w-20 bg-charcoal-200/80 dark:bg-charcoal-800 rounded"></div>
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="h-3 w-1/4 bg-charcoal-200/80 dark:bg-charcoal-800 rounded"></div>
            <div className="h-3 w-1/4 bg-charcoal-100/80 dark:bg-charcoal-800/60 rounded"></div>
            <div className="h-3 w-1/4 bg-charcoal-100/80 dark:bg-charcoal-800/60 rounded"></div>
            <div className="h-6 w-16 bg-charcoal-200/80 dark:bg-charcoal-800 rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
