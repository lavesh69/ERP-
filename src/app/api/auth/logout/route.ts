import { NextRequest, NextResponse } from "next/server";
import { revokeToken } from "@/lib/auth/token-revocation";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("classroom_session")?.value;
  if (token) {
    await revokeToken(token);
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.set("classroom_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
