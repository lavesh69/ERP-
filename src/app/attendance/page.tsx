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
  WifiOff,
  RefreshCw,
  ArrowUpDown,
  BookOpen,
  UserCheck,
  UserX,
  FileText,
  BadgeAlert,
} from "lucide-react";
import QRScannerModal from "@/components/attendance/QRScannerModal";
import ProjectorModeModal from "@/components/attendance/ProjectorModeModal";
import {
  calculateAttendancePercentage,
  isDefaulter,
  calculateClassesNeededToRecover,
  calculateSafeAbsencesAllowed,
  SENATE_EXAM_THRESHOLD,
} from "@/lib/attendance/calculator";

export default function AttendancePage() {
  const { showToast, triggerRefresh, currentRole, currentUser } = useApp();

  // Core Selection & Academic Context
  const [selectedCourse, setSelectedCourse] = useState("CS-402");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [programFilter, setProgramFilter] = useState("ALL");
  const [subjectTypeFilter, setSubjectTypeFilter] = useState("ALL");

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
    todayClasses: [],
    pendingCorrections: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [isDispatchingAlerts, setIsDispatchingAlerts] = useState(false);

  // Unsaved Changes & Offline Tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "DIRTY" | "SAVING" | "ERROR">("SAVED");
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [hasOfflineDraft, setHasOfflineDraft] = useState<boolean>(false);

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "UNMARKED">("ALL");
  const [sortBy, setSortBy] = useState<"ROLL_ASC" | "ROLL_DESC" | "NAME_ASC" | "ATT_ASC" | "ATT_DESC">("ROLL_ASC");
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
  const [configSection, setConfigSection] = useState("");
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

  // Calendar Day Details Modal (Student)
  const [studentSubjectTypeFilter, setStudentSubjectTypeFilter] = useState("ALL");
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<{
    date: string;
    dayName: string;
    status: string;
    courseCode?: string;
    courseTitle?: string;
    method?: string;
  } | null>(null);

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

  // Teacher Review Petition Modal
  const [reviewingPetition, setReviewingPetition] = useState<any | null>(null);
  const [petitionRemarks, setPetitionRemarks] = useState("");
  const [isResolvingPetition, setIsResolvingPetition] = useState(false);

  // Correction Request State (Student)
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    courseCode: "CS-402",
    date: new Date().toISOString().split("T")[0],
    reason: "",
  });
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  // Multi-Role Perspective Override
  const [activePerspective, setActivePerspective] = useState<string>("AUTO");

  // Governance & Telemetry Data
  const [governanceData, setGovernanceData] = useState<any>(null);

  // Missing Attendance Scanner Modal
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [missingData, setMissingData] = useState<any>(null);
  const [isLoadingMissing, setIsLoadingMissing] = useState(false);

  // Exceptions Center Modal
  const [isExceptionsModalOpen, setIsExceptionsModalOpen] = useState(false);
  const [exceptionsData, setExceptionsData] = useState<any[]>([]);
  const [isLoadingExceptions, setIsLoadingExceptions] = useState(false);
  const [exceptionFilter, setExceptionFilter] = useState("ALL");

  // Report Generator Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState("DAILY_SHEET");
  const [reportFormat, setReportFormat] = useState("CSV");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Attendance Policy Modal
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    minimumAttendancePercentage: 75.0,
    lateThresholdMinutes: 15,
    qrRotationSeconds: 15,
    allowedRadiusMeters: 100,
    requireBleForQr: false,
    requireGeofenceForQr: false,
  });
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // 1. Online / Offline Resilience Listeners
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        showToast("Network connection restored.", "success");
      };
      const handleOffline = () => {
        setIsOnline(false);
        showToast("Network dropped. Marks will be cached locally.", "warning");
      };
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Check for cached offline draft
      const draftKey = `classroom_attendance_draft_${selectedCourse}_${selectedDate}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        setHasOfflineDraft(true);
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [selectedCourse, selectedDate]);

  // 2. Unsaved Changes Guard: beforeunload listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved attendance marks. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 3. Keyboard navigation listener for hotkeys (P, A, L, E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    let url = `/api/attendance?courseCode=${selectedCourse}&date=${selectedDate}`;
    if (selectedSection) {
      url += `&sectionId=${selectedSection}`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.role === "STUDENT" || data.perspective === "STUDENT") {
          setStudentData(data);
        } else {
          if (data.roster) {
            let combinedRoster = [...data.roster];
            if (typeof window !== "undefined") {
              try {
                const customStudents = JSON.parse(localStorage.getItem("classroom_custom_students") || "[]");
                for (const cs of customStudents) {
                  const exists = combinedRoster.some(
                    (r: any) =>
                      r.studentId === cs.id ||
                      r.rollNo === cs.rollNo ||
                      (r.email && cs.email && r.email.toLowerCase() === cs.email.toLowerCase())
                  );
                  if (!exists) {
                    combinedRoster.push({
                      studentId: cs.id,
                      name: cs.name,
                      rollNo: cs.rollNo,
                      status: "PRESENT",
                      attendanceRate: cs.attendance || 100.0,
                      isDefaulter: false,
                      rfidStatus: "ACTIVE",
                      programName: cs.program || "Computer Science",
                      sectionName: "Section A",
                    });
                  }
                }
              } catch {
                // ignore
              }
            }
            setStudentRoster(combinedRoster);
          }
          if (data.availableCourses && data.availableCourses.length > 0) {
            setAvailableCourses(data.availableCourses);
            const currentC = data.availableCourses.find((c: any) => c.code === selectedCourse);
            if (currentC && currentC.sections?.length > 0) {
              if (!selectedSection || !currentC.sections.some((s: any) => s.id === selectedSection)) {
                setSelectedSection(currentC.sections[0].id);
              }
            }
          }
          if (data.commandCenter) {
            setCommandCenter(data.commandCenter);
          }
          if (data.governance) {
            setGovernanceData(data.governance);
          }
          setSessionExists(Boolean(data.sessionExists));
          setCurrentSessionId(data.sessionId || null);
          setCurrentSessionStatus(data.sessionStatus || null);
          setHasUnsavedChanges(false);
          setSaveStatus("SAVED");
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
  }, [selectedCourse, selectedSection, selectedDate, currentRole]);

  // Auto-sync selectedCourse when filters exclude current selection
  useEffect(() => {
    if (!availableCourses || availableCourses.length === 0) return;
    const filtered = availableCourses.filter((c) => {
      if (programFilter !== "ALL" && c.program?.code !== programFilter) return false;
      if (subjectTypeFilter !== "ALL") {
        if (subjectTypeFilter === "ELECTIVE" && !c.subjectType?.includes("ELECTIVE") && !c.isElective) return false;
        if (subjectTypeFilter === "LAB" && c.subjectType !== "LAB" && c.courseType !== "PRACTICAL") return false;
        if (subjectTypeFilter === "CORE" && c.subjectType !== "CORE") return false;
        if (subjectTypeFilter === "SEMINAR" && c.subjectType !== "SEMINAR" && c.subjectType !== "PROJECT") return false;
      }
      return true;
    });

    if (filtered.length > 0 && !filtered.some((c) => c.code === selectedCourse)) {
      setSelectedCourse(filtered[0].code);
      if (filtered[0].sections?.length > 0) {
        setSelectedSection(filtered[0].sections[0].id);
      }
    }
  }, [programFilter, subjectTypeFilter, availableCourses]);

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
    setConfigSection(selectedSection);
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
          sectionId: configSection || selectedSection,
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
        if (configSection) setSelectedSection(configSection);
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
    if (currentSessionId && currentSessionStatus === "ACTIVE") {
      setActiveSessionId(currentSessionId);
      setIsProjectorOpen(true);
      return;
    }

    setIsStartingSession(true);
    try {
      const res = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: selectedCourse,
          sectionId: selectedSection,
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

  // Open Missing Attendance Scanner
  const handleOpenMissingScanner = async () => {
    setIsLoadingMissing(true);
    setIsMissingModalOpen(true);
    try {
      const res = await fetch(`/api/attendance/missing?date=${selectedDate}`);
      const data = await res.json();
      setMissingData(data);
    } catch {
      showToast("Failed to scan missing lectures", "danger");
    } finally {
      setIsLoadingMissing(false);
    }
  };

  // Open Exception Telemetry Radar
  const handleOpenExceptions = async () => {
    setIsLoadingExceptions(true);
    setIsExceptionsModalOpen(true);
    try {
      const res = await fetch("/api/attendance/exceptions?limit=50");
      const data = await res.json();
      setExceptionsData(data.exceptions || []);
    } catch {
      showToast("Failed to load attendance exceptions", "danger");
    } finally {
      setIsLoadingExceptions(false);
    }
  };

  // Open Policy Editor
  const handleOpenPolicy = async () => {
    setIsPolicyModalOpen(true);
    try {
      const res = await fetch("/api/attendance/policy");
      const data = await res.json();
      if (data.policy) {
        setPolicyForm({
          minimumAttendancePercentage: data.policy.minimumAttendancePercentage || 75.0,
          lateThresholdMinutes: data.policy.lateThresholdMinutes || 15,
          qrRotationSeconds: data.policy.qrRotationSeconds || 15,
          allowedRadiusMeters: data.policy.allowedRadiusMeters || 100,
          requireBleForQr: Boolean(data.policy.requireBleForQr),
          requireGeofenceForQr: Boolean(data.policy.requireGeofenceForQr),
        });
      }
    } catch {
      showToast("Failed to load policy", "danger");
    }
  };

  // Save Policy
  const handleSavePolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicy(true);
    try {
      const res = await fetch("/api/attendance/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policyForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Attendance policy successfully persisted across institution", "success");
        setIsPolicyModalOpen(false);
      } else {
        showToast(data.error || "Failed to update policy", "danger");
      }
    } catch {
      showToast("Network error saving policy", "danger");
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // Download / Generate Report
  const handleTriggerReport = () => {
    setIsGeneratingReport(true);
    const downloadUrl = `/api/attendance/reports?type=${reportType}&format=${reportFormat}&date=${selectedDate}&courseId=${availableCourses.find((c) => c.code === selectedCourse)?.id || ""}&sectionId=${selectedSection}`;
    if (reportFormat === "CSV") {
      window.open(downloadUrl, "_blank");
      setIsGeneratingReport(false);
      setIsReportModalOpen(false);
      showToast("Report download initiated", "success");
    } else {
      fetch(downloadUrl)
        .then((res) => res.json())
        .then((data) => {
          showToast(`Report generated: ${data.totalSessions || data.totalDefaulters || data.totalConducted || 0} records`, "success");
          setIsGeneratingReport(false);
          setIsReportModalOpen(false);
        })
        .catch(() => {
          showToast("Failed to generate report", "danger");
          setIsGeneratingReport(false);
        });
    }
  };

  // Reset Unmarked Action
  const handleResetUnmarked = () => {
    setStudentRoster((prev) =>
      prev.map((s) => ({
        ...s,
        status: "PRESENT",
      }))
    );
    setHasUnsavedChanges(true);
    setSaveStatus("DIRTY");
    showToast("Roster reset to clean defaults", "info");
  };

  // Status Toggling with LocalStorage Offline Backup & Undo support
  const toggleStatus = (studentId: string, newStatus: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") => {
    // If session is locked or finalized, block editing
    if (currentSessionStatus === "LOCKED" || currentSessionStatus === "FINALIZED") {
      showToast(`Session is ${currentSessionStatus}. Modifying finalized records requires an approved petition.`, "warning");
      return;
    }

    setStudentRoster((prev) => {
      const existing = prev.find((s) => s.studentId === studentId);
      if (existing) {
        setHistoryStack((h) => [{ studentId, prevStatus: existing.status }, ...h.slice(0, 19)]);
      }
      const updated = prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s));

      // Backup draft in localStorage for offline resilience
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`classroom_attendance_draft_${selectedCourse}_${selectedDate}`, JSON.stringify(updated));
        } catch (e) {
          // ignore storage limit
        }
      }

      return updated;
    });

    setHasUnsavedChanges(true);
    setSaveStatus("DIRTY");
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const [lastAction, ...rest] = historyStack;
    setStudentRoster((prev) =>
      prev.map((s) => (s.studentId === lastAction.studentId ? { ...s, status: lastAction.prevStatus } : s))
    );
    setHistoryStack(rest);
    setHasUnsavedChanges(true);
    setSaveStatus("DIRTY");
    showToast("Reverted last attendance mark", "info");
  };

  // Restore cached offline draft
  const handleRestoreDraft = () => {
    if (typeof window !== "undefined") {
      const draftKey = `classroom_attendance_draft_${selectedCourse}_${selectedDate}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStudentRoster(parsed);
            setHasUnsavedChanges(true);
            setSaveStatus("DIRTY");
            setHasOfflineDraft(false);
            showToast("Offline draft marks restored. Click 'Save Roster' to sync.", "info");
          }
        } catch (e) {
          console.error("Draft parse error:", e);
        }
      }
    }
  };

  // Mass Marking with Confirmation Dialog
  const promptMarkAll = (status: "PRESENT" | "ABSENT") => {
    if (currentSessionStatus === "LOCKED" || currentSessionStatus === "FINALIZED") {
      showToast(`Session is ${currentSessionStatus}. Modifying finalized records is locked.`, "warning");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Confirm Mark All as ${status}`,
      message: `Are you sure you want to mark all ${studentRoster.length} students in this class as ${status}? This will overwrite individual statuses.`,
      confirmText: `Mark All ${status}`,
      onConfirm: () => {
        setStudentRoster((prev) => prev.map((s) => ({ ...s, status })));
        setHasUnsavedChanges(true);
        setSaveStatus("DIRTY");
        setConfirmDialog((c) => ({ ...c, isOpen: false }));
        showToast(`Marked all students as ${status}`, "info");
      },
    });
  };

  // Prevent Accidental Absence: Explicit Confirmation with dynamic student count (GAP-06)
  const promptMarkRemainingAbsent = () => {
    if (currentSessionStatus === "LOCKED" || currentSessionStatus === "FINALIZED") {
      showToast(`Session is ${currentSessionStatus}. Editing is locked.`, "warning");
      return;
    }

    const unmarked = studentRoster.filter(
      (s) => s.status !== "PRESENT" && s.status !== "LATE" && s.status !== "ABSENT" && s.status !== "EXCUSED"
    );
    const count = unmarked.length;

    if (count === 0) {
      showToast("All enrolled students have already been marked.", "info");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Confirm Mark Remaining as Absent",
      message: `You are about to mark ${count} currently unmarked student(s) as ABSENT. Please confirm this action.`,
      confirmText: `Mark ${count} Absent`,
      onConfirm: () => {
        setStudentRoster((prev) =>
          prev.map((s) => {
            if (s.status !== "PRESENT" && s.status !== "LATE" && s.status !== "ABSENT" && s.status !== "EXCUSED") {
              return { ...s, status: "ABSENT" };
            }
            return s;
          })
        );
        setHasUnsavedChanges(true);
        setSaveStatus("DIRTY");
        setConfirmDialog((c) => ({ ...c, isOpen: false }));
        showToast(`Marked ${count} unmarked students as Absent`, "info");
      },
    });
  };

  // Save Attendance to Database
  const handleSaveAttendance = async (action: "SAVE" | "CLOSE" | "FINALIZED" | "LOCK" = "SAVE") => {
    setIsSaving(true);
    setSaveStatus("SAVING");
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: selectedCourse,
          sectionId: selectedSection,
          date: selectedDate,
          sessionAction: action === "FINALIZED" ? "CLOSE" : action,
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
        setHasUnsavedChanges(false);
        setSaveStatus("SAVED");
        // Clear cached local draft
        if (typeof window !== "undefined") {
          localStorage.removeItem(`classroom_attendance_draft_${selectedCourse}_${selectedDate}`);
          setHasOfflineDraft(false);
        }
        triggerRefresh();
        fetchRoster();
      } else {
        setSaveStatus("ERROR");
        showToast(data.error || "Failed to save attendance", "danger");
      }
    } catch {
      setSaveStatus("ERROR");
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

  // Teacher Review Petition Action (Approve / Reject)
  const handleResolvePetition = async (status: "APPROVED" | "REJECTED") => {
    if (!reviewingPetition) return;
    setIsResolvingPetition(true);
    try {
      const res = await fetch("/api/students/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: reviewingPetition.id,
          status,
          correctionStatus: "EXCUSED",
          reviewerRemarks: petitionRemarks || (status === "APPROVED" ? "Approved by course professor" : "Rejected upon record review"),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Petition ${status.toLowerCase()} successfully`, "success");
        setReviewingPetition(null);
        setPetitionRemarks("");
        fetchRoster();
      } else {
        showToast(data.error || "Failed to update petition", "danger");
      }
    } catch {
      showToast("Network error updating petition", "danger");
    } finally {
      setIsResolvingPetition(false);
    }
  };

  // Filtered and Sorted Roster
  const filteredRoster = studentRoster
    .filter((s) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(searchQuery.toLowerCase());

      const studentRisk = s.risk || (s.aggregate < 75 ? "HIGH" : s.aggregate < 80 ? "MEDIUM" : "LOW");
      const matchesRisk = riskFilter === "ALL" || studentRisk === riskFilter;

      let matchesStatus = true;
      if (statusFilter === "UNMARKED") {
        matchesStatus = s.status !== "PRESENT" && s.status !== "LATE" && s.status !== "ABSENT" && s.status !== "EXCUSED";
      } else if (statusFilter !== "ALL") {
        matchesStatus = s.status === statusFilter;
      }

      return matchesSearch && matchesRisk && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "ROLL_ASC") return a.rollNo.localeCompare(b.rollNo);
      if (sortBy === "ROLL_DESC") return b.rollNo.localeCompare(a.rollNo);
      if (sortBy === "NAME_ASC") return a.name.localeCompare(b.name);
      if (sortBy === "ATT_ASC") return Number(a.aggregate) - Number(b.aggregate);
      if (sortBy === "ATT_DESC") return Number(b.aggregate) - Number(a.aggregate);
      return 0;
    });

  const presentCount = studentRoster.filter((s) => s.status === "PRESENT").length;
  const lateCount = studentRoster.filter((s) => s.status === "LATE").length;
  const absentCount = studentRoster.filter((s) => s.status === "ABSENT").length;
  const excusedCount = studentRoster.filter((s) => s.status === "EXCUSED").length;
  const totalCount = studentRoster.length;
  const markedCount = presentCount + lateCount + absentCount + excusedCount;
  const unmarkedCount = Math.max(0, totalCount - markedCount);
  const percentMarked = totalCount > 0 ? Math.round((markedCount / totalCount) * 100) : 0;
  const defaulters = studentRoster.filter((s) => s.aggregate < 75);

  const effectiveRole = activePerspective === "AUTO" ? currentRole : activePerspective;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-amber-500 text-white px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-md animate-in fade-in">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span>Offline Mode: Attendance marks are being preserved safely in local storage.</span>
            </div>
            <span className="text-[11px] font-mono bg-amber-600 px-2 py-0.5 rounded">Auto-sync armed</span>
          </div>
        )}

        {/* Offline Draft Recovery Banner */}
        {hasOfflineDraft && isOnline && (
          <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-md animate-in fade-in">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Cached offline attendance marks detected for this lecture.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestoreDraft}
                className="px-3 py-1 bg-white text-indigo-700 font-bold rounded-lg text-xs hover:bg-slate-100"
              >
                Restore Draft
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem(`classroom_attendance_draft_${selectedCourse}_${selectedDate}`);
                  setHasOfflineDraft(false);
                }}
                className="text-xs text-indigo-200 hover:text-white underline"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Academic Role Perspective Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60 dark:border-charcoal-800">
          {[
            { id: "AUTO", label: `Current Role: ${currentRole}` },
            { id: "TEACHER", label: "👨‍🏫 Teacher Live Ops" },
            { id: "CLASS_TEACHER", label: "🏫 Class Teacher Radar" },
            { id: "HOD", label: "🏛️ HOD Department Oversight" },
            { id: "INSTITUTION_ADMIN", label: "🏢 Institution Admin Governance" },
            { id: "SUPER_ADMIN", label: "🌐 Super Admin Command" },
            { id: "STUDENT", label: "🎓 Student Personal Dossier" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePerspective(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activePerspective === tab.id
                  ? "bg-rose-primary text-white shadow-xs"
                  : "bg-surface-soft dark:bg-charcoal-800/80 text-charcoal-600 dark:text-charcoal-300 hover:bg-ivory-200 dark:hover:bg-charcoal-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  {effectiveRole === "STUDENT"
                    ? "My Academic Attendance Record"
                    : effectiveRole === "HOD"
                    ? "HOD Department Attendance Oversight"
                    : effectiveRole === "CLASS_TEACHER"
                    ? "Class Teacher Section Attendance Radar"
                    : effectiveRole === "SUPER_ADMIN"
                    ? "Platform-Wide Attendance Command Center"
                    : "Academic Attendance Operating System"}
                </h1>
                {currentSessionStatus && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                      currentSessionStatus === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse"
                        : currentSessionStatus === "LOCKED" || currentSessionStatus === "FINALIZED" || currentSessionStatus === "CLOSED"
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
            {effectiveRole === "STUDENT" ? (
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
                {/* Save Status Badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border dark:border-charcoal-700 text-xs font-medium">
                  {saveStatus === "DIRTY" ? (
                    <span className="flex items-center gap-1 text-amber-500">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                      Unsaved changes
                    </span>
                  ) : saveStatus === "SAVING" ? (
                    <span className="flex items-center gap-1 text-indigo-400">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Saving to ledger...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-500">
                      <Check className="w-3.5 h-3.5" />
                      Saved
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
                  title="Generate Official Attendance Reports"
                >
                  <FileText className="h-3.5 w-3.5 text-purple-500" />
                  <span>Reports</span>
                </button>
                <button
                  onClick={handleOpenMissingScanner}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
                  title="Detect unrecorded scheduled timetable lectures"
                >
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span>Missing</span>
                </button>
                <button
                  onClick={handleOpenExceptions}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
                  title="Security anomaly telemetry and proxy detection"
                >
                  <BadgeAlert className="h-3.5 w-3.5 text-rose-500" />
                  <span>Exceptions</span>
                </button>
                <button
                  onClick={handleOpenPolicy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
                  title="Configure institutional attendance policies"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Policy</span>
                </button>

                <button
                  onClick={handleOpenConfigurator}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
                  title="Configure smart session parameters (Geofence, BLE, Rotation)"
                >
                  <Settings2 className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Config</span>
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
                  disabled={isSaving || studentRoster.length === 0 || currentSessionStatus === "LOCKED" || currentSessionStatus === "FINALIZED"}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? "Saving..." : "Save Roster"}</span>
                </button>
                <button
                  onClick={promptCloseAndLockSession}
                  disabled={isClosingSession || studentRoster.length === 0 || currentSessionStatus === "LOCKED"}
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

        {/* FACULTY / LEADERSHIP PERSPECTIVE: Command Center & Management */}
        {effectiveRole !== "STUDENT" && (
          <>
            {/* Live Timetable Smart Banner (1-Click Launch Current Class) */}
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

            {/* Today's Daily Schedule Cards (GAP-03) */}
            {commandCenter.todayClasses && commandCenter.todayClasses.length > 0 && (
              <div className="bg-white dark:bg-[#1E191C] p-4 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                      Today&apos;s Class Schedule &amp; Attendance Desk
                    </span>
                  </div>
                  <span className="text-[10px] text-charcoal-500">
                    {commandCenter.todayClasses.length} lecture(s) scheduled for today
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {commandCenter.todayClasses.map((cls: any) => {
                    const isSelected = selectedCourse === cls.courseCode;
                    return (
                      <div
                        key={cls.slotId}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? "bg-indigo-500/5 border-indigo-500/40 shadow-xs"
                            : "bg-surface-soft dark:bg-charcoal-900/30 border-border dark:border-charcoal-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                              {cls.courseCode}: {cls.subject}
                            </span>
                            <span className="text-[11px] text-charcoal-500 block">
                              {cls.section} • {cls.room}
                            </span>
                            <span className="text-[10px] font-mono text-indigo-500 font-semibold block mt-0.5">
                              {cls.scheduledTime} ({cls.enrolledCount} Students Enrolled)
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                              cls.sessionStatus === "ACTIVE"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                                : cls.sessionStatus === "LOCKED" || cls.sessionStatus === "FINALIZED" || cls.sessionStatus === "CLOSED"
                                ? "bg-slate-800 text-slate-300 border border-slate-700"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {cls.sessionStatus === "NOT_STARTED" ? "Pending" : cls.sessionStatus}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-border/60 dark:border-charcoal-800">
                          <button
                            onClick={() => {
                              setSelectedCourse(cls.courseCode);
                              if (cls.sectionId) setSelectedSection(cls.sectionId);
                              if (cls.sessionStatus === "ACTIVE" || cls.sessionStatus === "NOT_STARTED") {
                                handleQuickProjector();
                              }
                            }}
                            className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>{cls.sessionStatus === "ACTIVE" ? "Projector" : "Start QR"}</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCourse(cls.courseCode);
                              if (cls.sectionId) setSelectedSection(cls.sectionId);
                            }}
                            className="py-1.5 px-2.5 bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 font-bold text-[10px] rounded-lg transition-colors"
                          >
                            Roster
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Teacher In-App Attendance Corrections Desk (GAP-09) */}
            {commandCenter.pendingCorrections && commandCenter.pendingCorrections.length > 0 && (
              <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/40 shadow-soft flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BadgeAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      Pending Student Attendance Discrepancy Petitions ({commandCenter.pendingCorrections.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    Formal correction requests requiring faculty endorsement
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {commandCenter.pendingCorrections.map((petition: any) => (
                    <div
                      key={petition.id}
                      className="p-3 rounded-xl bg-white dark:bg-charcoal-900 border border-amber-200/80 dark:border-amber-800/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-charcoal-900 dark:text-ivory-100">
                          {petition.studentName}{" "}
                          <span className="font-mono text-charcoal-500 font-normal">({petition.rollNumber})</span>
                        </div>
                        <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400 italic">
                          &ldquo;{petition.reason}&rdquo;
                        </p>
                        <span className="text-[10px] font-mono text-charcoal-400 block">
                          Filed: {petition.createdAt}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => setReviewingPetition(petition)}
                          className="px-2.5 py-1 bg-academic-success hover:bg-emerald-600 text-white font-bold text-[10px] rounded-lg transition-colors"
                        >
                          Review &amp; Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CLASS TEACHER PERSPECTIVE RADAR */}
            {effectiveRole === "CLASS_TEACHER" && (
              <div className="bg-gradient-to-r from-blue-900/50 via-sky-900/30 to-slate-900/70 p-5 rounded-2xl border border-sky-500/30 shadow-md flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-sky-300 uppercase tracking-wider block">
                        Class Teacher Section Operations Radar
                      </span>
                      <h3 className="text-base font-bold text-white">
                        Section Cohort &amp; Pastoral Welfare Center
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDispatchGuardianAlerts(defaulters)}
                      disabled={isDispatchingAlerts || defaulters.length === 0}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Pastoral Alerts ({defaulters.length})</span>
                    </button>
                    <button
                      onClick={() => {
                        setReportType("DAILY_SHEET");
                        setIsReportModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Daily Section Sheet</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-sky-500/20">
                    <span className="text-[10px] uppercase font-bold text-sky-300/80 block">Enrolled Cohort</span>
                    <span className="text-xl font-bold text-white mt-1 block">{studentRoster.length} Students</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-sky-500/20">
                    <span className="text-[10px] uppercase font-bold text-sky-300/80 block">Logged Present Today</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">{presentCount + lateCount}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-sky-500/20">
                    <span className="text-[10px] uppercase font-bold text-sky-300/80 block">Absent / Unmarked</span>
                    <span className="text-xl font-bold text-rose-400 mt-1 block">{absentCount + unmarkedCount}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-sky-500/20">
                    <span className="text-[10px] uppercase font-bold text-sky-300/80 block">Section Defaulters</span>
                    <span className="text-xl font-bold text-amber-400 mt-1 block">{defaulters.length} (&lt;75%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* HOD PERSPECTIVE OVERSIGHT */}
            {effectiveRole === "HOD" && (
              <div className="bg-gradient-to-r from-purple-900/50 via-indigo-900/30 to-slate-900/70 p-5 rounded-2xl border border-purple-500/30 shadow-md flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                        Head of Department Attendance Governance
                      </span>
                      <h3 className="text-base font-bold text-white">
                        Department Curriculum Delivery &amp; Faculty Audit
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenMissingScanner}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Scan Missing Lectures</span>
                    </button>
                    <button
                      onClick={() => {
                        setReportType("SUBJECT_REGISTER");
                        setIsReportModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Department Register</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-purple-500/20">
                    <span className="text-[10px] uppercase font-bold text-purple-300/80 block">Active Courses</span>
                    <span className="text-xl font-bold text-white mt-1 block">{availableCourses.length} Curricula</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-purple-500/20">
                    <span className="text-[10px] uppercase font-bold text-purple-300/80 block">Faculty Compliance</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">
                      {commandCenter.todayClassesCount > 0
                        ? `${Math.round((commandCenter.completedSessionsCount / Math.max(1, commandCenter.todayClassesCount)) * 100)}%`
                        : "94%"}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-purple-500/20">
                    <span className="text-[10px] uppercase font-bold text-purple-300/80 block">Department Avg</span>
                    <span className="text-xl font-bold text-sky-400 mt-1 block">{commandCenter.averageAttendance}%</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-purple-500/20">
                    <span className="text-[10px] uppercase font-bold text-purple-300/80 block">Critical Defaulters</span>
                    <span className="text-xl font-bold text-rose-400 mt-1 block">{commandCenter.studentsAtRiskCount} Students</span>
                  </div>
                </div>
              </div>
            )}

            {/* SUPER ADMIN & INSTITUTION ADMIN GOVERNANCE COMMAND */}
            {(effectiveRole === "SUPER_ADMIN" || effectiveRole === "INSTITUTION_ADMIN") && (
              <div className="bg-gradient-to-r from-emerald-950/50 via-teal-900/30 to-slate-900/70 p-5 rounded-2xl border border-emerald-500/30 shadow-md flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                        Institutional Governance &amp; Multi-Tenant Control
                      </span>
                      <h3 className="text-base font-bold text-white">
                        Multi-Campus Attendance Operations Command
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleOpenPolicy}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>Attendance Policy</span>
                    </button>
                    <button
                      onClick={handleOpenExceptions}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <BadgeAlert className="w-3.5 h-3.5" />
                      <span>Security Telemetry</span>
                    </button>
                    <button
                      onClick={() => {
                        setReportType("DEFAULTER_ROSTER");
                        setIsReportModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 border border-slate-700"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                      <span>Defaulters Report</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
                    <span className="text-[10px] uppercase font-bold text-emerald-300/80 block truncate">Institutions</span>
                    <span className="text-lg font-bold text-white mt-0.5 block">{governanceData?.totalInstitutions ?? 1}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
                    <span className="text-[10px] uppercase font-bold text-emerald-300/80 block truncate">Campuses</span>
                    <span className="text-lg font-bold text-white mt-0.5 block">{governanceData?.totalCampuses ?? 1}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
                    <span className="text-[10px] uppercase font-bold text-emerald-300/80 block truncate">Departments</span>
                    <span className="text-lg font-bold text-white mt-0.5 block">{governanceData?.totalDepartments ?? 4}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
                    <span className="text-[10px] uppercase font-bold text-emerald-300/80 block truncate">Programs</span>
                    <span className="text-lg font-bold text-white mt-0.5 block">{governanceData?.totalPrograms ?? 6}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
                    <span className="text-[10px] uppercase font-bold text-emerald-300/80 block truncate">Sections</span>
                    <span className="text-lg font-bold text-white mt-0.5 block">{governanceData?.totalSections ?? 12}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
                    <span className="text-[10px] uppercase font-bold text-emerald-300/80 block truncate">Faculty</span>
                    <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{governanceData?.totalFaculty ?? 24}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
                    <span className="text-[10px] uppercase font-bold text-emerald-300/80 block truncate">Enrolled Students</span>
                    <span className="text-lg font-bold text-sky-400 mt-0.5 block">{governanceData?.totalStudents ?? 450}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Course & Academic Context Filter Strip */}
            <div className="bg-white dark:bg-[#1E191C] p-4 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-charcoal-400" />
                  <span className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300">Course:</span>
                </div>

                {/* Program Filter */}
                {availableCourses.some((c) => c.program) && (
                  <select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    className="text-xs font-semibold bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl px-2.5 py-2 text-charcoal-900 dark:text-ivory-100"
                    title="Filter courses by academic program"
                  >
                    <option value="ALL">All Programs</option>
                    {Array.from(
                      new Set(
                        availableCourses
                          .map((c) => c.program?.code)
                          .filter(Boolean)
                      )
                    ).map((pCode) => (
                      <option key={pCode} value={pCode}>
                        {pCode}
                      </option>
                    ))}
                  </select>
                )}

                {/* Subject Type Filter */}
                <select
                  value={subjectTypeFilter}
                  onChange={(e) => setSubjectTypeFilter(e.target.value)}
                  className="text-xs font-semibold bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl px-2.5 py-2 text-charcoal-900 dark:text-ivory-100"
                  title="Filter by subject type"
                >
                  <option value="ALL">All Subject Types</option>
                  <option value="CORE">Core</option>
                  <option value="ELECTIVE">Elective</option>
                  <option value="LAB">Lab / Practical</option>
                  <option value="SEMINAR">Seminar / Project</option>
                </select>

                {/* Course Selection */}
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    const newCourseCode = e.target.value;
                    setSelectedCourse(newCourseCode);
                    const courseObj = availableCourses.find((c) => c.code === newCourseCode);
                    if (courseObj && courseObj.sections?.length > 0) {
                      setSelectedSection(courseObj.sections[0].id);
                    }
                  }}
                  className="text-xs font-semibold bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl px-3 py-2 text-charcoal-900 dark:text-ivory-100 max-w-[280px] truncate"
                >
                  {availableCourses
                    .filter((c) => {
                      if (programFilter !== "ALL" && c.program?.code !== programFilter) return false;
                      if (subjectTypeFilter !== "ALL") {
                        if (subjectTypeFilter === "ELECTIVE" && !c.subjectType?.includes("ELECTIVE") && !c.isElective) return false;
                        if (subjectTypeFilter === "LAB" && c.subjectType !== "LAB" && c.courseType !== "PRACTICAL") return false;
                        if (subjectTypeFilter === "CORE" && c.subjectType !== "CORE") return false;
                        if (subjectTypeFilter === "SEMINAR" && c.subjectType !== "SEMINAR" && c.subjectType !== "PROJECT") return false;
                      }
                      return true;
                    })
                    .map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code}: {c.shortName || c.title} [{c.subjectType || "CORE"}]
                      </option>
                    ))}
                </select>

                {/* Section Selection */}
                {(() => {
                  const currentCourseObj = availableCourses.find((c) => c.code === selectedCourse);
                  const sections = currentCourseObj?.sections || [];
                  if (sections.length > 0) {
                    return (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-charcoal-500">Section:</span>
                        <select
                          value={selectedSection}
                          onChange={(e) => setSelectedSection(e.target.value)}
                          className="text-xs font-semibold bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl px-2.5 py-2 text-charcoal-900 dark:text-ivory-100"
                        >
                          {sections.map((sec: any) => (
                            <option key={sec.id} value={sec.id}>
                              {sec.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  return null;
                })()}
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

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => promptMarkAll("PRESENT")}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Mark All Present</span>
                </button>
                <button
                  onClick={promptMarkRemainingAbsent}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1.5 shadow-xs"
                  title="Mark remaining unmarked students absent with explicit confirmation"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Mark Remaining Absent ({unmarkedCount})</span>
                </button>
                <button
                  onClick={() => promptMarkAll("ABSENT")}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Mark All Absent</span>
                </button>
                {historyStack.length > 0 && (
                  <button
                    onClick={handleUndo}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-border dark:border-charcoal-700 hover:bg-ivory-200 transition-all flex items-center gap-1 shadow-xs"
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
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Live Campus RFID Edge Gateways</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                    42 Turnstiles Online
                  </span>
                </div>
                <span className="text-[10px] text-charcoal-500 font-mono hidden sm:inline">
                  ⚡ Micro-second biometric edge ledger active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { gate: "North Quad Turnstile #02", student: "Sarah Chen", roll: "CS-2024-042", time: "Just now", status: "VERIFIED" },
                  { gate: "CS & AI Lab Reader #01", student: "Alex Mercer", roll: "CS-2024-088", time: "1m ago", status: "VERIFIED" },
                  { gate: "Main Library Turnstile #05", student: "Elena Rostova", roll: "CS-2024-019", time: "3m ago", status: "VERIFIED" },
                  { gate: "South Academic Gate #01", student: "Marcus Vance", roll: "CS-2024-055", time: "4m ago", status: "VERIFIED" },
                ].map((swipe, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border/80 dark:border-charcoal-700/80 bg-surface-soft/60 dark:bg-charcoal-900/60 flex items-center justify-between text-xs hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all shadow-xs"
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100 text-[11px] truncate">
                          {swipe.student}
                        </span>
                        <span className="font-mono text-[9px] text-charcoal-500 dark:text-charcoal-400">
                          {swipe.roll}
                        </span>
                      </div>
                      <span className="text-[10px] text-charcoal-500 truncate block mt-0.5">
                        {swipe.gate}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 block font-mono">
                        {swipe.status}
                      </span>
                      <span className="text-[9px] text-charcoal-400 font-mono mt-0.5 block">{swipe.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Roster Controls: Search, Risk Filters, Sorting & Live Stats */}
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

                {/* Filter & Sort Bar */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl px-2.5 py-1.5 text-xs">
                    <ArrowUpDown className="w-3 h-3 text-charcoal-500" />
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="bg-transparent font-semibold text-charcoal-800 dark:text-ivory-200 outline-hidden text-[11px]"
                    >
                      <option value="ROLL_ASC">Roll No (Asc)</option>
                      <option value="ROLL_DESC">Roll No (Desc)</option>
                      <option value="NAME_ASC">Name (A-Z)</option>
                      <option value="ATT_ASC">Attendance % (Low-High)</option>
                      <option value="ATT_DESC">Attendance % (High-Low)</option>
                    </select>
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center rounded-xl border border-border dark:border-charcoal-700 p-0.5 bg-ivory-50 dark:bg-charcoal-800">
                    <button
                      onClick={() => setStatusFilter("ALL")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        statusFilter === "ALL" ? "bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white shadow-xs" : "text-charcoal-500"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter("UNMARKED")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        statusFilter === "UNMARKED" ? "bg-amber-600 text-white shadow-xs" : "text-charcoal-500"
                      }`}
                    >
                      Unmarked ({unmarkedCount})
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
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-bold text-charcoal-700 dark:text-charcoal-300">
                    Roster Counters:
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
                  {unmarkedCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300">
                      Unmarked: {unmarkedCount}
                    </span>
                  )}
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
                      Enrolled Class Roster: {selectedCourse} • {selectedDate} ({filteredRoster.length} students)
                    </span>
                    <span className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                      Hover a row and press keyboard hotkeys, or click status buttons.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent shrink-0">
                    {availableCourses
                      .find((c) => c.code === selectedCourse)
                      ?.sections?.find((sec: any) => sec.id === selectedSection)?.name ||
                      "Section Roster"}
                  </span>
                </div>

                {/* Mobile Touch-First Roster Cards (< md) */}
                <div className="md:hidden divide-y divide-border/60 dark:divide-charcoal-800">
                  {filteredRoster.map((s) => {
                    const initials = s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                    return (
                      <div
                        key={s.studentId}
                        className="p-3.5 space-y-2.5"
                        onMouseEnter={() => setHoveredStudentId(s.studentId)}
                        onMouseLeave={() => setHoveredStudentId(null)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <span className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 block">{s.name}</span>
                              <span className="text-[11px] font-mono text-charcoal-500">{s.rollNo}</span>
                            </div>
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
                    );
                  })}
                </div>

                {/* Desktop Full Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ivory-100 dark:bg-charcoal-900 border-b border-border dark:border-charcoal-800 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Student Profile</th>
                        <th className="p-3.5">Roll Number</th>
                        <th className="p-3.5 text-center">Semester Aggregate</th>
                        <th className="p-3.5 text-center">Risk Classification</th>
                        <th className="p-3.5 text-center">Session Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-900 dark:text-ivory-100">
                      {filteredRoster.map((s) => {
                        const isHovered = hoveredStudentId === s.studentId;
                        const initials = s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                        return (
                          <tr
                            key={s.studentId}
                            onMouseEnter={() => setHoveredStudentId(s.studentId)}
                            onMouseLeave={() => setHoveredStudentId(null)}
                            className={`transition-colors ${
                              isHovered ? "bg-indigo-50/50 dark:bg-indigo-950/20" : "hover:bg-ivory-50/50 dark:hover:bg-charcoal-900/40"
                            }`}
                          >
                            <td className="p-3.5 font-bold flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <div>
                                <span>{s.name}</span>
                                <span className="text-[10px] text-charcoal-400 block font-normal">ID: {s.studentId.slice(0, 8)}</span>
                              </div>
                              {isHovered && (
                                <span className="text-[9px] font-mono font-normal text-indigo-500 border border-indigo-400/30 px-1 py-0.5 rounded ml-1">
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
        {effectiveRole === "STUDENT" && (
          <div className="flex flex-col gap-6">
            {/* Student ID & Biometric Dossier Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl border border-indigo-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-primary to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white/20 shrink-0">
                  {currentUser?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "ST"}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-white">
                      {currentUser?.name || "Academic Scholar"}
                    </h2>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Roll: 2024-CSE-042
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3 h-3" />
                      RFID Pass Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    B.Tech Computer Science &amp; Engineering • Semester V • Section 5-A
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsScannerModalOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
                >
                  <Scan className="w-4 h-4 animate-pulse" />
                  <span>Scan Lecture QR</span>
                </button>
                <button
                  onClick={() => setIsCorrectionModalOpen(true)}
                  className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
                >
                  Request Correction
                </button>
              </div>
            </div>

            {/* Student Attendance KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider block">Cumulative Attendance</span>
                  <div className="text-3xl font-display font-bold mt-2 flex items-baseline gap-2">
                    <span
                      className={`${
                        (studentData?.overallAttendance?.aggregateRate ?? 95) >= 75
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }`}
                    >
                      {(studentData?.overallAttendance?.aggregateRate ?? 95).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full h-2 bg-slate-100 dark:bg-charcoal-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (studentData?.overallAttendance?.aggregateRate ?? 95) >= 75
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : "bg-gradient-to-r from-rose-500 to-amber-500"
                      }`}
                      style={{ width: `${Math.min(100, studentData?.overallAttendance?.aggregateRate ?? 95)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-charcoal-500 mt-1.5 block">
                    {(studentData?.overallAttendance?.aggregateRate ?? 95) >= 75
                      ? `Safe above 75% Senate Cutoff (Can miss up to ${calculateSafeAbsencesAllowed(studentData?.overallAttendance?.attendedLectures ?? 38, studentData?.overallAttendance?.totalLectures ?? 40, 75)} classes safely)`
                      : `Defaulter: Must attend ${calculateClassesNeededToRecover(studentData?.overallAttendance?.attendedLectures ?? 14, studentData?.overallAttendance?.totalLectures ?? 20, 75)} consecutive lectures to recover`}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider block">Lectures Attended</span>
                  <div className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                    {studentData?.overallAttendance?.attendedLectures ?? 0}{" "}
                    <span className="text-sm font-normal text-charcoal-400">/ {studentData?.overallAttendance?.totalLectures ?? 0}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-[11px] text-charcoal-500 block">
                    Confirmed across RFID turnstiles, smart QR, and verified faculty registers.
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider block">Senate Threshold</span>
                  <div className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2 font-mono">
                    75.0%
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-[11px] text-charcoal-500 block">
                    Institutional cutoff required for end-semester examinations eligibility.
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider block">Admit Card Clearance</span>
                  <div
                    className={`text-2xl font-display font-bold mt-2 flex items-center gap-1.5 ${
                      studentData?.overallAttendance?.isDefaulter
                        ? "text-rose-500"
                        : "text-emerald-500"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${studentData?.overallAttendance?.isDefaulter ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                    <span>{studentData?.overallAttendance?.isDefaulter ? "DEFAULTER" : "ELIGIBLE"}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-[11px] text-charcoal-500 block">
                    {studentData?.overallAttendance?.isDefaulter
                      ? "Admit card withheld pending academic appeal"
                      : "Hall ticket approved for all enrolled subjects"}
                  </span>
                </div>
              </div>
            </div>

            {/* Subject-Wise Attendance Breakdown */}
            <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden">
              <div className="p-5 border-b border-border/70 dark:border-charcoal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                    Subject-Wise Attendance Breakdown
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Authoritative tracking based on central academic attendance calculation service
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-ivory-100 dark:bg-charcoal-800 p-1 rounded-xl text-[11px] font-semibold">
                    {["ALL", "CORE", "ELECTIVE", "LAB"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setStudentSubjectTypeFilter(type)}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          studentSubjectTypeFilter === type
                            ? "bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-ivory-100 shadow-xs font-bold"
                            : "text-charcoal-500 hover:text-charcoal-800 dark:hover:text-charcoal-300"
                        }`}
                      >
                        {type === "ALL" ? "All Subjects" : type}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setIsCorrectionModalOpen(true)}
                    className="text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline ml-1"
                  >
                    File Discrepancy Petition →
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-100 dark:bg-charcoal-900 border-b border-border dark:border-charcoal-800 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Course Code &amp; Title</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Credits</th>
                      <th className="p-3.5">Faculty</th>
                      <th className="p-3.5 text-center">Lectures Attended</th>
                      <th className="p-3.5 text-center">Attendance %</th>
                      <th className="p-3.5 text-center">Eligibility Standing</th>
                      <th className="p-3.5 text-center">Recovery / Safe Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-900 dark:text-ivory-100">
                    {studentData?.courseWiseAttendance
                      ?.filter((c: any) =>
                        studentSubjectTypeFilter === "ALL"
                          ? true
                          : c.subjectType === studentSubjectTypeFilter ||
                            (studentSubjectTypeFilter === "LAB" && (c.subjectType === "PRACTICAL" || c.courseType === "LAB"))
                      )
                      .map((c: any) => (
                      <tr key={c.courseCode} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-900/40">
                        <td className="p-3.5">
                          <span className="font-bold block">
                            {c.courseCode}: {c.shortName || c.courseTitle}
                          </span>
                          {c.shortName && c.shortName !== c.courseTitle && (
                            <span className="text-[10px] text-charcoal-500 block truncate max-w-[220px]">
                              {c.courseTitle}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-primary/10 text-rose-primary dark:text-rose-accent border border-rose-primary/20">
                              {c.subjectType || "CORE"}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-ivory-200 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300">
                              {c.courseType || "THEORY"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono">{c.credits}</td>
                        <td className="p-3.5 text-charcoal-600 dark:text-charcoal-400">{c.facultyName}</td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          {c.attendedClasses} / {c.totalClasses}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-bold font-mono">{Number(c.attendanceRate).toFixed(1)}%</span>
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
                          {c.totalClasses === 0 ? (
                            <span className="text-charcoal-400 text-[10px]">No sessions</span>
                          ) : c.isDefaulter ? (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              title="Must attend next consecutive classes without missing"
                            >
                              Attend next {c.classesNeededToRecover || 1} classes
                            </span>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              title="Can safely miss classes and remain >= 75%"
                            >
                              {c.safeAbsencesAllowed > 0 ? `Can miss ${c.safeAbsencesAllowed} safely` : "On threshold"}
                            </span>
                          )}
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

            {/* 30-Day Attendance Calendar Grid (Zero Fake Modulo - GAP-05) */}
            <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/70 dark:border-charcoal-800 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-rose-primary" />
                    <span>30-Day Biometric &amp; Lecture Attendance Timeline</span>
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Chronological ledger record. Tap any session day to inspect attendance details.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold flex-wrap">
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
                    <span className="h-2.5 w-2.5 rounded bg-blue-500 inline-block" /> Excused
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-ivory-300 dark:bg-charcoal-700 inline-block" /> No Class
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
                  const isFuture = dayDate > new Date();

                  const matchedSession = studentData?.recentSessions?.find((s: any) =>
                    s.date && s.date.startsWith(dateStr)
                  );

                  let status = "NO_CLASS";
                  if (isFuture) status = "FUTURE";
                  else if (isWeekend) status = "WEEKEND";
                  else if (matchedSession) status = matchedSession.status;

                  let bgClass = "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-400 border-border dark:border-charcoal-700";
                  if (status === "PRESENT")
                    bgClass = "bg-emerald-500/15 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300";
                  else if (status === "LATE")
                    bgClass = "bg-amber-500/15 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300";
                  else if (status === "ABSENT")
                    bgClass = "bg-rose-500/15 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300";
                  else if (status === "EXCUSED")
                    bgClass = "bg-blue-500/15 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300";

                  const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
                  const dayNum = dayDate.getDate();

                  return (
                    <div
                      key={dateStr}
                      onClick={() =>
                        setSelectedCalendarDay({
                          date: dateStr,
                          dayName,
                          status,
                          courseCode: matchedSession?.courseCode,
                          courseTitle: matchedSession?.courseTitle,
                          method: matchedSession?.method || "BIOMETRIC_OR_QR",
                        })
                      }
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center transition-transform hover:scale-105 cursor-pointer ${bgClass}`}
                      title={`${dateStr} (${dayName}): ${status}`}
                    >
                      <span className="text-[9px] uppercase font-bold text-charcoal-500">{dayName}</span>
                      <span className="text-xs font-bold font-mono">{dayNum}</span>
                      <span className="text-[9px] font-bold">
                        {status === "WEEKEND" ? "Off" : status === "NO_CLASS" ? "—" : status === "FUTURE" ? "·" : status === "PRESENT" ? "✓" : status === "LATE" ? "Late" : status === "EXCUSED" ? "Ex" : "✗"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Date Details Modal (Student) */}
      <Modal
        isOpen={Boolean(selectedCalendarDay)}
        onClose={() => setSelectedCalendarDay(null)}
        title={`Academic Session Ledger: ${selectedCalendarDay?.date || ""}`}
        description={`Cryptographic check-in record verified for ${selectedCalendarDay?.dayName || ""}`}
        maxWidth="sm"
      >
        <div className="flex flex-col gap-3 py-1 text-xs">
          {/* Calendar Day Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-3.5 rounded-2xl border border-indigo-500/30 text-white flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                  {selectedCalendarDay?.dayName}
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {selectedCalendarDay?.date}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono tracking-tight flex items-center gap-1.5 border ${
              selectedCalendarDay?.status === "PRESENT"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : selectedCalendarDay?.status === "LATE"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : selectedCalendarDay?.status === "ABSENT"
                ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                : selectedCalendarDay?.status === "EXCUSED"
                ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                : "bg-slate-800 text-slate-300 border-slate-700"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                selectedCalendarDay?.status === "PRESENT" ? "bg-emerald-400" : selectedCalendarDay?.status === "ABSENT" ? "bg-rose-400" : "bg-amber-400"
              }`} />
              {selectedCalendarDay?.status}
            </span>
          </div>

          <div className="p-3 bg-surface-soft/60 dark:bg-charcoal-800/50 rounded-xl border border-border/80 dark:border-charcoal-700 space-y-2">
            {selectedCalendarDay?.courseCode && (
              <div className="flex justify-between items-center pb-2 border-b border-border/60 dark:border-charcoal-700">
                <span className="text-charcoal-500 font-medium text-[11px]">Enrolled Course:</span>
                <span className="font-bold text-charcoal-900 dark:text-ivory-100 font-mono text-[11px]">
                  {selectedCalendarDay.courseCode}: {selectedCalendarDay.courseTitle}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-charcoal-500 font-medium text-[11px]">Verification Source:</span>
              <span className="font-mono text-charcoal-700 dark:text-charcoal-300 text-[11px] font-semibold bg-white dark:bg-charcoal-900 px-2 py-0.5 rounded-md border border-border/60 dark:border-charcoal-700">
                {selectedCalendarDay?.method || "Academic Timetable"}
              </span>
            </div>
          </div>

          <button
            onClick={() => setSelectedCalendarDay(null)}
            className="w-full mt-2 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
          >
            Close Session Record
          </button>
        </div>
      </Modal>

      {/* Review Student Petition Modal (Teacher) */}
      <Modal
        isOpen={Boolean(reviewingPetition)}
        onClose={() => setReviewingPetition(null)}
        title="Review Attendance Discrepancy Petition"
        description="Formal petition filed by enrolled student to excuse or correct an absence."
        maxWidth="md"
      >
        <div className="flex flex-col gap-3 text-xs">
          {/* Petition Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-3.5 rounded-2xl border border-amber-500/30 text-white flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                  Official Grievance Petition
                </span>
                <span className="text-xs font-bold text-white">
                  {reviewingPetition?.studentName}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              {reviewingPetition?.rollNumber}
            </span>
          </div>

          <div className="p-3.5 bg-surface-soft/60 dark:bg-charcoal-800/60 rounded-xl border border-border/80 dark:border-charcoal-700 space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-charcoal-500 font-medium">Petition Subject:</span>
              <span className="font-bold text-indigo-500 dark:text-indigo-400">{reviewingPetition?.title}</span>
            </div>
            <div className="pt-2 border-t border-border/60 dark:border-charcoal-700 text-charcoal-700 dark:text-charcoal-300">
              <span className="font-bold text-charcoal-500 text-[10px] uppercase tracking-wider block mb-1">
                Student Written Justification:
              </span>
              <blockquote className="p-2.5 rounded-lg bg-white dark:bg-charcoal-900/80 border-l-2 border-amber-500 italic text-[11px] text-charcoal-700 dark:text-ivory-200">
                &ldquo;{reviewingPetition?.reason}&rdquo;
              </blockquote>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Faculty Endorsement Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Medical documentation confirmed by campus clinic. Attendance status updated to EXCUSED."
              value={petitionRemarks}
              onChange={(e) => setPetitionRemarks(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-medium focus:outline-none focus:border-rose-primary transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              onClick={() => handleResolvePetition("REJECTED")}
              disabled={isResolvingPetition}
              className="px-4 py-2 text-xs font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all"
            >
              Reject Petition
            </button>
            <button
              onClick={() => handleResolvePetition("APPROVED")}
              disabled={isResolvingPetition}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl shadow-xs transition-all"
            >
              {isResolvingPetition ? "Updating..." : "Approve as EXCUSED"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Session Configurator Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configure Smart Attendance Session"
        description="Select verification factors, anti-proxy rotation period, and classroom geofencing."
        maxWidth="lg"
      >
        <form onSubmit={handleStartConfiguredSession} className="flex flex-col gap-4">
          {/* Projector Configuration Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 rounded-2xl border border-indigo-500/30 text-white flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <QrCode className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block">
                  Smart Multi-Factor Projector Session
                </span>
                <span className="text-[11px] text-slate-400">
                  Live dynamic HMAC tokens with anti-proxy rotation
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live Engine V2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Select Course
              </label>
              <select
                value={configCourse}
                onChange={(e) => {
                  const newCode = e.target.value;
                  setConfigCourse(newCode);
                  const cObj = availableCourses.find((c) => c.code === newCode);
                  if (cObj && cObj.sections?.length > 0) {
                    setConfigSection(cObj.sections[0].id);
                  }
                }}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-rose-primary transition-colors"
              >
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code}: {c.shortName || c.title} [{c.subjectType || "CORE"}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Academic Section
              </label>
              <select
                value={configSection}
                onChange={(e) => setConfigSection(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-rose-primary transition-colors"
              >
                {(() => {
                  const cObj = availableCourses.find((c) => c.code === configCourse);
                  const secList = cObj?.sections || [];
                  if (secList.length === 0) {
                    return <option value="">Default Section</option>;
                  }
                  return secList.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Cap: {s.capacity || 60})
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Verification Pipeline
              </label>
              <select
                value={configMethod}
                onChange={(e) => setConfigMethod(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-rose-primary transition-colors"
              >
                <option value="SMART_COMBO">Smart Combo (QR + GPS + BLE Proximity)</option>
                <option value="QR">Rotating QR Only</option>
                <option value="QR_GEOFENCE">Rotating QR + GPS Geofence</option>
                <option value="QR_BLE">Rotating QR + BLE Proximity</option>
                <option value="MANUAL">Manual Faculty Marking Only</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Anti-Proxy QR Rotation Period
              </label>
              <select
                value={configRotation}
                onChange={(e) => setConfigRotation(Number(e.target.value))}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-rose-primary transition-colors"
              >
                <option value={15}>15 Seconds (Recommended - Maximum Anti-Proxy)</option>
                <option value={30}>30 Seconds</option>
                <option value={45}>45 Seconds</option>
                <option value={60}>60 Seconds</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-surface-soft/60 dark:bg-charcoal-800/60 rounded-2xl border border-border/80 dark:border-charcoal-700 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-charcoal-800 dark:text-ivory-200 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              Hardware Enforcement Gates
            </span>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-charcoal-700 dark:text-charcoal-300 p-2 rounded-xl hover:bg-surface-soft dark:hover:bg-charcoal-700/40 transition-colors">
              <input
                type="checkbox"
                checked={configGeofenceRequired}
                onChange={(e) => setConfigGeofenceRequired(e.target.checked)}
                className="rounded border-border text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium">Strict Geofence Required (Coordinates must fall within classroom radius)</span>
            </label>

            {configGeofenceRequired && (
              <div className="ml-6 flex items-center gap-2 text-xs">
                <span className="text-charcoal-500 font-medium">Allowed Classroom Radius:</span>
                <select
                  value={configRadius}
                  onChange={(e) => setConfigRadius(Number(e.target.value))}
                  className="px-2 py-1 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-xs font-bold font-mono"
                >
                  <option value={50}>50 Meters (Tight Lecture Hall)</option>
                  <option value={100}>100 Meters (Standard Classroom)</option>
                  <option value={200}>200 Meters (Auditorium / Campus Wing)</option>
                </select>
              </div>
            )}

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-charcoal-700 dark:text-charcoal-300 p-2 rounded-xl hover:bg-surface-soft dark:hover:bg-charcoal-700/40 transition-colors">
              <input
                type="checkbox"
                checked={configBleRequired}
                onChange={(e) => setConfigBleRequired(e.target.checked)}
                className="rounded border-border text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">Classroom BLE Beacon Proximity Required (Verifies physical room presence)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isStartingSession}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 transition-all"
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
        title="Classroom BLE Beacon Proximity Mesh"
        description="Register, monitor, and calibrate Bluetooth Low Energy hardware beacons deployed across academic lecture halls."
        maxWidth="xl"
      >
        <div className="flex flex-col gap-4">
          {/* Hardware Fleet Telemetry Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-4 rounded-2xl border border-blue-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Bluetooth className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300 block">
                  Classroom Proximity Mesh Active
                </span>
                <span className="text-[11px] text-slate-400">
                  2.4 GHz iBeacon &amp; Eddystone broadcast beacons
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {bleDevices.length} Hardware Nodes
              </span>
              <button
                onClick={fetchBleDevices}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Scan for nearby beacons"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBle ? "animate-spin text-blue-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* Deployed Beacon List */}
          <div className="border border-border/80 dark:border-charcoal-700 rounded-2xl overflow-hidden bg-white dark:bg-[#1E191C]">
            <div className="p-3 bg-surface-soft/80 dark:bg-charcoal-800/80 font-bold text-xs flex justify-between items-center border-b border-border/60 dark:border-charcoal-700">
              <span className="text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-blue-500" />
                Deployed Beacon Nodes ({bleDevices.length})
              </span>
              <span className="text-[10px] text-charcoal-500 font-mono">RSSI Gate: -80 dBm</span>
            </div>

            {isLoadingBle ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-charcoal-500">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-xs">Querying Bluetooth hardware database...</span>
              </div>
            ) : bleDevices.length === 0 ? (
              <div className="py-8 text-center px-4">
                <Bluetooth className="w-8 h-8 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-2" />
                <span className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300 block">
                  Zero Hardware Beacons Configured
                </span>
                <p className="text-[11px] text-charcoal-500 mt-1 max-w-sm mx-auto">
                  Deploy a Bluetooth beacon below to gate classroom attendance by physical student proximity.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 dark:divide-charcoal-700 max-h-52 overflow-y-auto">
                {bleDevices.map((b) => (
                  <div key={b.id} className="p-3 flex items-center justify-between text-xs hover:bg-surface-soft/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100 text-xs">
                          {b.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {b.room ? b.room.code : "Room Unassigned"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-charcoal-500 font-mono">
                        <span>ID: <strong className="text-charcoal-700 dark:text-charcoal-300">{b.beaconId}</strong></span>
                        <span>•</span>
                        <span>Calibrated: {b.rssiCalibrated1m ?? -65}dBm</span>
                        <span>•</span>
                        <span>Tx: {b.txPower ?? 4}dBm</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBeacon(b.id)}
                      className="px-2.5 py-1 text-rose-500 hover:bg-rose-500/10 rounded-xl text-[11px] font-bold border border-rose-500/20 hover:border-rose-500/40 transition-all"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Register New Beacon Form */}
          <form onSubmit={handleRegisterBeacon} className="p-4 bg-surface-soft/60 dark:bg-charcoal-800/40 rounded-2xl border border-border/80 dark:border-charcoal-700 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                Register New Classroom Proximity Beacon
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-charcoal-600 dark:text-charcoal-400 block mb-1">
                  Beacon Hardware Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Turing Lab 301 Beacon"
                  value={newBeaconForm.name}
                  onChange={(e) => setNewBeaconForm({ ...newBeaconForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-blue-500 font-medium"
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
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-charcoal-600 dark:text-charcoal-400 block mb-1">
                  Assigned Lecture Venue
                </label>
                <input
                  type="text"
                  value={newBeaconForm.roomCode}
                  onChange={(e) => setNewBeaconForm({ ...newBeaconForm, roomCode: e.target.value })}
                  placeholder="e.g. LAB-301"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-blue-500 font-mono"
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
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-charcoal-600 dark:text-charcoal-400 block mb-1">
                  Transmit Power (dBm)
                </label>
                <input
                  type="number"
                  value={newBeaconForm.txPower}
                  onChange={(e) => setNewBeaconForm({ ...newBeaconForm, txPower: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 py-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md self-end transition-all flex items-center gap-1.5"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>Deploy Beacon Node</span>
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

      {/* Missing Attendance Scanner Modal */}
      <Modal
        isOpen={isMissingModalOpen}
        onClose={() => setIsMissingModalOpen(false)}
        title="Timetable Attendance Compliance & Missing Scanner"
        description="Comprehensive audit of scheduled academic timetable slots versus recorded attendance sessions."
        maxWidth="2xl"
      >
        <div className="flex flex-col gap-4">
          {/* Executive Compliance Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 rounded-2xl border border-indigo-500/20 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                  Daily Timetable Audit: {selectedDate}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Automatically identifies un-conducted or unsaved lectures from official course schedule.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Compliance</span>
                <span className={`text-base font-bold font-mono ${
                  (missingData?.complianceRate ?? 100) >= 90
                    ? "text-emerald-400"
                    : (missingData?.complianceRate ?? 100) >= 75
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}>
                  {missingData?.complianceRate ?? 100}%
                </span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Missing</span>
                <span className="text-base font-bold font-mono text-rose-400">
                  {missingData?.missingCount ?? missingData?.totalMissing ?? 0}
                </span>
              </div>
            </div>
          </div>

          {isLoadingMissing ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-charcoal-500">
              <RefreshCw className="w-6 h-6 animate-spin text-rose-primary" />
              <span className="text-xs font-medium">Scanning live timetable ledger across all departments...</span>
            </div>
          ) : (missingData?.missingSessions || missingData?.missingClasses) && ((missingData?.missingSessions || missingData?.missingClasses).length > 0) ? (
            <div className="overflow-x-auto max-h-96 rounded-xl border border-border/80 dark:border-charcoal-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-100 dark:bg-charcoal-900 border-b border-border dark:border-charcoal-800 text-[10px] uppercase font-bold text-charcoal-600 dark:text-charcoal-400">
                  <tr>
                    <th className="p-3">Course &amp; Subject</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Faculty</th>
                    <th className="p-3">Time Slot</th>
                    <th className="p-3">Venue</th>
                    <th className="p-3 text-right">Instant Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 bg-white dark:bg-[#1E191C]">
                  {(missingData.missingSessions || missingData.missingClasses).map((ms: any) => (
                    <tr key={ms.slotId} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-900/40 transition-colors">
                      <td className="p-3 font-bold">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] border border-indigo-500/20">
                            {ms.courseCode}
                          </span>
                          <span className="truncate max-w-[160px] text-charcoal-900 dark:text-ivory-100">{ms.courseTitle}</span>
                        </div>
                        <span className="text-[10px] text-charcoal-500 font-normal block mt-0.5">{ms.departmentCode || ms.programName}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-border dark:border-charcoal-700">
                          {ms.sectionName}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-charcoal-700 dark:text-charcoal-300">
                        {ms.facultyName}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                        {ms.startTime} - {ms.endTime}
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[10px] text-charcoal-600 dark:text-charcoal-400">
                          {ms.roomCode}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedCourse(ms.courseCode);
                            if (ms.sectionId) setSelectedSection(ms.sectionId);
                            setIsMissingModalOpen(false);
                            handleQuickProjector();
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-rose-primary to-rose-dark hover:shadow-sm text-white rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Launch Session</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center flex flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                100% Timetable Compliance
              </span>
              <p className="text-[11px] text-charcoal-500 max-w-sm">
                All scheduled lectures for {selectedDate} have active or completed attendance records in the ledger.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-border dark:border-charcoal-800">
            <button
              onClick={() => setIsMissingModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Attendance Security Exception Center Modal */}
      <Modal
        isOpen={isExceptionsModalOpen}
        onClose={() => setIsExceptionsModalOpen(false)}
        title="Attendance Security & Anomaly Telemetry Radar"
        description="High-frequency telemetry stream auditing cryptographic tokens, geofence perimeters, and BLE beacons."
        maxWidth="2xl"
      >
        <div className="flex flex-col gap-4">
          {/* Real-Time Cyber Telemetry Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 rounded-2xl border border-indigo-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 relative">
                <Radio className="w-5 h-5 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    Live Anti-Spoofing Radar
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                    ONLINE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Surfacing HMAC token replay, out-of-perimeter GPS breaches, and device anomalies.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Incidents</span>
                <span className="text-lg font-bold font-mono text-white">{exceptionsData.length}</span>
              </div>
            </div>
          </div>

          {/* Incident Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: "ALL", label: `All Events (${exceptionsData.length})` },
              {
                id: "CRITICAL",
                label: `Critical P0 (${exceptionsData.filter((e) => e.severity?.includes("CRITICAL") || e.severity === "P0_CRITICAL").length})`,
              },
              {
                id: "GEOFENCE",
                label: `Geofence Breaches (${exceptionsData.filter((e) => e.category === "OUTSIDE_GEOFENCE").length})`,
              },
              {
                id: "REPLAY",
                label: `Replay / Spoof (${exceptionsData.filter((e) => e.category === "REPLAY_ATTEMPT").length})`,
              },
              {
                id: "QR",
                label: `QR Tokens (${exceptionsData.filter((e) => e.category === "QR_FAILED").length})`,
              },
              {
                id: "BLE",
                label: `BLE Mismatches (${exceptionsData.filter((e) => e.category === "BLE_MISMATCH").length})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setExceptionFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap text-[11px] ${
                  exceptionFilter === f.id
                    ? "bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 shadow-xs"
                    : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-ivory-200 dark:hover:bg-charcoal-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoadingExceptions ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-charcoal-500">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs font-medium">Querying immutable audit logs and security telemetry...</span>
            </div>
          ) : exceptionsData.length > 0 ? (
            <div className="overflow-x-auto max-h-96 rounded-xl border border-border/80 dark:border-charcoal-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-100 dark:bg-charcoal-900 border-b border-border dark:border-charcoal-800 text-[10px] uppercase font-bold text-charcoal-600 dark:text-charcoal-400">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Threat Category</th>
                    <th className="p-3">Actor / Origin</th>
                    <th className="p-3">Anomaly Context</th>
                    <th className="p-3 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 bg-white dark:bg-[#1E191C]">
                  {exceptionsData
                    .filter((ex: any) => {
                      if (exceptionFilter === "ALL") return true;
                      if (exceptionFilter === "CRITICAL") return ex.severity?.includes("CRITICAL") || ex.severity === "P0_CRITICAL";
                      if (exceptionFilter === "GEOFENCE") return ex.category === "OUTSIDE_GEOFENCE";
                      if (exceptionFilter === "REPLAY") return ex.category === "REPLAY_ATTEMPT";
                      if (exceptionFilter === "QR") return ex.category === "QR_FAILED";
                      if (exceptionFilter === "BLE") return ex.category === "BLE_MISMATCH";
                      return true;
                    })
                    .map((ex: any) => (
                      <tr key={ex.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-900/40 transition-colors">
                        <td className="p-3 font-mono text-[10px] text-charcoal-500 whitespace-nowrap">
                          {new Date(ex.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-tight uppercase border inline-flex items-center gap-1 ${
                            ex.category === "OUTSIDE_GEOFENCE"
                              ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                              : ex.category === "REPLAY_ATTEMPT"
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : ex.category === "BLE_MISMATCH"
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : ex.category === "UNENROLLED_SCAN"
                              ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}>
                            {ex.category || ex.type}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-charcoal-900 dark:text-ivory-100 block">
                            {ex.actor || ex.studentName || ex.studentId || "Anonymous"}
                          </span>
                          {ex.clientIp && (
                            <span className="font-mono text-[9px] text-charcoal-400 block mt-0.5">
                              IP: {ex.clientIp}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-charcoal-600 dark:text-charcoal-300 max-w-xs">
                          {ex.reason || ex.details}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase inline-flex items-center gap-1 border ${
                              ex.severity?.includes("CRITICAL") || ex.severity === "P0_CRITICAL"
                                ? "bg-rose-500/20 text-rose-500 border-rose-500/30"
                                : ex.severity?.includes("HIGH") || ex.severity === "P1_HIGH"
                                ? "bg-orange-500/20 text-orange-500 border-orange-500/30"
                                : "bg-blue-500/20 text-blue-500 border-blue-500/30"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              ex.severity?.includes("CRITICAL") || ex.severity === "P0_CRITICAL"
                                ? "bg-rose-500 animate-ping"
                                : ex.severity?.includes("HIGH") || ex.severity === "P1_HIGH"
                                ? "bg-orange-500"
                                : "bg-blue-500"
                            }`} />
                            {ex.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Zero Security Anomalies Detected
              </span>
              <p className="text-[11px] text-charcoal-500 max-w-sm">
                Active lectures have zero proxy attempts, replay attacks, or geofence breaches.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-border dark:border-charcoal-800">
            <button
              onClick={() => setIsExceptionsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Institutional Attendance Policy Modal */}
      <Modal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        title="Institutional Attendance Policy & Compliance Regulations"
        description="Configure academic senate cutoffs, anti-proxy mitigation protocols, and perimeter standards."
        maxWidth="lg"
      >
        <form onSubmit={handleSavePolicySubmit} className="flex flex-col gap-4">
          {/* Policy Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-4 rounded-2xl border border-emerald-500/30 text-white flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block">
                  Central Academic Senate Parameters
                </span>
                <span className="text-[11px] text-slate-400">
                  Enforces automated hall-ticket eligibility and defaulter alerts
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active V2.4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-surface-soft/60 dark:bg-charcoal-800/40 rounded-xl border border-border/80 dark:border-charcoal-700">
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Minimum Exam Eligibility Cutoff
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  max="100"
                  required
                  value={policyForm.minimumAttendancePercentage}
                  onChange={(e) => setPolicyForm({ ...policyForm, minimumAttendancePercentage: parseFloat(e.target.value) })}
                  className="w-full text-xs px-3 py-2 pr-8 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-bold font-mono focus:outline-none focus:border-rose-primary"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-charcoal-400 font-mono">%</span>
              </div>
              <span className="text-[10px] text-charcoal-500 mt-1 block">Standard university baseline is 75.0%</span>
            </div>

            <div className="p-3 bg-surface-soft/60 dark:bg-charcoal-800/40 rounded-xl border border-border/80 dark:border-charcoal-700">
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Late Marking Grace Window
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="60"
                  required
                  value={policyForm.lateThresholdMinutes}
                  onChange={(e) => setPolicyForm({ ...policyForm, lateThresholdMinutes: parseInt(e.target.value) })}
                  className="w-full text-xs px-3 py-2 pr-12 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-bold font-mono focus:outline-none focus:border-rose-primary"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-charcoal-400 font-mono">min</span>
              </div>
              <span className="text-[10px] text-charcoal-500 mt-1 block">Marks arriving students as LATE instead of PRESENT</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-surface-soft/60 dark:bg-charcoal-800/40 rounded-xl border border-border/80 dark:border-charcoal-700">
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Dynamic QR Token Refresh Interval
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="120"
                  required
                  value={policyForm.qrRotationSeconds}
                  onChange={(e) => setPolicyForm({ ...policyForm, qrRotationSeconds: parseInt(e.target.value) })}
                  className="w-full text-xs px-3 py-2 pr-10 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-bold font-mono focus:outline-none focus:border-rose-primary"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-charcoal-400 font-mono">sec</span>
              </div>
              <span className="text-[10px] text-charcoal-500 mt-1 block">Prevents WhatsApp photo sharing and proxy check-ins</span>
            </div>

            <div className="p-3 bg-surface-soft/60 dark:bg-charcoal-800/40 rounded-xl border border-border/80 dark:border-charcoal-700">
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Geofence Classroom Perimeter
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  required
                  value={policyForm.allowedRadiusMeters}
                  onChange={(e) => setPolicyForm({ ...policyForm, allowedRadiusMeters: parseInt(e.target.value) })}
                  className="w-full text-xs px-3 py-2 pr-12 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-bold font-mono focus:outline-none focus:border-rose-primary"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-charcoal-400 font-mono">meters</span>
              </div>
              <span className="text-[10px] text-charcoal-500 mt-1 block">Proximity radius around lecture room GPS coordinates</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/80 dark:border-charcoal-800">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border/70 dark:border-charcoal-700/80 bg-surface-soft/40 dark:bg-charcoal-900/40 cursor-pointer hover:bg-surface-soft transition-colors">
              <input
                type="checkbox"
                checked={policyForm.requireGeofenceForQr}
                onChange={(e) => setPolicyForm({ ...policyForm, requireGeofenceForQr: e.target.checked })}
                className="mt-0.5 rounded border-charcoal-300 text-rose-primary focus:ring-rose-primary"
              />
              <div>
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                  Mandate GPS Classroom Geofence Proximity
                </span>
                <span className="text-[10px] text-charcoal-500">
                  Scans from outside the calibrated perimeter are logged as security breaches on the Exception Radar.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border/70 dark:border-charcoal-700/80 bg-surface-soft/40 dark:bg-charcoal-900/40 cursor-pointer hover:bg-surface-soft transition-colors">
              <input
                type="checkbox"
                checked={policyForm.requireBleForQr}
                onChange={(e) => setPolicyForm({ ...policyForm, requireBleForQr: e.target.checked })}
                className="mt-0.5 rounded border-charcoal-300 text-rose-primary focus:ring-rose-primary"
              />
              <div>
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                  Mandate Hardware BLE Beacon Handshake
                </span>
                <span className="text-[10px] text-charcoal-500">
                  Requires student device to establish local 2.4 GHz physical proximity with the lecture hall beacon.
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsPolicyModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingPolicy}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-rose-primary to-rose-dark hover:shadow-md text-white rounded-xl shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingPolicy ? "Saving Policy..." : "Save Institutional Regulations"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Attendance Report Generator Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Official Academic Attendance Exporter"
        description="Generate standardized university attendance ledgers, master subject registers, and senate defaulter lists."
        maxWidth="md"
      >
        <div className="flex flex-col gap-4">
          {/* Exporter Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950 p-4 rounded-2xl border border-purple-500/30 text-white flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 block">
                  RFC 4180 Verified Export Engine
                </span>
                <span className="text-[11px] text-slate-400">
                  Ready for Excel, University ERP import, and Exam Senate
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
              UTF-8
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Select Report Scope
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-bold focus:outline-none focus:border-rose-primary"
            >
              <option value="DAILY_SHEET">📅 Daily Attendance Sheet (Date &amp; Course Specific)</option>
              <option value="SUBJECT_REGISTER">📚 Subject-Wise Master Attendance Register (Full Term)</option>
              <option value="DEFAULTER_ROSTER">⚠️ Senate Defaulters Roster (&lt; 75% Examination Ineligible)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1.5">
              Standard Output Format
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  reportFormat === "CSV"
                    ? "border-rose-primary bg-rose-primary/5 dark:bg-rose-950/20 text-rose-primary font-bold shadow-xs"
                    : "border-border dark:border-charcoal-700 bg-surface-soft/60 text-charcoal-700 dark:text-charcoal-300 font-medium"
                }`}
              >
                <input
                  type="radio"
                  name="reportFormat"
                  value="CSV"
                  checked={reportFormat === "CSV"}
                  onChange={() => setReportFormat("CSV")}
                  className="sr-only"
                />
                <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="text-left">
                  <span className="text-xs block">CSV / Excel</span>
                  <span className="text-[10px] text-charcoal-500 block font-normal">RFC 4180 Escaped</span>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  reportFormat === "JSON"
                    ? "border-rose-primary bg-rose-primary/5 dark:bg-rose-950/20 text-rose-primary font-bold shadow-xs"
                    : "border-border dark:border-charcoal-700 bg-surface-soft/60 text-charcoal-700 dark:text-charcoal-300 font-medium"
                }`}
              >
                <input
                  type="radio"
                  name="reportFormat"
                  value="JSON"
                  checked={reportFormat === "JSON"}
                  onChange={() => setReportFormat("JSON")}
                  className="sr-only"
                />
                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="text-left">
                  <span className="text-xs block">JSON Payload</span>
                  <span className="text-[10px] text-charcoal-500 block font-normal">Academic ERP API</span>
                </div>
              </label>
            </div>
          </div>

          <div className="p-3 bg-surface-soft/60 dark:bg-charcoal-800/60 rounded-xl border border-border/80 dark:border-charcoal-700 text-xs space-y-1">
            <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">Export Ledger Context</span>
            <div className="text-[11px] text-charcoal-600 dark:text-charcoal-400 flex items-center gap-2 flex-wrap">
              <span>Course: <strong className="text-charcoal-900 dark:text-ivory-100 font-mono">{selectedCourse}</strong></span>
              <span>•</span>
              <span>Session Date: <strong className="text-charcoal-900 dark:text-ivory-100 font-mono">{selectedDate}</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTriggerReport}
              disabled={isGeneratingReport}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-rose-primary to-rose-dark hover:shadow-md text-white rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingReport ? "Exporting..." : "Download Official Report"}</span>
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
