"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Search,
  Filter,
  Check,
  ChevronRight,
  LucideIcon,
  Inbox,
} from "lucide-react";
import { Pagination } from "@/components/common/Pagination";
import { SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: (row: T) => any;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  hideOnMobile?: boolean;
}

interface BulkAction<T> {
  label: string;
  onClick: (selectedRows: T[]) => void;
  icon?: LucideIcon;
  variant?: "danger" | "primary" | "secondary";
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
  title?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  loading?: boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  bulkActions?: BulkAction<T>[];
  onRowClick?: (row: T) => void;
  exportable?: boolean;
  exportFilename?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  title,
  searchable = true,
  searchPlaceholder = "Search records...",
  searchKeys,
  loading = false,
  pageSize = 10,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries available matching your criteria.",
  emptyActionLabel,
  onEmptyAction,
  bulkActions,
  onRowClick,
  exportable = true,
  exportFilename = "data-export",
  className = "",
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();

    return data.filter((row) => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((k) => {
          const val = row[k as string];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
        });
      }
      return Object.values(row).some((val) => {
        return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
      });
    });
  }, [data, searchQuery, searchKeys]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    const column = columns.find((c) => c.key === sortKey);
    return [...filteredData].sort((a, b) => {
      let valA = column?.accessor ? column.accessor(a) : a[sortKey];
      let valB = column?.accessor ? column.accessor(b) : b[sortKey];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // Pagination
  const totalCount = sortedData.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Selection
  const allCurrentKeys = paginatedData.map(keyExtractor);
  const isAllSelected =
    allCurrentKeys.length > 0 && allCurrentKeys.every((k) => selectedKeys.has(k));

  const toggleSelectAll = () => {
    const next = new Set(selectedKeys);
    if (isAllSelected) {
      allCurrentKeys.forEach((k) => next.delete(k));
    } else {
      allCurrentKeys.forEach((k) => next.add(k));
    }
    setSelectedKeys(next);
  };

  const toggleSelectRow = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleExportCsv = () => {
    if (sortedData.length === 0) return;
    const exportColumns = columns.filter((c) => c.header && c.key);
    const headers = exportColumns.map((c) => `"${c.header.replace(/"/g, '""')}"`);

    const rows = sortedData.map((row) =>
      exportColumns.map((c) => {
        const val = c.accessor ? c.accessor(row) : row[c.key];
        const cleanVal = val !== undefined && val !== null ? String(val) : "";
        return `"${cleanVal.replace(/"/g, '""')}"`;
      })
    );

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${exportFilename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedRowsList = data.filter((row) => selectedKeys.has(keyExtractor(row)));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {title && (
          <h3 className="text-base sm:text-lg font-display font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
            <span>{title}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-rose-primary/10 text-rose-primary dark:bg-rose-accent/20 dark:text-rose-light">
              {totalCount}
            </span>
          </h3>
        )}

        <div className="flex items-center gap-2 self-stretch sm:self-auto ml-auto">
          {searchable && (
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-charcoal-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl text-xs text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-rose-primary/30"
              />
            </div>
          )}

          {exportable && totalCount > 0 && (
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-200/60 dark:hover:bg-charcoal-700 text-xs font-bold transition-all shadow-2xs"
              title="Export as CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {bulkActions && selectedKeys.size > 0 && (
        <div className="p-3 rounded-2xl bg-rose-primary/10 dark:bg-rose-950/60 border border-rose-primary/30 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="font-bold text-rose-primary dark:text-rose-light flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>{selectedKeys.size} item(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            {bulkActions.map((action, idx) => {
              const ActionIcon = action.icon;
              const btnClass = {
                danger: "bg-red-600 hover:bg-red-700 text-white",
                primary: "bg-rose-primary hover:bg-rose-dark text-white",
                secondary: "bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 border border-border",
              }[action.variant || "primary"];

              return (
                <button
                  key={idx}
                  onClick={() => action.onClick(selectedRowsList)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shadow-xs ${btnClass}`}
                >
                  {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <SkeletonTable rows={pageSize} />
      ) : paginatedData.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      ) : (
        <div className="glass-panel rounded-2xl border border-border/80 dark:border-charcoal-700/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-900/60 font-display text-charcoal-600 dark:text-charcoal-300">
                  {bulkActions && (
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-border dark:border-charcoal-600 text-rose-primary focus:ring-rose-primary/30 cursor-pointer"
                      />
                    </th>
                  )}
                  {columns.map((col) => {
                    const isSorted = sortKey === col.key;
                    const alignClass = {
                      left: "text-left",
                      center: "text-center",
                      right: "text-right",
                    }[col.align || "left"];

                    return (
                      <th
                        key={col.key}
                        style={{ width: col.width }}
                        className={`p-3.5 font-bold uppercase tracking-wider text-[11px] select-none ${alignClass} ${
                          col.hideOnMobile ? "hidden md:table-cell" : ""
                        }`}
                      >
                        {col.sortable ? (
                          <button
                            onClick={() => handleSort(col.key)}
                            className="inline-flex items-center gap-1.5 hover:text-rose-primary dark:hover:text-rose-accent transition-colors focus:outline-none"
                          >
                            <span>{col.header}</span>
                            {isSorted ? (
                              sortDirection === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5 text-rose-primary" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-rose-primary" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </button>
                        ) : (
                          <span>{col.header}</span>
                        )}
                      </th>
                    );
                  })}
                  {onRowClick && <th className="p-3.5 w-8"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-800 dark:text-ivory-200">
                {paginatedData.map((row) => {
                  const key = keyExtractor(row);
                  const isSelected = selectedKeys.has(key);

                  return (
                    <tr
                      key={key}
                      onClick={() => onRowClick && onRowClick(row)}
                      className={`transition-colors duration-150 ${
                        onRowClick ? "cursor-pointer hover:bg-rose-container/30 dark:hover:bg-charcoal-800/60" : "hover:bg-ivory-100 dark:hover:bg-charcoal-900/40"
                      } ${isSelected ? "bg-rose-primary/5 dark:bg-rose-950/30" : ""}`}
                    >
                      {bulkActions && (
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => toggleSelectRow(key, e)}
                            onChange={() => {}}
                            className="rounded border-border dark:border-charcoal-600 text-rose-primary focus:ring-rose-primary/30 cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((col) => {
                        const val = col.accessor ? col.accessor(row) : row[col.key];
                        const content = col.render ? col.render(val, row) : val;
                        const alignClass = {
                          left: "text-left",
                          center: "text-center",
                          right: "text-right",
                        }[col.align || "left"];

                        return (
                          <td
                            key={col.key}
                            className={`p-3.5 ${alignClass} ${
                              col.hideOnMobile ? "hidden md:table-cell" : ""
                            }`}
                          >
                            {content}
                          </td>
                        );
                      })}
                      {onRowClick && (
                        <td className="p-3.5 text-right text-charcoal-400">
                          <ChevronRight className="h-4 w-4 inline" />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            limit={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
