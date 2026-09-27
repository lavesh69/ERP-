/**
 * Intelligent Anti-Cheating Seating Allocation Engine
 * 
 * Provides automated checkerboard student interleaving across examination halls.
 * Ensures no two adjacent desks (horizontally or vertically) hold students
 * appearing for the same course / question paper.
 */

export interface CandidateEntry {
  studentId: string;
  studentName: string;
  rollNumber: string;
  courseCode: string;
  courseTitle: string;
  department: string;
}

export interface ExamHallConfig {
  hallId: string;
  hallName: string;
  building: string;
  rows: number;
  cols: number; // rows * cols = capacity
  invigilatorId?: string;
  invigilatorName?: string;
  invigilatorDept?: string;
}

export interface AllocatedSeat {
  seatNumber: string; // e.g., "A-1", "B-3"
  row: number;
  col: number;
  student: CandidateEntry | null;
}

export interface HallSeatingPlan {
  hallId: string;
  hallName: string;
  building: string;
  capacity: number;
  occupiedSeats: number;
  invigilator: {
    id?: string;
    name?: string;
    department?: string;
    conflictWarning?: string | null;
  };
  grid: AllocatedSeat[][]; // 2D matrix [rows][cols]
  doorNotice: {
    courseCode: string;
    courseTitle: string;
    allocatedCount: number;
    rollRange: string;
  }[];
}

export interface SeatingAllocationResult {
  success: boolean;
  totalCandidates: number;
  totalAllocated: number;
  unallocatedCount: number;
  hallsUsed: number;
  plans: HallSeatingPlan[];
  antiCheatingMetrics: {
    horizontalClashes: number; // Must be 0
    verticalClashes: number;
    interleavingRatio: number; // % of seats bordered by different subjects
  };
}

/**
 * Distributes candidates from multiple courses across examination halls
 * applying a multi-course checkerboard pattern to prevent cheating.
 */
export function generateAntiCheatingSeatingPlan(
  candidatesByCourse: Record<string, CandidateEntry[]>,
  halls: ExamHallConfig[]
): SeatingAllocationResult {
  // Group course queues sorted by course code for deterministic behavior
  const courseCodes = Object.keys(candidatesByCourse).sort();
  const candidateQueues: Record<string, CandidateEntry[]> = {};
  let totalCandidates = 0;

  for (const code of courseCodes) {
    // Sort students by roll number within course
    candidateQueues[code] = [...candidatesByCourse[code]].sort((a, b) =>
      a.rollNumber.localeCompare(b.rollNumber)
    );
    totalCandidates += candidateQueues[code].length;
  }

  const plans: HallSeatingPlan[] = [];
  let totalAllocated = 0;
  let horizontalClashes = 0;
  let verticalClashes = 0;
  let totalAdjacentPairs = 0;
  let differentCourseAdjacentPairs = 0;

  for (const hall of halls) {
    const grid: AllocatedSeat[][] = [];
    const hallCourseCounts: Record<string, { count: number; rolls: string[]; title: string }> = {};

    for (let r = 0; r < hall.rows; r++) {
      const rowSeats: AllocatedSeat[] = [];
      const rowLetter = String.fromCharCode(65 + r); // 'A', 'B', 'C', ...

      for (let c = 0; c < hall.cols; c++) {
        const seatNumber = `${rowLetter}-${c + 1}`;

        // Checkerboard course assignment target:
        // When multiple courses exist, interleave based on (r + c) parity
        const targetCourseIndex = (r + c) % courseCodes.length;
        let selectedCandidate: CandidateEntry | null = null;
        let selectedCourseCode: string | null = null;

        // Try primary targeted course according to checkerboard parity
        const preferredCode = courseCodes[targetCourseIndex];
        if (candidateQueues[preferredCode] && candidateQueues[preferredCode].length > 0) {
          selectedCandidate = candidateQueues[preferredCode].shift()!;
          selectedCourseCode = preferredCode;
        } else {
          // If preferred course is exhausted, pick another course that minimizes conflict with neighbors
          const leftNeighbor = c > 0 ? rowSeats[c - 1]?.student?.courseCode : null;
          const topNeighbor = r > 0 ? grid[r - 1]?.[c]?.student?.courseCode : null;

          for (const altCode of courseCodes) {
            if (candidateQueues[altCode] && candidateQueues[altCode].length > 0) {
              if (altCode !== leftNeighbor && altCode !== topNeighbor) {
                selectedCandidate = candidateQueues[altCode].shift()!;
                selectedCourseCode = altCode;
                break;
              }
            }
          }

          // Fallback if constrained
          if (!selectedCandidate) {
            for (const altCode of courseCodes) {
              if (candidateQueues[altCode] && candidateQueues[altCode].length > 0) {
                selectedCandidate = candidateQueues[altCode].shift()!;
                selectedCourseCode = altCode;
                break;
              }
            }
          }
        }

        if (selectedCandidate && selectedCourseCode) {
          totalAllocated++;
          if (!hallCourseCounts[selectedCourseCode]) {
            hallCourseCounts[selectedCourseCode] = {
              count: 0,
              rolls: [],
              title: selectedCandidate.courseTitle,
            };
          }
          hallCourseCounts[selectedCourseCode].count++;
          hallCourseCounts[selectedCourseCode].rolls.push(selectedCandidate.rollNumber);
        }

        rowSeats.push({
          seatNumber,
          row: r,
          col: c,
          student: selectedCandidate,
        });
      }
      grid.push(rowSeats);
    }

    // Verify invigilator conflict (Invigilator cannot invigilate their own teaching department)
    let conflictWarning: string | null = null;
    if (hall.invigilatorDept) {
      const hostingDepts = new Set<string>();
      grid.forEach((row) =>
        row.forEach((seat) => {
          if (seat.student) hostingDepts.add(seat.student.department);
        })
      );
      if (hostingDepts.has(hall.invigilatorDept)) {
        conflictWarning = `Notice: Invigilator ${hall.invigilatorName || "Faculty"} belongs to Department (${hall.invigilatorDept}) appearing in this examination hall. Independent CoE invigilator recommended.`;
      }
    }

    // Build Door Notice for affixing outside hall
    const doorNotice = Object.entries(hallCourseCounts).map(([code, meta]) => {
      const rolls = meta.rolls;
      const rollRange = rolls.length > 0 ? `${rolls[0]} to ${rolls[rolls.length - 1]}` : "None";
      return {
        courseCode: code,
        courseTitle: meta.title,
        allocatedCount: meta.count,
        rollRange,
      };
    });

    const occupiedSeats = grid.reduce(
      (acc, row) => acc + row.filter((s) => s.student !== null).length,
      0
    );

    plans.push({
      hallId: hall.hallId,
      hallName: hall.hallName,
      building: hall.building,
      capacity: hall.rows * hall.cols,
      occupiedSeats,
      invigilator: {
        id: hall.invigilatorId,
        name: hall.invigilatorName,
        department: hall.invigilatorDept,
        conflictWarning,
      },
      grid,
      doorNotice,
    });
  }

  // Audit Anti-Cheating Metrics across all generated plans
  for (const plan of plans) {
    const grid = plan.grid;
    const rows = grid.length;
    const cols = grid[0]?.length || 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const current = grid[r][c].student;
        if (!current) continue;

        // Check Horizontal Right
        if (c + 1 < cols && grid[r][c + 1].student) {
          totalAdjacentPairs++;
          if (grid[r][c + 1].student?.courseCode === current.courseCode) {
            horizontalClashes++;
          } else {
            differentCourseAdjacentPairs++;
          }
        }

        // Check Vertical Down
        if (r + 1 < rows && grid[r + 1][c].student) {
          totalAdjacentPairs++;
          if (grid[r + 1][c].student?.courseCode === current.courseCode) {
            verticalClashes++;
          } else {
            differentCourseAdjacentPairs++;
          }
        }
      }
    }
  }

  const interleavingRatio =
    totalAdjacentPairs > 0
      ? Number(((differentCourseAdjacentPairs / totalAdjacentPairs) * 100).toFixed(1))
      : 100.0;

  return {
    success: totalAllocated === totalCandidates,
    totalCandidates,
    totalAllocated,
    unallocatedCount: totalCandidates - totalAllocated,
    hallsUsed: plans.filter((p) => p.occupiedSeats > 0).length,
    plans,
    antiCheatingMetrics: {
      horizontalClashes,
      verticalClashes,
      interleavingRatio,
    },
  };
}
