import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { MOCK_USERS } from "@/lib/auth/roles";
import { logger } from "@/lib/logging/logger";

export const DEFAULT_DEMO_PASSWORD = "Classroom@2026";

export const ALL_DEMO_PERSONAS = [
  ...Object.values(MOCK_USERS).map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
  })),
  {
    id: "usr-fac-sharma-01",
    email: "faculty.sharma@apex.edu",
    firstName: "Rajesh",
    lastName: "Sharma",
    role: "FACULTY" as const,
  },
  {
    id: "usr-parent-mercer-01",
    email: "parent.mercer@apex.edu",
    firstName: "Sarah",
    lastName: "Mercer",
    role: "PARENT" as const,
  },
];

/**
 * Ensures all 16 institutional RBAC roles exist as real user rows in the database
 * with real PBKDF2 password hashes for "Classroom@2026".
 */
export async function ensureDbUsers() {
  try {
    let institution = await prisma.institution.findFirst();
    if (!institution) {
      institution = await prisma.institution.create({
        data: {
          id: "inst-apex-001",
          name: "Apex Institute of Technology & Management",
          code: "AITM",
          legalName: "Apex Institute of Technology & Management Foundation",
          website: "https://apex.edu",
          status: "ACTIVE",
        },
      });
      logger.info("Auto-initialized default institution for fresh database");
    }

    const defaultPasswordHash = await hashPassword(DEFAULT_DEMO_PASSWORD);

    for (const demoUser of ALL_DEMO_PERSONAS) {
      const cleanEmail = demoUser.email.toLowerCase().trim();
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: demoUser.id,
            institutionId: institution.id,
            email: cleanEmail,
            passwordHash: defaultPasswordHash,
            firstName: demoUser.firstName,
            lastName: demoUser.lastName,
            role: demoUser.role,
            isActive: true,
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
        logger.info(`Seeded real DB user: ${cleanEmail}`);
      } else if (process.env.NODE_ENV !== "production") {
        // Keep demo passwords synchronized to Classroom@2026 in development
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash: defaultPasswordHash,
            failedLoginAttempts: 0,
            lockedUntil: null,
            isActive: true,
          },
        });
      }
    }
  } catch (error: any) {
    logger.error("ensureDbUsers failed", error);
  }
}
