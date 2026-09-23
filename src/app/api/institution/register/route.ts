import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/email/email-service";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      institutionName,
      code,
      adminEmail,
      adminFirstName,
      adminLastName,
      adminPassword,
      website,
    } = body;

    if (!institutionName || !code || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "institutionName, code, adminEmail, and adminPassword are required" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");

    // 1. Check uniqueness
    const existingInst = await prisma.institution.findUnique({
      where: { code: cleanCode },
    });
    if (existingInst) {
      return NextResponse.json(
        { error: `Institution with code '${cleanCode}' is already registered.` },
        { status: 409 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail.trim().toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: `A user with email '${adminEmail}' already exists in the system.` },
        { status: 409 }
      );
    }

    // 2. Provision New Multi-Tenant Workspace
    const institution = await prisma.institution.create({
      data: {
        name: institutionName.trim(),
        code: cleanCode,
        legalName: institutionName.trim(),
        website: website || `https://${cleanCode.toLowerCase()}.classroom.edu`,
        status: "ACTIVE",
      },
    });

    // 3. Create Default Main Campus
    const campus = await prisma.campus.create({
      data: {
        institutionId: institution.id,
        code: `${cleanCode}-MAIN`,
        name: `${institutionName} Main Campus`,
        location: "Institutional Headquarters",
        isMainCampus: true,
      },
    });

    // 4. Create Default Faculty Department
    await prisma.department.create({
      data: {
        institutionId: institution.id,
        campusId: campus.id,
        code: "ENG-SCI",
        name: "School of Engineering & Sciences",
      },
    });

    // 5. Create Root Institution Admin User
    const passwordHash = await hashPassword(adminPassword);
    const adminUser = await prisma.user.create({
      data: {
        institutionId: institution.id,
        email: adminEmail.trim().toLowerCase(),
        passwordHash,
        firstName: adminFirstName || "Provost",
        lastName: adminLastName || "Administrator",
        role: "INSTITUTION_ADMIN",
        isActive: true,
      },
    });

    // 6. Record Audit Trail
    await logAuditEvent({
      institutionId: institution.id,
      actorUserId: adminUser.id,
      action: "PERMISSION_OVERRIDE",
      targetEntity: "Institution",
      targetId: institution.id,
      details: {
        code: cleanCode,
        name: institutionName,
        adminEmail: adminUser.email,
      },
    });

    // 7. Dispatch Provisioning Confirmation Email
    await sendEmail({
      to: adminUser.email,
      subject: `Welcome to CLASSROOM ERP — ${institutionName} Provisioned`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #231e21;">
          <h2 style="color: #8e5368;">Institution Tenant Live</h2>
          <p>Congratulations! <strong>${institutionName}</strong> (Code: <code>${cleanCode}</code>) has been successfully provisioned.</p>
          <p>You can now log in using your admin credentials: <strong>${adminUser.email}</strong>.</p>
        </div>
      `,
      type: "WELCOME",
    });

    return NextResponse.json({
      success: true,
      message: "Institution workspace and administrative credentials provisioned successfully",
      institution: {
        id: institution.id,
        code: institution.code,
        name: institution.name,
      },
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to provision institution" },
      { status: 500 }
    );
  }
}
