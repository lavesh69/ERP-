import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { logger } from "@/lib/logging/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rollNumber, admissionNumber, graduationYear, verificationAgency } = body;

    if (!rollNumber && !admissionNumber) {
      return NextResponse.json({ error: "rollNumber or admissionNumber is required" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          ...(rollNumber ? [{ rollNumber }] : []),
          ...(admissionNumber ? [{ admissionNumber }] : []),
        ],
      },
      include: {
        user: true,
        program: {
          include: { department: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({
        verified: false,
        message: "No credential matching provided enrollment identifiers found in university registry.",
      }, { status: 404 });
    }

    const verificationHash = crypto
      .createHash("sha256")
      .update(`${student.rollNumber}:${student.admissionNumber}:${student.cgpa}:APEX-DEGREE-VALID`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();

    const result = {
      verified: true,
      institution: "Apex University of Science & Technology",
      alumnus: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
        conferredDegree: student.program.name,
        department: student.program.department.name,
        cumulativeGpa: student.cgpa,
        academicStanding: student.cgpa >= 3.5 ? "FIRST_CLASS_WITH_DISTINCTION" : "FIRST_CLASS",
        degreeStatus: student.status === "GRADUATED" ? "CONFERRED" : "ENROLLED_ACTIVE",
      },
      cryptographicProof: {
        certificateReference: `DEG-APEX-${verificationHash}`,
        registrarDigitalStamp: "SEAL_VERIFIED_REGISTRAR_APEX_2026",
        timestamp: new Date().toISOString(),
      },
      verifiedForAgency: verificationAgency || "Corporate Background Verification Partner",
    };

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    logger.error("Alumni verification POST error", error);
    return NextResponse.json({ error: "Failed to verify graduate credential" }, { status: 500 });
  }
}
