"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Send,
  Users,
  Search,
  BookOpen,
  Building,
  DollarSign,
  PackageCheck,
  Download,
  Filter,
  Eye,
  Printer,
  X,
  RotateCcw,
  FileCode,
  Copy,
  Check,
  FileText,
} from "lucide-react";

interface Candidate {
  id: string;
  candidateRef: string;
  studentRoll: string;
  fullName: string;
  program: string;
  finalCgpa: number;
  honorsCategory: string;
  isMedalist: boolean;
  medalType?: string;
  noDuesStatus: {
    LIBRARY: boolean;
    HOSTEL: boolean;
    FINANCE: boolean;
    LABORATORY: boolean;
    SPORTS_COUNCIL: boolean;
    ALUMNI_ASSOCIATION: boolean;
  };
  allClearancesGranted: boolean;
  convocationRegistered: boolean;
  robeSize?: string;
  guestPassesCount: number;
  degreeDispatchMode: string;
  courierTrackingAwb?: string;
  certificateHash: string;
}

export default function ConvocationPage() {
  const [activeTab, setActiveTab] = useState<"clearance" | "ceremony" | "medals">("clearance");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchRoll, setSearchRoll] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedCandidateDossier, setSelectedCandidateDossier] = useState<Candidate | null>(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regData, setRegData] = useState({
    robeSize: "L" as "S" | "M" | "L" | "XL",
    guestPassesCount: 2,
    degreeDispatchMode: "CONVOCATION_IN_PERSON" as "CONVOCATION_IN_PERSON" | "POSTAL_SPEEDPOST" | "COLLECT_AT_REGISTRAR",
  });
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [filterProgram, setFilterProgram] = useState("ALL");
  const [filterClearance, setFilterClearance] = useState("ALL");

  const handleExportConvocationCsv = () => {
    const headers = "Candidate Ref,Student Roll,Full Name,Program,Final CGPA,Honors,Medalist,All Clearances,Registered For Ceremony,Gown Size,Guest Passes,Dispatch Mode,Certificate Seal Hash\n";
    const rows = filteredCandidates
      .map((c) => `"${c.candidateRef}","${c.studentRoll}","${c.fullName}","${c.program}",${c.finalCgpa},"${c.honorsCategory}",${c.isMedalist},${c.allClearancesGranted},${c.convocationRegistered},"${c.robeSize || "N/A"}",${c.guestPassesCount},"${c.degreeDispatchMode}","${c.certificateHash}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Convocation_Degree_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [showNadModal, setShowNadModal] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);

  const generateNadXml = (cands: Candidate[]) => {
    const awardList = cands
      .map(
        (c) => `    <DegreeCertificate>
      <StudentDetail>
        <ABC_Account_ID>ABC-${(c.studentRoll.replace(/[^0-9]/g, "") || "992481").padStart(6, "0")}-2026</ABC_Account_ID>
        <RollNo>${c.studentRoll}</RollNo>
        <StudentName>${c.fullName.replace(/&/g, "&amp;")}</StudentName>
      </StudentDetail>
      <AwardDetail>
        <DegreeName>${c.program.replace(/&/g, "&amp;")}</DegreeName>
        <CGPA>${c.finalCgpa.toFixed(2)}</CGPA>
        <Classification>${c.honorsCategory.replace(/&/g, "&amp;")}</Classification>
        <Medalist>${c.isMedalist ? (c.medalType || "YES") : "NO"}</Medalist>
        <ClearanceCertified>${c.allClearancesGranted ? "TRUE" : "FALSE"}</ClearanceCertified>
        <DigitalCertificateDigest>${c.certificateHash}</DigitalCertificateDigest>
        <AuthoritySignatory>Registrar &amp; Controller of Examinations, Apex University</AuthoritySignatory>
      </AwardDetail>
    </DegreeCertificate>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<AcademicAwards xmlns="http://nad.gov.in/schema/v1.2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  institutionCode="UGC-IND-APEX-2026"
  institutionName="Apex University of Science and Technology"
  batchYear="2026"
  convocationCycle="42nd Annual Convocation"
  certifiedTimestamp="${new Date().toISOString()}">
  <RecordCount>${cands.length}</RecordCount>
  <AwardsList>
${awardList}
  </AwardsList>
</AcademicAwards>`;
  };

  const handleDownloadNadXml = (cands = filteredCandidates) => {
    const xmlContent = generateNadXml(cands);
    const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DigiLocker_NAD_Awards_ApexUniv_${new Date().toISOString().split("T")[0]}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, candRes] = await Promise.all([
        fetch("/api/convocation?tab=summary"),
        fetch("/api/convocation?tab=candidates"),
      ]);

      const sumData = await sumRes.json();
      const candData = await candRes.json();

      if (sumData.success) setSummary(sumData.summary);
      if (candData.success) setCandidates(candData.candidates || []);
    } catch (err) {
      console.error("Error fetching convocation data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleClearance = async (candidateId: string, department: string, currentVal: boolean) => {
    try {
      const res = await fetch("/api/convocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_CLEARANCE",
          candidateId,
          department,
          isCleared: !currentVal,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: `Department clearance updated successfully.`, type: "success" });
        fetchData();
      } else {
        setMessage({ text: data.error || "Failed to update clearance", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error", type: "error" });
    }
  };

  const handleRegisterCeremony = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    try {
      const res = await fetch("/api/convocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REGISTER_CEREMONY",
          candidateId: selectedCandidate.id,
          ...regData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: `Registered for Convocation successfully!`, type: "success" });
        setShowRegModal(false);
        fetchData();
      } else {
        setMessage({ text: data.error || "Registration failed", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error", type: "error" });
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchRoll.toLowerCase()) ||
      c.studentRoll.toLowerCase().includes(searchRoll.toLowerCase());
    const matchesProgram = filterProgram === "ALL" || c.program.includes(filterProgram);
    const matchesClearance =
      filterClearance === "ALL" ||
      (filterClearance === "CLEARED" && c.allClearancesGranted) ||
      (filterClearance === "PENDING" && !c.allClearancesGranted);
    return matchesSearch && matchesProgram && matchesClearance;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Convocation & Degree Conferral Portal
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Multi-Department No-Dues Clearance, Academic Honors, Gown Allocation & Degree Dispatch
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search roll / name..."
              value={searchRoll}
              onChange={(e) => setSearchRoll(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-44"
            />
          </div>
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Programs</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Electronics">Electronics</option>
          </select>
          <select
            value={filterClearance}
            onChange={(e) => setFilterClearance(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Clearances</option>
            <option value="CLEARED">100% Cleared</option>
            <option value="PENDING">Dues Pending</option>
          </select>
          <button
            onClick={() => setShowNadModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/20"
          >
            <FileCode className="w-3.5 h-3.5" />
            DigiLocker / NAD XML
          </button>
          <button
            onClick={handleExportConvocationCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {message.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Graduation Candidates</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : summary?.totalCandidates || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Class of 2026 Batch</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fully Cleared (No-Dues)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : summary?.fullyCleared || 0}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Eligible for degree award</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Convocation Registered</span>
            <GraduationCap className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : summary?.registeredForConvocation || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Gown & Robe reserved</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gold Medalists & Honors</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : summary?.honorMedalistsCount || 0}
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Dean's List / Gold Medal</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("clearance")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "clearance"
              ? "border-amber-600 text-amber-600 dark:text-amber-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          No-Dues Clearance Matrix
        </button>
        <button
          onClick={() => setActiveTab("ceremony")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "ceremony"
              ? "border-amber-600 text-amber-600 dark:text-amber-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Ceremony & Robe Allocation
        </button>
        <button
          onClick={() => setActiveTab("medals")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "medals"
              ? "border-amber-600 text-amber-600 dark:text-amber-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Award className="w-4 h-4" />
          Distinction Honors Roll
        </button>
      </div>

      {/* Tab 1: Clearance Matrix */}
      {activeTab === "clearance" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">CGPA</th>
                  <th className="py-3 px-4 text-center">Library</th>
                  <th className="py-3 px-4 text-center">Hostel</th>
                  <th className="py-3 px-4 text-center">Finance</th>
                  <th className="py-3 px-4 text-center">Labs</th>
                  <th className="py-3 px-4 text-center">Sports</th>
                  <th className="py-3 px-4 text-center">Alumni</th>
                  <th className="py-3 px-4">Overall Standing</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{c.fullName}</div>
                      <div className="text-xs font-mono text-slate-400">{c.studentRoll} • {c.program}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {c.finalCgpa}
                    </td>

                    {/* Department Toggles */}
                    {[
                      { key: "LIBRARY" as const, label: "Library" },
                      { key: "HOSTEL" as const, label: "Hostel" },
                      { key: "FINANCE" as const, label: "Finance" },
                      { key: "LABORATORY" as const, label: "Lab" },
                      { key: "SPORTS_COUNCIL" as const, label: "Sports" },
                      { key: "ALUMNI_ASSOCIATION" as const, label: "Alumni" },
                    ].map(({ key }) => (
                      <td key={key} className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleClearance(c.id, key, c.noDuesStatus[key])}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title={`Toggle ${key} clearance`}
                        >
                          {c.noDuesStatus[key] ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-500 mx-auto" />
                          )}
                        </button>
                      </td>
                    ))}

                    <td className="py-3 px-4">
                      {c.allClearancesGranted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          CLEARED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          PENDING DUES
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedCandidateDossier(c)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          Dossier
                        </button>
                        {c.allClearancesGranted && !c.convocationRegistered ? (
                          <button
                            onClick={() => {
                              setSelectedCandidate(c);
                              setShowRegModal(true);
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition"
                          >
                            Register Gown
                          </button>
                        ) : c.convocationRegistered ? (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                            Gown Confirmed ({c.robeSize})
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Clear Dues First</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCandidates.length === 0 && (
            <div className="py-16 text-center border-t border-slate-100 dark:border-slate-800">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">No Candidates Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No graduation candidates match query &ldquo;{searchRoll}&rdquo; and criteria.
              </p>
              <button
                onClick={() => {
                  setSearchRoll("");
                  setFilterProgram("ALL");
                  setFilterClearance("ALL");
                }}
                className="mt-4 px-4 py-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-amber-100 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Ceremony & Robes */}
      {activeTab === "ceremony" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {candidates
              .filter((c) => c.convocationRegistered)
              .map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{c.fullName}</h3>
                      <p className="text-xs text-slate-500">{c.studentRoll} • {c.program}</p>
                    </div>
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold">
                      Robe: {c.robeSize}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Guest Passes:</span>
                      <span className="font-semibold">{c.guestPassesCount} Passes Issued</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conferral Mode:</span>
                      <span className="font-semibold">{c.degreeDispatchMode}</span>
                    </div>
                    {c.courierTrackingAwb && (
                      <div className="flex justify-between">
                        <span>SpeedPost Tracking:</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {c.courierTrackingAwb}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-xs text-slate-500 break-all">
                    Certificate Seal: {c.certificateHash}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setSelectedCandidateDossier(c)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Degree Dossier
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {candidates.filter((c) => c.convocationRegistered).length === 0 && (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">No Ceremony Registrations</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No students have confirmed gown sizes or convocation seating yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Medals & Honors */}
      {activeTab === "medals" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidates
              .filter((c) => c.isMedalist || c.honorsCategory === "FIRST_CLASS_WITH_DISTINCTION")
              .map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                      <Award className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{c.fullName}</h3>
                      <p className="text-xs text-slate-500">{c.studentRoll} • {c.program}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          CGPA: {c.finalCgpa}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                          {c.honorsCategory}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {c.isMedalist && (
                      <span className="px-3 py-1.5 bg-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider">
                        {c.medalType?.replace("_", " ")}
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedCandidateDossier(c)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Dossier
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {candidates.filter((c) => c.isMedalist || c.honorsCategory === "FIRST_CLASS_WITH_DISTINCTION").length === 0 && (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">No Distinction Candidates</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No candidates currently classified with First Class with Distinction or Medals.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Registration Modal */}
      {showRegModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Convocation Ceremony Registration
              </h2>
              <button
                onClick={() => setShowRegModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterCeremony} className="space-y-4 text-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedCandidate.fullName} ({selectedCandidate.studentRoll})
                </p>
                <p className="text-xs text-slate-500">{selectedCandidate.program}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Convocation Academic Robe Size
                </label>
                <select
                  value={regData.robeSize}
                  onChange={(e) => setRegData({ ...regData, robeSize: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="S">Small (Height &lt; 5'4")</option>
                  <option value="M">Medium (Height 5'4" - 5'9")</option>
                  <option value="L">Large (Height 5'10" - 6'1")</option>
                  <option value="XL">Extra Large (Height &gt; 6'1")</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Guest Passes for Family (Max 3)
                </label>
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={regData.guestPassesCount}
                  onChange={(e) =>
                    setRegData({ ...regData, guestPassesCount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Degree Conferral / Dispatch Mode
                </label>
                <select
                  value={regData.degreeDispatchMode}
                  onChange={(e) =>
                    setRegData({ ...regData, degreeDispatchMode: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="CONVOCATION_IN_PERSON">In-Person on Stage (Convocation Day)</option>
                  <option value="POSTAL_SPEEDPOST">Courier SpeedPost to Registered Address</option>
                  <option value="COLLECT_AT_REGISTRAR">Collection at Registrar Counter</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convocation Degree & Clearance Dossier Modal */}
      {selectedCandidateDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      {selectedCandidateDossier.fullName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      CGPA {selectedCandidateDossier.finalCgpa}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Roll: {selectedCandidateDossier.studentRoll} • {selectedCandidateDossier.program}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidateDossier(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Honors & Medal Banner */}
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-xl border border-amber-300 dark:border-amber-700/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                  Academic Degree Classification
                </span>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {selectedCandidateDossier.honorsCategory.replace(/_/g, " ")}
                </div>
              </div>
              {selectedCandidateDossier.isMedalist && (
                <span className="px-3 py-1 bg-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  {selectedCandidateDossier.medalType?.replace(/_/g, " ")}
                </span>
              )}
            </div>

            {/* 6-Department Clearance Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  6-Department Statutory Clearances
                </h4>
                <span className={`text-[11px] font-bold ${selectedCandidateDossier.allClearancesGranted ? "text-emerald-600" : "text-amber-600"}`}>
                  {selectedCandidateDossier.allClearancesGranted ? "✓ 100% Cleared for Degree" : "Pending Verification"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {Object.entries(selectedCandidateDossier.noDuesStatus).map(([dept, isCleared]) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={async () => {
                      const nextVal = !isCleared;
                      await handleToggleClearance(selectedCandidateDossier.id, dept, Boolean(isCleared));
                      setSelectedCandidateDossier((prev: any) => {
                        const updatedStatus = { ...prev.noDuesStatus, [dept]: nextVal };
                        const allCleared = Object.values(updatedStatus).every(Boolean);
                        return { ...prev, noDuesStatus: updatedStatus, allClearancesGranted: allCleared };
                      });
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${
                      isCleared
                        ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    <div className="font-semibold text-[11px]">{dept.replace(/_/g, " ")}</div>
                    <div className="text-[10px] font-mono mt-0.5">{isCleared ? "✓ CLEARED" : "✕ PENDING (Click)"}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ceremony Logistics & Degree Delivery */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-medium block">Ceremony Allocation</span>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {selectedCandidateDossier.convocationRegistered ? `Gown Size: ${selectedCandidateDossier.robeSize}` : "Not Registered"}
                </span>
                <span className="text-slate-500 block">
                  {selectedCandidateDossier.guestPassesCount} Guest Seat Passes Reserved
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-medium block">Conferral & Dispatch</span>
                <span className="font-semibold text-slate-900 dark:text-white block truncate">
                  {selectedCandidateDossier.degreeDispatchMode.replace(/_/g, " ")}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono block truncate">
                  AWB: {selectedCandidateDossier.courierTrackingAwb || "Registrar Vault Delivery"}
                </span>
              </div>
            </div>

            {/* DigiLocker / APAAR ID Integration Card */}
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div className="text-xs">
                  <div className="font-bold text-indigo-950 dark:text-indigo-200">
                    National Academic Depository (NAD) / DigiLocker
                  </div>
                  <div className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300">
                    ABC ID: ABC-{(selectedCandidateDossier.studentRoll.replace(/[^0-9]/g, "") || "992481").padStart(6, "0")}-2026 • Verified
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadNadXml([selectedCandidateDossier])}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export XML
              </button>
            </div>

            {/* Cryptographic Proof Hash */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs space-y-1 font-mono border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Registrar Cryptographic Degree Seal Hash</span>
              <p className="text-slate-700 dark:text-slate-300 break-all text-[11px]">{selectedCandidateDossier.certificateHash}</p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Degree Dossier
              </button>
              <button
                onClick={() => setSelectedCandidateDossier(null)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DigiLocker / NAD XML Payload Exporter Modal */}
      {showNadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <FileCode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      DigiLocker / NAD Academic Awards XML Payload
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      SCHEMA v1.2 VALID
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Compliant with Government of India Ministry of Education National Academic Depository
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span>Candidate Records Packaged: <strong>{filteredCandidates.length} Awardees</strong></span>
              <span>Statutory Entity: <strong>UGC-IND-APEX-2026</strong></span>
            </div>

            <div className="relative">
              <div className="max-h-64 overflow-y-auto p-4 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] leading-relaxed border border-slate-800 selection:bg-emerald-800">
                <pre>{generateNadXml(filteredCandidates)}</pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(generateNadXml(filteredCandidates));
                  setCopiedXml(true);
                  setTimeout(() => setCopiedXml(false), 2500);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                {copiedXml ? "Copied XML!" : "Copy XML to Clipboard"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNadModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadNadXml(filteredCandidates)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .XML File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
