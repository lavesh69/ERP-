import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";

const DEFAULT_MODULES = [
  {
    title: "Unit I: Foundations of Deep Learning & Matrix Tensors",
    orderIndex: 1,
    description: "4 hours • 3 Topics",
    progressPercent: 100.0,
    learningObjectives: "Understand tensor calculus, backpropagation derivations, and GPU memory layouts.",
    courseOutcomes: "CO1: Formulate high-dimensional matrix gradients for optimization.",
    chapters: [
      { title: "1.1 High-Dimensional Matrix Calculus & Backpropagation", orderIndex: 1, contentType: "SLIDES", contentUrl: "/materials/unit1_matrix_calculus.pdf", fileSizeKb: 2450, durationMins: 45 },
      { title: "1.2 Optimization: AdamW, RMSProp & Gradient Clipping", orderIndex: 2, contentType: "PDF", contentUrl: "/materials/unit1_optimization.pdf", fileSizeKb: 1820, durationMins: 30 },
      { title: "1.3 Diagnostic Quiz: Tensor Mathematics", orderIndex: 3, contentType: "QUIZ", contentUrl: "", fileSizeKb: 0, durationMins: 20 },
    ],
  },
  {
    title: "Unit II: Scaled Dot-Product & Multi-Head Self-Attention",
    orderIndex: 2,
    description: "6 hours • 3 Topics",
    progressPercent: 80.0,
    learningObjectives: "Analyze attention mechanisms, RoPE embeddings, and KV-cache architectures.",
    courseOutcomes: "CO2: Implement modular transformer attention blocks with numerical stability.",
    chapters: [
      { title: "2.1 The Transformer Revolution: Vaswani et al. Breakdown", orderIndex: 1, contentType: "VIDEO", contentUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY", fileSizeKb: 0, durationMins: 55 },
      { title: "2.2 Rotary Positional Embeddings (RoPE) & FlashAttention-2", orderIndex: 2, contentType: "PDF", contentUrl: "/materials/unit2_rope_attention.pdf", fileSizeKb: 3100, durationMins: 40 },
      { title: "2.3 Coding Lab: Attention Layer Assertions", orderIndex: 3, contentType: "CODE", contentUrl: "/materials/unit2_lab_starter.py", fileSizeKb: 45, durationMins: 60 },
    ],
  },
  {
    title: "Unit III: Autonomous Agents & RAG Retrieval Architectures",
    orderIndex: 3,
    description: "5 hours • 2 Topics",
    progressPercent: 45.0,
    learningObjectives: "Design deterministic tool calling loops, vector indexing, and grounding guardrails.",
    courseOutcomes: "CO3: Deploy grounded agent systems with strict provenance checks.",
    chapters: [
      { title: "3.1 Vector Similarity, Cosine Distances & Hierarchical Chunking", orderIndex: 1, contentType: "PDF", contentUrl: "/materials/unit3_vector_retrieval.pdf", fileSizeKb: 4200, durationMins: 50 },
      { title: "3.2 Agent Tool Calling, Guardrails & ReAct Loops", orderIndex: 2, contentType: "SLIDES", contentUrl: "/materials/unit3_agent_loops.pptx", fileSizeKb: 5800, durationMins: 45 },
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
          progressPercent: mod.progressPercent,
          learningObjectives: mod.learningObjectives,
          courseOutcomes: mod.courseOutcomes,
        },
      });

      for (const ch of mod.chapters) {
        await prisma.courseChapter.create({
          data: {
            moduleId: createdMod.id,
            title: ch.title,
            orderIndex: ch.orderIndex,
            contentType: ch.contentType,
            contentUrl: ch.contentUrl,
            fileSizeKb: ch.fileSizeKb,
            durationMins: ch.durationMins,
            isPublished: true,
          },
        });
      }
    }

    course = await prisma.course.findFirst({
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
      return NextResponse.json(
        { error: "Course not found and could not be provisioned" },
        { status: 404 }
      );
    }

    // Get user-specific completed chapters
    let completedChapterIds: string[] = [];
    if (session?.userId || session?.sub) {
      const uid = session.userId || session.sub;
      const completedLogs = await prisma.auditLog.findMany({
        where: {
          actorUserId: uid,
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

    // Available courses list for dropdown
    const availableCourses = await prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, code: true, title: true },
      take: 10,
    });

    const isTeacher = ["FACULTY", "PROFESSOR", "CLASS_TEACHER", "HOD", "SUPER_ADMIN", "INSTITUTION_ADMIN"].includes(
      session?.role || ""
    );

    return NextResponse.json({
      perspective: isTeacher ? "FACULTY" : "STUDENT",
      availableCourses,
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
        credits: course.credits,
        lectureHours: course.lectureHours,
        labHours: course.labHours,
        progressPercent,
        completedCount,
        totalChapters,
      },
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        duration: m.description || "3-4 hours",
        progressPercent: m.progressPercent,
        learningObjectives: m.learningObjectives,
        courseOutcomes: m.courseOutcomes,
        chapters: m.chapters
          .filter((ch) => isTeacher || ch.isPublished)
          .map((ch) => ({
            id: ch.id,
            title: ch.title,
            contentType: ch.contentType,
            contentUrl: ch.contentUrl,
            fileSizeKb: ch.fileSizeKb,
            isPublished: ch.isPublished,
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
    const { action } = body;

    // Teacher Action: Add Learning Material
    if (action === "ADD_MATERIAL") {
      const { moduleId, title, contentType, contentUrl, fileSizeKb } = body;
      if (!moduleId || !title) {
        return NextResponse.json({ error: "moduleId and title are required" }, { status: 400 });
      }

      const chapterCount = await prisma.courseChapter.count({ where: { moduleId } });
      const newChapter = await prisma.courseChapter.create({
        data: {
          moduleId,
          title,
          orderIndex: chapterCount + 1,
          contentType: contentType || "PDF",
          contentUrl: contentUrl || null,
          fileSizeKb: Number(fileSizeKb) || 1200,
          durationMins: 45,
          isPublished: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Learning material '${title}' attached to curriculum.`,
        chapter: newChapter,
      });
    }

    // Teacher Action: Update Unit Syllabus Progress
    if (action === "UPDATE_SYLLABUS_PROGRESS") {
      const { moduleId, progressPercent, learningObjectives, courseOutcomes } = body;
      if (!moduleId) {
        return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
      }

      const updated = await prisma.courseModule.update({
        where: { id: moduleId },
        data: {
          progressPercent: Number(progressPercent),
          learningObjectives: learningObjectives || undefined,
          courseOutcomes: courseOutcomes || undefined,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Syllabus progress updated successfully.",
        module: updated,
      });
    }

    // Student / User Action: Mark Chapter Completed / Incomplete
    const { chapterId, completed } = body;
    if (!chapterId) {
      return NextResponse.json({ error: "chapterId is required" }, { status: 400 });
    }

    // Identify user
    let user = session?.userId || session?.sub
      ? await prisma.user.findUnique({ where: { id: session.userId || session.sub } })
      : await prisma.user.findFirst({ where: { role: "STUDENT" } });

    if (!user) {
      return NextResponse.json({ error: "User session required" }, { status: 401 });
    }

    const institution = await prisma.institution.findFirst();
    if (!institution) {
      return NextResponse.json({ error: "Institution context required" }, { status: 400 });
    }

    if (completed === false) {
      await prisma.auditLog.deleteMany({
        where: {
          actorUserId: user.id,
          action: "CHAPTER_COMPLETED",
          targetEntity: "CourseChapter",
          targetId: chapterId,
        },
      });
    } else {
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
