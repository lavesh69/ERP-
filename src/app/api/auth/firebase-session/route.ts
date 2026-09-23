import { NextRequest, NextResponse } from "next/server";
import { signJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/audit/logger";
import { UserRole, SessionUser } from "@/types/auth";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json().catch(() => ({}));
    const {
      uid,
      email,
      displayName,
      phoneNumber,
      photoURL,
      role = "STUDENT",
      providerId = "firebase",
      isTestPhone = false,
      rememberMe = true,
    } = body;

    if (!uid) {
      return NextResponse.json(
        { error: "Invalid Firebase session payload: uid is required" },
        { status: 400 }
      );
    }

    // Determine target email
    const cleanEmail = email
      ? email.toLowerCase().trim()
      : phoneNumber
      ? `phone.${phoneNumber.replace(/[^0-9]/g, "")}@trial.classroom.edu`
      : `scholar.${uid.substring(0, 10)}@trial.classroom.edu`;

    // 1. Check if user already exists in database
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, ...(phoneNumber ? [{ phone: phoneNumber }] : [])],
      },
      include: {
        institution: true,
        studentProfile: true,
        facultyProfile: true,
        parentProfile: true,
      },
    });

    let isNewUser = false;

    // 2. If user doesn't exist, create profile in database
    if (!user) {
      isNewUser = true;

      // Find or create default institution
      let institution = await prisma.institution.findFirst();
      if (!institution) {
        institution = await prisma.institution.create({
          data: {
            code: "APEX-MAIN",
            name: "Apex Institute of Science & Technology",
            legalName: "Apex Global Educational Foundation",
            status: "ACTIVE",
          },
        });
      }

      // Parse display name
      const nameParts = (displayName || "").trim().split(/\s+/);
      const firstName = nameParts[0] || (phoneNumber ? "Mobile" : "Scholar");
      const lastName = nameParts.slice(1).join(" ") || (phoneNumber ? "User" : "Trial");

      const defaultPasswordHash = await hashPassword("Classroom@2026");

      // Find program if student
      let program = await prisma.program.findFirst();
      if (!program) {
        let department = await prisma.department.findFirst();
        if (!department) {
          let campus = await prisma.campus.findFirst();
          if (!campus) {
            campus = await prisma.campus.create({
              data: {
                institutionId: institution.id,
                code: "MAIN-CAMPUS",
                name: "Apex Central Campus",
                location: "Boston, USA",
              },
            });
          }
          department = await prisma.department.create({
            data: {
              institutionId: institution.id,
              campusId: campus.id,
              code: "CS",
              name: "Computer Science & Engineering",
            },
          });
        }
        program = await prisma.program.create({
          data: {
            departmentId: department.id,
            code: "BTECH-CS",
            name: "Bachelor of Technology in Computer Science",
            degree: "B.Tech",
          },
        });
      }

      const assignedRole: UserRole = [
        "SUPER_ADMIN",
        "INSTITUTION_ADMIN",
        "FACULTY",
        "STUDENT",
        "PARENT",
      ].includes(role)
        ? (role as UserRole)
        : "STUDENT";

      const rollNumberSuffix = Math.floor(1000 + Math.random() * 9000);
      const studentRoll = `TR-${rollNumberSuffix}`;

      user = await prisma.user.create({
        data: {
          institutionId: institution.id,
          email: cleanEmail,
          passwordHash: defaultPasswordHash,
          firstName,
          lastName,
          phone: phoneNumber || null,
          avatarUrl: photoURL || null,
          role: assignedRole,
          isActive: true,
          mustChangePassword: false,
          ...(assignedRole === "STUDENT"
            ? {
                studentProfile: {
                  create: {
                    rollNumber: studentRoll,
                    admissionNumber: `ADM-${rollNumberSuffix}`,
                    admissionDate: new Date(),
                    currentSemester: 1,
                    programId: program.id,
                    status: "ACTIVE",
                    cgpa: 3.85,
                    attendanceRate: 94.0,
                  },
                },
              }
            : {}),
        },
        include: {
          institution: true,
          studentProfile: true,
          facultyProfile: true,
          parentProfile: true,
        },
      });

      // Log trial enrollment
      await logAuditEvent({
        institutionId: institution.id,
        actorUserId: user.id,
        action: "TRIAL_USER_PROVISIONED",
        targetEntity: "User",
        targetId: user.id,
        details: {
          providerId,
          isTestPhone,
          email: cleanEmail,
          role: assignedRole,
        },
      });
    }

    // 3. Construct session user object
    const sessionUser: SessionUser = {
      id: user.id,
      institutionId: user.institutionId,
      institutionName: user.institution?.name || "Apex Institute of Science & Technology",
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role as UserRole,
      avatarUrl: user.avatarUrl || undefined,
      studentId: user.studentProfile?.id,
      facultyId: user.facultyProfile?.id,
      parentId: user.parentProfile?.id,
    };

    // 4. Issue standard JWT token (7 days for trial, 24 hours standard)
    const tokenLifetimeSeconds = rememberMe ? 7 * 86400 : 86400;
    const token = await signJwt(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
        fullName: sessionUser.fullName,
        avatarUrl: sessionUser.avatarUrl,
        provider: providerId,
        isTrialAuth: true,
      },
      tokenLifetimeSeconds
    );

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      isNewUser,
      authMethod: providerId,
    });

    // 5. Set HTTP-only secure cookie for Next.js SSR middleware
    response.cookies.set("classroom_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: tokenLifetimeSeconds,
    });

    return response;
  } catch (error: any) {
    console.error("Firebase session bridge error:", error);

    const errorMessage = String(error?.message || error || "");
    const isDbConfigError =
      errorMessage.includes("DATABASE_URL") ||
      errorMessage.includes("datasource 'db'") ||
      errorMessage.includes("Can't reach database server") ||
      errorMessage.includes("does not exist") ||
      errorMessage.includes("PrismaClientInitializationError") ||
      errorMessage.includes("Empty string");

    if (isDbConfigError && body?.uid) {
      try {
        const fallbackEmail = body.email || `scholar.${body.uid.substring(0, 8)}@trial.classroom.edu`;
        const fallbackName = body.displayName || "Academic User";
        const fallbackRole = (body.role as UserRole) || "STUDENT";
        const fallbackLifetime = body.rememberMe ? 7 * 86400 : 86400;

        const sessionUser: SessionUser = {
          id: body.uid,
          email: fallbackEmail,
          fullName: fallbackName,
          role: fallbackRole,
          institutionId: "inst-default",
          institutionName: "Apex Autonomous University",
          status: "ACTIVE",
          avatarUrl: body.photoURL,
        };

        const token = await signJwt(
          {
            sub: body.uid,
            email: fallbackEmail,
            role: fallbackRole,
            institutionId: "inst-default",
            fullName: fallbackName,
            avatarUrl: body.photoURL,
            provider: body.providerId || "firebase",
            isTrialAuth: true,
          },
          fallbackLifetime
        );

        const fallbackResponse = NextResponse.json({
          success: true,
          user: sessionUser,
          isNewUser: false,
          authMethod: body.providerId || "firebase",
          trialNotice: "Running in Resilient Trial Mode: DATABASE_URL not yet connected in Vercel settings.",
        });

        fallbackResponse.cookies.set("classroom_session", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: fallbackLifetime,
        });

        return fallbackResponse;
      } catch (fallbackError) {
        console.error("Critical fallback session error:", fallbackError);
      }
    }

    return NextResponse.json(
      { error: error.message || "Failed to establish Firebase session" },
      { status: 500 }
    );
  }
}
