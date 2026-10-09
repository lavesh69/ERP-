import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { logger } from "@/lib/logging/logger";

const DETENTION_FILE = path.join(
  process.cwd(),
  "data",
  "policies",
  "attendance_detentions.json"
);

function getDetentionData() {
  try {
    if (fs.existsSync(DETENTION_FILE)) {
      return JSON.parse(fs.readFileSync(DETENTION_FILE, "utf-8"));
    }
  } catch (err) {
    logger.error("Failed to read detention file", err);
  }
  return {
    academicSession: "Fall 2026",
    statutoryThresholdPercent: 75.0,
    medicalCondonationFloorPercent: 65.0,
    condonations: [],
    sampleDetainedStudents: [],
  };
}

function saveDetentionData(data: any) {
  try {
    const dir = path.dirname(DETENTION_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DETENTION_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    logger.error("Failed to write detention file", err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const data = getDetentionData();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error("Detention GET Error", error);
    return NextResponse.json(
      { error: "Failed to fetch detention registry" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const data = getDetentionData();

    if (action === "APPLY_CONDONATION") {
      const {
        studentRoll,
        studentName,
        courseCode,
        courseTitle,
        attendancePercentage,
        medicalCertRef,
        hospitalName,
        condonationFeeReceipt,
        approvedBy,
      } = body;

      if (!studentRoll || !medicalCertRef) {
        return NextResponse.json(
          { error: "Student Roll number and Medical Certificate reference are required." },
          { status: 400 }
        );
      }

      const newCondonation = {
        id: `cnd-${Date.now()}`,
        studentRoll,
        studentName: studentName || "Candidate Scholar",
        courseCode: courseCode || "CS-402",
        courseTitle: courseTitle || "Advanced Course",
        attendancePercentage: Number(attendancePercentage) || 68.0,
        totalClasses: 40,
        attendedClasses: 27,
        status: "CONDONED_EXAM_PERMITTED",
        medicalCertRef,
        hospitalName: hospitalName || "Registered University Medical Center",
        condonationFeeReceipt: condonationFeeReceipt || `REC-${Date.now().toString().slice(-5)}`,
        condonationFeeAmount: 25,
        approvedBy: approvedBy || "HOD Academic Council",
        approvedAt: new Date().toISOString(),
      };

      data.condonations = [newCondonation, ...(data.condonations || [])];

      // Update student status in sampleDetainedStudents if present
      const matchIdx = (data.sampleDetainedStudents || []).findIndex(
        (s: any) => s.studentRoll === studentRoll
      );
      if (matchIdx >= 0) {
        data.sampleDetainedStudents[matchIdx].status = "CONDONED_EXAM_PERMITTED";
      }

      saveDetentionData(data);

      return NextResponse.json({
        success: true,
        message: `Medical Condonation granted for ${studentRoll}. Hall Ticket eligibility unblocked.`,
        condonation: newCondonation,
        detainedStudents: data.sampleDetainedStudents,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    logger.error("Detention POST Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to process condonation" },
      { status: 500 }
    );
  }
}
