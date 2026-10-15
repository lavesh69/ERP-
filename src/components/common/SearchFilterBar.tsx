"use client";

import React from "react";
import { Search, Filter, X, Download, Plus, LucideIcon } from "lucide-react";

export interface FilterOption {
  key: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
}

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  onExportCsv?: () => void;
  exportLabel?: string;
  primaryActionLabel?: string;
  primaryActionIcon?: LucideIcon;
  onPrimaryAction?: () => void;
  className?: string;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filters = [],
  onClearFilters,
  hasActiveFilters = false,
  onExportCsv,
  exportLabel = "Export CSV",
  primaryActionLabel,
  primaryActionIcon: PrimaryIcon = Plus,
  onPrimaryAction,
  className = "",
}: SearchFilterBarProps) {
  return (
    <div
      className={`glass-panel p-3.5 sm:p-4 rounded-2xl border border-border/80 dark:border-charcoal-700/80 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 ${className}`}
    >
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400 dark:text-charcoal-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-8 py-2 bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl text-xs sm:text-sm text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-rose-primary/30 focus:border-rose-primary transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-ivory-200"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter Selects & Actions */}
      <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-end">
        {filters.map((f) => (
          <div key={f.key} className="relative min-w-[130px]">
            <select
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl text-xs font-medium text-charcoal-800 dark:text-ivory-200 focus:outline-none focus:ring-2 focus:ring-rose-primary/30 focus:border-rose-primary cursor-pointer transition-all"
            >
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-charcoal-400 pointer-events-none" />
          </div>
        ))}

        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-primary hover:bg-rose-container/50 dark:hover:bg-rose-dark/30 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        )}

        {onExportCsv && (
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-200/60 dark:hover:bg-charcoal-700 text-xs font-bold transition-all shadow-2xs"
            title="Export filtered records as CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{exportLabel}</span>
          </button>
        )}

        {primaryActionLabel && onPrimaryAction && (
          <button
            onClick={onPrimaryAction}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold transition-all shadow-sm btn-primary-glow active:scale-[0.98]"
          >
            <PrimaryIcon className="h-4 w-4" />
            <span>{primaryActionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
