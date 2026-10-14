import { NextRequest, NextResponse } from "next/server";
import {
  getAllRepositoryItems,
  searchRepository,
  depositRepositoryItem,
  generateCitation,
  requestSecuredDownload,
  getRepositoryAnalytics,
} from "@/lib/library/elibrary-repository-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const department = searchParams.get("department") || undefined;
    const itemType = searchParams.get("itemType") || undefined;
    const accessLevel = searchParams.get("accessLevel") || undefined;

    const items = searchRepository({ query, department, itemType, accessLevel });
    const analytics = getRepositoryAnalytics();

    return NextResponse.json({
      success: true,
      count: items.length,
      items,
      analytics,
    });
  } catch (error: any) {
    console.error("Error in GET /api/library/elibrary:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch repository items" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action is required ('DEPOSIT_ITEM', 'GENERATE_CITATION', 'SECURE_DOWNLOAD')" },
        { status: 400 }
      );
    }

    if (action === "DEPOSIT_ITEM") {
      const {
        itemType,
        title,
        author,
        authorAffiliation,
        department,
        publicationYear,
        license,
        abstract,
        keywords,
        fileSizeMb,
        fileFormat,
        accessLevel,
        advisor,
        peerReviewed,
      } = body;

      if (!itemType || !title || !author || !department || !abstract) {
        return NextResponse.json(
          { success: false, error: "Missing required fields (itemType, title, author, department, abstract)" },
          { status: 400 }
        );
      }

      const deposited = depositRepositoryItem({
        itemType,
        title,
        author,
        authorAffiliation: authorAffiliation || "Apex Institute of Technology",
        department,
        publicationYear: publicationYear ? Number(publicationYear) : undefined,
        license: license || "CC-BY-4.0",
        abstract,
        keywords: Array.isArray(keywords) ? keywords : typeof keywords === "string" ? keywords.split(",") : [],
        fileSizeMb: fileSizeMb ? Number(fileSizeMb) : 4.5,
        fileFormat: fileFormat || "PDF",
        accessLevel: accessLevel || "OPEN_ACCESS",
        advisor,
        peerReviewed: peerReviewed !== undefined ? Boolean(peerReviewed) : true,
      });

      return NextResponse.json({
        success: true,
        message: "Repository asset deposited successfully with institutional DOI assigned",
        item: deposited,
      });
    }

    if (action === "GENERATE_CITATION") {
      const { itemId, style } = body;
      if (!itemId) {
        return NextResponse.json({ success: false, error: "itemId is required" }, { status: 400 });
      }

      const chosenStyle = (style || "APA").toUpperCase() as "APA" | "IEEE" | "BIBTEX";
      const result = generateCitation(itemId, chosenStyle);
      return NextResponse.json({ success: true, citation: result });
    }

    if (action === "SECURE_DOWNLOAD") {
      const { itemId, requesterName, requesterEmail, requesterRole } = body;
      if (!itemId) {
        return NextResponse.json({ success: false, error: "itemId is required" }, { status: 400 });
      }

      const pass = requestSecuredDownload(itemId, {
        name: requesterName || "Faculty / Researcher",
        email: requesterEmail || "researcher@apex.edu",
        role: requesterRole || "ACADEMICIAN",
      });

      return NextResponse.json({
        success: true,
        message: "Cryptographic secure download authorization generated",
        pass,
      });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("Error in POST /api/library/elibrary:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process e-library request" },
      { status: 500 }
    );
  }
}
