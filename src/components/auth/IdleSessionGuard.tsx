"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AlertCircle, Clock } from "lucide-react";

const IDLE_TIMEOUT_MS = 14 * 60 * 1000; // 14 minutes
const COUNTDOWN_SECONDS = 60; // 60 seconds warning

export default function IdleSessionGuard() {
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const router = useRouter();
  const pathname = usePathname();

  // Exclude public routes from idle checking
  const isPublicRoute = ["/login", "/register", "/"].includes(pathname || "");

  const resetTimer = useCallback(() => {
    setIsWarningVisible(false);
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  useEffect(() => {
    if (isPublicRoute) return;

    let idleTimer: NodeJS.Timeout;

    const handleActivity = () => {
      if (!isWarningVisible) {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          setIsWarningVisible(true);
        }, IDLE_TIMEOUT_MS);
      }
    };

    // Initial setup
    handleActivity();

    // Event listeners for activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((event) => document.addEventListener(event, handleActivity));

    return () => {
      clearTimeout(idleTimer);
      events.forEach((event) => document.removeEventListener(event, handleActivity));
    };
  }, [isPublicRoute, isWarningVisible]);

  // Countdown effect when warning is visible
  useEffect(() => {
    if (!isWarningVisible) return;

    if (countdown <= 0) {
      // Logout
      const performLogout = async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // ignore
        } finally {
          router.push("/login?reason=inactivity");
        }
      };
      performLogout();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isWarningVisible, countdown, router]);

  if (!isWarningVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-charcoal-950/80 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-border dark:border-charcoal-700 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-500">
            <Clock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mb-2">
            Session Expiring Soon
          </h2>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-6">
            For your security, you will be automatically logged out due to inactivity in{" "}
            <span className="font-bold text-rose-primary">{countdown}</span> seconds.
          </p>
          <div className="flex flex-col w-full gap-3">
            <button
              onClick={resetTimer}
              className="w-full py-3 rounded-xl text-sm font-bold bg-rose-primary text-white hover:bg-rose-deep transition-all"
            >
              Keep Session Active
            </button>
            <button
              onClick={() => {
                fetch("/api/auth/logout", { method: "POST" }).finally(() => {
                  router.push("/login");
                });
              }}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gray-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-100 hover:bg-gray-200 dark:hover:bg-charcoal-700 transition-all"
            >
              Log Out Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
