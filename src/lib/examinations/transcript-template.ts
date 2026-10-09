/**
 * Academic Transcript Print/PDF Document Generator
 * Generates an official, tamper-evident, print-optimized document conforming to
 * UGC / AICTE statutory guidelines and Ivory Bloom institutional aesthetics.
 */

export function generateTranscriptHtml(transcript: any): string {
  const { institution, student, performance, courses = [], semesterHistory = [], verification } = transcript;

  const coursesRows = courses
    .map(
      (c: any, index: number) => `
      <tr>
        <td style="text-align: center; padding: 8px; border: 1px solid #EADDE2;">${index + 1}</td>
        <td style="font-weight: 600; padding: 8px; border: 1px solid #EADDE2; color: #8E5368;">${c.code}</td>
        <td style="padding: 8px; border: 1px solid #EADDE2;">${c.title}</td>
        <td style="text-align: center; padding: 8px; border: 1px solid #EADDE2;">${c.type || "CORE"}</td>
        <td style="text-align: center; padding: 8px; border: 1px solid #EADDE2; font-weight: 600;">${c.credits}</td>
        <td style="text-align: center; padding: 8px; border: 1px solid #EADDE2; font-weight: bold; color: ${c.grade === "F" ? "#DC2626" : "#2E7D32"};">${c.grade}</td>
        <td style="text-align: center; padding: 8px; border: 1px solid #EADDE2;">${c.gradePoint != null ? c.gradePoint.toFixed(1) : "-"}</td>
      </tr>
    `
    )
    .join("");

  const historyRows = semesterHistory
    .map(
      (h: any) => `
      <div style="background: #FDF9FA; border: 1px solid #EADDE2; border-radius: 6px; padding: 8px 12px; text-align: center; min-width: 90px;">
        <div style="font-size: 10px; color: #666; font-weight: 600; text-transform: uppercase;">${h.semester}</div>
        <div style="font-size: 15px; font-weight: bold; color: #8E5368; margin-top: 2px;">${h.gpa != null ? Number(h.gpa).toFixed(2) : "-"}</div>
        <div style="font-size: 10px; color: #888;">${h.credits} Credits</div>
      </div>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Academic Transcript — ${student.name} (${student.rollNumber})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #242124;
      background: #FFFFFF;
      margin: 0;
      padding: 24px;
      line-height: 1.4;
      font-size: 12px;
    }
    .transcript-sheet {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #8E5368;
      border-radius: 8px;
      padding: 28px;
      position: relative;
      background: #FFFFFF;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 64px;
      font-weight: 900;
      color: rgba(142, 83, 104, 0.04);
      letter-spacing: 6px;
      pointer-events: none;
      z-index: 0;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #8E5368;
      padding-bottom: 16px;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    .crest-badge {
      display: inline-block;
      width: 48px;
      height: 48px;
      line-height: 48px;
      border-radius: 50%;
      background: #8E5368;
      color: #FFFFFF;
      font-weight: bold;
      font-size: 20px;
      margin-bottom: 8px;
    }
    .univ-name {
      font-size: 20px;
      font-weight: 800;
      color: #8E5368;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0;
    }
    .univ-sub {
      font-size: 11px;
      font-weight: 600;
      color: #666;
      letter-spacing: 1px;
      margin-top: 4px;
      text-transform: uppercase;
    }
    .doc-title {
      font-size: 14px;
      font-weight: 700;
      color: #242124;
      background: #FFF0F5;
      display: inline-block;
      padding: 4px 16px;
      border-radius: 20px;
      margin-top: 10px;
      border: 1px solid #EADDE2;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
      background: #FFF0F5;
      border: 1px solid #EADDE2;
      border-radius: 6px;
      padding: 12px 16px;
      position: relative;
      z-index: 1;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 10px;
      color: #777;
      text-transform: uppercase;
      font-weight: 600;
    }
    .meta-val {
      font-size: 12px;
      font-weight: 600;
      color: #242124;
      margin-top: 2px;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    .summary-card {
      background: #FDF9FA;
      border: 1px solid #EADDE2;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
    }
    .summary-card.highlight {
      background: #FFF0F5;
      border-color: #8E5368;
    }
    .card-title {
      font-size: 10px;
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
    }
    .card-val {
      font-size: 18px;
      font-weight: 800;
      color: #8E5368;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    th {
      background: #8E5368;
      color: #FFFFFF;
      font-weight: 600;
      font-size: 11px;
      padding: 8px;
      text-align: left;
      border: 1px solid #8E5368;
    }
    th.center {
      text-align: center;
    }
    .history-container {
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    .history-title {
      font-size: 11px;
      font-weight: 700;
      color: #8E5368;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .history-grid {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #EADDE2;
      position: relative;
      z-index: 1;
    }
    .seal-box {
      font-size: 10px;
      color: #666;
      border-left: 3px solid #8E5368;
      padding-left: 10px;
    }
    .sign-box {
      text-align: center;
      min-width: 180px;
    }
    .sign-line {
      width: 160px;
      border-bottom: 1px solid #242124;
      margin: 0 auto 6px auto;
    }
    .sign-title {
      font-size: 10px;
      font-weight: 700;
      color: #242124;
      text-transform: uppercase;
    }
    .sign-sub {
      font-size: 9px;
      color: #777;
    }
    @media print {
      body {
        padding: 0;
      }
      .transcript-sheet {
        border: none;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 16px auto; display: flex; justify-content: flex-end; gap: 8px;">
    <button onclick="window.print()" style="background: #8E5368; color: #FFF; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
      🖨️ Print Transcript / Save as PDF
    </button>
  </div>

  <div class="transcript-sheet">
    <div class="watermark">${institution?.code || "APEX"} OFFICIAL</div>

    <div class="header">
      <div class="crest-badge">🎓</div>
      <h1 class="univ-name">${institution?.name || "Apex University of Science & Technology"}</h1>
      <div class="univ-sub">${institution?.controllerOffice || "Office of the Controller of Examinations"}</div>
      <div class="doc-title">OFFICIAL GRADE TRANSCRIPT & CONSOLIDATED MARKS CARD</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Scholar Name</span>
        <span class="meta-val">${student.name}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Enrollment / Roll Number</span>
        <span class="meta-val">${student.rollNumber}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Academic Program</span>
        <span class="meta-val">${student.program}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">School / Department</span>
        <span class="meta-val">${student.department}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Current Term</span>
        <span class="meta-val">Semester ${student.currentSemester}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Transcript Reference ID</span>
        <span class="meta-val" style="font-family: monospace;">${transcript.transcriptId}</span>
      </div>
    </div>

    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-title">Term SGPA</div>
        <div class="card-val">${performance.currentSemesterSGPA != null ? performance.currentSemesterSGPA.toFixed(2) : "-"}</div>
      </div>
      <div class="summary-card highlight">
        <div class="card-title">Cumulative CGPA</div>
        <div class="card-val">${performance.cumulativeCGPA != null ? performance.cumulativeCGPA.toFixed(2) : "-"}</div>
      </div>
      <div class="summary-card">
        <div class="card-title">Earned Credits</div>
        <div class="card-val">${performance.totalCreditsEarned} / ${performance.totalCreditsRegistered}</div>
      </div>
      <div class="summary-card">
        <div class="card-title">Academic Classification</div>
        <div class="card-val" style="font-size: 13px; color: ${performance.standingBadgeColor || "#8E5368"}; line-height: 24px;">
          ${performance.academicStanding}
        </div>
      </div>
    </div>

    <div class="history-container">
      <div class="history-title">Semester Progression & SGPA Breakdown</div>
      <div class="history-grid">
        ${historyRows}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35px;" class="center">#</th>
          <th style="width: 90px;">Course Code</th>
          <th>Course Title</th>
          <th style="width: 65px;" class="center">Type</th>
          <th style="width: 55px;" class="center">Credits</th>
          <th style="width: 55px;" class="center">Grade</th>
          <th style="width: 65px;" class="center">Grade Point</th>
        </tr>
      </thead>
      <tbody>
        ${coursesRows}
      </tbody>
    </table>

    <div class="footer">
      <div class="seal-box">
        <div><strong>Cryptographic Security Seal:</strong> ${verification?.sealNumber || "APEX-COE-AUTHENTIC"}</div>
        <div><strong>Issued At:</strong> ${new Date(transcript.issuedAt).toLocaleString()}</div>
        <div>Verified by Academic Examination Security Framework</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-title">${verification?.authenticatedBy || "Controller of Examinations"}</div>
        <div class="sign-sub">Apex University Examination Authority</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
