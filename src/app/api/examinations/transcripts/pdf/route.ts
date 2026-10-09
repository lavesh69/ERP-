import { NextRequest, NextResponse } from "next/server";
import { GET as getTranscriptJson } from "@/app/api/examinations/transcripts/route";
import { generateTranscriptHtml } from "@/lib/examinations/transcript-template";
import { logger } from "@/lib/logging/logger";

/**
 * GET /api/examinations/transcripts/pdf
 * Returns official printable academic transcript with embedded print-to-PDF styles and security watermark
 */
export async function GET(req: NextRequest) {
  try {
    // Clone request with format=json to retrieve verified transcript model
    const url = new URL(req.url);
    url.searchParams.delete("format");
    url.searchParams.delete("export");

    const jsonReq = new NextRequest(url.toString(), {
      headers: req.headers,
    });

    const res = await getTranscriptJson(jsonReq);
    if (res.status !== 200) {
      return res;
    }

    const data = await res.json();
    if (!data.transcript) {
      return NextResponse.json({ error: "Transcript data not found" }, { status: 404 });
    }

    const html = generateTranscriptHtml(data.transcript);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    logger.error("Transcript PDF GET Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate transcript PDF view" },
      { status: 500 }
    );
  }
}
