import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Clock, ShieldAlert, LogOut } from "lucide-react";

interface IdleSessionGuardProps {
  idleTimeoutMinutes?: number; // Default: 15 minutes
  warningDurationSeconds?: number; // Default: 60 seconds
}

export const IdleSessionGuard: React.FC<IdleSessionGuardProps> = ({
  idleTimeoutMinutes = 15,
  warningDurationSeconds = 60,
}) => {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningDurationSeconds);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimers = () => {
    if (showWarning) return; // If warning is currently displayed, user must explicitly click "Stay Logged In"

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setShowWarning(false);
    setCountdown(warningDurationSeconds);

    if (user) {
      // Start idle timer: (timeout minutes - warning seconds)
      const warningDelayMs = Math.max(
        (idleTimeoutMinutes * 60 - warningDurationSeconds) * 1000,
        10000
      );

      idleTimerRef.current = setTimeout(() => {
        triggerWarning();
      }, warningDelayMs);
    }
  };

  const triggerWarning = () => {
    setShowWarning(true);
    setCountdown(warningDurationSeconds);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          handleAutomaticTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAutomaticTimeout = async () => {
    setShowWarning(false);
    await logout();
    window.location.href = "/login?timeout=inactivity";
  };

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    resetTimers();
  };

  useEffect(() => {
    if (!user) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"];
    const handleActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    events.forEach((ev) => window.addEventListener(ev, handleActivity));
    resetTimers();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [user, showWarning]);

  if (!showWarning || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-2xl border-2 border-rose-500/30 text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-stone-900 dark:text-white">
            Security Inactivity Timeout
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            Your academic session has been inactive. To protect student privacy and prevent unauthorized grade tampering on shared campus workstations, your session will automatically terminate in:
          </p>
        </div>

        <div className="py-2">
          <div className="inline-block rounded-2xl bg-rose-50 border border-rose-200 px-6 py-3 dark:bg-rose-950/40 dark:border-rose-800">
            <span className="font-mono text-3xl font-black text-rose-600 dark:text-rose-400">
              00:{countdown < 10 ? `0${countdown}` : countdown}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 rounded-xl bg-rose-600 py-3 px-4 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition-colors"
          >
            Stay Signed In
          </button>
          <button
            onClick={handleAutomaticTimeout}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 py-3 px-4 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
