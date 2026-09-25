"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const pathname = usePathname();

  // If items not provided, automatically derive from current pathname
  const derivedItems: BreadcrumbItem[] = React.useMemo(() => {
    if (items && items.length > 0) return items;
    if (!pathname || pathname === "/") return [];

    const segments = pathname.split("/").filter(Boolean);
    return segments.map((seg, idx) => {
      const href = "/" + segments.slice(0, idx + 1).join("/");
      // Clean display names
      let label = decodeURIComponent(seg);
      if (label.startsWith("STU-") || label.startsWith("FAC-")) {
        label = label.toUpperCase();
      } else {
        label = label.charAt(0).toUpperCase() + label.slice(1).replace(/-/g, " ");
      }
      return {
        label,
        href: idx === segments.length - 1 ? undefined : href,
      };
    });
  }, [items, pathname]);

  if (derivedItems.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs text-charcoal-500 dark:text-charcoal-400 mb-4 overflow-x-auto py-1 ${className}`}
    >
      <Link
        href="/"
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-ivory-200/60 dark:hover:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100 transition-colors shrink-0"
        title="Dashboard Home"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only text-[11px] font-medium">Home</span>
      </Link>

      {derivedItems.map((item, index) => {
        const isLast = index === derivedItems.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-3.5 w-3.5 text-charcoal-400 dark:text-charcoal-600 shrink-0" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="px-2 py-0.5 rounded-lg hover:bg-ivory-200/60 dark:hover:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100 transition-colors text-[11px] font-medium truncate shrink-0 max-w-[150px]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className="px-2 py-0.5 rounded-lg bg-surface-soft dark:bg-charcoal-800/80 text-rose-primary dark:text-rose-accent text-[11px] font-bold truncate shrink-0 max-w-[200px]"
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
