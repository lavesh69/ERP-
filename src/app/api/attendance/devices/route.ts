import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireFacultyOrAdminAuth, getOptionalSession } from "@/lib/auth/admin-guard";
import { CLASSROOM_BLE_SERVICE_UUID } from "@/lib/attendance/ble";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to access campus IoT hardware beacons." },
        { status: 401 }
      );
    }

    const tenantFilter =
      session.role === "SUPER_ADMIN" || !session.institutionId
        ? {}
        : {
            room: {
              campus: {
                institutionId: session.institutionId,
              },
            },
          };

    const devices = await prisma.bleDevice.findMany({
      where: tenantFilter,
      include: {
        room: {
          select: { id: true, code: true, name: true, type: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      devices,
      defaultServiceUuid: CLASSROOM_BLE_SERVICE_UUID,
    });
  } catch (error) {
    console.error("BLE Devices GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch BLE devices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      name,
      roomId,
      serviceUuid = CLASSROOM_BLE_SERVICE_UUID,
      characteristicUuid,
      beaconIdentifier: inputBeaconIdentifier,
      beaconId,
      major,
      minor,
      rssiThreshold = -80,
    } = body;

    const beaconIdentifier = inputBeaconIdentifier || beaconId;

    if (!name || !beaconIdentifier) {
      return NextResponse.json(
        { error: "name and beaconIdentifier are required" },
        { status: 400 }
      );
    }

    if (roomId && auth.payload.role !== "SUPER_ADMIN" && auth.payload.institutionId) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { campus: true },
      });
      if (room && room.campus.institutionId !== auth.payload.institutionId) {
        return NextResponse.json(
          { error: "Forbidden: You cannot register hardware for a room in another institution." },
          { status: 403 }
        );
      }
    }

    const device = await prisma.bleDevice.create({
      data: {
        name,
        roomId: roomId || null,
        serviceUuid,
        characteristicUuid: characteristicUuid || null,
        beaconIdentifier,
        major: typeof major === "number" ? major : null,
        minor: typeof minor === "number" ? minor : null,
        rssiThreshold: typeof rssiThreshold === "number" ? rssiThreshold : -80,
        isActive: true,
      },
      include: {
        room: true,
      },
    });

    return NextResponse.json({
      message: "BLE Device registered successfully",
      device,
    });
  } catch (error) {
    console.error("BLE Device POST Error:", error);
    return NextResponse.json({ error: "Failed to register BLE device" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Device ID required" }, { status: 400 });
    }

    await prisma.bleDevice.delete({
      where: { id },
    });

    return NextResponse.json({ message: "BLE Device removed successfully" });
  } catch (error) {
    console.error("BLE Device DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete BLE device" }, { status: 500 });
  }
}
