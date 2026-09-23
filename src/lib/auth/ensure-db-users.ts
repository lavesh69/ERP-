import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { MOCK_USERS } from "@/lib/auth/roles";
import { logger } from "@/lib/logging/logger";

export const DEFAULT_DEMO_PASSWORD = "Classroom@2026";

/**
 * Ensures all 16 institutional RBAC roles exist as real user rows in the database
 * with real PBKDF2 password hashes for "Classroom@2026".
 */
export async function ensureDbUsers() {
  try {
    const institution = await prisma.institution.findFirst();
    if (!institution) {
      logger.warn("ensureDbUsers: No institution found in database, skipping.");
      return;
    }

    const defaultPasswordHash = await hashPassword(DEFAULT_DEMO_PASSWORD);

    for (const [roleKey, mockUser] of Object.entries(MOCK_USERS)) {
      const cleanEmail = mockUser.email.toLowerCase().trim();
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: mockUser.id,
            institutionId: institution.id,
            email: cleanEmail,
            passwordHash: defaultPasswordHash,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: mockUser.role,
            isActive: true,
          },
        });
        logger.info(`Seeded real DB user for role ${roleKey}: ${cleanEmail}`);
      } else if (!existingUser.passwordHash || !existingUser.passwordHash.startsWith("pbkdf2$")) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { passwordHash: defaultPasswordHash },
        });
      }
    }
  } catch (error: any) {
    logger.error("ensureDbUsers failed", error);
  }
}
