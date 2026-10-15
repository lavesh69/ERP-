"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Send,
  Lock,
} from "lucide-react";

export type ERPStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "PARTIAL"
  | "OVERDUE"
  | "COMPLETED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "PUBLISHED"
  | "DRAFT"
  | "CANCELLED"
  | "ON_LEAVE"
  | "VERIFIED"
  | "ESCALATED"
  | "RESOLVED"
  | "CRITICAL"
  | "OPEN"
  | "CLOSED";

interface StatusBadgeProps {
  status: ERPStatus | string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
  className = "",
}: StatusBadgeProps) {
  const normalized = (status || "").toUpperCase();

  const getStatusConfig = () => {
    switch (normalized) {
      case "ACTIVE":
      case "APPROVED":
      case "PAID":
      case "COMPLETED":
      case "PUBLISHED":
      case "VERIFIED":
      case "RESOLVED":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
          icon: CheckCircle2,
          label: normalized.replace(/_/g, " "),
        };

      case "PENDING":
      case "SUBMITTED":
      case "IN_PROGRESS":
      case "PARTIAL":
      case "OPEN":
      case "ON_LEAVE":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-500/20",
          icon: Clock,
          label: normalized.replace(/_/g, " "),
        };

      case "REJECTED":
      case "OVERDUE":
      case "CANCELLED":
      case "INACTIVE":
      case "CRITICAL":
        return {
          bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-500/20",
          icon: XCircle,
          label: normalized.replace(/_/g, " "),
        };

      case "ESCALATED":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-500/20",
          icon: AlertTriangle,
          label: normalized.replace(/_/g, " "),
        };

      case "DRAFT":
        return {
          bg: "bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 border-border dark:border-charcoal-700",
          icon: HelpCircle,
          label: "DRAFT",
        };

      case "CLOSED":
        return {
          bg: "bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 border-border dark:border-charcoal-700",
          icon: Lock,
          label: "CLOSED",
        };

      default:
        return {
          bg: "bg-ivory-200 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border-border dark:border-charcoal-700",
          icon: HelpCircle,
          label: normalized.replace(/_/g, " ") || "UNKNOWN",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border shadow-2xs ${sizeClasses} ${config.bg} ${className}`}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
