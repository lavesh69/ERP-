import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";

const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost:(3000|5173|5174)$/,
  /^https:\/\/erp-.*\.vercel\.app$/,
  /^https:\/\/.*-lavesh69s-projects\.vercel\.app$/,
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

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



  // CORS Handling for APIs
  const origin = req.headers.get("origin");
  const isAllowed = isOriginAllowed(origin);

  if (req.method === "OPTIONS") {
    const preflightHeaders = new Headers();
    if (isAllowed && origin) {
      preflightHeaders.set("Access-Control-Allow-Origin", origin);
      preflightHeaders.set("Access-Control-Allow-Credentials", "true");
      preflightHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      preflightHeaders.set(
        "Access-Control-Allow-Headers",
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, User-Agent"
      );
      preflightHeaders.set("Access-Control-Max-Age", "86400");
    }
    return new NextResponse(null, { status: isAllowed ? 204 : 403, headers: preflightHeaders });
  }

  // Forward user session info in headers to downstream routes
  const response = NextResponse.next();
  if (userSession) {
    response.headers.set("x-user-id", userSession.userId || "");
    response.headers.set("x-user-role", userSession.role || "");
    response.headers.set("x-user-institution", userSession.institutionId || "");
  }

  if (isAllowed && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Enterprise Security Headers
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https: wss:; frame-src 'self' https://challenges.cloudflare.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self';"
  );
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
