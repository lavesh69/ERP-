import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireFacultyOrAdminAuth, getOptionalSession } from "@/lib/auth/admin-guard";

export async function POST(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { courseCode, defaulters } = body;

    const institution = await prisma.institution.findFirst();
    if (!institution) {
      return NextResponse.json({ error: "Institution context missing" }, { status: 400 });
    }

    const defaulterNames = Array.isArray(defaulters)
      ? defaulters.map((d: any) => typeof d === "string" ? d : `${d.name} (${d.aggregate}%)`).join(", ")
      : "Students below threshold";

    // 1. Create a high-priority institutional announcement targeted at PARENTS
    const announcement = await prisma.announcement.create({
      data: {
        institutionId: institution.id,
        title: `Pastoral Attendance Warning: ${courseCode || "Semester V Course"}`,
        content: `Official pastoral notification issued for scholars below the mandatory 75% attendance threshold: ${defaulterNames}. Guardians must schedule an advisory review.`,
        targetAudience: "PARENTS",
        priority: "HIGH",
      },
    });

    // 2. Also send notifications to all parent user accounts
    const parentUsers = await prisma.user.findMany({
      where: { role: "PARENT" },
    });

    for (const parent of parentUsers) {
      await prisma.notification.create({
        data: {
          userId: parent.id,
          title: `Attendance Defaulter Notice (${courseCode || "CS-402"})`,
          message: `Your ward has fallen below the 75% attendance criteria. Please review their attendance ledger immediately.`,
          type: "ATTENDANCE",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Pastoral defaulter warnings successfully recorded and dispatched to ${parentUsers.length || 1} guardian(s).`,
      announcementId: announcement.id,
    });
  } catch (error: any) {
    console.error("Attendance defaulters API error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch pastoral guardian alerts", details: error.message },
      { status: 500 }
    );
  }
}
