import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "data", "system_settings.json");

const DEFAULT_SETTINGS = {
  aiQuestionGeneration: true,
  rfidAttendanceSync: true,
  strictGradeVerification: true,
};

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      const dir = path.dirname(SETTINGS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf8");
      return DEFAULT_SETTINGS;
    }
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings: any) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
    return true;
  } catch (err) {
    return false;
  }
}

export async function GET() {
  const settings = readSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = readSettings();
    const updated = { ...current, ...body };
    writeSettings(updated);

    return NextResponse.json({
      success: true,
      message: "Platform settings and AI guardrails persisted",
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to persist platform settings", details: error.message },
      { status: 500 }
    );
  }
}
