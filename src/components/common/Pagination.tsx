import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  limit,
  onPageChange,
}: PaginationProps) {
  const [jumpInput, setJumpInput] = React.useState("");

  if (totalCount === 0) return null;

  const startIdx = (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, totalCount);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      onPageChange(target);
      setJumpInput("");
    }
  };

  return (
    <div className="p-4 border-t border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="text-charcoal-500 font-medium">
        Showing <span className="font-bold text-charcoal-800 dark:text-ivory-200">{startIdx}</span> -{" "}
        <span className="font-bold text-charcoal-800 dark:text-ivory-200">{endIdx}</span> of{" "}
        <span className="font-bold text-charcoal-800 dark:text-ivory-200">{totalCount}</span> records
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold border transition-all ${
            page <= 1
              ? "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-400 border-border dark:border-charcoal-700 cursor-not-allowed"
              : "bg-white dark:bg-charcoal-700 text-charcoal-800 dark:text-ivory-100 border-border dark:border-charcoal-600 hover:bg-rose-container hover:text-rose-primary"
          }`}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1 px-2 font-mono font-bold text-charcoal-700 dark:text-charcoal-300 text-xs">
          Page {page} of {Math.max(1, totalPages)}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold border transition-all ${
            page >= totalPages
              ? "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-400 border-border dark:border-charcoal-700 cursor-not-allowed"
              : "bg-white dark:bg-charcoal-700 text-charcoal-800 dark:text-ivory-100 border-border dark:border-charcoal-600 hover:bg-rose-container hover:text-rose-primary"
          }`}
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {totalPages > 2 && (
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 pl-2 border-l border-border dark:border-charcoal-700">
            <span className="text-charcoal-500 text-[11px]">Go to:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder="#"
              className="w-12 px-1.5 py-1 text-center bg-white dark:bg-charcoal-700 border border-border dark:border-charcoal-600 rounded-lg text-xs font-mono font-bold text-charcoal-800 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary"
            />
          </form>
        )}
      </div>
    </div>
  );
}
