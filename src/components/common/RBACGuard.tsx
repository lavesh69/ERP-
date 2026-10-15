"use client";

import React from "react";
import { UserRole } from "@/types/auth";
import { PermissionCode, hasPermission as checkPermission } from "@/lib/auth/permissions";
import { hasModuleAccess, getRoleCapabilities, RoleCapabilities } from "@/lib/auth/rbac";
import { useApp } from "@/context/AppContext";
import { PermissionDenied } from "./PermissionDenied";

export interface RBACGuardProps {
  /**
   * Allowed roles that can view the guarded content.
   * If omitted, all authenticated roles are allowed unless restricted by permissions.
   */
  roles?: readonly UserRole[] | UserRole[];

  /**
   * Granular permission codes required to view the guarded content.
   */
  permissions?: readonly PermissionCode[] | PermissionCode[];

  /**
   * If true, user must have ALL specified permissions.
   * If false (default), user must have AT LEAST ONE of the specified permissions.
   */
  requireAllPermissions?: boolean;

  /**
   * What to render if user is not authorized. Defaults to null.
   */
  fallback?: React.ReactNode;

  /**
   * If true, renders the standard enterprise <PermissionDenied> screen instead of fallback.
   */
  showDeniedState?: boolean;

  /**
   * Custom title for PermissionDenied screen
   */
  deniedTitle?: string;

  /**
   * Custom message for PermissionDenied screen
   */
  deniedMessage?: string;

  /**
   * Child elements to render if authorized.
   */
  children: React.ReactNode;
}

/**
 * Declarative component to conditionally render UI elements based on UserRole and granular permissions.
 */
export function RBACGuard({
  roles,
  permissions,
  requireAllPermissions = false,
  fallback = null,
  showDeniedState = false,
  deniedTitle,
  deniedMessage,
  children,
}: RBACGuardProps) {
  const { currentRole } = useApp();

  let isAuthorized = true;

  // Check role requirement
  if (roles && roles.length > 0) {
    if (!roles.includes(currentRole)) {
      isAuthorized = false;
    }
  }

  // Check granular permission requirement
  if (isAuthorized && permissions && permissions.length > 0) {
    if (requireAllPermissions) {
      isAuthorized = permissions.every((perm) => checkPermission(currentRole, perm));
    } else {
      isAuthorized = permissions.some((perm) => checkPermission(currentRole, perm));
    }
  }

  if (!isAuthorized) {
    if (showDeniedState) {
      return (
        <PermissionDenied
          moduleName={deniedTitle}
          requiredRoles={roles ? [...roles] : undefined}
        />
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Comprehensive client-side hook for Role-Based Access Control and feature capability checks.
 */
export function useRBAC() {
  const { currentRole, currentUser, setCurrentRole } = useApp();

  const hasPermission = (permission: PermissionCode): boolean => {
    return checkPermission(currentRole, permission);
  };

  const hasAnyPermission = (permissions: PermissionCode[]): boolean => {
    return permissions.some((p) => checkPermission(currentRole, p));
  };

  const hasAllPermissions = (permissions: PermissionCode[]): boolean => {
    return permissions.every((p) => checkPermission(currentRole, p));
  };

  const canAccessRoute = (route: string): boolean => {
    return hasModuleAccess(currentRole, route);
  };

  const isRole = (roles: UserRole | UserRole[]): boolean => {
    if (Array.isArray(roles)) {
      return roles.includes(currentRole);
    }
    return currentRole === roles;
  };

  const capabilities: RoleCapabilities = getRoleCapabilities(currentRole);

  const switchRole = async (targetRole: UserRole): Promise<boolean> => {
    try {
      setCurrentRole(targetRole);
      return true;
    } catch {
      return false;
    }
  };

  return {
    role: currentRole,
    user: currentUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    isRole,
    capabilities,
    switchRole,
  };
}
