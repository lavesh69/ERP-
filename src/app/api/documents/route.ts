import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/storage";
import { requireRoleAuth, getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";
import fs from "fs";
import path from "path";
import { validateUploadFile } from "@/lib/storage/upload-validator";

const PUBLIC_DOCUMENT_CATEGORIES = [
  "SYLLABUS",
  "INSTITUTIONAL",
  "HANDBOOK",
  "POLICY",
  "CALENDAR",
  "TEMPLATE",
];

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const isStudent = session?.role === "STUDENT";

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const docs = await prisma.academicDocument.findMany({
      include: { user: true },
      orderBy: { uploadedAt: "desc" },
    });

    const filtered = docs
      .filter((d) => {
        // Privacy isolation for students: only see own docs or public institutional categories
        if (isStudent) {
          const isOwn = d.userId === session?.userId || d.user?.email === session?.email;
          const isPublic = PUBLIC_DOCUMENT_CATEGORIES.includes(d.category);
          if (!isOwn && !isPublic) return false;
        }
        return true;
      })
      .filter((d) => {
        if (category && category !== "ALL") {
          return d.category === category;
        }
        return true;
      })
      .filter((d) => {
        if (search) {
          const q = search.toLowerCase();
          return (
            d.title.toLowerCase().includes(q) ||
            d.category.toLowerCase().includes(q) ||
            `${d.user.firstName} ${d.user.lastName}`.toLowerCase().includes(q)
          );
        }
        return true;
      });

    return NextResponse.json({
      documents: filtered.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        fileUrl: d.fileUrl,
        fileSizeKb: d.fileSizeKb,
        mimeType: d.mimeType,
        uploadedAt: d.uploadedAt.toISOString().split("T")[0],
        uploaderName: `${d.user.firstName} ${d.user.lastName}`,
        format: d.mimeType.includes("pdf")
          ? "PDF"
          : d.mimeType.includes("image")
          ? "IMG"
          : d.mimeType.includes("word") || d.mimeType.includes("doc")
          ? "DOCX"
          : "FILE",
      })),
    });
  } catch (error: any) {
    console.error("Documents GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const category = (formData.get("category") as string) || "OFFICIAL_TRANSCRIPT";
    const userId = (formData.get("userId") as string) || "usr-alex-01";

    if (!title) {
      return NextResponse.json({ error: "Document title is required" }, { status: 400 });
    }

    // Default user fallback
    let authorUser = await prisma.user.findFirst();
    if (!authorUser) {
      return NextResponse.json({ error: "Institution user not found" }, { status: 400 });
    }

    let fileUrl = "/uploads/documents/sample-transcript.pdf";
    let fileSizeKb = 1024;
    let mimeType = "application/pdf";

    if (file && typeof file.arrayBuffer === "function") {
      const validation = validateUploadFile(file.name, file.type, file.size);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || "File upload validation failed" },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const isPrivate = category === "TRANSCRIPT" || category === "ID_PROOF" || category === "DEGREE";

      const storage = getStorageProvider();
      const uploadResult = await storage.upload(
        buffer,
        file.name,
        file.type || "application/pdf",
        isPrivate
      );

      fileUrl = uploadResult.fileUrl;
      fileSizeKb = Math.round(uploadResult.fileSizeBytes / 1024);
      mimeType = uploadResult.mimeType;
    }

    const doc = await prisma.academicDocument.create({
      data: {
        userId: authorUser.id,
        title,
        category,
        fileUrl,
        fileSizeKb,
        mimeType,
      },
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error: any) {
    console.error("Documents POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Must be authenticated to delete documents
  const auth = await requireRoleAuth(req, [
    "SUPER_ADMIN",
    "INSTITUTION_ADMIN",
    "FACULTY",
    "HOD",
    "HR_STAFF",
    "STUDENT",
  ]);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const doc = await prisma.academicDocument.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Only allow admin or the user who uploaded the document
    const isAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN"].includes(auth.payload.role);
    const isOwner = doc.userId === auth.payload.userId;

    if (!isAdmin && !isOwner) {
      logger.security("FORBIDDEN_DOCUMENT_DELETE", auth.payload.email, {
        documentId: id,
        ownerId: doc.userId,
      });
      return NextResponse.json(
        { error: "Forbidden. You can only delete your own documents." },
        { status: 403 }
      );
    }

    const storage = getStorageProvider();
    const fileKey = path.basename(doc.fileUrl);
    await storage.delete(fileKey).catch(() => {});
    await prisma.academicDocument.delete({ where: { id } });

    logger.info("Document deleted", {
      documentId: id,
      title: doc.title,
      actor: auth.payload.email,
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    logger.error("Documents DELETE Error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

