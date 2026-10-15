"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/common/Breadcrumbs";

export interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "danger" | "outline";
  disabled?: boolean;
  loading?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageHeaderAction[];
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
  breadcrumbs,
  actions,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`space-y-4 mb-6 ${className}`}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 sm:p-6 rounded-3xl border border-border/80 dark:border-charcoal-700/80 shadow-soft">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          {Icon && (
            <div className="h-12 w-12 rounded-2xl bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center shrink-0 border border-rose-primary/20 dark:border-rose-accent/20 shadow-xs">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 truncate tracking-tight">
                {title}
              </h1>
              {badge && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-primary/10 text-rose-primary dark:bg-rose-accent/20 dark:text-rose-light border border-rose-primary/20 dark:border-rose-accent/30">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-charcoal-600 dark:text-charcoal-400 mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto shrink-0">
            {actions.map((action, idx) => {
              const ActionIcon = action.icon;
              const variantClasses = {
                primary:
                  "bg-rose-primary hover:bg-rose-dark text-white shadow-sm btn-primary-glow border-transparent",
                secondary:
                  "bg-ivory-200 dark:bg-charcoal-800 text-charcoal-800 dark:text-ivory-200 hover:bg-rose-container hover:text-rose-primary border-border dark:border-charcoal-700",
                outline:
                  "bg-transparent text-charcoal-700 dark:text-ivory-300 hover:bg-ivory-200/60 dark:hover:bg-charcoal-800 border-border dark:border-charcoal-700",
                danger:
                  "bg-red-600 hover:bg-red-700 text-white shadow-sm border-transparent",
              }[action.variant || "primary"];

              return (
                <button
                  key={idx}
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-[0.98] ${variantClasses} ${
                    action.disabled || action.loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4 shrink-0" />}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
