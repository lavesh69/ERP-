import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

function sanitizeFilename(filename: string): string {
  const base = path.basename(filename);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const expires = searchParams.get("expires");
    const sig = searchParams.get("sig");

    if (!key) {
      return NextResponse.json({ error: "File key parameter is required" }, { status: 400 });
    }

    const cleanKey = sanitizeFilename(key);
    let isAuthorized = false;

    // 1. Signature-based verification (Presigned HMAC URL)
    if (expires && sig) {
      const expiresAt = parseInt(expires, 10);
      if (!isNaN(expiresAt) && Date.now() <= expiresAt) {
        const secret = process.env.SESSION_SECRET || "classroom-storage-secret";
        const expectedSig = crypto
          .createHmac("sha256", secret)
          .update(`${cleanKey}:${expiresAt}`)
          .digest("hex");

        if (
          expectedSig.length === sig.length &&
          crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig))
        ) {
          isAuthorized = true;
        }
      }
    }

    // 2. Session-based fallback verification
    if (!isAuthorized) {
      const session = await getOptionalSession(req);
      if (session) {
        // Authenticated users with valid session can download
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Access Denied: Invalid, expired, or unauthorized download request." },
        { status: 403 }
      );
    }

    // Locate file in storage directories (private or public)
    const privatePath = path.join(process.cwd(), "storage", "private", cleanKey);
    const publicPath = path.join(process.cwd(), "public", "uploads", "documents", cleanKey);

    let filePath: string | null = null;
    if (fs.existsSync(privatePath)) {
      filePath = privatePath;
    } else if (fs.existsSync(publicPath)) {
      filePath = publicPath;
    }

    if (!filePath) {
      return NextResponse.json({ error: "The requested document file could not be found." }, { status: 404 });
    }

    // Path traversal check
    const resolvedPath = path.resolve(filePath);
    const storageRoot = path.resolve(process.cwd());
    if (!resolvedPath.startsWith(storageRoot)) {
      return NextResponse.json({ error: "Security Violation: Invalid file path." }, { status: 400 });
    }

    const fileBuffer = fs.readFileSync(resolvedPath);
    const ext = path.extname(cleanKey).toLowerCase();

    const MIME_TYPES: Record<string, string> = {
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".txt": "text/plain",
      ".csv": "text/csv",
    };

    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${cleanKey}"`,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    logger.error("Document download streaming error", { error: error.message });
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 });
  }
}
