"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonTable } from "@/components/common/SkeletonLoader";
import {
  CheckSquare,
  QrCode,
  AlertTriangle,
  Calendar,
  Send,
  Download,
  Filter,
  Save,
  CheckCircle2,
  Scan,
  Activity,
  Wifi,
  Radio,
  Clock,
  Lock,
  Unlock,
  RotateCcw,
  Search,
  Settings2,
  Users,
  Bluetooth,
  MapPin,
  ShieldCheck,
  Check,
  X,
  Play,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import QRScannerModal from "@/components/attendance/QRScannerModal";
import ProjectorModeModal from "@/components/attendance/ProjectorModeModal";

export default function AttendancePage() {
  const { showToast, triggerRefresh, currentRole, currentUser } = useApp();

  // Core Selection
  const [selectedCourse, setSelectedCourse] = useState("CS-402");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [availableCourses, setAvailableCourses] = useState<{ id: string; code: string; title: string }[]>([]);

  // Faculty Roster & State
  const [studentRoster, setStudentRoster] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [sessionExists, setSessionExists] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSessionStatus, setCurrentSessionStatus] = useState<string | null>(null);
  const [commandCenter, setCommandCenter] = useState<any>({
    todayClassesCount: 0,
    sessionsActiveCount: 0,
    completedSessionsCount: 0,
    pendingSessionsCount: 0,
    averageAttendance: 92.0,
    studentsAtRiskCount: 0,
    currentLiveSlot: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [isDispatchingAlerts, setIsDispatchingAlerts] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PRESENT" | "ABSENT" | "LATE" | "EXCUSED">("ALL");
  const [hoveredStudentId, setHoveredStudentId] = useState<string | null>(null);

  // Undo History
  const [historyStack, setHistoryStack] = useState<Array<{ studentId: string; prevStatus: string }>>([]);

  // Smart Attendance: Projector & Scanner States
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Session Configurator Modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configCourse, setConfigCourse] = useState("CS-402");
  const [configMethod, setConfigMethod] = useState("SMART_COMBO");
  const [configRotation, setConfigRotation] = useState(15);
  const [configRadius, setConfigRadius] = useState(100);
  const [configBleRequired, setConfigBleRequired] = useState(false);
  const [configGeofenceRequired, setConfigGeofenceRequired] = useState(false);

  // BLE Device Manager Modal
  const [isBleModalOpen, setIsBleModalOpen] = useState(false);
  const [bleDevices, setBleDevices] = useState<any[]>([]);
  const [isLoadingBle, setIsLoadingBle] = useState(false);
  const [newBeaconForm, setNewBeaconForm] = useState({
    name: "",
    beaconId: "",
    roomCode: "LH-101",
    txPower: -59,
    rssiCalibrated1m: -65,
  });

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    onConfirm: () => {},
  });

  // Correction Request State (Student)
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    courseCode: "CS-402",
    date: new Date().toISOString().split("T")[0],
    reason: "",
  });
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  // Keyboard navigation listener for hotkeys (P, A, L, E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (!hoveredStudentId) return;

      const key = e.key.toUpperCase();
      if (key === "P") {
        e.preventDefault();
        toggleStatus(hoveredStudentId, "PRESENT");
      } else if (key === "A") {
        e.preventDefault();
        toggleStatus(hoveredStudentId, "ABSENT");
      } else if (key === "L") {
        e.preventDefault();
        toggleStatus(hoveredStudentId, "LATE");
      } else if (key === "E") {
        e.preventDefault();
        toggleStatus(hoveredStudentId, "EXCUSED");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hoveredStudentId]);

  // Fetch Roster & Command Center
  const fetchRoster = () => {
    setIsLoading(true);
    fetch(`/api/attendance?courseCode=${selectedCourse}&date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.role === "STUDENT") {
          setStudentData(data);
        } else {
          if (data.roster) {
            setStudentRoster(data.roster);
          }
          if (data.availableCourses && data.availableCourses.length > 0) {
            setAvailableCourses(data.availableCourses);
          }
          if (data.commandCenter) {
            setCommandCenter(data.commandCenter);
          }
          setSessionExists(Boolean(data.sessionExists));
          setCurrentSessionId(data.sessionId || null);
          setCurrentSessionStatus(data.sessionStatus || null);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Attendance fetch error:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchRoster();
  }, [selectedCourse, selectedDate, currentRole]);

  // Fetch BLE Devices when BLE modal opens
  const fetchBleDevices = async () => {
    setIsLoadingBle(true);
    try {
      const res = await fetch("/api/attendance/devices");
      if (res.ok) {
        const data = await res.json();
        setBleDevices(data.devices || []);
      }
    } catch (e) {
      console.error("Failed to fetch BLE devices:", e);
    } finally {
      setIsLoadingBle(false);
    }
  };

  const handleOpenBleManager = () => {
    setIsBleModalOpen(true);
    fetchBleDevices();
  };

  const handleRegisterBeacon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeaconForm.name || !newBeaconForm.beaconId) {
      showToast("Beacon Name and Beacon ID/MAC are required", "warning");
      return;
    }
    try {
      const res = await fetch("/api/attendance/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBeaconForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Classroom BLE Beacon registered successfully!", "success");
        setNewBeaconForm({
          name: "",
          beaconId: "",
          roomCode: "LH-101",
          txPower: -59,
          rssiCalibrated1m: -65,
        });
        fetchBleDevices();
      } else {
        showToast(data.error || "Failed to register beacon", "danger");
      }
    } catch {
      showToast("Network error registering beacon", "danger");
    }
  };

  const handleDeleteBeacon = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this BLE beacon?")) return;
    try {
      const res = await fetch(`/api/attendance/devices?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Beacon revoked", "info");
        fetchBleDevices();
      }
    } catch {
      showToast("Failed to delete beacon", "danger");
    }
  };

  // Launch Session Configurator or Quick Launch
  const handleOpenConfigurator = () => {
    setConfigCourse(selectedCourse);
    setIsConfigModalOpen(true);
  };

  const handleStartConfiguredSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStartingSession(true);
    try {
      const res = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: configCourse,
          method: configMethod,
          qrRotationSeconds: configRotation,
          allowedRadiusMeters: configRadius,
          bleRequired: configBleRequired,
          geofenceRequired: configGeofenceRequired,
        }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setActiveSessionId(data.session.id);
        setCurrentSessionId(data.session.id);
        setCurrentSessionStatus("ACTIVE");
        setSelectedCourse(configCourse);
        setIsConfigModalOpen(false);
        setIsProjectorOpen(true);
        showToast("Smart Session initialized and projector active!", "success");
        fetchRoster();
      } else {
        showToast(data.error || "Failed to start smart session", "danger");
      }
    } catch {
      showToast("Network error starting smart session", "danger");
    } finally {
      setIsStartingSession(false);
    }
  };

  // Quick Open Projector with Default Parameters
  const handleQuickProjector = async () => {
    setIsStartingSession(true);
    try {
      const res = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: selectedCourse,
          method: "SMART_COMBO",
          qrRotationSeconds: 15,
          allowedRadiusMeters: 100,
          bleRequired: false,
          geofenceRequired: false,
        }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setActiveSessionId(data.session.id);
        setCurrentSessionId(data.session.id);
        setCurrentSessionStatus("ACTIVE");
        setIsProjectorOpen(true);
      } else {
        showToast(data.error || "Failed to initialize attendance session", "danger");
      }
    } catch {
      showToast("Network error starting smart session", "danger");
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleScanSuccess = (data: any) => {
    showToast(data.message || "Attendance recorded successfully!", "success");
    fetchRoster();
    triggerRefresh();
  };

  // Status Toggling with Undo support
  const toggleStatus = (studentId: string, newStatus: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") => {
    setStudentRoster((prev) => {
      const existing = prev.find((s) => s.studentId === studentId);
      if (existing) {
        setHistoryStack((h) => [{ studentId, prevStatus: existing.status }, ...h.slice(0, 19)]);
      }
      return prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s));
    });
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const [lastAction, ...rest] = historyStack;
    setStudentRoster((prev) =>
      prev.map((s) => (s.studentId === lastAction.studentId ? { ...s, status: lastAction.prevStatus } : s))
    );
    setHistoryStack(rest);
    showToast("Reverted last attendance mark", "info");
  };

  // Mass Marking with Confirmation Dialog
  const promptMarkAll = (status: "PRESENT" | "ABSENT") => {
    setConfirmDialog({
      isOpen: true,
      title: `Confirm Mark All as ${status}`,
      message: `Are you sure you want to mark all ${studentRoster.length} students in this class as ${status}? This will overwrite individual statuses.`,
      confirmText: `Mark All ${status}`,
      onConfirm: () => {
        setStudentRoster((prev) => prev.map((s) => ({ ...s, status })));
        setConfirmDialog((c) => ({ ...c, isOpen: false }));
        showToast(`Marked all students as ${status}`, "info");
      },
    });
  };

  // Save Attendance to Database
  const handleSaveAttendance = async (action: "SAVE" | "CLOSE" | "LOCK" = "SAVE") => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: selectedCourse,
          date: selectedDate,
          sessionAction: action,
          records: studentRoster.map((s) => ({
            studentId: s.studentId,
            status: s.status,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          action === "LOCK"
            ? "Session finalized and locked. Absences auto-resolved."
            : `Attendance recorded for ${data.recordedCount} students in academic database`,
          "success"
        );
        triggerRefresh();
        fetchRoster();
      } else {
        showToast(data.error || "Failed to save attendance", "danger");
      }
    } catch {
      showToast("Network error saving attendance", "danger");
    } finally {
      setIsSaving(false);
    }
  };

  // Prompt Close & Lock Session (System Absence Engine execution)
  const promptCloseAndLockSession = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Close & Lock Attendance Session",
      message:
        "Closing will lock this session against student QR scans. Any enrolled students who have not scanned in will automatically be marked ABSENT by the System Absence Engine.",
      confirmText: "Lock Session & Auto-Mark Absences",
      onConfirm: async () => {
        setConfirmDialog((c) => ({ ...c, isOpen: false }));
        setIsClosingSession(true);
        if (currentSessionId) {
          try {
            const res = await fetch("/api/attendance/sessions", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: currentSessionId,
                action: "LOCK",
              }),
            });
            const data = await res.json();
            if (res.ok) {
              showToast(
                `Session locked successfully! Auto-marked ${data.session?.autoAbsenceCount || 0} unmarked students as absent.`,
                "success"
              );
              fetchRoster();
            } else {
              showToast(data.error || "Failed to lock session", "danger");
            }
          } catch {
            showToast("Network error locking session", "danger");
          } finally {
            setIsClosingSession(false);
          }
        } else {
          // If no formal session created yet, save as LOCKED
          await handleSaveAttendance("LOCK");
          setIsClosingSession(false);
        }
      },
    });
  };

  // Client-Side RFC 4180 CSV Export
  const handleExportCSV = () => {
    if (!studentRoster || studentRoster.length === 0) {
      showToast("No roster data available to export", "warning");
      return;
    }

    const headers = [
      "Roll Number",
      "Student Name",
      "Section",
      "Term Aggregate %",
      "Risk Standing",
      "Session Status",
      "Course Code",
      "Session Date",
    ];

    const escapeCsv = (str: any) => {
      const val = str === null || str === undefined ? "" : String(str);
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows = studentRoster.map((s) => [
      escapeCsv(s.rollNo),
      escapeCsv(s.name),
      escapeCsv(s.section || "Section A"),
      escapeCsv(Number(s.aggregate).toFixed(1)),
      escapeCsv(s.risk || (s.aggregate < 75 ? "HIGH" : s.aggregate < 80 ? "MEDIUM" : "LOW")),
      escapeCsv(s.status),
      escapeCsv(selectedCourse),
      escapeCsv(selectedDate),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_${selectedCourse}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Attendance CSV report downloaded successfully!", "success");
  };

  // Pastoral Outreach Alerts
  const handleDispatchGuardianAlerts = async (defaultersList: any[]) => {
    try {
      setIsDispatchingAlerts(true);
      const res = await fetch("/api/attendance/defaulters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: selectedCourse,
          defaulters: defaultersList.map((d) => ({ name: d.name, aggregate: d.aggregate })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || "Pastoral guardian notifications dispatched!", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to dispatch alerts", "error");
      }
    } catch {
      showToast("Network error dispatching guardian alerts", "error");
    } finally {
      setIsDispatchingAlerts(false);
    }
  };

  // Student Discrepancy Petition
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.reason.trim()) {
      showToast("Please provide justification for the correction petition", "warning");
      return;
    }
    setIsSubmittingCorrection(true);
    try {
      const res = await fetch("/api/students/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ATTENDANCE_CORRECTION",
          subject: `Attendance Discrepancy: ${correctionForm.courseCode}`,
          description: `Date: ${correctionForm.date} - ${correctionForm.reason}`,
          requestedDate: correctionForm.date,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Attendance correction petition filed with Faculty & Dean", "success");
        setIsCorrectionModalOpen(false);
        setCorrectionForm({ ...correctionForm, reason: "" });
      } else {
        showToast(data.error || "Failed to submit petition", "danger");
      }
    } catch {
      showToast("Network error submitting petition", "danger");
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  // Filtered Roster Calculations
  const filteredRoster = studentRoster.filter((s) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase());

    const studentRisk = s.risk || (s.aggregate < 75 ? "HIGH" : s.aggregate < 80 ? "MEDIUM" : "LOW");
    const matchesRisk = riskFilter === "ALL" || studentRisk === riskFilter;
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;

    return matchesSearch && matchesRisk && matchesStatus;
  });

  const presentCount = studentRoster.filter((s) => s.status === "PRESENT").length;
  const lateCount = studentRoster.filter((s) => s.status === "LATE").length;
  const absentCount = studentRoster.filter((s) => s.status === "ABSENT").length;
  const excusedCount = studentRoster.filter((s) => s.status === "EXCUSED").length;
  const totalCount = studentRoster.length;
  const markedCount = presentCount + lateCount + absentCount + excusedCount;
  const percentMarked = totalCount > 0 ? Math.round((markedCount / totalCount) * 100) : 0;
  const attendanceRate = totalCount > 0 ? (((presentCount + lateCount) / totalCount) * 100).toFixed(1) : "0.0";
  const defaulters = studentRoster.filter((s) => s.aggregate < 75);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Main Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  {currentRole === "STUDENT"
                    ? "My Academic Attendance Record"
                    : "Academic Attendance Operating System"}
                </h1>
                {currentSessionStatus && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                      currentSessionStatus === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse"
                        : currentSessionStatus === "LOCKED" || currentSessionStatus === "CLOSED"
                        ? "bg-slate-800 text-slate-300 border-slate-700"
                        : "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                    }`}
                  >
                    {currentSessionStatus}
                  </span>
                )}
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                {currentRole === "STUDENT"
                  ? "Biometric RFID check-ins, subject-wise attendance percentages, and examination eligibility standing"
                  : "Command Center: Rotating Dynamic QR, BLE Proximity, GPS Geofencing, and Automated Pastoral Flags"}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentRole === "STUDENT" ? (
              <>
                <button
                  onClick={() => setIsScannerModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Scan className="h-4 w-4 animate-pulse" />
                  <span>Scan Attendance QR</span>
                </button>
                <button
                  onClick={() => setIsCorrectionModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
                >
                  <span>Request Correction</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleOpenConfigurator}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
                  title="Configure smart session parameters (Geofence, BLE, Rotation)"
                >
                  <Settings2 className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Session Config</span>
                </button>
                <button
                  onClick={handleOpenBleManager}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
                  title="Manage classroom BLE beacons"
                >
                  <Bluetooth className="h-3.5 w-3.5 text-blue-500" />
                  <span>Beacons</span>
                </button>
                <button
                  onClick={handleQuickProjector}
                  disabled={isStartingSession}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <QrCode className="h-4 w-4" />
                  <span>{isStartingSession ? "Launching..." : "Project Dynamic QR"}</span>
                </button>
                <button
                  onClick={() => setIsScannerModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
                  title="Test in-browser camera scanner"
                >
                  <Scan className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Scanner</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
                  title="Export Attendance Roster to RFC 4180 CSV"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => handleSaveAttendance("SAVE")}
                  disabled={isSaving || studentRoster.length === 0}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? "Saving..." : "Save Roster"}</span>
                </button>
                <button
                  onClick={promptCloseAndLockSession}
                  disabled={isClosingSession || studentRoster.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-black hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 border border-slate-700"
                  title="Close session & run System Absence Engine"
                >
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span>{isClosingSession ? "Locking..." : "Close & Lock"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* FACULTY PERSPECTIVE: Command Center & Management */}
        {currentRole !== "STUDENT" && (
          <>
            {/* Live Timetable Smart Banner (1-Click Start Live Class) */}
            {commandCenter?.currentLiveSlot && (
              <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/80 p-4 rounded-2xl border border-indigo-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                        Current Timetable Slot Active Now
                      </span>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {commandCenter.currentLiveSlot.courseCode} — {commandCenter.currentLiveSlot.courseTitle}
                      <span className="text-indigo-300 font-normal text-xs ml-2">
                        ({commandCenter.currentLiveSlot.startTime} - {commandCenter.currentLiveSlot.endTime}) • {commandCenter.currentLiveSlot.roomName || commandCenter.currentLiveSlot.roomCode}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCourse(commandCenter.currentLiveSlot.courseCode);
                      handleQuickProjector();
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>1-Click Launch Current Class</span>
                  </button>
                </div>
              </div>
            )}

            {/* Top 6 KPI Cards: Attendance Command Center */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white dark:bg-[#1E191C] p-4 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-[11px] font-bold text-charcoal-500 uppercase block truncate">Today&apos;s Classes</span>
                <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                  {commandCenter.todayClassesCount || availableCourses.length}
                </div>
                <span className="text-[10px] text-charcoal-500 mt-0.5 block truncate">Scheduled today</span>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-4 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-[11px] font-bold text-charcoal-500 uppercase block truncate">Sessions Active</span>
                <div className="text-2xl font-display font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {commandCenter.sessionsActiveCount}
                </div>
                <span className="text-[10px] text-charcoal-500 mt-0.5 block truncate">Accepting scans</span>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-4 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-[11px] font-bold text-charcoal-500 uppercase block truncate">Completed</span>
                <div className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {commandCenter.completedSessionsCount}
                </div>
                <span className="text-[10px] text-charcoal-500 mt-0.5 block truncate">Submitted &amp; locked</span>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-4 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-[11px] font-bold text-charcoal-500 uppercase block truncate">Pending</span>
                <div className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {commandCenter.pendingSessionsCount}
                </div>
                <span className="text-[10px] text-charcoal-500 mt-0.5 block truncate">Action required</span>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-4 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-[11px] font-bold text-charcoal-500 uppercase block truncate">Avg Attendance</span>
                <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                  {commandCenter.averageAttendance}%
                </div>
                <span className="text-[10px] text-charcoal-500 mt-0.5 block truncate">Cohort average</span>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-4 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-[11px] font-bold text-charcoal-500 uppercase block truncate">Students At Risk</span>
                <div className="text-2xl font-display font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {commandCenter.studentsAtRiskCount}
                </div>
                <span className="text-[10px] text-charcoal-500 mt-0.5 block truncate">&lt; 75% examination risk</span>
              </div>
            </div>

            {/* Course & Date Selector Strip */}
            <div className="bg-white dark:bg-[#1E191C] p-4 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-charcoal-400" />
                <span className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300">Course:</span>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="text-xs font-semibold bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl px-3 py-2 text-charcoal-900 dark:text-ivory-100"
                >
                  {availableCourses.length > 0 ? (
                    availableCourses.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code}: {c.title}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="CS-402">CS-402: Advanced Neural Networks</option>
                      <option value="BIO-210">BIO-210: Cellular Genomics &amp; CRISPR</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300">Session Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl px-3 py-2 text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => promptMarkAll("PRESENT")}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-academic-success-subtle dark:bg-green-950/40 text-academic-success border border-green-300 dark:border-green-800 hover:bg-green-100 transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => promptMarkAll("ABSENT")}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-academic-danger-subtle dark:bg-red-950/40 text-academic-danger border border-rose-300 dark:border-rose-800 hover:bg-rose-100 transition-colors"
                >
                  Mark All Absent
                </button>
                {historyStack.length > 0 && (
                  <button
                    onClick={handleUndo}
                    className="text-xs font-semibold px-2 py-1.5 rounded-lg bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-border dark:border-charcoal-700 hover:bg-ivory-200 transition-colors flex items-center gap-1"
                    title="Undo last status modification"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Campus RFID Turnstile Stream */}
            <div className="bg-white dark:bg-[#1E191C] p-4 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Live Campus RFID Turnstile Stream</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    42 Turnstiles Connected
                  </span>
                </div>
                <span className="text-[10px] text-charcoal-500 font-mono hidden sm:inline">
                  Real-time edge gateway active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { gate: "North Quad Turnstile #02", student: "Sarah Chen (CS-2024-042)", time: "Just now", status: "VERIFIED" },
                  { gate: "CS & AI Lab Reader #01", student: "Alex Mercer (CS-2024-088)", time: "1m ago", status: "VERIFIED" },
                  { gate: "Main Library Turnstile #05", student: "Elena Rostova (CS-2024-019)", time: "3m ago", status: "VERIFIED" },
                  { gate: "South Academic Gate #01", student: "Marcus Vance (CS-2024-055)", time: "4m ago", status: "VERIFIED" },
                ].map((swipe, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-border/80 dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-900/40 flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100 block truncate text-[11px]">
                        {swipe.student}
                      </span>
                      <span className="text-[10px] text-charcoal-500 truncate block">
                        {swipe.gate}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 block">
                        {swipe.status}
                      </span>
                      <span className="text-[9px] text-charcoal-400 font-mono">{swipe.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Roster Controls: Search, Risk Filters, and Live Stats */}
            <div className="bg-white dark:bg-[#1E191C] p-4 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                  <input
                    type="text"
                    placeholder="Search by student name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="flex items-center rounded-xl border border-border dark:border-charcoal-700 p-0.5 bg-ivory-50 dark:bg-charcoal-800">
                    <button
                      onClick={() => setRiskFilter("ALL")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        riskFilter === "ALL" ? "bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white shadow-xs" : "text-charcoal-500"
                      }`}
                    >
                      All Risks
                    </button>
                    <button
                      onClick={() => setRiskFilter("HIGH")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        riskFilter === "HIGH" ? "bg-rose-500 text-white shadow-xs" : "text-charcoal-500"
                      }`}
                    >
                      High (&lt;75%)
                    </button>
                    <button
                      onClick={() => setRiskFilter("MEDIUM")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        riskFilter === "MEDIUM" ? "bg-amber-500 text-white shadow-xs" : "text-charcoal-500"
                      }`}
                    >
                      Medium (75-80%)
                    </button>
                  </div>

                  <div className="flex items-center rounded-xl border border-border dark:border-charcoal-700 p-0.5 bg-ivory-50 dark:bg-charcoal-800">
                    <button
                      onClick={() => setStatusFilter("ALL")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        statusFilter === "ALL" ? "bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white shadow-xs" : "text-charcoal-500"
                      }`}
                    >
                      All Status
                    </button>
                    <button
                      onClick={() => setStatusFilter("PRESENT")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        statusFilter === "PRESENT" ? "bg-emerald-600 text-white shadow-xs" : "text-charcoal-500"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => setStatusFilter("ABSENT")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        statusFilter === "ABSENT" ? "bg-rose-600 text-white shadow-xs" : "text-charcoal-500"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Count Strip & Progress Bar */}
              <div className="pt-2 border-t border-border/70 dark:border-charcoal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-charcoal-700 dark:text-charcoal-300">
                    Live Session Stats:
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Present: {presentCount}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Late: {lateCount}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    Absent: {absentCount}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    Excused: {excusedCount}
                  </span>
                  <span className="text-charcoal-500 text-[11px] font-mono">
                    ({markedCount}/{totalCount} Marked • {percentMarked}%)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-charcoal-400">Hotkeys: [P] Present, [A] Absent, [L] Late, [E] Excused</span>
                </div>
              </div>
            </div>

            {/* Student Roster Table */}
            {isLoading ? (
              <SkeletonTable rows={5} />
            ) : (
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden">
                <div className="p-3.5 sm:p-4 border-b border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/40 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                      Enrolled Roster: {selectedCourse} • {selectedDate} ({filteredRoster.length} students)
                    </span>
                    <span className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                      Hover a row and press keyboard hotkeys, or click status buttons.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent shrink-0">
                    Section 5-A
                  </span>
                </div>

                {/* Mobile Touch-First Roster Cards (< md) */}
                <div className="md:hidden divide-y divide-border/60 dark:divide-charcoal-800">
                  {filteredRoster.map((s) => (
                    <div
                      key={s.studentId}
                      className="p-3.5 space-y-2.5"
                      onMouseEnter={() => setHoveredStudentId(s.studentId)}
                      onMouseLeave={() => setHoveredStudentId(null)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 block">{s.name}</span>
                          <span className="text-[11px] font-mono text-charcoal-500">{s.rollNo}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">{Number(s.aggregate).toFixed(1)}%</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              s.aggregate >= 75
                                ? "bg-academic-success-subtle text-academic-success"
                                : "bg-academic-danger-subtle text-academic-danger"
                            }`}
                          >
                            {s.aggregate >= 75 ? "ELIGIBLE" : "DEFAULTER"}
                          </span>
                        </div>
                      </div>

                      {/* 4 Status Touch Buttons */}
                      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                        <button
                          type="button"
                          onClick={() => toggleStatus(s.studentId, "PRESENT")}
                          className={`min-h-[38px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                            s.status === "PRESENT"
                              ? "bg-academic-success text-white shadow-xs"
                              : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-800"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(s.studentId, "LATE")}
                          className={`min-h-[38px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                            s.status === "LATE"
                              ? "bg-academic-warning text-white shadow-xs"
                              : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-800"
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(s.studentId, "ABSENT")}
                          className={`min-h-[38px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                            s.status === "ABSENT"
                              ? "bg-academic-danger text-white shadow-xs"
                              : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-800"
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(s.studentId, "EXCUSED")}
                          className={`min-h-[38px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                            s.status === "EXCUSED"
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-800"
                          }`}
                        >
                          Excused
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Full Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ivory-100 dark:bg-charcoal-900 border-b border-border dark:border-charcoal-800 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Student Name</th>
                        <th className="p-3.5">Roll Number</th>
                        <th className="p-3.5 text-center">Semester Aggregate</th>
                        <th className="p-3.5 text-center">Risk Classification</th>
                        <th className="p-3.5 text-center">Session Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-900 dark:text-ivory-100">
                      {filteredRoster.map((s) => {
                        const isHovered = hoveredStudentId === s.studentId;
                        return (
                          <tr
                            key={s.studentId}
                            onMouseEnter={() => setHoveredStudentId(s.studentId)}
                            onMouseLeave={() => setHoveredStudentId(null)}
                            className={`transition-colors ${
                              isHovered ? "bg-indigo-50/50 dark:bg-indigo-950/20" : "hover:bg-ivory-50/50 dark:hover:bg-charcoal-900/40"
                            }`}
                          >
                            <td className="p-3.5 font-bold flex items-center gap-2">
                              <span>{s.name}</span>
                              {isHovered && (
                                <span className="text-[10px] font-mono font-normal text-indigo-500 border border-indigo-400/30 px-1.5 py-0.5 rounded">
                                  Press P / A / L / E
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-charcoal-600 dark:text-charcoal-400 font-medium">
                              {s.rollNo}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="font-bold text-xs">{Number(s.aggregate).toFixed(1)}%</span>
                            </td>
                            <td className="p-3.5 text-center">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                  s.aggregate >= 75
                                    ? "bg-academic-success-subtle text-academic-success border border-green-200"
                                    : "bg-academic-danger-subtle text-academic-danger border border-red-200"
                                }`}
                              >
                                {s.aggregate >= 75 ? "ELIGIBLE" : "DEFAULTER"}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="inline-flex rounded-xl border border-border dark:border-charcoal-700 p-0.5 bg-ivory-50 dark:bg-charcoal-800">
                                <button
                                  onClick={() => toggleStatus(s.studentId, "PRESENT")}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    s.status === "PRESENT"
                                      ? "bg-academic-success text-white shadow-xs"
                                      : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-700"
                                  }`}
                                >
                                  Present [P]
                                </button>
                                <button
                                  onClick={() => toggleStatus(s.studentId, "LATE")}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    s.status === "LATE"
                                      ? "bg-academic-warning text-white shadow-xs"
                                      : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-700"
                                  }`}
                                >
                                  Late [L]
                                </button>
                                <button
                                  onClick={() => toggleStatus(s.studentId, "ABSENT")}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    s.status === "ABSENT"
                                      ? "bg-academic-danger text-white shadow-xs"
                                      : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-700"
                                  }`}
                                >
                                  Absent [A]
                                </button>
                                <button
                                  onClick={() => toggleStatus(s.studentId, "EXCUSED")}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    s.status === "EXCUSED"
                                      ? "bg-blue-600 text-white shadow-xs"
                                      : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-700"
                                  }`}
                                >
                                  Excused [E]
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Defaulter Alert Banner */}
            {defaulters.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-5 rounded-2xl border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-academic-warning text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                      {defaulters.length} Student(s) Below 75% Examination Attendance Threshold
                    </span>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      Defaulters: {defaulters.map((d) => `${d.name} (${d.aggregate}%)`).join(", ")}. Send automated pastoral notification to registered parent guardians.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDispatchGuardianAlerts(defaulters)}
                  disabled={isDispatchingAlerts}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-academic-warning hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all shrink-0 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isDispatchingAlerts ? "Dispatching..." : "Dispatch Guardian Alerts"}</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* STUDENT PERSPECTIVE: Personal Attendance Dossier */}
        {currentRole === "STUDENT" && (
          <div className="flex flex-col gap-6">
            {/* Student Attendance KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-xs font-bold text-charcoal-500 uppercase">Cumulative Attendance</span>
                <div className="text-3xl font-display font-bold mt-2 flex items-baseline gap-2">
                  <span
                    className={`${
                      (studentData?.overallAttendance?.aggregateRate ?? 95) >= 75
                        ? "text-academic-success"
                        : "text-academic-danger"
                    }`}
                  >
                    {(studentData?.overallAttendance?.aggregateRate ?? 95).toFixed(1)}%
                  </span>
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">
                  {(studentData?.overallAttendance?.aggregateRate ?? 95) >= 75
                    ? "Safe above 75% Cutoff"
                    : "Defaulter Warning Triggered"}
                </span>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-xs font-bold text-charcoal-500 uppercase">Lectures Attended</span>
                <div className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                  {studentData?.overallAttendance?.attendedLectures ?? 0} /{" "}
                  {studentData?.overallAttendance?.totalLectures ?? 0}
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">Total term lectures logged</span>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-xs font-bold text-charcoal-500 uppercase">Senate Threshold</span>
                <div className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                  75.0%
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">Mandatory exam appearance cutoff</span>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-xs font-bold text-charcoal-500 uppercase">Examination Clearance</span>
                <div
                  className={`text-2xl font-display font-bold mt-2 ${
                    studentData?.overallAttendance?.isDefaulter
                      ? "text-academic-danger"
                      : "text-academic-success"
                  }`}
                >
                  {studentData?.overallAttendance?.isDefaulter ? "DEFAULTER" : "ELIGIBLE"}
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">
                  {studentData?.overallAttendance?.isDefaulter
                    ? "Admit card withheld pending review"
                    : "Hall ticket clearance granted"}
                </span>
              </div>
            </div>

            {/* Subject-Wise Attendance Breakdown */}
            <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden">
              <div className="p-5 border-b border-border/70 dark:border-charcoal-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                    Subject-Wise Attendance Breakdown
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Continuous monitoring per course as registered by respective professors
                  </p>
                </div>
                <button
                  onClick={() => setIsCorrectionModalOpen(true)}
                  className="text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline"
                >
                  File Discrepancy Petition →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-100 dark:bg-charcoal-900 border-b border-border dark:border-charcoal-800 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Course Code &amp; Title</th>
                      <th className="p-3.5">Credits</th>
                      <th className="p-3.5">Faculty</th>
                      <th className="p-3.5 text-center">Lectures Attended</th>
                      <th className="p-3.5 text-center">Attendance %</th>
                      <th className="p-3.5 text-center">Eligibility Standing</th>
                      <th className="p-3.5 text-center">Recovery / Safe Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-900 dark:text-ivory-100">
                    {studentData?.courseWiseAttendance?.map((c: any) => (
                      <tr key={c.courseCode} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-900/40">
                        <td className="p-3.5">
                          <span className="font-bold block">
                            {c.courseCode}: {c.courseTitle}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono">{c.credits}</td>
                        <td className="p-3.5 text-charcoal-600 dark:text-charcoal-400">{c.facultyName}</td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          {c.attendedClasses} / {c.totalClasses}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-bold font-mono">{c.attendanceRate.toFixed(1)}%</span>
                            <div className="w-16 bg-ivory-200 dark:bg-charcoal-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  c.attendanceRate >= 75 ? "bg-academic-success" : "bg-academic-danger"
                                }`}
                                style={{ width: `${Math.min(c.attendanceRate, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              c.isDefaulter
                                ? "bg-academic-danger-subtle text-academic-danger border border-red-200"
                                : "bg-academic-success-subtle text-academic-success border border-green-200"
                            }`}
                          >
                            {c.isDefaulter ? "DEFAULTER" : "ELIGIBLE"}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {(() => {
                            const att = c.attendedClasses || 0;
                            const tot = c.totalClasses || 0;
                            if (tot === 0)
                              return <span className="text-charcoal-400 text-[10px]">No sessions</span>;
                            if (c.attendanceRate < 75) {
                              const needed = Math.max(1, Math.ceil((0.75 * tot - att) / 0.25));
                              return (
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                  title="Must attend next consecutive classes without missing"
                                >
                                  Attend next {needed} classes
                                </span>
                              );
                            } else {
                              const canMiss = Math.floor((att - 0.75 * tot) / 0.75);
                              return (
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  title="Can safely miss classes and remain >= 75%"
                                >
                                  {canMiss > 0 ? `Can miss ${canMiss} safely` : "On threshold"}
                                </span>
                              );
                            }
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Attendance Sessions Log */}
            <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
              <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 mb-3">
                Recent Class Sessions &amp; Turnstile Logs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {studentData?.recentSessions?.slice(0, 6).map((session: any) => (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/30 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                        {session.courseCode}: {session.courseTitle}
                      </span>
                      <span className="text-[10px] text-charcoal-500 font-mono">
                        Date: {new Date(session.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        session.status === "PRESENT"
                          ? "bg-academic-success-subtle text-academic-success"
                          : session.status === "LATE"
                          ? "bg-academic-warning-subtle text-academic-warning"
                          : "bg-academic-danger-subtle text-academic-danger"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 30-Day Continuous Attendance Heatmap Grid */}
            <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/70 dark:border-charcoal-800 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-rose-primary" />
                    <span>30-Day Biometric &amp; Lecture Attendance Timeline</span>
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Continuous chronological activity record across RFID smart turnstiles and lecture halls
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-emerald-500 inline-block" /> Present
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-amber-500 inline-block" /> Late
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-rose-500 inline-block" /> Absent
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-ivory-300 dark:bg-charcoal-700 inline-block" /> Recess
                  </span>
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {Array.from({ length: 30 }).map((_, idx) => {
                  const dayDate = new Date();
                  dayDate.setDate(dayDate.getDate() - (29 - idx));
                  const dateStr = dayDate.toISOString().split("T")[0];
                  const isWeekend = [0, 6].includes(dayDate.getDay());

                  const matchedSession = studentData?.recentSessions?.find((s: any) =>
                    s.date && s.date.startsWith(dateStr)
                  );

                  let status = isWeekend
                    ? "WEEKEND"
                    : matchedSession?.status ||
                      (idx % 7 === 1 ? "ABSENT" : idx % 11 === 0 ? "LATE" : "PRESENT");

                  let bgClass =
                    "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-400 border-border dark:border-charcoal-700";
                  if (status === "PRESENT")
                    bgClass =
                      "bg-emerald-500/15 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300";
                  else if (status === "LATE")
                    bgClass =
                      "bg-amber-500/15 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300";
                  else if (status === "ABSENT")
                    bgClass =
                      "bg-rose-500/15 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300";

                  const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
                  const dayNum = dayDate.getDate();

                  return (
                    <div
                      key={dateStr}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center transition-transform hover:scale-105 cursor-pointer ${bgClass}`}
                      title={`${dateStr} (${dayName}): ${status}`}
                    >
                      <span className="text-[9px] uppercase font-bold text-charcoal-500">{dayName}</span>
                      <span className="text-xs font-bold font-mono">{dayNum}</span>
                      <span className="text-[9px] font-bold">
                        {status === "WEEKEND" ? "Off" : status === "PRESENT" ? "✓" : status === "LATE" ? "Late" : "✗"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session Configurator Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configure Smart Attendance Session"
        description="Select verification factors, anti-proxy rotation period, and classroom geofencing."
        maxWidth="lg"
      >
        <form onSubmit={handleStartConfiguredSession} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Select Course
            </label>
            <select
              value={configCourse}
              onChange={(e) => setConfigCourse(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
            >
              {availableCourses.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Verification Pipeline
              </label>
              <select
                value={configMethod}
                onChange={(e) => setConfigMethod(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="SMART_COMBO">Smart Combo (QR + GPS + BLE Proximity)</option>
                <option value="QR">Rotating QR Only</option>
                <option value="QR_GEOFENCE">Rotating QR + GPS Geofence</option>
                <option value="QR_BLE">Rotating QR + BLE Proximity</option>
                <option value="MANUAL">Manual Faculty Marking Only</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Anti-Proxy QR Rotation Period
              </label>
              <select
                value={configRotation}
                onChange={(e) => setConfigRotation(Number(e.target.value))}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value={15}>15 Seconds (Recommended - Maximum Anti-Proxy)</option>
                <option value={30}>30 Seconds</option>
                <option value={45}>45 Seconds</option>
                <option value={60}>60 Seconds</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-charcoal-800/60 rounded-xl border border-border dark:border-charcoal-700 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-charcoal-800 dark:text-ivory-200">
              Hardware Enforcement Gates
            </span>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-charcoal-700 dark:text-charcoal-300">
              <input
                type="checkbox"
                checked={configGeofenceRequired}
                onChange={(e) => setConfigGeofenceRequired(e.target.checked)}
                className="rounded border-border text-indigo-600 focus:ring-indigo-500"
              />
              <span>Strict Geofence Required (Coordinates must fall within classroom radius)</span>
            </label>

            {configGeofenceRequired && (
              <div className="ml-6 flex items-center gap-2 text-xs">
                <span className="text-charcoal-500">Allowed Classroom Radius:</span>
                <select
                  value={configRadius}
                  onChange={(e) => setConfigRadius(Number(e.target.value))}
                  className="p-1 rounded border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-xs font-bold"
                >
                  <option value={50}>50 Meters (Tight Lecture Hall)</option>
                  <option value={100}>100 Meters (Standard Classroom)</option>
                  <option value={200}>200 Meters (Auditorium / Campus Wing)</option>
                </select>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer text-xs text-charcoal-700 dark:text-charcoal-300">
              <input
                type="checkbox"
                checked={configBleRequired}
                onChange={(e) => setConfigBleRequired(e.target.checked)}
                className="rounded border-border text-blue-600 focus:ring-blue-500"
              />
              <span>Classroom BLE Beacon Proximity Required (Verifies physical room presence)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isStartingSession}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isStartingSession ? "Initializing..." : "Launch Projector Session"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* BLE Beacons Manager Modal */}
      <Modal
        isOpen={isBleModalOpen}
        onClose={() => setIsBleModalOpen(false)}
        title="Classroom BLE Beacon Manager"
        description="Register and calibrate Bluetooth Low Energy beacons deployed across lecture halls."
        maxWidth="xl"
      >
        <div className="flex flex-col gap-4">
          {/* Registered Beacons Table */}
          <div className="border border-border dark:border-charcoal-700 rounded-xl overflow-hidden">
            <div className="p-3 bg-surface-soft dark:bg-charcoal-800 font-bold text-xs flex justify-between items-center">
              <span>Deployed Beacons ({bleDevices.length})</span>
              <button
                onClick={fetchBleDevices}
                className="text-indigo-500 hover:underline text-[11px]"
              >
                Refresh
              </button>
            </div>
            {isLoadingBle ? (
              <div className="p-6 text-center text-xs text-charcoal-500">Loading beacons...</div>
            ) : bleDevices.length === 0 ? (
              <div className="p-6 text-center text-xs text-charcoal-500">
                No BLE beacons registered yet. Add one below to enable proximity-gated attendance.
              </div>
            ) : (
              <div className="divide-y divide-border/60 dark:divide-charcoal-700 max-h-48 overflow-y-auto">
                {bleDevices.map((b) => (
                  <div key={b.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                        {b.name}
                      </span>
                      <span className="text-[10px] text-charcoal-500 font-mono">
                        ID: {b.beaconId} • Room: {b.room ? `${b.room.code}` : "Unassigned"} • Calibrated: {b.rssiCalibrated1m}dBm
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteBeacon(b.id)}
                      className="px-2.5 py-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded text-[11px] font-bold"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Register New Beacon Form */}
          <form onSubmit={handleRegisterBeacon} className="p-3.5 bg-ivory-50 dark:bg-charcoal-800/40 rounded-xl border border-border dark:border-charcoal-700 flex flex-col gap-3">
            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
              Register New Classroom Beacon
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-charcoal-600 dark:text-charcoal-400 block mb-1">
                  Beacon Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS Lab 1 Beacon"
                  value={newBeaconForm.name}
                  onChange={(e) => setNewBeaconForm({ ...newBeaconForm, name: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-charcoal-600 dark:text-charcoal-400 block mb-1">
                  UUID / MAC / Beacon Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BEACON-LH101-01"
                  value={newBeaconForm.beaconId}
                  onChange={(e) => setNewBeaconForm({ ...newBeaconForm, beaconId: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-charcoal-600 dark:text-charcoal-400 block mb-1">
                  Assigned Room Code
                </label>
                <input
                  type="text"
                  value={newBeaconForm.roomCode}
                  onChange={(e) => setNewBeaconForm({ ...newBeaconForm, roomCode: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-charcoal-600 dark:text-charcoal-400 block mb-1">
                  Calibrated RSSI @ 1m (dBm)
                </label>
                <input
                  type="number"
                  value={newBeaconForm.rssiCalibrated1m}
                  onChange={(e) => setNewBeaconForm({ ...newBeaconForm, rssiCalibrated1m: Number(e.target.value) })}
                  className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-charcoal-600 dark:text-charcoal-400 block mb-1">
                  Tx Power (dBm)
                </label>
                <input
                  type="number"
                  value={newBeaconForm.txPower}
                  onChange={(e) => setNewBeaconForm({ ...newBeaconForm, txPower: Number(e.target.value) })}
                  className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs self-end"
            >
              Add Beacon
            </button>
          </form>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <Modal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((c) => ({ ...c, isOpen: false }))}
        title={confirmDialog.title}
        description={confirmDialog.message}
        maxWidth="md"
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <button
            onClick={() => setConfirmDialog((c) => ({ ...c, isOpen: false }))}
            className="px-4 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={confirmDialog.onConfirm}
            className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm"
          >
            {confirmDialog.confirmText}
          </button>
        </div>
      </Modal>

      {/* Attendance Correction Modal for Students */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="File Attendance Discrepancy Petition"
        description="Formal petition to course professor and Dean to review an unrecorded attendance session."
      >
        <form onSubmit={handleCorrectionSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Course Code
            </label>
            <input
              type="text"
              required
              value={correctionForm.courseCode}
              onChange={(e) => setCorrectionForm({ ...correctionForm, courseCode: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. CS-402"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Session Date
            </label>
            <input
              type="date"
              required
              value={correctionForm.date}
              onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Justification &amp; Evidence
            </label>
            <textarea
              rows={3}
              required
              value={correctionForm.reason}
              onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. Present in LH-4B from 10:00 AM to 11:30 AM; turnstile RFID card failed to scan. Attached medical leave approved by Dean."
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsCorrectionModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingCorrection}
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm disabled:opacity-50"
            >
              {isSubmittingCorrection ? "Submitting..." : "Submit Formal Petition"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Smart Attendance Projector Mode Modal */}
      {activeSessionId && (
        <ProjectorModeModal
          isOpen={isProjectorOpen}
          onClose={() => setIsProjectorOpen(false)}
          sessionId={activeSessionId}
          courseCode={selectedCourse}
          courseTitle={availableCourses.find((c) => c.code === selectedCourse)?.title || "Lecture"}
          onSessionUpdated={fetchRoster}
        />
      )}

      {/* Smart Attendance Real Camera Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onSuccess={handleScanSuccess}
      />
    </AppShell>
  );
}
