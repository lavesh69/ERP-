import { NextRequest, NextResponse } from "next/server";
import { exportToCsv, exportToExcelXml, ExportColumnDefinition } from "@/lib/export/tabular-export";
import { requireAuth } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

/**
 * POST /api/export/tabular
 * Export arbitrary dataset to CSV or Microsoft Excel SpreadsheetML XML
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      data,
      format = "csv",
      filename = "export",
      sheetName = "Data Sheet",
      columns,
    }: {
      data: Record<string, any>[];
      format?: "csv" | "excel";
      filename?: string;
      sheetName?: string;
      columns?: ExportColumnDefinition[];
    } = body;

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "data must be an array of records to export" },
        { status: 400 }
      );
    }

    const safeBaseName = filename.replace(/[^a-zA-Z0-9_\-]/g, "_");

    if (format === "excel") {
      const xml = exportToExcelXml(data, sheetName, columns);
      return new NextResponse(xml, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": `attachment; filename="${safeBaseName}.xls"`,
        },
      });
    }

    // Default CSV
    const csv = exportToCsv(data, columns);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeBaseName}.csv"`,
      },
    });
  } catch (error: any) {
    logger.error("Failed to generate tabular export", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate export file" },
      { status: 500 }
    );
  }
}
