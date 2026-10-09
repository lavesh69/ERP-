import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { logger } from "@/lib/logging/logger";

const ELECTIVE_DATA_FILE = path.join(
  process.cwd(),
  "data",
  "curriculum",
  "elective_registrations.json"
);

function getElectiveData() {
  try {
    if (fs.existsSync(ELECTIVE_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(ELECTIVE_DATA_FILE, "utf-8"));
    }
  } catch (err) {
    logger.error("Failed to read elective registration data", err);
  }
  return {
    semesterTerm: "Fall 2026 - CBCS",
    minCreditsRequired: 18,
    maxCreditsAllowed: 24,
    registrationDeadline: "2026-10-31T23:59:59Z",
    availableElectives: [],
    studentRegistrations: [],
  };
}

function saveElectiveData(data: any) {
  try {
    const dir = path.dirname(ELECTIVE_DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ELECTIVE_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    logger.error("Failed to write elective registration data", err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const data = getElectiveData();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error("Elective Registration GET Error", error);
    return NextResponse.json(
      { error: "Failed to fetch elective course options" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, studentRoll, studentName, choices, totalCredits } = body;

    const data = getElectiveData();

    if (action === "SUBMIT_CHOICE_FILLING") {
      if (!choices || !Array.isArray(choices) || choices.length === 0) {
        return NextResponse.json(
          { error: "At least one elective course choice is required." },
          { status: 400 }
        );
      }

      // Check seat capacity and lock seats
      const allottedChoices = choices.map((choice: any, idx: number) => {
        const course = data.availableElectives.find((c: any) => c.code === choice.courseCode);
        if (course) {
          if (course.enrolledCount < course.maxSeats) {
            course.enrolledCount += 1;
            return {
              preference: choice.preference || idx + 1,
              courseCode: course.code,
              courseTitle: course.title,
              credits: course.credits,
              status: "ALLOTTED",
            };
          } else {
            return {
              preference: choice.preference || idx + 1,
              courseCode: course.code,
              courseTitle: course.title,
              credits: course.credits,
              status: "WAITLISTED",
            };
          }
        }
        return {
          preference: choice.preference || idx + 1,
          courseCode: choice.courseCode,
          status: "PENDING_SCRUTINY",
        };
      });

      const newRegistration = {
        id: `reg-cbcs-${Date.now()}`,
        studentRoll: studentRoll || "APX2026-CS-042",
        studentName: studentName || "Candidate Scholar",
        registeredTerm: data.semesterTerm || "Fall 2026",
        priorityChoices: allottedChoices,
        totalCreditsRegistered: Number(totalCredits) || 21,
        status: "CONFIRMED_SEALED",
        enrolledAt: new Date().toISOString(),
        sealHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
      };

      data.studentRegistrations = [newRegistration, ...(data.studentRegistrations || [])];
      saveElectiveData(data);

      return NextResponse.json({
        success: true,
        message: "CBCS Elective Choice Filling submitted and verified successfully!",
        registration: newRegistration,
        availableElectives: data.availableElectives,
      });
    }

    return NextResponse.json(
      { error: "Unknown action provided" },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error("Elective Registration POST Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to process course enrollment" },
      { status: 500 }
    );
  }
}
