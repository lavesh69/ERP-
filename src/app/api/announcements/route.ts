import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireFacultyOrAdminAuth, getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const role = session?.role;

    let whereClause: any = {};
    if (role === "STUDENT") {
      whereClause = { targetAudience: { in: ["ALL", "STUDENT"] } };
    } else if (role && ["FACULTY", "PROFESSOR", "CLASS_TEACHER", "HOD"].includes(role)) {
      whereClause = { targetAudience: { in: ["ALL", "FACULTY", "STUDENT"] } };
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    logger.error("Announcements GET Error", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Faculty, Leadership, or Admin only
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { title, content, targetAudience, priority } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const institution = await prisma.institution.findFirst();
    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        institutionId: institution.id,
        title,
        content,
        targetAudience: targetAudience || "ALL",
        priority: priority || "NORMAL",
      },
    });

    logger.info("Announcement broadcasted", {
      title,
      targetAudience: targetAudience || "ALL",
      priority: priority || "NORMAL",
      actor: auth.payload.email,
    });

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error: any) {
    logger.error("Announcements POST Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to create announcement" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Faculty, Leadership, or Admin only
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.announcement.delete({ where: { id } });

    logger.info("Announcement deleted", {
      announcementId: id,
      actor: auth.payload.email,
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    logger.error("Announcements DELETE Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
