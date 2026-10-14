import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import {
  getFacultyResearchPortfolio,
  addPublicationToPortfolio,
  addGrantToPortfolio,
  addPatentToPortfolio,
  loadAllPortfolios,
} from "@/lib/faculty/faculty-research-portfolio-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let facultyId = searchParams.get("facultyId");
    const mode = searchParams.get("mode"); // "all" for dean/admin view

    if (mode === "all" && (session.user?.role === "ADMIN" || session.user?.role === "DEAN" || session.user?.role === "MANAGEMENT")) {
      const allPortfolios = loadAllPortfolios();
      return NextResponse.json({
        success: true,
        portfolios: Object.values(allPortfolios),
      });
    }

    if (!facultyId) {
      // Try resolving from faculty record of the logged-in user
      const faculty = await prisma.faculty.findFirst({
        where: { userId: session.user?.id || "" },
      });
      if (faculty) {
        facultyId = faculty.id;
      } else {
        facultyId = "fac-demo-01";
      }
    }

    // Attempt to lookup faculty name
    let facultyName = "Faculty Member";
    try {
      const dbFac = await prisma.faculty.findUnique({
        where: { id: facultyId },
        include: { user: true },
      });
      if (dbFac) {
        facultyName = `${dbFac.user?.firstName || ""} ${dbFac.user?.lastName || ""}`.trim() || "Dr. Rajesh K. Sharma";
      }
    } catch {
      // fallback
    }

    const portfolio = getFacultyResearchPortfolio(facultyId, facultyName);

    return NextResponse.json({
      success: true,
      portfolio,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { action, facultyId: rawFacultyId } = body;

    let targetFacultyId = rawFacultyId;
    if (!targetFacultyId) {
      const faculty = await prisma.faculty.findFirst({
        where: { userId: session.userId || (session as any).user?.id || "" },
      });
      targetFacultyId = faculty ? faculty.id : "fac-demo-01";
    }

    if (action === "ADD_PUBLICATION") {
      const {
        title,
        journalName,
        issnOrIsbn,
        indexing = "SCOPUS",
        impactFactor = 1.0,
        authorshipRole = "FIRST_AUTHOR",
        totalAuthors = 1,
        doi,
        publicationYear = new Date().getFullYear(),
        facultyName = (session as any).user?.name || "Faculty Member",
      } = body;

      if (!title || !journalName) {
        return NextResponse.json(
          { error: "Title and Journal Name are required for publication registration" },
          { status: 400 }
        );
      }

      const updated = addPublicationToPortfolio(targetFacultyId, {
        facultyId: targetFacultyId,
        facultyName,
        title,
        journalName,
        issnOrIsbn: issnOrIsbn || "N/A",
        indexing,
        impactFactor: Number(impactFactor),
        authorshipRole,
        totalAuthors: Number(totalAuthors),
        doi,
        publicationYear: Number(publicationYear),
      });

      return NextResponse.json({
        success: true,
        message: "Research publication registered with UGC Regulation 2018 Table 2 scoring",
        portfolio: updated,
      });
    }

    if (action === "ADD_GRANT") {
      const {
        projectTitle,
        fundingAgency = "DST",
        sanctionOrderNumber,
        sanctionYear = new Date().getFullYear(),
        durationMonths = 36,
        totalOutlayInr,
        fundsDisbursedInr = 0,
        investigatorRole = "PRINCIPAL_INVESTIGATOR",
        status = "SANCTIONED",
        facultyName = (session as any).user?.name || "Faculty Member",
      } = body;

      if (!projectTitle || !sanctionOrderNumber || !totalOutlayInr) {
        return NextResponse.json(
          { error: "Project title, sanction order, and outlay are required for grant logging" },
          { status: 400 }
        );
      }

      const updated = addGrantToPortfolio(targetFacultyId, {
        facultyId: targetFacultyId,
        facultyName,
        projectTitle,
        fundingAgency,
        sanctionOrderNumber,
        sanctionYear: Number(sanctionYear),
        durationMonths: Number(durationMonths),
        totalOutlayInr: Number(totalOutlayInr),
        fundsDisbursedInr: Number(fundsDisbursedInr),
        investigatorRole,
        status,
      });

      return NextResponse.json({
        success: true,
        message: "Extramural research grant logged with UGC API points",
        portfolio: updated,
      });
    }

    if (action === "ADD_PATENT") {
      const {
        title,
        patentOffice = "INDIA_IPO",
        applicationNumber,
        filingDate = new Date().toISOString().split("T")[0],
        grantDate,
        stage = "FILED",
        isNational = true,
        facultyName = (session as any).user?.name || "Faculty Member",
      } = body;

      if (!title || !applicationNumber) {
        return NextResponse.json(
          { error: "Title and application number are required for patent registration" },
          { status: 400 }
        );
      }

      const updated = addPatentToPortfolio(targetFacultyId, {
        facultyId: targetFacultyId,
        facultyName,
        title,
        patentOffice,
        applicationNumber,
        filingDate,
        grantDate,
        stage,
        isNational: Boolean(isNational),
      });

      return NextResponse.json({
        success: true,
        message: "Intellectual Property / Patent registered successfully",
        portfolio: updated,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
