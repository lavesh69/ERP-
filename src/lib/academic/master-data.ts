import { prisma } from "@/lib/db/prisma";

/**
 * CLASSROOM Academic OS — Central Academic Master Data Synchronizer
 * 
 * Ensures all standard university institutions, departments, programs,
 * semesters, sections, subjects, faculty assignments, and enrollments
 * are persistently mapped with full relational integrity.
 */
export async function ensureAcademicMasterData() {
  // 1. Institution
  let institution = await prisma.institution.findFirst({
    where: { code: "APEX-UNIV" },
  });
  if (!institution) {
    institution = await prisma.institution.create({
      data: {
        id: "inst-apex-01",
        code: "APEX-UNIV",
        name: "Apex University of Science & Technology",
        legalName: "Apex University Higher Education Trust",
        motto: "Veritas, Scientia, Progressus",
        primaryColor: "#8E5368",
        status: "ACTIVE",
      },
    });
  }

  // 2. Campus
  let campus = await prisma.campus.findFirst({
    where: { institutionId: institution.id, code: "MAIN-CAMPUS" },
  });
  if (!campus) {
    campus = await prisma.campus.create({
      data: {
        id: "cmp-main-01",
        institutionId: institution.id,
        code: "MAIN-CAMPUS",
        name: "Main Research Campus",
        location: "Innovation Corridor, Building 4",
        isMainCampus: true,
      },
    });
  }

  // 3. Departments
  const departmentsData = [
    {
      id: "dept-cs-01",
      code: "CSE",
      name: "Computer Science & Engineering",
      description: "Department of AI, Software Architecture & High-Performance Computing",
    },
    {
      id: "dept-bio-01",
      code: "BIO",
      name: "Biotechnology & Genomics",
      description: "Computational Biology, Proteomics and CRISPR Molecular Technologies",
    },
    {
      id: "dept-mgmt-01",
      code: "MGMT",
      name: "Business & Management Sciences",
      description: "Corporate Finance, Marketing Strategy and Supply Chain Analytics",
    },
    {
      id: "dept-hum-01",
      code: "HUM",
      name: "Humanities & Social Sciences",
      description: "Professional Communication, Ethics, and Environmental Studies",
    },
    {
      id: "dept-pharm-01",
      code: "PHARM",
      name: "Pharmaceutical Sciences",
      description: "Pharmacology, Medicinal Chemistry and Clinical Research",
    },
  ];

  const departmentMap: Record<string, string> = {};
  for (const d of departmentsData) {
    const existing = await prisma.department.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: d.code } },
      update: { name: d.name, description: d.description },
      create: {
        id: d.id,
        institutionId: institution.id,
        campusId: campus.id,
        code: d.code,
        name: d.name,
        description: d.description,
      },
    });
    departmentMap[d.code] = existing.id;
  }

  // 4. Programs
  const programsData = [
    {
      id: "prog-cs-01",
      departmentCode: "CSE",
      code: "BTECH-CSE",
      name: "Bachelor of Technology in Computer Science & Engineering",
      degree: "B.Tech",
      durationYears: 4,
      totalCredits: 160,
    },
    {
      id: "prog-aiml-01",
      departmentCode: "CSE",
      code: "BTECH-AIML",
      name: "Bachelor of Technology in Artificial Intelligence & Machine Learning",
      degree: "B.Tech",
      durationYears: 4,
      totalCredits: 160,
    },
    {
      id: "prog-bio-01",
      departmentCode: "BIO",
      code: "BSC-BIO",
      name: "Bachelor of Science in Biotechnology",
      degree: "B.Sc.",
      durationYears: 3,
      totalCredits: 120,
    },
    {
      id: "prog-micro-01",
      departmentCode: "BIO",
      code: "BSC-MICRO",
      name: "Bachelor of Science in Microbiology",
      degree: "B.Sc.",
      durationYears: 3,
      totalCredits: 120,
    },
    {
      id: "prog-bba-01",
      departmentCode: "MGMT",
      code: "BBA",
      name: "Bachelor of Business Administration",
      degree: "BBA",
      durationYears: 3,
      totalCredits: 120,
    },
    {
      id: "prog-bca-01",
      departmentCode: "CSE",
      code: "BCA",
      name: "Bachelor of Computer Applications",
      degree: "BCA",
      durationYears: 3,
      totalCredits: 120,
    },
    {
      id: "prog-bcom-01",
      departmentCode: "MGMT",
      code: "BCOM",
      name: "Bachelor of Commerce",
      degree: "B.Com",
      durationYears: 3,
      totalCredits: 120,
    },
    {
      id: "prog-ba-01",
      departmentCode: "HUM",
      code: "BA-ECON",
      name: "Bachelor of Arts in Economics",
      degree: "BA",
      durationYears: 3,
      totalCredits: 120,
    },
    {
      id: "prog-mca-01",
      departmentCode: "CSE",
      code: "MCA",
      name: "Master of Computer Applications",
      degree: "MCA",
      durationYears: 2,
      totalCredits: 80,
    },
    {
      id: "prog-mba-01",
      departmentCode: "MGMT",
      code: "MBA",
      name: "Master of Business Administration",
      degree: "MBA",
      durationYears: 2,
      totalCredits: 80,
    },
    {
      id: "prog-msc-bio-01",
      departmentCode: "BIO",
      code: "MSC-BIO",
      name: "Master of Science in Biotechnology",
      degree: "M.Sc.",
      durationYears: 2,
      totalCredits: 80,
    },
  ];

  const programMap: Record<string, string> = {};
  for (const p of programsData) {
    const deptId = departmentMap[p.departmentCode];
    if (!deptId) continue;
    let prog = await prisma.program.findFirst({
      where: { departmentId: deptId, code: p.code },
    });
    if (!prog) {
      prog = await prisma.program.create({
        data: {
          id: p.id,
          departmentId: deptId,
          code: p.code,
          name: p.name,
          degree: p.degree,
          durationYears: p.durationYears,
          totalCredits: p.totalCredits,
        },
      });
    }
    programMap[p.code] = prog.id;
  }

  // 5. Academic Years
  const ayCurrent = await prisma.academicYear.upsert({
    where: { code: "2026-2027" },
    update: { isCurrent: true },
    create: {
      id: "ay-2026-2027",
      code: "2026-2027",
      title: "Academic Year 2026-2027",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2027-05-31"),
      isCurrent: true,
    },
  });

  const ayPast = await prisma.academicYear.upsert({
    where: { code: "2025-2026" },
    update: { isCurrent: false },
    create: {
      id: "ay-2025-2026",
      code: "2025-2026",
      title: "Academic Year 2025-2026",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-05-31"),
      isCurrent: false,
    },
  });

  // 6. Semesters
  const semestersData = [
    {
      id: "sem-fall-2026",
      programCode: "BTECH-CSE",
      academicYearId: ayCurrent.id,
      semesterNumber: 5,
      title: "Fall 2026 (Semester V)",
      startDate: new Date("2026-08-15"),
      endDate: new Date("2026-12-20"),
      isCurrent: true,
    },
    {
      id: "sem-cs-spring-2027",
      programCode: "BTECH-CSE",
      academicYearId: ayCurrent.id,
      semesterNumber: 6,
      title: "Spring 2027 (Semester VI)",
      startDate: new Date("2027-01-10"),
      endDate: new Date("2027-05-15"),
      isCurrent: false,
    },
    {
      id: "sem-bio-fall-2026",
      programCode: "BSC-BIO",
      academicYearId: ayCurrent.id,
      semesterNumber: 3,
      title: "Fall 2026 (Semester III)",
      startDate: new Date("2026-08-15"),
      endDate: new Date("2026-12-20"),
      isCurrent: true,
    },
    {
      id: "sem-bba-fall-2026",
      programCode: "BBA",
      academicYearId: ayCurrent.id,
      semesterNumber: 3,
      title: "Fall 2026 (Semester III)",
      startDate: new Date("2026-08-15"),
      endDate: new Date("2026-12-20"),
      isCurrent: true,
    },
    {
      id: "sem-cs-fall-2025",
      programCode: "BTECH-CSE",
      academicYearId: ayPast.id,
      semesterNumber: 3,
      title: "Fall 2025 (Semester III - Historical)",
      startDate: new Date("2025-08-15"),
      endDate: new Date("2025-12-20"),
      isCurrent: false,
    },
  ];

  const semesterMap: Record<string, string> = {};
  for (const s of semestersData) {
    const progId = programMap[s.programCode];
    if (!progId) continue;
    let sem = await prisma.semester.findFirst({
      where: { programId: progId, academicYearId: s.academicYearId, semesterNumber: s.semesterNumber },
    });
    if (!sem) {
      sem = await prisma.semester.create({
        data: {
          id: s.id,
          programId: progId,
          academicYearId: s.academicYearId,
          semesterNumber: s.semesterNumber,
          title: s.title,
          startDate: s.startDate,
          endDate: s.endDate,
          isCurrent: s.isCurrent,
        },
      });
    }
    semesterMap[s.id] = sem.id;
  }

  // 7. Sections
  const sectionsData = [
    { id: "sec-cs-5a", semesterKey: "sem-fall-2026", name: "Section 5-A", capacity: 60 },
    { id: "sec-cs-5b", semesterKey: "sem-fall-2026", name: "Section 5-B", capacity: 60 },
    { id: "sec-bio-3a", semesterKey: "sem-bio-fall-2026", name: "Section 3-A", capacity: 50 },
    { id: "sec-bba-3a", semesterKey: "sem-bba-fall-2026", name: "Section 3-A", capacity: 50 },
  ];

  const sectionMap: Record<string, string> = {};
  for (const sec of sectionsData) {
    const semId = semesterMap[sec.semesterKey];
    if (!semId) continue;
    let section = await prisma.section.findFirst({
      where: { semesterId: semId, name: sec.name },
    });
    if (!section) {
      section = await prisma.section.create({
        data: {
          id: sec.id,
          semesterId: semId,
          name: sec.name,
          capacity: sec.capacity,
        },
      });
    }
    sectionMap[sec.id] = section.id;
  }

  // 8. Rooms
  const roomsData = [
    {
      id: "rm-4b",
      code: "LH-4B",
      name: "Alan Turing Smart Lecture Hall",
      type: "LECTURE_HALL",
      capacity: 70,
    },
    {
      id: "rm-lab-102",
      code: "LAB-102",
      name: "Ada Lovelace AI Computing Pod",
      type: "LAB",
      capacity: 45,
    },
    {
      id: "rm-bio-201",
      code: "BIO-LH1",
      name: "Rosalind Franklin Genomics Hall",
      type: "LECTURE_HALL",
      capacity: 60,
    },
    {
      id: "rm-bio-lab",
      code: "BIO-LAB",
      name: "CRISPR & Recombinant DNA Wet Lab",
      type: "LAB",
      capacity: 40,
    },
  ];

  for (const r of roomsData) {
    const existing = await prisma.room.findFirst({
      where: { campusId: campus.id, code: r.code },
    });
    if (!existing) {
      await prisma.room.create({
        data: {
          id: r.id,
          campusId: campus.id,
          code: r.code,
          name: r.name,
          type: r.type,
          capacity: r.capacity,
          hasIot: true,
          iotStatus: "ONLINE",
        },
      });
    }
  }

  // 9. Faculty Members
  const facultyDeptCS = departmentMap["CSE"];
  const facultyDeptBio = departmentMap["BIO"];
  const facultyDeptMgmt = departmentMap["MGMT"];
  const facultyDeptHum = departmentMap["HUM"];

  const facultyUsers = [
    {
      userId: "usr-fac-01",
      email: "sarah.chen@apex.edu",
      firstName: "Sarah",
      lastName: "Chen",
      facultyId: "fac-chen-01",
      deptId: facultyDeptCS,
      employeeCode: "FAC-CS-108",
      designation: "Associate Professor",
      specialization: "Deep Neural Architectures & Transformer Systems",
    },
    {
      userId: "usr-fac-02",
      email: "vikram.raman@apex.edu",
      firstName: "Vikram",
      lastName: "Raman",
      facultyId: "fac-raman-02",
      deptId: facultyDeptBio,
      employeeCode: "FAC-BIO-204",
      designation: "Professor & Chair",
      specialization: "Molecular Genetics & Cellular Gene Expression",
    },
    {
      userId: "usr-fac-03",
      email: "marcus.sterling@apex.edu",
      firstName: "Marcus",
      lastName: "Sterling",
      facultyId: "fac-sterling-03",
      deptId: facultyDeptMgmt,
      employeeCode: "FAC-MGT-301",
      designation: "Professor",
      specialization: "Corporate Valuation & Quantitative Finance",
    },
    {
      userId: "usr-fac-04",
      email: "anita.roy@apex.edu",
      firstName: "Anita",
      lastName: "Roy",
      facultyId: "fac-roy-04",
      deptId: facultyDeptHum,
      employeeCode: "FAC-HUM-105",
      designation: "Assistant Professor",
      specialization: "Technical Rhetoric & Environmental Ethics",
    },
  ];

  const facultyMap: Record<string, string> = {};
  for (const fu of facultyUsers) {
    if (!fu.deptId) continue;
    let user = await prisma.user.findUnique({ where: { email: fu.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: fu.userId,
          institutionId: institution.id,
          email: fu.email,
          passwordHash: "$2b$10$wU05z.1gUj6R4lM2zXpZqeCjGjGvK9U1A2B3C4D5E6F7G8H9I0J1K",
          firstName: fu.firstName,
          lastName: fu.lastName,
          role: "FACULTY",
        },
      });
    }

    let fac = await prisma.faculty.findUnique({ where: { userId: user.id } });
    if (!fac) {
      fac = await prisma.faculty.create({
        data: {
          id: fu.facultyId,
          userId: user.id,
          departmentId: fu.deptId,
          employeeCode: fu.employeeCode,
          designation: fu.designation,
          specialization: fu.specialization,
          joiningDate: new Date("2021-06-01"),
        },
      });
    }
    facultyMap[fu.facultyId] = fac.id;
  }

  // 10. Complete Course / Subject Catalog
  const semCsFall = semesterMap["sem-fall-2026"];
  const semBioFall = semesterMap["sem-bio-fall-2026"];
  const semBbaFall = semesterMap["sem-bba-fall-2026"];
  const semCsPast = semesterMap["sem-cs-fall-2025"];

  const coursesMaster = [
    // CSE Core & Labs
    {
      id: "crs-cs402",
      code: "CS-402",
      title: "Advanced Neural Networks",
      shortName: "Neural Networks",
      description: "Mathematical foundations of deep learning, transformer self-attention, and agentic workflows.",
      departmentId: facultyDeptCS,
      semesterId: semCsFall,
      subjectType: "CORE",
      courseType: "THEORY",
      credits: 4,
      lectureHours: 3,
      tutorialHours: 0,
      labHours: 2,
      internalMarks: 40,
      externalMarks: 60,
      totalMarks: 100,
      passingMarks: 40,
      status: "ACTIVE",
      isElective: false,
      isCommon: false,
      assignedFacultyId: "fac-chen-01",
    },
    {
      id: "crs-cs402l",
      code: "CS-402L",
      title: "Advanced Neural Networks Laboratory",
      shortName: "Neural Net Lab",
      description: "Hands-on PyTorch implementations of multi-head attention, backprop derivation, and CUDA benchmarking.",
      departmentId: facultyDeptCS,
      semesterId: semCsFall,
      subjectType: "LAB",
      courseType: "PRACTICAL",
      credits: 2,
      lectureHours: 0,
      tutorialHours: 0,
      labHours: 4,
      internalMarks: 50,
      externalMarks: 50,
      totalMarks: 100,
      passingMarks: 50,
      status: "ACTIVE",
      isElective: false,
      isCommon: false,
      assignedFacultyId: "fac-chen-01",
    },
    {
      id: "crs-cs301",
      code: "CS-301",
      title: "Distributed Systems & Cloud Computing",
      shortName: "Distributed Systems",
      description: "Consensus algorithms, Raft, Paxos, distributed transaction sagas, and microservices.",
      departmentId: facultyDeptCS,
      semesterId: semCsFall,
      subjectType: "CORE",
      courseType: "THEORY",
      credits: 4,
      lectureHours: 3,
      tutorialHours: 0,
      labHours: 2,
      internalMarks: 40,
      externalMarks: 60,
      totalMarks: 100,
      passingMarks: 40,
      status: "ACTIVE",
      isElective: false,
      isCommon: false,
      assignedFacultyId: "fac-chen-01",
    },
    {
      id: "crs-cs450",
      code: "CS-450",
      title: "Reinforcement Learning & Autonomous Agents",
      shortName: "RL & Agents",
      description: "Markov decision processes, Q-learning, policy gradients, PPO, and autonomous agent orchestration.",
      departmentId: facultyDeptCS,
      semesterId: semCsFall,
      subjectType: "PROGRAM_ELECTIVE",
      courseType: "THEORY",
      credits: 3,
      lectureHours: 3,
      tutorialHours: 0,
      labHours: 0,
      internalMarks: 40,
      externalMarks: 60,
      totalMarks: 100,
      passingMarks: 40,
      status: "ACTIVE",
      isElective: true,
      isCommon: false,
      assignedFacultyId: "fac-chen-01",
    },
    {
      id: "crs-cs480",
      code: "CS-480",
      title: "Big Data Analytics & Distributed Warehousing",
      shortName: "Big Data",
      description: "Hadoop, Apache Spark, columnar storage engines, and enterprise data lakehouses.",
      departmentId: facultyDeptCS,
      semesterId: semCsFall,
      subjectType: "OPEN_ELECTIVE",
      courseType: "THEORY",
      credits: 3,
      lectureHours: 3,
      tutorialHours: 0,
      labHours: 0,
      internalMarks: 40,
      externalMarks: 60,
      totalMarks: 100,
      passingMarks: 40,
      status: "ACTIVE",
      isElective: true,
      isCommon: false,
      assignedFacultyId: "fac-chen-01",
    },

    // Biotechnology Subjects
    {
      id: "crs-bio301",
      code: "BIO-301",
      title: "Molecular Biology & Gene Expression",
      shortName: "Molecular Biology",
      description: "DNA replication, transcription, translational kinetics, and epigenetic chromatin remodeling.",
      departmentId: facultyDeptBio,
      semesterId: semBioFall,
      subjectType: "CORE",
      courseType: "THEORY",
      credits: 4,
      lectureHours: 3,
      tutorialHours: 1,
      labHours: 0,
      internalMarks: 40,
      externalMarks: 60,
      totalMarks: 100,
      passingMarks: 40,
      status: "ACTIVE",
      isElective: false,
      isCommon: false,
      assignedFacultyId: "fac-raman-02",
    },
    {
      id: "crs-bio301l",
      code: "BIO-301L",
      title: "Molecular Biology & Recombinant DNA Lab",
      shortName: "MolBio Lab",
      description: "Plasmid extraction, restriction endonuclease digestion, agarose gel electrophoresis, and PCR amplification.",
      departmentId: facultyDeptBio,
      semesterId: semBioFall,
      subjectType: "LAB",
      courseType: "PRACTICAL",
      credits: 2,
      lectureHours: 0,
      tutorialHours: 0,
      labHours: 4,
      internalMarks: 50,
      externalMarks: 50,
      totalMarks: 100,
      passingMarks: 50,
      status: "ACTIVE",
      isElective: false,
      isCommon: false,
      assignedFacultyId: "fac-raman-02",
    },
    {
      id: "crs-bio302",
      code: "BIO-302",
      title: "Genetics & Epigenetic Regulation",
      shortName: "Genetics",
      description: "Mendelian ratios, chromosome mapping, population genetics, and histone methylation dynamics.",
      departmentId: facultyDeptBio,
      semesterId: semBioFall,
      subjectType: "CORE",
      courseType: "THEORY",
      credits: 4,
      lectureHours: 3,
      tutorialHours: 1,
      labHours: 0,
      internalMarks: 40,
      externalMarks: 60,
      totalMarks: 100,
      passingMarks: 40,
      status: "ACTIVE",
      isElective: false,
      isCommon: false,
      assignedFacultyId: "fac-raman-02",
    },
    {
      id: "crs-bio303",
      code: "BIO-303",
      title: "Cellular Biochemistry & Metabolism",
      shortName: "Biochemistry",
      description: "Enzyme kinetics, metabolic pathways, Krebs cycle, oxidative phosphorylation, and lipid biosynthesis.",
      departmentId: facultyDeptBio,
      semesterId: semBioFall,
      subjectType: "CORE",
      courseType: "THEORY",
      credits: 4,
      lectureHours: 3,
      tutorialHours: 0,
      labHours: 2,
      internalMarks: 40,
      externalMarks: 60,
      totalMarks: 100,
      passingMarks: 40,
      status: "ACTIVE",
      isElective: false,
      isCommon: false,
      assignedFacultyId: "fac-raman-02",
    },
    {
      id: "crs-bio350",
      code: "BIO-350",
      title: "Computational Genomics & Bioinformatics",
      shortName: "Bioinformatics",
      description: "Sequence alignment algorithms (Smith-Waterman, BLAST), phylogenetic tree construction, and structural biology.",
      departmentId: facultyDeptBio,
      semesterId: semBioFall,
      subjectType: "PROGRAM_ELECTIVE",
      courseType: "THEORY",
      credits: 3,
      lectureHours: 3,
      tutorialHours: 0,
      labHours: 0,
      internalMarks: 40,
      externalMarks: 60,
      totalMarks: 100,
      passingMarks: 40,
      status: "ACTIVE",
      isElective: true,
      isCommon: false,
      assignedFacultyId: "fac-raman-02",
    },

    // Business Administration Subjects
    {
      id: "crs-bba301",
      code: "BBA-301",
      title: "Corporate Financial Management",
      shortName: "Corporate Finance",
      description: "Capital budgeting, discounted cash flow valuation, working capital optimization, and financial markets.",
      departmentId: facultyDeptMgmt,
      semesterId: semBbaFall,
      subjectType: "CORE",
      courseType: "THEORY",
      credits: 4,
      lectureHours: 3,
      tutorialHours: 1,
      labHours: 0,
      internalMarks: 40,
      externalMarks: 60,
      totalMarks: 100,
      passingMarks: 40,
      status: "ACTIVE",
      isElective: false,
      isCommon: false,
      assignedFacultyId: "fac-sterling-03",
    },
    {
      id: "crs-bba302",
      code: "BBA-302",
      title: "Strategic Marketing & Consumer Analytics",
      shortName: "Marketing Strategy",
      description: "Brand architecture, segmentation, behavioral consumer dynamics, and econometric marketing mix modeling.",
      departmentId: facultyDeptMgmt,
      semesterId: semBbaFall,
      subjectType: "CORE",
      courseType: "THEORY",
      credits: 4,
      lectureHours: 3,
      tutorialHours: 0,
      labHours: 0,
      internalMarks: 40,
      externalMarks: 60,
      totalMarks: 100,
      passingMarks: 40,
      status: "ACTIVE",
      isElective: false,
      isCommon: false,
      assignedFacultyId: "fac-sterling-03",
    },

    // Common University Subjects
    {
      id: "crs-eng101",
      code: "ENG-101",
      title: "Technical Communication & Professional Ethics",
      shortName: "Technical English",
      description: "Academic thesis writing, professional technical documentation, oral presentations, and engineering ethics.",
      departmentId: facultyDeptHum,
      semesterId: semCsFall,
      subjectType: "ABILITY_ENHANCEMENT",
      courseType: "THEORY",
      credits: 2,
      lectureHours: 2,
      tutorialHours: 0,
      labHours: 0,
      internalMarks: 50,
      externalMarks: 50,
      totalMarks: 100,
      passingMarks: 40,
      status: "ACTIVE",
      isElective: false,
      isCommon: true,
      assignedFacultyId: "fac-roy-04",
    },
    {
      id: "crs-env201",
      code: "ENV-201",
      title: "Environmental Sustainability & Climate Science",
      shortName: "Environmental Science",
      description: "Ecosystem dynamics, carbon accounting, renewable energy transitions, and circular economy principles.",
      departmentId: facultyDeptHum,
      semesterId: semBioFall,
      subjectType: "VALUE_ADDED",
      courseType: "THEORY",
      credits: 2,
      lectureHours: 2,
      tutorialHours: 0,
      labHours: 0,
      internalMarks: 50,
      externalMarks: 50,
      totalMarks: 100,
      passingMarks: 40,
      status: "ACTIVE",
      isElective: false,
      isCommon: true,
      assignedFacultyId: "fac-roy-04",
    },

    // Historical / Archived Course
    {
      id: "crs-cs201-hist",
      code: "CS-201",
      title: "Object-Oriented Programming with C++ (Legacy)",
      shortName: "OOP C++",
      description: "Historical curriculum course archived following curriculum revision.",
      departmentId: facultyDeptCS,
      semesterId: semCsPast,
      subjectType: "CORE",
      courseType: "THEORY",
      credits: 4,
      lectureHours: 3,
      tutorialHours: 0,
      labHours: 2,
      internalMarks: 40,
      externalMarks: 60,
      totalMarks: 100,
      passingMarks: 40,
      status: "ARCHIVED",
      isElective: false,
      isCommon: false,
      assignedFacultyId: "fac-chen-01",
    },
  ];

  for (const cm of coursesMaster) {
    if (!cm.departmentId || !cm.semesterId) continue;
    const existing = await prisma.course.findFirst({
      where: { departmentId: cm.departmentId, code: cm.code },
    });

    let courseRecord = null;
    if (existing) {
      courseRecord = await prisma.course.update({
        where: { id: existing.id },
        data: {
          title: cm.title,
          shortName: cm.shortName,
          description: cm.description,
          subjectType: cm.subjectType,
          courseType: cm.courseType,
          credits: cm.credits,
          lectureHours: cm.lectureHours,
          tutorialHours: cm.tutorialHours,
          labHours: cm.labHours,
          internalMarks: cm.internalMarks,
          externalMarks: cm.externalMarks,
          totalMarks: cm.totalMarks,
          passingMarks: cm.passingMarks,
          status: cm.status,
          isElective: cm.isElective,
          isCommon: cm.isCommon,
          isActive: cm.status === "ACTIVE",
        },
      });
    } else {
      courseRecord = await prisma.course.create({
        data: {
          id: cm.id,
          departmentId: cm.departmentId,
          semesterId: cm.semesterId,
          code: cm.code,
          title: cm.title,
          shortName: cm.shortName,
          description: cm.description,
          subjectType: cm.subjectType,
          courseType: cm.courseType,
          credits: cm.credits,
          lectureHours: cm.lectureHours,
          tutorialHours: cm.tutorialHours,
          labHours: cm.labHours,
          internalMarks: cm.internalMarks,
          externalMarks: cm.externalMarks,
          totalMarks: cm.totalMarks,
          passingMarks: cm.passingMarks,
          status: cm.status,
          isElective: cm.isElective,
          isCommon: cm.isCommon,
          isActive: cm.status === "ACTIVE",
        },
      });
    }

    // Assign faculty to course
    const actualFacId = facultyMap[cm.assignedFacultyId];
    if (actualFacId && courseRecord) {
      await prisma.courseFaculty.upsert({
        where: { courseId_facultyId: { courseId: courseRecord.id, facultyId: actualFacId } },
        update: { role: "PRIMARY_INSTRUCTOR" },
        create: {
          courseId: courseRecord.id,
          facultyId: actualFacId,
          role: "PRIMARY_INSTRUCTOR",
        },
      });
    }
  }

  // 11. Students & Realistic Enrollments
  const secCs5A = sectionMap["sec-cs-5a"];
  const secCs5B = sectionMap["sec-cs-5b"];
  const secBio3A = sectionMap["sec-bio-3a"];

  // Alex Mercer (CSE, Section 5-A)
  const alexStudent = await prisma.student.findFirst({
    where: { rollNumber: "2024-CSE-042" },
  });
  if (alexStudent) {
    await prisma.student.update({
      where: { id: alexStudent.id },
      data: { sectionId: secCs5A },
    });

    const alexCourses = ["CS-402", "CS-402L", "CS-301", "CS-450", "ENG-101"];
    for (const cCode of alexCourses) {
      const crs = await prisma.course.findFirst({ where: { code: cCode } });
      if (crs) {
        await prisma.enrollment.upsert({
          where: { studentId_courseId: { studentId: alexStudent.id, courseId: crs.id } },
          update: { status: "ENROLLED" },
          create: { studentId: alexStudent.id, courseId: crs.id, status: "ENROLLED" },
        });
      }
    }
  }

  // Ethan Hunt (CSE, Section 5-A, Defaulter)
  const ethanStudent = await prisma.student.findFirst({
    where: { rollNumber: "2024-CSE-099" },
  });
  if (ethanStudent) {
    await prisma.student.update({
      where: { id: ethanStudent.id },
      data: { sectionId: secCs5A },
    });

    const ethanCourses = ["CS-402", "CS-402L", "CS-301", "CS-480"];
    for (const cCode of ethanCourses) {
      const crs = await prisma.course.findFirst({ where: { code: cCode } });
      if (crs) {
        await prisma.enrollment.upsert({
          where: { studentId_courseId: { studentId: ethanStudent.id, courseId: crs.id } },
          update: { status: "ENROLLED" },
          create: { studentId: ethanStudent.id, courseId: crs.id, status: "ENROLLED" },
        });
      }
    }
  }

  // Maya Patel (Biotechnology, Section 3-A)
  let mayaUser = await prisma.user.findUnique({ where: { email: "maya.patel@apex.edu" } });
  if (!mayaUser) {
    mayaUser = await prisma.user.create({
      data: {
        id: "usr-stu-03",
        institutionId: institution.id,
        email: "maya.patel@apex.edu",
        passwordHash: "$2b$10$wU05z.1gUj6R4lM2zXpZqeCjGjGvK9U1A2B3C4D5E6F7G8H9I0J1K",
        firstName: "Maya",
        lastName: "Patel",
        role: "STUDENT",
      },
    });
  }

  const progBioId = programMap["BSC-BIO"];
  let mayaStudent = await prisma.student.findUnique({ where: { userId: mayaUser.id } });
  if (!mayaStudent && progBioId) {
    mayaStudent = await prisma.student.create({
      data: {
        id: "stu-patel-03",
        userId: mayaUser.id,
        programId: progBioId,
        sectionId: secBio3A,
        rollNumber: "2024-BIO-015",
        admissionNumber: "ADM-2024-402",
        admissionDate: new Date("2024-08-01"),
        currentSemester: 3,
        cgpa: 3.92,
        attendanceRate: 88.5,
        status: "ACTIVE",
      },
    });
  }

  if (mayaStudent) {
    const mayaCourses = ["BIO-301", "BIO-301L", "BIO-302", "BIO-303", "BIO-350", "ENV-201"];
    for (const cCode of mayaCourses) {
      const crs = await prisma.course.findFirst({ where: { code: cCode } });
      if (crs) {
        await prisma.enrollment.upsert({
          where: { studentId_courseId: { studentId: mayaStudent.id, courseId: crs.id } },
          update: { status: "ENROLLED" },
          create: { studentId: mayaStudent.id, courseId: crs.id, status: "ENROLLED" },
        });
      }
    }
  }

  // Rohan Sharma (CSE, Section 5-B)
  let rohanUser = await prisma.user.findUnique({ where: { email: "rohan.sharma@apex.edu" } });
  if (!rohanUser) {
    rohanUser = await prisma.user.create({
      data: {
        id: "usr-stu-04",
        institutionId: institution.id,
        email: "rohan.sharma@apex.edu",
        passwordHash: "$2b$10$wU05z.1gUj6R4lM2zXpZqeCjGjGvK9U1A2B3C4D5E6F7G8H9I0J1K",
        firstName: "Rohan",
        lastName: "Sharma",
        role: "STUDENT",
      },
    });
  }

  const progCsId = programMap["BTECH-CSE"];
  let rohanStudent = await prisma.student.findUnique({ where: { userId: rohanUser.id } });
  if (!rohanStudent && progCsId) {
    rohanStudent = await prisma.student.create({
      data: {
        id: "stu-sharma-04",
        userId: rohanUser.id,
        programId: progCsId,
        sectionId: secCs5B,
        rollNumber: "2024-CSE-112",
        admissionNumber: "ADM-2024-650",
        admissionDate: new Date("2024-08-01"),
        currentSemester: 5,
        cgpa: 3.45,
        attendanceRate: 91.0,
        status: "ACTIVE",
      },
    });
  }

  if (rohanStudent) {
    const rohanCourses = ["CS-402", "CS-402L", "CS-301", "CS-480"];
    for (const cCode of rohanCourses) {
      const crs = await prisma.course.findFirst({ where: { code: cCode } });
      if (crs) {
        await prisma.enrollment.upsert({
          where: { studentId_courseId: { studentId: rohanStudent.id, courseId: crs.id } },
          update: { status: "ENROLLED" },
          create: { studentId: rohanStudent.id, courseId: crs.id, status: "ENROLLED" },
        });
      }
    }
  }

  // 12. Timetable Slots
  const courseCs402 = await prisma.course.findFirst({ where: { code: "CS-402" } });
  const courseCs402L = await prisma.course.findFirst({ where: { code: "CS-402L" } });
  const courseBio301 = await prisma.course.findFirst({ where: { code: "BIO-301" } });
  const facChen = facultyMap["fac-chen-01"];
  const facRaman = facultyMap["fac-raman-02"];
  const room4B = await prisma.room.findFirst({ where: { code: "LH-4B" } });
  const roomLab102 = await prisma.room.findFirst({ where: { code: "LAB-102" } });
  const roomBio1 = await prisma.room.findFirst({ where: { code: "BIO-LH1" } });

  const daysOfWeek = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  if (courseCs402 && facChen && room4B && secCs5A) {
    for (const day of daysOfWeek) {
      const existing = await prisma.timetableSlot.findFirst({
        where: { courseId: courseCs402.id, sectionId: secCs5A, dayOfWeek: day, startTime: "09:00" },
      });
      if (!existing) {
        await prisma.timetableSlot.create({
          data: {
            campusId: campus.id,
            courseId: courseCs402.id,
            facultyId: facChen,
            roomId: room4B.id,
            sectionId: secCs5A,
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "10:30",
          },
        });
      }
    }
  }

  // Section 5-B CS-402 Timetable slot
  if (courseCs402 && facChen && room4B && secCs5B) {
    for (const day of ["MONDAY", "WEDNESDAY", "FRIDAY"]) {
      const existing = await prisma.timetableSlot.findFirst({
        where: { courseId: courseCs402.id, sectionId: secCs5B, dayOfWeek: day, startTime: "11:00" },
      });
      if (!existing) {
        await prisma.timetableSlot.create({
          data: {
            campusId: campus.id,
            courseId: courseCs402.id,
            facultyId: facChen,
            roomId: room4B.id,
            sectionId: secCs5B,
            dayOfWeek: day,
            startTime: "11:00",
            endTime: "12:30",
          },
        });
      }
    }
  }

  // Lab Timetable slot
  if (courseCs402L && facChen && roomLab102 && secCs5A) {
    for (const day of ["TUESDAY", "THURSDAY"]) {
      const existing = await prisma.timetableSlot.findFirst({
        where: { courseId: courseCs402L.id, sectionId: secCs5A, dayOfWeek: day, startTime: "14:00" },
      });
      if (!existing) {
        await prisma.timetableSlot.create({
          data: {
            campusId: campus.id,
            courseId: courseCs402L.id,
            facultyId: facChen,
            roomId: roomLab102.id,
            sectionId: secCs5A,
            dayOfWeek: day,
            startTime: "14:00",
            endTime: "16:00",
          },
        });
      }
    }
  }

  // Biotech Timetable slot
  if (courseBio301 && facRaman && roomBio1 && secBio3A) {
    for (const day of daysOfWeek) {
      const existing = await prisma.timetableSlot.findFirst({
        where: { courseId: courseBio301.id, sectionId: secBio3A, dayOfWeek: day, startTime: "10:00" },
      });
      if (!existing) {
        await prisma.timetableSlot.create({
          data: {
            campusId: campus.id,
            courseId: courseBio301.id,
            facultyId: facRaman,
            roomId: roomBio1.id,
            sectionId: secBio3A,
            dayOfWeek: day,
            startTime: "10:00",
            endTime: "11:30",
          },
        });
      }
    }
  }

  return {
    institutionId: institution.id,
    departmentsCount: Object.keys(departmentMap).length,
    programsCount: Object.keys(programMap).length,
    coursesCount: coursesMaster.length,
    sectionsCount: 4,
  };
}
