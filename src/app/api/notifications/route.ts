import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to view notifications" },
        { status: 401 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    logger.error("Notifications GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const { id, markAllRead } = body;

    if (markAllRead) {
      const updateResult = await prisma.notification.updateMany({
        where: { userId: auth.payload.userId },
        data: { isRead: true },
      });
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
        updatedCount: updateResult.count,
      });
    }

    if (id) {
      const notification = await prisma.notification.findUnique({ where: { id } });
      if (!notification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      if (notification.userId !== auth.payload.userId) {
        logger.security("BOLA_NOTIFICATION_UNAUTHORIZED_ACCESS", auth.payload.email, {
          targetNotificationId: id,
          actualOwnerId: notification.userId,
        });
        return NextResponse.json(
          { error: "Forbidden: You cannot modify another user's notifications" },
          { status: 403 }
        );
      }

      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ error: "id or markAllRead required" }, { status: 400 });
  } catch (error: any) {
    logger.error("Notifications PATCH Error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (notification.userId !== auth.payload.userId) {
      logger.security("BOLA_NOTIFICATION_DELETE_UNAUTHORIZED", auth.payload.email, {
        targetNotificationId: id,
        actualOwnerId: notification.userId,
      });
      return NextResponse.json(
        { error: "Forbidden: You cannot delete another user's notifications" },
        { status: 403 }
      );
    }

    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    logger.error("Notifications DELETE Error:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
