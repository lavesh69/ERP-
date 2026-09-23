import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files, Next.js internals, and public api/auth endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("classroom_session")?.value;
  let userSession = null;

  if (sessionCookie) {
    userSession = await verifyJwt<any>(sessionCookie);
  }

  // Role-Based Access Control (RBAC) Route Matrix
  const ROUTE_PERMISSIONS: Record<string, string[]> = {
    "/admin": ["SUPER_ADMIN", "INSTITUTION_ADMIN"],
    "/institution": ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD"],
    "/faculty": ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "HR_STAFF"],
    "/analytics": ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "ACCOUNTANT", "PLACEMENT_OFFICER"],
    "/research": ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "RESEARCH_COORDINATOR"],
  };

  // If visiting /login or /register while already authenticated, redirect to role home
  if (pathname === "/login" || pathname === "/register") {
    if (userSession) {
      const home = userSession.role === "STUDENT" ? "/students/profile" : "/";
      return NextResponse.redirect(new URL(home, req.url));
    }
    return NextResponse.next();
  }

  // Require active authenticated session for all application page routes
  if (!userSession && !pathname.startsWith("/api/")) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Enforce role permissions if logged in
  if (userSession) {
    // Restrict /students (directory list) from students — scholars must use /students/profile
    if (pathname === "/students" || pathname === "/students/") {
      if (userSession.role === "STUDENT" || userSession.role === "PARENT") {
        return NextResponse.redirect(new URL("/students/profile", req.url));
      }
    }

    for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
      if (pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)) {
        if (!allowedRoles.includes(userSession.role)) {
          const fallback = userSession.role === "STUDENT" ? "/students/profile" : "/";
          return NextResponse.redirect(new URL(fallback, req.url));
        }
      }
    }
  }



  // Forward user session info in headers to downstream routes
  const response = NextResponse.next();
  if (userSession) {
    response.headers.set("x-user-id", userSession.userId || "");
    response.headers.set("x-user-role", userSession.role || "");
  }

  // Enterprise Security Headers
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
