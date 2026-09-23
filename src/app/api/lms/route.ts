import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";

const DEFAULT_MODULES = [
  {
    title: "Module 1: Foundations of Deep Learning & Matrix Tensors",
    orderIndex: 1,
    description: "4 hours • 3 Chapters",
    chapters: [
      { title: "1.1 High-Dimensional Matrix Calculus & Backpropagation", orderIndex: 1, contentType: "VIDEO", durationMins: 45 },
      { title: "1.2 Optimization: AdamW, RMSProp & Gradient Clipping", orderIndex: 2, contentType: "PDF", durationMins: 30 },
      { title: "1.3 Diagnostic Quiz: Tensor Mathematics", orderIndex: 3, contentType: "QUIZ", durationMins: 20 },
    ],
  },
  {
    title: "Module 2: Scaled Dot-Product & Multi-Head Self-Attention",
    orderIndex: 2,
    description: "6 hours • 3 Chapters",
    chapters: [
      { title: "2.1 The Transformer Revolution: Vaswani et al. Breakdown", orderIndex: 1, contentType: "VIDEO", durationMins: 55 },
      { title: "2.2 Rotary Positional Embeddings (RoPE) & FlashAttention-2", orderIndex: 2, contentType: "PDF", durationMins: 40 },
      { title: "2.3 Coding Lab: Attention Layer Assertions", orderIndex: 3, contentType: "CODE", durationMins: 60 },
    ],
  },
  {
    title: "Module 3: Autonomous Agents & RAG Retrieval Architectures",
    orderIndex: 3,
    description: "5 hours • 2 Chapters",
    chapters: [
      { title: "3.1 Vector Similarity, Cosine Distances & Hierarchical Chunking", orderIndex: 1, contentType: "VIDEO", durationMins: 50 },
      { title: "3.2 Agent Tool Calling, Guardrails & ReAct Loops", orderIndex: 2, contentType: "PDF", durationMins: 45 },
    ],
  },
];

async function ensureCourseAndModules(courseCode: string) {
  let course = await prisma.course.findFirst({
    where: { code: courseCode },
    include: {
      modules: {
        include: {
          chapters: {
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!course) {
    const dept = await prisma.department.findFirst();
    const semester = await prisma.semester.findFirst();
    if (!dept || !semester) return null;

    course = await prisma.course.create({
      data: {
        code: courseCode,
        title: "Advanced Neural Networks & Multi-Agent Systems",
        departmentId: dept.id,
        semesterId: semester.id,
        credits: 4,
        lectureHours: 3,
        labHours: 2,
      },
      include: {
        modules: {
          include: {
            chapters: true,
          },
        },
      },
    });
  }

  // If modules are not yet populated in DB, seed them now
  if (!course.modules || course.modules.length === 0) {
    for (const mod of DEFAULT_MODULES) {
      const createdMod = await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: mod.title,
          orderIndex: mod.orderIndex,
          description: mod.description,
        },
      });

      for (const ch of mod.chapters) {
        await prisma.courseChapter.create({
          data: {
            moduleId: createdMod.id,
            title: ch.title,
            orderIndex: ch.orderIndex,
            contentType: ch.contentType,
            durationMins: ch.durationMins,
          },
        });
      }
    }

    // Reload with seeded modules
    course = await prisma.course.findUnique({
      where: { id: course.id },
      include: {
        modules: {
          include: {
            chapters: {
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });
  }

  return course;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get("courseCode") || "CS-402";

    const course = await ensureCourseAndModules(courseCode);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Identify user
    let userId = session?.sub;
    if (!userId) {
      const fallbackUser = await prisma.user.findFirst({
        where: { role: "STUDENT" },
      });
      userId = fallbackUser?.id;
    }

    // Query completed chapters from AuditLog
    let completedChapterIds: string[] = [];
    if (userId) {
      const completedLogs = await prisma.auditLog.findMany({
        where: {
          actorUserId: userId,
          action: "CHAPTER_COMPLETED",
          targetEntity: "CourseChapter",
        },
        select: { targetId: true },
      });
      completedChapterIds = completedLogs
        .map((log) => log.targetId)
        .filter((id): id is string => Boolean(id));
    }

    // Calculate progress
    const allChapters = course.modules.flatMap((m) => m.chapters);
    const totalChapters = allChapters.length;
    const completedCount = allChapters.filter((ch) =>
      completedChapterIds.includes(ch.id)
    ).length;
    const progressPercent = totalChapters > 0
      ? Math.round((completedCount / totalChapters) * 100)
      : 0;

    return NextResponse.json({
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
        credits: course.credits,
        progressPercent,
        completedCount,
        totalChapters,
      },
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        duration: m.description || "3-4 hours",
        chapters: m.chapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          contentType: ch.contentType,
          durationMins: `${ch.durationMins}m`,
          completed: completedChapterIds.includes(ch.id),
        })),
      })),
    });
  } catch (error: any) {
    console.error("LMS GET error:", error);
    return NextResponse.json(
      { error: "Failed to load LMS courseware", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const body = await req.json();
    const { chapterId, completed } = body;

    if (!chapterId) {
      return NextResponse.json({ error: "chapterId is required" }, { status: 400 });
    }

    // Identify user
    let user = session?.sub
      ? await prisma.user.findUnique({ where: { id: session.sub } })
      : await prisma.user.findFirst({ where: { role: "STUDENT" } });

    if (!user) {
      return NextResponse.json({ error: "User session required" }, { status: 401 });
    }

    const institution = await prisma.institution.findFirst();
    if (!institution) {
      return NextResponse.json({ error: "Institution context required" }, { status: 400 });
    }

    if (completed === false) {
      // Remove completed log
      await prisma.auditLog.deleteMany({
        where: {
          actorUserId: user.id,
          action: "CHAPTER_COMPLETED",
          targetEntity: "CourseChapter",
          targetId: chapterId,
        },
      });
    } else {
      // Create completion log if not already existing
      const existing = await prisma.auditLog.findFirst({
        where: {
          actorUserId: user.id,
          action: "CHAPTER_COMPLETED",
          targetEntity: "CourseChapter",
          targetId: chapterId,
        },
      });

      if (!existing) {
        await prisma.auditLog.create({
          data: {
            institutionId: institution.id,
            actorUserId: user.id,
            action: "CHAPTER_COMPLETED",
            targetEntity: "CourseChapter",
            targetId: chapterId,
            detailsJson: JSON.stringify({ completedAt: new Date().toISOString() }),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: completed ? "Chapter marked as completed" : "Chapter marked as incomplete",
      chapterId,
      completed,
    });
  } catch (error: any) {
    console.error("LMS POST error:", error);
    return NextResponse.json(
      { error: "Failed to update chapter progress", details: error.message },
      { status: 500 }
    );
  }
}
