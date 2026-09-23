import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Notifications GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (id) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ error: "id or markAllRead required" }, { status: 400 });
  } catch (error: any) {
    console.error("Notifications PATCH Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}
