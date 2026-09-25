import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { FULL_COHORT_STUDENTS, hashCohortPassword } from "../src/lib/academic/full-cohort";

const prisma = new PrismaClient();

// Default demo password — all seeded accounts share this for development
const DEMO_PASSWORD = "Classroom@2026";

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32).toString("hex");
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, key) => {
      if (err) return reject(err);
      resolve(`pbkdf2$sha512$100000$${salt}$${key.toString("hex")}`);
    });
  });
}

async function main() {
  console.log("🌱 Starting CLASSROOM ERP database seeding...");

  // Clean existing tables
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.academicDocument.deleteMany();
  await prisma.aIMessage.deleteMany();
  await prisma.aISession.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.rAGChunk.deleteMany();
  await prisma.rAGDocument.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.publication.deleteMany();
  await prisma.researchProject.deleteMany();
  await prisma.bookLoan.deleteMany();
  await prisma.libraryBook.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.studentFee.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.scholarshipApplication.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.question.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.room.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.courseFaculty.deleteMany();
  await prisma.courseChapter.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.course.deleteMany();
  await prisma.studentParentRelation.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.student.deleteMany();
  await prisma.section.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.campus.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();

  // 1. Institution
  const institution = await prisma.institution.create({
    data: {
      id: "inst-apex-01",
      code: "APEX-UNIV",
      name: "Apex University of Science & Technology",
      legalName: "Apex University of Science & Technology Higher Education Trust",
      motto: "Veritas, Scientia, Progressus",
      logoUrl: "/branding/logo.png",
      primaryColor: "#8E5368",
      status: "ACTIVE",
    },
  });

  // 2. Campus
  const mainCampus = await prisma.campus.create({
    data: {
      id: "cmp-main-01",
      institutionId: institution.id,
      code: "MAIN-CAMPUS",
      name: "Main Research Campus",
      location: "Innovation Corridor, Building 4",
      isMainCampus: true,
    },
  });

  // 3. Departments
  const deptCS = await prisma.department.create({
    data: {
      id: "dept-cs-01",
      institutionId: institution.id,
      campusId: mainCampus.id,
      code: "CSE",
      name: "Computer Science & Engineering",
      description: "Department of AI, Software Architecture & High-Performance Computing",
    },
  });

  const deptBio = await prisma.department.create({
    data: {
      id: "dept-bio-01",
      institutionId: institution.id,
      campusId: mainCampus.id,
      code: "BIO",
      name: "Biotechnology & Genomics",
      description: "Computational Biology, Proteomics and CRISPR Technology",
    },
  });

  // 4. Programs
  const progBTech = await prisma.program.create({
    data: {
      id: "prog-cs-01",
      departmentId: deptCS.id,
      code: "BTECH-CSE",
      name: "Bachelor of Technology in Computer Science",
      degree: "B.Tech",
      durationYears: 4,
      totalCredits: 160,
    },
  });

  // 5. Academic Year & Semester
  const academicYear = await prisma.academicYear.create({
    data: {
      id: "ay-2026-2027",
      code: "2026-2027",
      title: "Academic Year 2026-2027",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2027-05-31"),
      isCurrent: true,
    },
  });

  const semester5 = await prisma.semester.create({
    data: {
      id: "sem-fall-2026",
      programId: progBTech.id,
      academicYearId: academicYear.id,
      semesterNumber: 5,
      title: "Fall 2026 (Semester V)",
      startDate: new Date("2026-08-15"),
      endDate: new Date("2026-12-20"),
      isCurrent: true,
    },
  });

  // 6. Section
  const sectionA = await prisma.section.create({
    data: {
      id: "sec-cs-5a",
      semesterId: semester5.id,
      name: "Section 5-A",
      capacity: 60,
    },
  });

  // 7. Rooms
  const room4B = await prisma.room.create({
    data: {
      id: "rm-4b",
      campusId: mainCampus.id,
      code: "LH-4B",
      name: "Alan Turing Smart Lecture Hall",
      type: "LECTURE_HALL",
      capacity: 70,
      hasIot: true,
      iotStatus: "ONLINE",
      amenities: "4K Projector, SmartPod Podium, Automated RFID Attendance, Hybrid Stream Cam",
    },
  });

  const roomLab102 = await prisma.room.create({
    data: {
      id: "rm-lab-102",
      campusId: mainCampus.id,
      code: "LAB-102",
      name: "Ada Lovelace AI Computing Pod",
      type: "LAB",
      capacity: 45,
      hasIot: true,
      iotStatus: "ONLINE",
      amenities: "NVIDIA GPU Cluster Workstations, High-Speed Low-Latency Networking",
    },
  });

  // 8. Users & Stakeholders
  // Generate shared demo password hash (done once, reused for speed)
  const demoHash = await hashPassword(DEMO_PASSWORD);

  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      id: "usr-admin-01",
      institutionId: institution.id,
      email: "provost.evans@classroom.edu",
      passwordHash: demoHash,
      firstName: "Elena",
      lastName: "Evans",
      role: "SUPER_ADMIN",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Faculty User
  const facultyUser = await prisma.user.create({
    data: {
      id: "usr-fac-01",
      institutionId: institution.id,
      email: "sarah.chen@apex.edu",
      passwordHash: demoHash,
      firstName: "Sarah",
      lastName: "Chen",
      role: "FACULTY",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const faculty = await prisma.faculty.create({
    data: {
      id: "fac-chen-01",
      userId: facultyUser.id,
      departmentId: deptCS.id,
      employeeCode: "FAC-CS-108",
      designation: "Associate Professor",
      specialization: "Deep Neural Architectures & Transformer Systems",
      joiningDate: new Date("2021-06-01"),
      qualification: "Ph.D. in Computer Science (Stanford)",
      officeRoom: "Room 304, CSE Block",
      weeklyHours: 16,
    },
  });

  const cohortHash = hashCohortPassword();

  // Student User
  const studentUser = await prisma.user.create({
    data: {
      id: "usr-stu-01",
      institutionId: institution.id,
      email: "alex.mercer@apex.edu",
      passwordHash: cohortHash,
      firstName: "Alex",
      lastName: "Mercer",
      role: "STUDENT",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    },
  });

  const student = await prisma.student.create({
    data: {
      id: "stu-mercer-01",
      userId: studentUser.id,
      programId: progBTech.id,
      sectionId: sectionA.id,
      rollNumber: "2024-CSE-042",
      admissionNumber: "ADM-2024-890",
      admissionDate: new Date("2024-08-01"),
      currentSemester: 5,
      cgpa: 3.88,
      attendanceRate: 94.6,
      status: "ACTIVE",
    },
  });

  // Defaulter Student to showcase low attendance warning in ERP
  const studentUser2 = await prisma.user.create({
    data: {
      id: "usr-stu-02",
      institutionId: institution.id,
      email: "ethan.hunt@apex.edu",
      passwordHash: cohortHash,
      firstName: "Ethan",
      lastName: "Hunt",
      role: "STUDENT",
    },
  });

  await prisma.student.create({
    data: {
      id: "stu-hunt-02",
      userId: studentUser2.id,
      programId: progBTech.id,
      sectionId: sectionA.id,
      rollNumber: "2024-CSE-099",
      admissionNumber: "ADM-2024-911",
      admissionDate: new Date("2024-08-01"),
      currentSemester: 5,
      cgpa: 2.95,
      attendanceRate: 64.2, // Defaulter (< 75%)
      status: "ACTIVE",
    },
  });

  // Full Section 5-A Cohort (60+ real students with @gmail.com accounts & password Ilikesonpapdi115500)
  for (const cStu of FULL_COHORT_STUDENTS.slice(2)) {
    const u = await prisma.user.create({
      data: {
        id: cStu.userId,
        institutionId: institution.id,
        email: cStu.email,
        passwordHash: cohortHash,
        firstName: cStu.firstName,
        lastName: cStu.lastName,
        role: "STUDENT",
        isActive: true,
      },
    });
    await prisma.student.create({
      data: {
        id: cStu.id,
        userId: u.id,
        programId: progBTech.id,
        sectionId: sectionA.id,
        rollNumber: cStu.rollNumber,
        admissionNumber: cStu.admissionNumber,
        admissionDate: new Date("2024-08-01"),
        currentSemester: 5,
        cgpa: cStu.cgpa,
        attendanceRate: cStu.attendanceRate,
        status: "ACTIVE",
      },
    });
  }

  // Parent User
  const parentUser = await prisma.user.create({
    data: {
      id: "usr-parent-01",
      institutionId: institution.id,
      email: "katherine.mercer@gmail.com",
      passwordHash: demoHash,
      firstName: "Katherine",

      lastName: "Mercer",
      role: "PARENT",
    },
  });

  const parent = await prisma.parent.create({
    data: {
      id: "par-mercer-01",
      userId: parentUser.id,
      relation: "MOTHER",
      occupation: "Senior Systems Engineer",
    },
  });

  await prisma.studentParentRelation.create({
    data: {
      studentId: student.id,
      parentId: parent.id,
      isPrimary: true,
    },
  });

  // 9. Courses
  const courseCS402 = await prisma.course.create({
    data: {
      id: "crs-cs402",
      departmentId: deptCS.id,
      semesterId: semester5.id,
      code: "CS-402",
      title: "Advanced Neural Networks",
      description: "Mathematical foundations of deep learning, transformer self-attention, and agentic workflows.",
      credits: 4,
      lectureHours: 3,
      labHours: 2,
    },
  });

  const courseCS301 = await prisma.course.create({
    data: {
      id: "crs-cs301",
      departmentId: deptCS.id,
      semesterId: semester5.id,
      code: "CS-301",
      title: "Distributed Systems & Cloud Computing",
      description: "Consensus algorithms, Raft, Paxos, distributed transaction sagas, and microservices.",
      credits: 4,
      lectureHours: 3,
      labHours: 2,
    },
  });

  // Course Faculty Mapping
  await prisma.courseFaculty.create({
    data: {
      courseId: courseCS402.id,
      facultyId: faculty.id,
      role: "PRIMARY_INSTRUCTOR",
    },
  });

  // Enrollments
  await prisma.enrollment.create({
    data: {
      studentId: student.id,
      courseId: courseCS402.id,
      grade: "A",
      gradePoint: 9.0,
      status: "ENROLLED",
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student.id,
      courseId: courseCS301.id,
      grade: "A+",
      gradePoint: 10.0,
      status: "ENROLLED",
    },
  });

  // Enroll all other Section 5-A students into CS-402 and CS-301
  const allSecAStudents = await prisma.student.findMany({
    where: { sectionId: sectionA.id },
  });
  for (const s of allSecAStudents) {
    if (s.id !== student.id) {
      await prisma.enrollment.create({
        data: {
          studentId: s.id,
          courseId: courseCS402.id,
          grade: "A",
          gradePoint: 8.5,
          status: "ENROLLED",
        },
      });
      await prisma.enrollment.create({
        data: {
          studentId: s.id,
          courseId: courseCS301.id,
          grade: "A",
          gradePoint: 8.5,
          status: "ENROLLED",
        },
      });
    }
  }

  // 10. Timetable Slots
  await prisma.timetableSlot.create({
    data: {
      campusId: mainCampus.id,
      courseId: courseCS402.id,
      facultyId: faculty.id,
      roomId: room4B.id,
      sectionId: sectionA.id,
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "10:30",
    },
  });

  await prisma.timetableSlot.create({
    data: {
      campusId: mainCampus.id,
      courseId: courseCS301.id,
      facultyId: faculty.id,
      roomId: roomLab102.id,
      sectionId: sectionA.id,
      dayOfWeek: "WEDNESDAY",
      startTime: "11:00",
      endTime: "12:30",
    },
  });

  // 11. Attendance Session & Records
  const attSession = await prisma.attendanceSession.create({
    data: {
      id: "att-sess-01",
      courseId: courseCS402.id,
      facultyId: faculty.id,
      sectionId: sectionA.id,
      date: new Date(),
      startTime: "09:00",
      endTime: "10:30",
      method: "QR",
      status: "SUBMITTED",
    },
  });

  await prisma.attendanceRecord.create({
    data: {
      sessionId: attSession.id,
      studentId: student.id,
      status: "PRESENT",
      remarks: "Scanned IoT QR terminal at 08:58 AM",
    },
  });

  // 12. Assignments & Submissions
  const assignment1 = await prisma.assignment.create({
    data: {
      id: "asg-nn-01",
      courseId: courseCS402.id,
      facultyId: faculty.id,
      title: "Implement Multi-Head Scaled Dot-Product Attention from Scratch",
      description: "Write a clean PyTorch/NumPy implementation of scaled dot-product attention with dimension assertions and causal masking.",
      maxPoints: 100.0,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
      allowLate: true,
      rubricJson: JSON.stringify({
        tensorMath: 40,
        causalMask: 30,
        unitTests: 30,
      }),
    },
  });

  await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: student.id,
      content: "Submitted attention.py implementation with full assert checks and causal test suite.",
      gradePoints: 95.0,
      feedback: "Exceptional numerical stability checks on softmax scaling factor.",
      gradedAt: new Date(),
      gradedById: facultyUser.id,
    },
  });

  // 13. Examination & Results
  const midTermExam = await prisma.exam.create({
    data: {
      id: "exam-mid-cs402",
      courseId: courseCS402.id,
      title: "Mid-Term Examination: Deep Learning & Transformers",
      type: "MID_TERM",
      totalMarks: 100.0,
      weightage: 30.0,
      examDate: new Date("2026-10-15"),
      durationMins: 120,
      status: "PUBLISHED",
    },
  });

  await prisma.examResult.create({
    data: {
      examId: midTermExam.id,
      studentId: student.id,
      marksObtained: 92.5,
      gradeLetter: "A+",
      remarks: "Top 5% percentile performance.",
      isVerified: true,
    },
  });

  // 14. Fee Structure & Student Fee Ledger
  const feeStructure = await prisma.feeStructure.create({
    data: {
      id: "fee-btech-f26",
      code: "FEE-BTECH-F26",
      title: "Fall 2026 B.Tech Tuition & Lab Ledger",
      totalAmount: 4850.0,
      dueDate: new Date("2026-10-30"),
      breakdownJson: JSON.stringify({
        tuition: 3800,
        labFacilities: 650,
        libraryAndTechnology: 300,
        healthInsurance: 100,
      }),
    },
  });

  const studentFee = await prisma.studentFee.create({
    data: {
      id: "sfee-mercer-01",
      studentId: student.id,
      feeStructureId: feeStructure.id,
      totalAmount: 4850.0,
      paidAmount: 4850.0,
      status: "PAID",
      dueDate: new Date("2026-10-30"),
    },
  });

  await prisma.paymentTransaction.create({
    data: {
      studentFeeId: studentFee.id,
      amount: 4850.0,
      paymentMethod: "WIRE_TRANSFER",
      referenceNumber: "TXN-APX-98273941",
      status: "SUCCESS",
      gatewayResponse: "APPROVED_AUTH_2026",
    },
  });

  // 15. Library Books & Circulation
  const book1 = await prisma.libraryBook.create({
    data: {
      isbn: "978-0262035613",
      title: "Deep Learning (Adaptive Computation and Machine Learning series)",
      author: "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
      category: "Computer Science",
      publisher: "MIT Press",
      totalCopies: 12,
      availableCopies: 11,
      shelfLocation: "Stack 4, Row B, Shelf 3",
    },
  });

  await prisma.bookLoan.create({
    data: {
      bookId: book1.id,
      studentId: student.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: "ISSUED",
    },
  });

  // 16. Research Projects & Publications
  await prisma.researchProject.create({
    data: {
      principalInvestigatorId: faculty.id,
      title: "Scalable Multi-Agent Consensus for Autonomous Edge Computing",
      grantAmount: 185000.0,
      fundingAgency: "National Science Foundation (NSF)",
      status: "ACTIVE",
      abstract: "Investigating distributed asynchronous belief propagation across resource-constrained edge accelerators.",
      startDate: new Date("2025-01-15"),
    },
  });

  await prisma.publication.create({
    data: {
      facultyId: faculty.id,
      title: "Self-Attention Dynamics in Sparse Low-Rank Graph Networks",
      journalName: "IEEE Transactions on Pattern Analysis and Machine Intelligence (TPAMI)",
      doi: "10.1109/TPAMI.2026.3129841",
      year: 2026,
      citationCount: 38,
    },
  });

  // 17. Scholarships & Endowments
  const sch1 = await prisma.scholarship.create({
    data: {
      title: "Apex Academic Merit Excellence Fellowship 2026",
      provider: "University Endowment Foundation",
      amount: 5000,
      deadline: new Date("2026-11-30"),
      minCgpa: 3.75,
      description: "Full semester merit fellowship awarded to top academic scholars with distinguished coursework.",
      eligibilityRules: "Enrolled in STEM program with CGPA >= 3.75 and zero disciplinary infractions",
    },
  });

  const sch2 = await prisma.scholarship.create({
    data: {
      title: "Women in Deep AI Research Grant",
      provider: "Global Foundation for Computing",
      amount: 7500,
      deadline: new Date("2026-12-15"),
      minCgpa: 3.5,
      description: "Research fellowship supporting women scholars in foundational AI and computing.",
      eligibilityRules: "Students authoring research papers in Machine Learning & Transformers",
    },
  });

  const sch3 = await prisma.scholarship.create({
    data: {
      title: "Undergraduate Dean's Financial Aid Subsidy",
      provider: "Higher Education Board",
      amount: 2500,
      deadline: new Date("2027-01-10"),
      minCgpa: 3.0,
      description: "Need-based tuition assistance grant for undergraduate students.",
      eligibilityRules: "Demonstrated financial need with household income verification",
    },
  });

  await prisma.scholarshipApplication.create({
    data: {
      scholarshipId: sch1.id,
      studentId: student.id,
      status: "UNDER_REVIEW",
      statement: "Pursuing research in transformer optimization with 3.88 CGPA.",
    },
  });

  // 18. Job & Internship Hub
  const job1 = await prisma.jobPosting.create({
    data: {
      companyName: "Anthropic / OpenAI Research Labs",
      jobTitle: "AI Systems Engineering Intern (Summer 2027)",
      type: "INTERNSHIP",
      location: "San Francisco, CA (Hybrid)",
      stipend: "$9,500 / month + Housing",
      deadline: new Date("2026-11-15"),
      requirements: "Proficiency in PyTorch/Rust, transformer performance profiling, and distributed training systems.",
      status: "ACTIVE",
    },
  });

  await prisma.jobPosting.createMany({
    data: [
      {
        companyName: "Google DeepMind Core Architecture",
        jobTitle: "Research Scientist Intern: Multi-Agent Systems",
        type: "INTERNSHIP",
        location: "London, UK (On-site)",
        stipend: "£7,200 / month",
        deadline: new Date("2026-12-01"),
        requirements: "Reinforcement learning, game theory, multi-agent communication protocols.",
        status: "ACTIVE",
      },
      {
        companyName: "NVIDIA Accelerated Computing",
        jobTitle: "CUDA Kernel Performance Engineer (New Grad)",
        type: "FULL_TIME",
        location: "Santa Clara, CA",
        stipend: "$165,000 / yr + Equity",
        deadline: new Date("2026-12-15"),
        requirements: "C++, CUDA, GPU hardware memory architecture, Triton compilers.",
        status: "ACTIVE",
      },
    ],
  });

  await prisma.jobApplication.create({
    data: {
      jobId: job1.id,
      studentId: student.id,
      status: "SHORTLISTED",
      resumeUrl: "/uploads/resumes/alex_mercer_cv.pdf",
    },
  });

  // 18. Announcements & Notifications
  await prisma.announcement.create({
    data: {
      institutionId: institution.id,
      title: "Mid-Term Examination Schedules Released & AI Review Hub Open",
      content: "All Mid-Term Examination schedules for Semester V have been published. Students can consult the CLASSROOM AI Revision Assistant for personalized practice question sets.",
      priority: "HIGH",
      targetAudience: "ALL",
    },
  });

  await prisma.notification.create({
    data: {
      userId: studentUser.id,
      title: "Assignment Graded: CS-402 Attention",
      message: "Prof. Sarah Chen scored your submission 95/100.",
      type: "ACADEMIC",
    },
  });

  // 19. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      institutionId: institution.id,
      actorUserId: adminUser.id,
      action: "LOGIN",
      targetEntity: "SuperAdminConsole",
      detailsJson: JSON.stringify({ ip: "10.0.4.12", session: "provost-secure-auth" }),
    },
  });

  console.log("✅ CLASSROOM ERP database seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
