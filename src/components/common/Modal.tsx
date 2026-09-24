"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Window */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-[#231E21] rounded-2xl border border-border dark:border-charcoal-800 shadow-elevated p-4 sm:p-6 z-10 transition-all transform animate-in zoom-in-95 duration-200 max-h-[calc(100dvh-2rem)] overflow-y-auto`}
      >
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-border dark:border-charcoal-800 gap-2">
          <div className="min-w-0">
            <h3 id="modal-title" className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100 truncate">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-0.5 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
