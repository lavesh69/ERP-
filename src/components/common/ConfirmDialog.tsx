"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "success";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  isLoading = false,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-500/20",
      btnBg: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
      icon: AlertTriangle,
    },
    warning: {
      iconBg: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-500/20",
      btnBg: "bg-amber-600 hover:bg-amber-700 text-white shadow-sm",
      icon: AlertTriangle,
    },
    info: {
      iconBg: "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-500/20",
      btnBg: "bg-rose-primary hover:bg-rose-dark text-white shadow-sm",
      icon: Info,
    },
    success: {
      iconBg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
      icon: CheckCircle2,
    },
  }[variant];

  const Icon = variantStyles.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative w-full max-w-md glass-panel p-6 rounded-3xl border border-border/80 dark:border-charcoal-700/80 shadow-elevated z-10 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-start gap-4">
          <div
            className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${variantStyles.iconBg}`}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="confirm-dialog-title"
              className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100"
            >
              {title}
            </h3>
            <p
              id="confirm-dialog-desc"
              className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1.5 leading-relaxed"
            >
              {message}
            </p>
          </div>

          {!isLoading && (
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-charcoal-400 hover:text-charcoal-600 dark:hover:text-ivory-200 hover:bg-ivory-200 dark:hover:bg-charcoal-800 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-border/60 dark:border-charcoal-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-200/60 dark:hover:bg-charcoal-800 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 ${variantStyles.btnBg}`}
          >
            {isLoading && (
              <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
