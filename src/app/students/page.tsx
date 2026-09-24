"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import {
  GraduationCap,
  Search,
  Plus,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  FileSpreadsheet,
  Upload,
  Download,
} from "lucide-react";

export default function StudentsDirectoryPage() {
  const { showToast, refreshTrigger, triggerRefresh } = useApp();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    departmentCode: "CSE",
    semester: "1",
  });

  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) {
      showToast("Please paste CSV data or choose a file", "error");
      return;
    }
    setIsImporting(true);
    setBulkResult(null);
    try {
      const res = await fetch("/api/students/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: csvText }),
      });
      const data = await res.json();
      if (res.ok) {
        setBulkResult(data);
        showToast(`Successfully enrolled ${data.importedCount} student(s)!`, "success");
        triggerRefresh();
      } else {
        showToast(data.error || "Bulk import failed", "error");
      }
    } catch {
      showToast("Network error uploading bulk student roster", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const fetchStudents = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (filterDepartment !== "ALL") params.append("department", filterDepartment);
    if (searchQuery) params.append("search", searchQuery);
    params.append("page", String(page));
    params.append("limit", String(limit));

    fetch(`/api/students?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load students:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    setPage(1);
  }, [filterDepartment, searchQuery]);

  useEffect(() => {
    fetchStudents();
  }, [filterDepartment, searchQuery, page, refreshTrigger]);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (res.ok) {
        showToast("Student enrolled and registered into SIS", "success");
        setIsEnrollModalOpen(false);
        setFormData({ firstName: "", lastName: "", email: "", departmentCode: "CSE", semester: "1" });
        triggerRefresh();
      } else {
        showToast(result.error || "Enrollment failed", "danger");
      }
    } catch {
      showToast("Error enrolling student", "danger");
    }
  };

  const handleDelete = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from the database?`)) return;
    try {
      const res = await fetch(`/api/students?id=${studentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(`Student record for ${studentName} removed`, "success");
        triggerRefresh();
      } else {
        showToast("Failed to delete student record", "danger");
      }
    } catch {
      showToast("Error deleting student", "danger");
    }
  };

  const handleExportCSV = () => {
    let csv = "ID,Name,Roll Number,Email,Department,Semester,CGPA,Attendance (%),Status\n";
    students.forEach((s) => {
      csv += `"${s.id}","${s.name}","${s.rollNo}","${s.email}","${s.department}","${s.semester}","${s.cgpa}","${s.attendance}%","${s.status}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SIS_Student_Cohort_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported SIS cohort data to CSV", "success");
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                Student Information System (SIS)
              </h1>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Comprehensive 360° student records, GPA progression, fee status, and attendance telemetry
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4 text-charcoal-600 dark:text-charcoal-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                setBulkResult(null);
                setCsvText("");
                setIsBulkModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
            >
              <Upload className="h-4 w-4 text-rose-primary dark:text-rose-accent" />
              <span>Bulk Import (CSV)</span>
            </button>
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Enroll Student</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-[#1E191C] p-4 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-charcoal-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by student name, roll number or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-900/40 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-accent"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400">Department:</span>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="text-xs bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl px-3 py-2 text-charcoal-800 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-accent cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="CSE">Computer Science (CSE)</option>
              <option value="BIO">Biotechnology (BIO)</option>
            </select>
          </div>
        </div>

        {/* Student Data Table */}
        {isLoading ? (
          <SkeletonTable rows={5} />
        ) : students.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No students found"
            description="No student records match your current filter criteria or search query."
            actionLabel="Enroll First Student"
            onAction={() => setIsEnrollModalOpen(true)}
          />
        ) : (
          <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden">
            {/* Mobile Responsive Cards (Phone Viewports < md) */}
            <div className="md:hidden divide-y divide-border/60 dark:divide-charcoal-800">
              {students.map((student) => (
                <div key={student.id} className="p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center font-bold text-xs shrink-0">
                        {student.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 block truncate">{student.name}</span>
                        <span className="text-[11px] font-mono text-charcoal-500 block truncate">{student.rollNo} • {student.departmentName}</span>
                      </div>
                    </div>
                    <span
                      className={`font-bold inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] shrink-0 ${
                        student.attendance >= 75
                          ? "bg-academic-success-subtle text-academic-success border border-green-300 dark:border-green-800"
                          : "bg-academic-danger-subtle text-academic-danger border border-rose-300 dark:border-rose-800"
                      }`}
                    >
                      {student.attendance < 75 && <AlertTriangle className="h-3 w-3" />}
                      {Number(student.attendance).toFixed(1)}% Att
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-surface-soft dark:bg-charcoal-900/60 p-2.5 rounded-xl border border-border/50 dark:border-charcoal-700">
                    <div>
                      <span className="text-[10px] text-charcoal-500 block uppercase">Semester</span>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5 block">{student.semester}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-charcoal-500 block uppercase">CGPA</span>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5 block">{Number(student.cgpa).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-charcoal-500 block uppercase">Fee Status</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                        student.feeStatus === "PAID"
                          ? "bg-academic-success-subtle text-academic-success"
                          : "bg-academic-warning-subtle text-academic-warning"
                      }`}>
                        {student.feeStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      student.status === "DEFAULTER_ALERT"
                        ? "bg-academic-danger-subtle text-academic-danger border border-red-200"
                        : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300"
                    }`}>
                      {student.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/students/profile?id=${student.id}`}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-ivory-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-ivory-200 text-xs font-bold flex items-center gap-1 hover:bg-rose-container"
                      >
                        <span>Profile</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(student.id, student.name)}
                        aria-label="Delete Student"
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1.5 rounded-xl text-charcoal-400 hover:text-academic-danger hover:bg-rose-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Full Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-100 dark:bg-charcoal-900 border-b border-border dark:border-charcoal-800 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Roll Number</th>
                    <th className="p-4">Department & Program</th>
                    <th className="p-4">Semester</th>
                    <th className="p-4 text-center">CGPA</th>
                    <th className="p-4 text-center">Attendance</th>
                    <th className="p-4 text-center">Fee Ledger</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-900 dark:text-ivory-100">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-900/40 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center font-bold text-xs shrink-0">
                            {student.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .substring(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold block">{student.name}</span>
                            <span className="text-[11px] text-charcoal-500 dark:text-charcoal-400">
                              {student.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold font-mono text-charcoal-800 dark:text-ivory-200">
                        {student.rollNo}
                      </td>
                      <td className="p-4">
                        <span className="font-medium block">{student.program}</span>
                        <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400">
                          {student.departmentName}
                        </span>
                      </td>
                      <td className="p-4 text-charcoal-600 dark:text-charcoal-300 font-medium">
                        {student.semester}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold px-2 py-0.5 rounded bg-surface-soft dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                          {Number(student.cgpa).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`font-bold inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] ${
                            student.attendance >= 75
                              ? "bg-academic-success-subtle text-academic-success border border-green-300 dark:border-green-800"
                              : "bg-academic-danger-subtle text-academic-danger border border-rose-300 dark:border-rose-800"
                          }`}
                        >
                          {student.attendance < 75 && <AlertTriangle className="h-3 w-3" />}
                          {Number(student.attendance).toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            student.feeStatus === "PAID"
                              ? "bg-academic-success-subtle text-academic-success"
                              : "bg-academic-warning-subtle text-academic-warning"
                          }`}
                        >
                          {student.feeStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            student.status === "DEFAULTER_ALERT"
                              ? "bg-academic-danger-subtle text-academic-danger border border-red-200"
                              : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/students/profile?id=${student.id}`}
                            className="p-1.5 rounded-lg text-charcoal-600 dark:text-charcoal-400 hover:text-rose-primary dark:hover:text-rose-accent hover:bg-ivory-100 dark:hover:bg-charcoal-800 transition-colors"
                            title="View 360 Profile"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(student.id, student.name)}
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-academic-danger hover:bg-rose-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalCount={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* Enroll Student Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Enroll New Student (SIS Admission)"
        description="Creates user profile and matriculates student in the institutional registry."
      >
        <form onSubmit={handleEnroll} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                placeholder="e.g. Liam"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                placeholder="e.g. Vance"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. liam.vance@apex.edu"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Department
              </label>
              <select
                value={formData.departmentCode}
                onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="CSE">Computer Science (CSE)</option>
                <option value="BIO">Biotechnology (BIO)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="1">Semester I</option>
                <option value="3">Semester III</option>
                <option value="5">Semester V</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsEnrollModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm"
            >
              Enroll Student
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk CSV Import Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Registrar Bulk Student Onboarding"
        description="Upload a CSV spreadsheet or paste formatted student rows to enroll hundreds of scholars simultaneously."
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-700">
            <div>
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                Standard Import Template
              </span>
              <span className="text-[11px] text-charcoal-500">
                Headers: firstName, lastName, email, phone, rollNumber, admissionNumber
              </span>
            </div>
            <a
              href="/api/students/bulk-import?template=true"
              download="students-bulk-template.csv"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-charcoal-800 text-rose-primary dark:text-rose-accent border border-border dark:border-charcoal-700 hover:bg-rose-subtle transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Sample CSV</span>
            </a>
          </div>

          <form onSubmit={handleBulkImportSubmit} className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                  CSV Roster Data:
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  id="csv-file-input"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setCsvText(evt.target?.result as string || "");
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
                <label
                  htmlFor="csv-file-input"
                  className="text-[11px] font-bold text-rose-primary dark:text-rose-accent cursor-pointer hover:underline"
                >
                  Choose .csv file
                </label>
              </div>
              <textarea
                rows={7}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="firstName,lastName,email,phone,rollNumber,admissionNumber&#10;Aarav,Sharma,aarav.sharma@apex.edu,+1-555-0101,2026CSE001,ADM-2026-001&#10;Diya,Patel,diya.patel@apex.edu,+1-555-0102,2026CSE002,ADM-2026-002"
                className="w-full text-xs font-mono p-3 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 outline-none focus:ring-1 focus:ring-rose-accent"
              />
            </div>

            {bulkResult && (
              <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs">
                <div className="flex items-center gap-2 font-bold text-academic-success mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Enrolled: {bulkResult.importedCount} Student(s)</span>
                  {bulkResult.failedCount > 0 && (
                    <span className="text-academic-danger font-normal">
                      • Skipped/Failed: {bulkResult.failedCount}
                    </span>
                  )}
                </div>
                {bulkResult.errors?.length > 0 && (
                  <div className="mt-2 text-[11px] text-academic-danger space-y-0.5 max-h-24 overflow-y-auto font-mono">
                    {bulkResult.errors.map((err: any, idx: number) => (
                      <div key={idx}>Row {err.rowNumber} ({err.email || "N/A"}): {err.reason}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-charcoal-800">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isImporting || !csvText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{isImporting ? "Processing Roster..." : "Execute Bulk Import"}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </AppShell>
  );
}
