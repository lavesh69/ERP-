import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession, STAFF_ROLES } from "@/lib/auth/admin-guard";
import { inventoryStore } from "@/lib/inventory/inventory-store";
import { hostelStore } from "@/lib/hostel/hostel-store";
import { transportStore } from "@/lib/transport/transport-store";
import { incubationStore } from "@/lib/incubation/incubation-store";
import { grievancesStore } from "@/lib/grievances/grievances-store";
import { admissionsStore } from "@/lib/admissions/admissions-store";
import { logger } from "@/lib/logging/logger";

export type SearchCategory =
  | "STUDENT"
  | "FACULTY"
  | "COURSE"
  | "APPLICATION"
  | "PAYMENT"
  | "BOOK"
  | "ASSET"
  | "HOSTEL"
  | "VEHICLE"
  | "RESEARCH"
  | "ALUMNI"
  | "STARTUP"
  | "SUPPORT";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: SearchCategory;
  href: string;
  metadata?: Record<string, any>;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get("q")?.trim();
    const categoryFilter = searchParams.get("category")?.toUpperCase() as SearchCategory | undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    if (!rawQuery || rawQuery.length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
        suggestions: ["CS-402", "Turing Auditorium", "Linear Algebra", "Hostel Wing A", "Library"],
        total: 0,
        page,
        limit,
        latencyMs: Date.now() - startTime,
      });
    }

    // Input sanitization: limit query length
    const query = rawQuery.slice(0, 50).toLowerCase();

    const session = await getOptionalSession(req);
    const userRole = session?.role || "GUEST";
    const isStaff = STAFF_ROLES.includes(userRole as any) || userRole === "SUPER_ADMIN";
    const isFinanceStaff = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "ACCOUNTANT"].includes(userRole);
    const isGrievanceStaff = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD"].includes(userRole);

    const allResults: SearchResultItem[] = [];

    // Helper to check if category is included
    const shouldSearch = (cat: SearchCategory) => !categoryFilter || categoryFilter === cat;

    // 1. STUDENTS (Staff only — protects student PII against peer snooping)
    if (shouldSearch("STUDENT") && isStaff) {
      const students = await prisma.student.findMany({
        where: {
          OR: [
            { rollNumber: { contains: query } },
            { user: { firstName: { contains: query } } },
            { user: { lastName: { contains: query } } },
            { user: { email: { contains: query } } },
          ],
        },
        include: { user: true, program: true },
        take: 6,
      });

      for (const s of students) {
        allResults.push({
          id: `stu-${s.id}`,
          title: `${s.user.firstName} ${s.user.lastName}`,
          subtitle: `${s.rollNumber} • ${s.program.name} (Sem ${s.currentSemester})`,
          category: "STUDENT",
          href: `/students`,
        });
      }
    }

    // 2. FACULTY (Public institutional directory)
    if (shouldSearch("FACULTY")) {
      const faculty = await prisma.faculty.findMany({
        where: {
          OR: [
            { employeeCode: { contains: query } },
            { user: { firstName: { contains: query } } },
            { user: { lastName: { contains: query } } },
          ],
        },
        include: { user: true, department: true },
        take: 5,
      });

      for (const f of faculty) {
        allResults.push({
          id: `fac-${f.id}`,
          title: `${f.user.firstName} ${f.user.lastName}`,
          subtitle: `${f.designation} • Dept of ${f.department.code}`,
          category: "FACULTY",
          href: `/faculty`,
        });
      }
    }

    // 3. COURSES (Public curriculum catalog)
    if (shouldSearch("COURSE")) {
      const courses = await prisma.course.findMany({
        where: {
          OR: [{ code: { contains: query } }, { title: { contains: query } }],
        },
        take: 5,
      });

      for (const c of courses) {
        allResults.push({
          id: `crs-${c.id}`,
          title: `${c.code}: ${c.title}`,
          subtitle: `${c.credits} Credits • ${c.labHours > 0 ? "Theory + Lab" : "Theory"}`,
          category: "COURSE",
          href: `/lms`,
        });
      }
    }

    // 4. ADMISSIONS APPLICATIONS (Admissions & Leadership staff only)
    if (shouldSearch("APPLICATION") && isStaff) {
      try {
        const applicants = admissionsStore.getApplicants().filter(
          (a) =>
            a.applicationNo.toLowerCase().includes(query) ||
            a.fullName.toLowerCase().includes(query) ||
            a.email.toLowerCase().includes(query)
        );

        for (const a of applicants.slice(0, 4)) {
          allResults.push({
            id: `app-${a.id}`,
            title: `${a.fullName} (${a.applicationNo})`,
            subtitle: `Target: ${a.programName} • Stage: ${a.stage}`,
            category: "APPLICATION",
            href: `/admissions`,
          });
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    // 5. PAYMENTS / TRANSACTIONS (Finance clearance required)
    if (shouldSearch("PAYMENT") && isFinanceStaff) {
      const payments = await prisma.paymentTransaction.findMany({
        where: {
          OR: [
            { referenceNumber: { contains: query } },
            { paymentMethod: { contains: query } },
          ],
        },
        take: 4,
      });

      for (const p of payments) {
        allResults.push({
          id: `pay-${p.id}`,
          title: `₹${p.amount.toLocaleString("en-IN")} • ${p.referenceNumber}`,
          subtitle: `${p.status} via ${p.paymentMethod}`,
          category: "PAYMENT",
          href: `/finance`,
        });
      }
    }

    // 6. LIBRARY BOOKS & RESOURCES
    if (shouldSearch("BOOK")) {
      const books = await prisma.libraryBook.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { author: { contains: query } },
            { isbn: { contains: query } },
          ],
        },
        take: 5,
      });

      for (const b of books) {
        allResults.push({
          id: `bk-${b.id}`,
          title: b.title,
          subtitle: `By ${b.author} • ISBN: ${b.isbn} (${b.availableCopies}/${b.totalCopies} Avail)`,
          category: "BOOK",
          href: `/library`,
        });
      }
    }

    // 7. INVENTORY ASSETS
    if (shouldSearch("ASSET") && isStaff) {
      try {
        const assets = inventoryStore.getAssets().filter(
          (a) =>
            a.name.toLowerCase().includes(query) ||
            a.assetTag.toLowerCase().includes(query) ||
            a.category.toLowerCase().includes(query)
        );
        for (const a of assets.slice(0, 4)) {
          allResults.push({
            id: `ast-${a.id}`,
            title: `${a.name} (${a.assetTag})`,
            subtitle: `${a.category} • Room: ${a.locationRoom} • Dept: ${a.department}`,
            category: "ASSET",
            href: `/inventory`,
          });
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    // 8. HOSTEL ROOMS
    if (shouldSearch("HOSTEL")) {
      try {
        const isRoomOrHostel = query.includes("room") || query.includes("hostel");
        const rooms = hostelStore.getRooms().filter(
          (r) =>
            isRoomOrHostel ||
            r.roomNumber.toLowerCase().includes(query) ||
            r.blockName.toLowerCase().includes(query) ||
            r.roomType.toLowerCase().includes(query)
        );
        for (const r of rooms.slice(0, 4)) {
          allResults.push({
            id: `hst-${r.id}`,
            title: `Room ${r.roomNumber} (${r.blockName})`,
            subtitle: `${r.roomType} • Status: ${r.status} (${r.occupiedCount}/${r.capacity} Beds)`,
            category: "HOSTEL",
            href: `/hostel`,
          });
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    // 9. TRANSPORT VEHICLES
    if (shouldSearch("VEHICLE")) {
      try {
        const fleet = transportStore.getSummary().vehicles.filter(
          (v) =>
            v.registrationNumber.toLowerCase().includes(query) ||
            v.vehicleCode.toLowerCase().includes(query) ||
            v.type.toLowerCase().includes(query)
        );
        for (const v of fleet.slice(0, 4)) {
          allResults.push({
            id: `veh-${v.id}`,
            title: `${v.registrationNumber} (${v.vehicleCode})`,
            subtitle: `Type: ${v.type} • Status: ${v.status} • Cap: ${v.capacity}`,
            category: "VEHICLE",
            href: `/transport`,
          });
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    // 10. RESEARCH PROJECTS
    if (shouldSearch("RESEARCH")) {
      const projects = await prisma.researchProject.findMany({
        where: {
          OR: [{ title: { contains: query } }, { fundingAgency: { contains: query } }],
        },
        take: 4,
      });

      for (const rp of projects) {
        allResults.push({
          id: `res-${rp.id}`,
          title: rp.title,
          subtitle: `Funded by ${rp.fundingAgency} • ₹${(rp.grantAmount || 0).toLocaleString("en-IN")}`,
          category: "RESEARCH",
          href: `/research`,
        });
      }
    }

    // 11. ALUMNI
    if (shouldSearch("ALUMNI")) {
      const alumni = await prisma.student.findMany({
        where: {
          status: "ALUMNI",
          OR: [
            { rollNumber: { contains: query } },
            { user: { firstName: { contains: query } } },
            { user: { lastName: { contains: query } } },
          ],
        },
        include: { user: true, program: true },
        take: 4,
      });

      for (const al of alumni) {
        const name = `${al.user.firstName} ${al.user.lastName}`;
        allResults.push({
          id: `alm-${al.id}`,
          title: `${name} (${al.rollNumber})`,
          subtitle: `Alumni • ${al.program.name}`,
          category: "ALUMNI",
          href: `/alumni`,
        });
      }
    }

    // 12. INCUBATION STARTUPS
    if (shouldSearch("STARTUP")) {
      try {
        const startups = incubationStore.getStartups().filter(
          (s) =>
            s.startupName.toLowerCase().includes(query) ||
            s.sector.toLowerCase().includes(query) ||
            s.founderName.toLowerCase().includes(query)
        );
        for (const s of startups.slice(0, 4)) {
          allResults.push({
            id: `stp-${s.id}`,
            title: `${s.startupName} (${s.sector})`,
            subtitle: `Founder: ${s.founderName} • Stage: ${s.stage}`,
            category: "STARTUP",
            href: `/incubation`,
          });
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    // 13. SUPPORT / GRIEVANCES (Strictly protected for leadership & proctors)
    if (shouldSearch("SUPPORT") && isGrievanceStaff) {
      try {
        const cases = grievancesStore.getGrievances().filter(
          (g) =>
            g.grievanceTicketNo.toLowerCase().includes(query) ||
            g.category.toLowerCase().includes(query) ||
            g.title.toLowerCase().includes(query)
        );
        for (const c of cases.slice(0, 4)) {
          allResults.push({
            id: `grv-${c.id}`,
            title: `${c.grievanceTicketNo}: ${c.title}`,
            subtitle: `${c.category} • Status: ${c.status}`,
            category: "SUPPORT",
            href: `/grievances`,
          });
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    // Pagination
    const total = allResults.length;
    const startIndex = (page - 1) * limit;
    const paginatedResults = allResults.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      query,
      results: paginatedResults,
      total,
      page,
      limit,
      latencyMs: Date.now() - startTime,
    });
  } catch (error: any) {
    logger.error("Global Enterprise Search API Error:", error);
    return NextResponse.json(
      { error: "Search execution failed", details: String(error?.message || error) },
      { status: 500 }
    );
  }
}
