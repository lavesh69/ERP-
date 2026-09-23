import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { getUserTotpSecret, getTotpUri, generateQrCodeDataUrl } from "@/lib/auth/two-factor";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, twoFactorEnabled: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const secret = getUserTotpSecret(user.id);
    const uri = getTotpUri(user.email, secret);
    const qrCodeDataUrl = await generateQrCodeDataUrl(uri);

    return NextResponse.json({
      success: true,
      email: user.email,
      secret,
      uri,
      qrCodeDataUrl,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error: any) {
    console.error("2FA Setup Error:", error);
    return NextResponse.json({ error: "Failed to initiate 2FA setup", details: error.message }, { status: 500 });
  }
}
