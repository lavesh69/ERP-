/**
 * Robust RFC 4180 CSV parser & generator for Registrar Bulk Imports
 */

export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export function parseCsv(text: string): ParsedCsvResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  // Parse header line
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx].trim() : "";
    });
    rows.push(row);
  }

  return { headers, rows, totalRows: rows.length };
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export const STUDENT_SAMPLE_CSV = `firstName,lastName,email,phone,rollNumber,admissionNumber,programCode,semester
Aarav,Sharma,aarav.sharma@apex.edu,+1-555-0101,2026CSE001,ADM-2026-001,CS-BS,1
Diya,Patel,diya.patel@apex.edu,+1-555-0102,2026CSE002,ADM-2026-002,CS-BS,1
Rohan,Mehta,rohan.mehta@apex.edu,+1-555-0103,2026CSE003,ADM-2026-003,CS-BS,1`;

export const FACULTY_SAMPLE_CSV = `firstName,lastName,email,phone,employeeCode,designation,departmentCode
Vikram,Malhotra,vikram.m@apex.edu,+1-555-0201,EMP-2026-01,Associate Professor,CS
Pooja,Nair,pooja.n@apex.edu,+1-555-0202,EMP-2026-02,Assistant Professor,EE`;
