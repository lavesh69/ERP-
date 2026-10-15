"use client";

import React from "react";
import { CheckCircle2, Clock, AlertCircle, XCircle, Info, LucideIcon } from "lucide-react";

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string | Date;
  actor?: string;
  role?: string;
  status?: "success" | "warning" | "danger" | "info" | "pending";
  icon?: LucideIcon;
  badge?: string;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function ActivityTimeline({ events, className = "" }: ActivityTimelineProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className={`relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border dark:before:bg-charcoal-700 ${className}`}>
      {events.map((event, idx) => {
        const statusConfig = {
          success: {
            dotBg: "bg-emerald-500 ring-emerald-100 dark:ring-emerald-950",
            icon: CheckCircle2,
            iconColor: "text-white",
          },
          warning: {
            dotBg: "bg-amber-500 ring-amber-100 dark:ring-amber-950",
            icon: Clock,
            iconColor: "text-white",
          },
          danger: {
            dotBg: "bg-rose-500 ring-rose-100 dark:ring-rose-950",
            icon: XCircle,
            iconColor: "text-white",
          },
          info: {
            dotBg: "bg-sky-500 ring-sky-100 dark:ring-sky-950",
            icon: Info,
            iconColor: "text-white",
          },
          pending: {
            dotBg: "bg-charcoal-400 ring-charcoal-100 dark:ring-charcoal-800",
            icon: Clock,
            iconColor: "text-white",
          },
        }[event.status || "info"];

        const Icon = event.icon || statusConfig.icon;

        const dateStr =
          typeof event.timestamp === "string"
            ? event.timestamp
            : event.timestamp.toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

        return (
          <div key={event.id || idx} className="relative group">
            {/* Timeline Marker Dot */}
            <div
              className={`absolute -left-[27px] top-1.5 h-6 w-6 rounded-full flex items-center justify-center ring-4 shadow-xs transition-transform group-hover:scale-110 ${statusConfig.dotBg}`}
            >
              <Icon className={`h-3.5 w-3.5 ${statusConfig.iconColor}`} />
            </div>

            {/* Event Card Content */}
            <div className="glass-panel p-4 rounded-2xl border border-border/80 dark:border-charcoal-700/80 shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100">
                    {event.title}
                  </h4>
                  {event.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ivory-200 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-300 border border-border dark:border-charcoal-700">
                      {event.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-charcoal-400 dark:text-charcoal-500 shrink-0">
                  {dateStr}
                </span>
              </div>

              {event.description && (
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 leading-relaxed">
                  {event.description}
                </p>
              )}

              {(event.actor || event.role) && (
                <div className="mt-2.5 pt-2 border-t border-border/50 dark:border-charcoal-800 flex items-center gap-2 text-[11px] text-charcoal-500">
                  {event.actor && (
                    <span className="font-semibold text-charcoal-700 dark:text-ivory-200">
                      {event.actor}
                    </span>
                  )}
                  {event.role && (
                    <span className="px-1.5 py-0.5 rounded bg-ivory-100 dark:bg-charcoal-900 border border-border/50 font-mono text-[10px]">
                      {event.role}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
