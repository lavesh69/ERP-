"use client";

import React from "react";
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string | number;
  changeType?: "increase" | "decrease" | "neutral";
  changeDescription?: string;
  icon: LucideIcon;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
  onClick?: () => void;
}

export function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  changeDescription,
  icon: Icon,
  subtitle,
  variant = "default",
  className = "",
  onClick,
}: KPICardProps) {
  const variantStyles = {
    default: {
      iconBg: "bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent border-rose-primary/20",
    },
    success: {
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    warning: {
      iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    danger: {
      iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
    info: {
      iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-500/20",
    },
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-700/80 shadow-soft transition-all duration-200 flex flex-col justify-between ${
        onClick ? "cursor-pointer hover:border-rose-primary/40 hover:shadow-card active:scale-[0.99]" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider truncate">
          {title}
        </span>
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${variantStyles.iconBg}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-display font-extrabold text-charcoal-900 dark:text-ivory-100 tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {change !== undefined && (
        <div className="mt-3 pt-2.5 border-t border-border/60 dark:border-charcoal-800 flex items-center gap-1.5 text-xs">
          {changeType === "increase" && (
            <span className="flex items-center font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {change}
            </span>
          )}
          {changeType === "decrease" && (
            <span className="flex items-center font-bold text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="h-3.5 w-3.5" />
              {change}
            </span>
          )}
          {changeType === "neutral" && (
            <span className="flex items-center font-bold text-charcoal-500">
              <Minus className="h-3.5 w-3.5" />
              {change}
            </span>
          )}
          {changeDescription && (
            <span className="text-charcoal-500 dark:text-charcoal-400 truncate">
              {changeDescription}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
