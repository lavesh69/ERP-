"use client";

import React from "react";
import { Check, X, ShieldCheck } from "lucide-react";

export interface PasswordCriteria {
  label: string;
  met: boolean;
}

export function evaluatePassword(password: string) {
  const criteria: PasswordCriteria[] = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Uppercase & lowercase letters", met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "At least one number (0-9)", met: /\d/.test(password) },
    { label: "Special symbol (!@#$%^&*)", met: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password) },
  ];

  const metCount = criteria.filter((c) => c.met).length;

  let strengthLabel = "Too Weak";
  let barColor = "bg-rose-500";
  let textColor = "text-rose-500";

  if (metCount === 0) {
    strengthLabel = "Enter password";
    barColor = "bg-gray-200 dark:bg-charcoal-700";
    textColor = "text-charcoal-400";
  } else if (metCount === 1) {
    strengthLabel = "Weak";
    barColor = "bg-red-500";
    textColor = "text-red-500";
  } else if (metCount === 2) {
    strengthLabel = "Fair";
    barColor = "bg-amber-500";
    textColor = "text-amber-500";
  } else if (metCount === 3) {
    strengthLabel = "Good";
    barColor = "bg-blue-500";
    textColor = "text-blue-500";
  } else if (metCount === 4) {
    strengthLabel = "Strong";
    barColor = "bg-emerald-500";
    textColor = "text-emerald-500";
  }

  return { criteria, metCount, strengthLabel, barColor, textColor, isStrong: metCount >= 3 };
}

interface PasswordStrengthMeterProps {
  password: string;
  showCriteria?: boolean;
  className?: string;
}

export default function PasswordStrengthMeter({
  password,
  showCriteria = true,
  className = "",
}: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { criteria, metCount, strengthLabel, barColor, textColor } = evaluatePassword(password);

  return (
    <div className={`space-y-2 pt-1 ${className}`}>
      {/* 4-segment visual bar */}
      <div className="flex items-center justify-between gap-1">
        <div className="grid grid-cols-4 gap-1.5 flex-1">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index <= metCount ? barColor : "bg-gray-200 dark:bg-charcoal-700"
              }`}
            />
          ))}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ml-2 ${textColor}`}>
          {strengthLabel}
        </span>
      </div>

      {/* Checklist items */}
      {showCriteria && (
        <div className="grid grid-cols-2 gap-1 pt-1">
          {criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px]">
              {c.met ? (
                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
              ) : (
                <X className="h-3 w-3 text-charcoal-400 shrink-0" />
              )}
              <span className={c.met ? "text-charcoal-700 dark:text-charcoal-300 font-medium" : "text-charcoal-400"}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
