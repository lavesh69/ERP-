// src/lib/auth/password-strength.ts
// Pure utility — no React imports. Safe to use in both server routes and client components.

export interface PasswordStrength {
  score: number; // 0-4
  label: "Weak" | "Fair" | "Good" | "Strong";
  color: string; // tailwind bg color
  criteria: {
    minLength: boolean;
    mixedCase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function evaluatePassword(password: string): PasswordStrength {
  const criteria = {
    minLength: password.length >= 8,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const score = Object.values(criteria).filter(Boolean).length;

  const labelMap: Record<number, "Weak" | "Fair" | "Good" | "Strong"> = {
    0: "Weak",
    1: "Weak",
    2: "Fair",
    3: "Good",
    4: "Strong",
  };

  const colorMap: Record<number, string> = {
    0: "bg-red-500",
    1: "bg-red-500",
    2: "bg-amber-500",
    3: "bg-yellow-400",
    4: "bg-green-500",
  };

  return {
    score,
    label: labelMap[score],
    color: colorMap[score],
    criteria,
  };
}
