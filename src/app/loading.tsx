import React from "react";
import { SkeletonCard, SkeletonTable } from "@/components/common/SkeletonLoader";

export default function Loading() {
  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-charcoal-950 p-6 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto animate-pulse transition-colors duration-200">
      {/* Top Banner Skeleton */}
      <div className="h-28 bg-white/70 dark:bg-charcoal-900/70 rounded-3xl border border-border dark:border-charcoal-800 p-6 flex items-center justify-between shadow-soft">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-ivory-200 dark:bg-charcoal-800" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-48 bg-ivory-200 dark:bg-charcoal-800 rounded-md" />
            <div className="h-3 w-64 bg-ivory-200 dark:bg-charcoal-800 rounded-md" />
          </div>
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Table Skeleton */}
      <SkeletonTable rows={6} />
    </div>
  );
}
