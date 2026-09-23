import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  // 1. Loading state while authentication state is resolving
  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-100 dark:bg-charcoal-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-rose-primary/10 border-2 border-rose-primary/20 animate-pulse flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-3 border-rose-primary border-t-transparent animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100">
              CLASSROOM ACADEMIC OS
            </h3>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
              Validating cryptographic security credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Redirect unauthorized/unauthenticated users to /login preserving target location
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role-Based Access Control check (if roles are restricted)
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen bg-ivory-100 dark:bg-charcoal-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-charcoal-900 p-8 rounded-3xl border border-border dark:border-charcoal-800 shadow-elevated text-center">
          <div className="h-12 w-12 rounded-2xl bg-academic-danger/10 text-academic-danger flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-ivory-100">
            Access Restricted
          </h2>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-2 leading-relaxed">
            Your current perspective (<strong>{profile.role}</strong>) does not have administrative authorization to access this sector.
          </p>
          <div className="mt-6">
            <a
              href="/dashboard"
              className="inline-block py-2.5 px-5 rounded-xl bg-rose-primary text-white text-xs font-bold hover:bg-rose-dark transition-all"
            >
              Return to Safe Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
