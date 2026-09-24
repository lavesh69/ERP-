import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";
import { UserRole } from "@/types/auth";
import { logger } from "@/lib/logging/logger";

import { isTokenRevoked } from "@/lib/auth/token-revocation";

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN"];

const FACULTY_LEADERSHIP_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "PRINCIPAL",
  "HOD",
  "FACULTY",
  "CLASS_TEACHER",
];

function extractToken(req: NextRequest): string | undefined {
  return (
    req.cookies.get("classroom_session")?.value ||
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  );
}

/**
 * Returns verified JWT payload if present, or null without rejecting.
 * Useful for read endpoints that adapt based on the caller's role.
 */
export async function getOptionalSession(
  req: NextRequest
): Promise<Record<string, any> | null> {
  const token = extractToken(req);
  if (!token) return null;
  if (await isTokenRevoked(token)) return null;
  return await verifyJwt(token);
}

/**
 * Verifies that the incoming request has a valid session with one of the allowed roles.
 */
export async function requireRoleAuth(
  req: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ payload: Record<string, any> } | NextResponse> {
  const token = extractToken(req);

  if (!token) {
    logger.security("UNAUTHORIZED_ACCESS_NO_TOKEN", "anonymous", {
      path: req.nextUrl.pathname,
      ip: req.headers.get("x-forwarded-for") || "unknown",
    });
    return NextResponse.json(
      { error: "Authentication required. Please log in." },
      { status: 401 }
    );
  }

  if (await isTokenRevoked(token)) {
    logger.security("UNAUTHORIZED_ACCESS_REVOKED_TOKEN", "anonymous", {
      path: req.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: "Session has been revoked or invalidated. Please log in again." },
      { status: 401 }
    );
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    logger.security("UNAUTHORIZED_ACCESS_INVALID_TOKEN", "anonymous", {
      path: req.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: "Invalid or expired session. Please log in again." },
      { status: 401 }
    );
  }

  const userRole = payload.role as UserRole;
  if (!allowedRoles.includes(userRole)) {
    logger.security("FORBIDDEN_ROLE_ACCESS", payload.email || "unknown", {
      role: userRole,
      allowedRoles,
      path: req.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: `Forbidden. Requires one of: ${allowedRoles.join(", ")}.` },
      { status: 403 }
    );
  }

  return { payload };
}

/**
 * Restricts access to Super Admin or Institution Admin.
 */
export async function requireAdminAuth(
  req: NextRequest
): Promise<{ payload: Record<string, any> } | NextResponse> {
  return requireRoleAuth(req, ADMIN_ROLES);
}

/**
 * Restricts access to any authenticated user with a valid unrevoked session.
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ payload: Record<string, any> } | NextResponse> {
  const token = extractToken(req);

  if (!token) {
    logger.security("UNAUTHORIZED_ACCESS_NO_TOKEN", "anonymous", {
      path: req.nextUrl.pathname,
      ip: req.headers.get("x-forwarded-for") || "unknown",
    });
    return NextResponse.json(
      { error: "Authentication required. Please log in." },
      { status: 401 }
    );
  }

  if (await isTokenRevoked(token)) {
    logger.security("UNAUTHORIZED_ACCESS_REVOKED_TOKEN", "anonymous", {
      path: req.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: "Session has been revoked or invalidated. Please log in again." },
      { status: 401 }
    );
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    logger.security("UNAUTHORIZED_ACCESS_INVALID_TOKEN", "anonymous", {
      path: req.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: "Invalid or expired session. Please log in again." },
      { status: 401 }
    );
  }

  return { payload };
}

/**
 * Restricts access to Faculty, Academic Leadership, or Admins.
 */
export async function requireFacultyOrAdminAuth(
  req: NextRequest
): Promise<{ payload: Record<string, any> } | NextResponse> {
  return requireRoleAuth(req, FACULTY_LEADERSHIP_ROLES);
}


