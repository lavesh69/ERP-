"use client";

import React, { useState, useEffect } from "react";
import { Award, CheckCircle2, AlertCircle, Plus, ShieldCheck, FileCheck, Clock } from "lucide-react";

interface ActivityPointsTabProps {
  studentId: string;
  studentName: string;
}

export function ActivityPointsTab({ studentId, studentName }: ActivityPointsTabProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimForm, setClaimForm] = useState({
    category: "TECHNICAL_HACKATHONS",
    title: "",
    issuingOrganization: "",
    academicYear: "2025-26",
    pointsClaimed: 20,
    evidenceDocumentUrl: "https://apex.edu/credentials/cert-demo.pdf",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPoints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/activity-points?studentId=${studentId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load activity points", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, [studentId]);

  useEffect(() => {
    if (!showClaimModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowClaimModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showClaimModal]);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/students/activity-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_CLAIM",
          studentId,
          ...claimForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowClaimModal(false);
        setClaimForm({
          category: "TECHNICAL_HACKATHONS",
          title: "",
          issuingOrganization: "",
          academicYear: "2025-26",
          pointsClaimed: 20,
          evidenceDocumentUrl: "https://apex.edu/credentials/cert-demo.pdf",
        });
        fetchPoints();
      }
    } catch (err) {
      console.error("Failed to submit activity point claim", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-charcoal-800 p-8 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft text-center text-charcoal-500 text-xs">
        Auditing AICTE activity points register and degree clearance compliance...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-charcoal-800 p-8 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft text-center text-charcoal-500 text-xs">
        No AICTE activity point records found for this student.
      </div>
    );
  }

  const isCleared = data.isDegreeClearanceGranted;
  const progressPct = Math.min(100, Math.round((data.totalPointsEarned / data.thresholdRequired) * 100));

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
            <Award className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
                AICTE 100 Mandatory Activity Points & Degree Clearance
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                STATUTORY AICTE
              </span>
            </div>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
              Under AICTE Model Curriculum regulations, undergraduate engineering scholars must earn a minimum of 100 non-academic activity points for graduation clearance.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowClaimModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-deep text-white text-xs font-bold transition-all shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Submit Activity Claim</span>
        </button>
      </div>

      {/* Degree Clearance Certificate Banner */}
      <div
        className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isCleared
            ? "bg-green-50/80 dark:bg-green-950/20 border-green-200 dark:border-green-800"
            : "bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
        }`}
      >
        <div className="flex items-center gap-3">
          {isCleared ? (
            <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                {isCleared ? "AICTE Graduation Degree Clearance Status: CLEARED" : "AICTE Graduation Clearance: IN PROGRESS"}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isCleared ? "bg-green-600 text-white" : "bg-amber-500 text-white"
                }`}
              >
                {data.totalPointsEarned} / {data.thresholdRequired} PTS
              </span>
            </div>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
              {isCleared
                ? `Scholar has satisfied the 100-point threshold. Certificate Seal: ${data.clearanceCertificateSeal}`
                : `Scholar needs ${data.thresholdRequired - data.totalPointsEarned} additional verified points to attain formal degree convocation clearance.`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col gap-1 w-full md:w-60">
          <div className="flex justify-between text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
            <span>Threshold Progress</span>
            <span>{progressPct}%</span>
          </div>
          <div className="w-full bg-charcoal-200 dark:bg-charcoal-700 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isCleared ? "bg-green-600" : "bg-amber-500"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5 Categories Breakdown Grid */}
      <div>
        <h4 className="text-xs font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider mb-3">
          AICTE Prescribed Categories Performance
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {data.categoryBreakdown &&
            Object.entries(data.categoryBreakdown).map(([catKey, catVal]: [string, any]) => (
              <div
                key={catKey}
                className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 uppercase block truncate" title={catVal.categoryName}>
                    {catVal.categoryName}
                  </span>
                  <div className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                    {catVal.earnedPoints} <span className="text-xs font-normal text-charcoal-400">/ {catVal.maxCapPoints}</span>
                  </div>
                </div>
                <div className="w-full bg-charcoal-100 dark:bg-charcoal-700 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-rose-primary rounded-full"
                    style={{ width: `${Math.min(100, (catVal.earnedPoints / catVal.maxCapPoints) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Verified Claims History */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
        <h4 className="text-xs font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-rose-primary" /> Submitted & Verified Claims Register
        </h4>

        <div className="divide-y divide-border dark:divide-charcoal-700">
          {data.claims?.map((claim: any) => (
            <div key={claim.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">{claim.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      claim.status === "VERIFIED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : claim.status === "SUBMITTED"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>
                <span className="text-[11px] text-charcoal-500">
                  {claim.issuingOrganization} • Academic Year {claim.academicYear} • Category: {claim.category.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-display font-bold text-rose-primary">
                  +{claim.pointsAwarded || claim.pointsClaimed} Pts
                </span>
                {claim.verificationSeal && (
                  <span className="text-[10px] text-charcoal-400 font-mono hidden md:inline">
                    Seal: {claim.verificationSeal.substring(0, 16)}...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Claim Submission Modal */}
      {showClaimModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Submit AICTE Activity Point Claim"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowClaimModal(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4">
            <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
              Submit AICTE Activity Point Claim
            </h3>
            <form onSubmit={handleSubmitClaim} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Activity Category *
                </label>
                <select
                  value={claimForm.category}
                  onChange={(e) => setClaimForm({ ...claimForm, category: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 font-medium"
                >
                  <option value="NATIONAL_INITIATIVES">National Initiatives (NSS, NCC, Swachh Bharat)</option>
                  <option value="SPORTS_CULTURAL">Sports & Cultural Participation</option>
                  <option value="TECHNICAL_HACKATHONS">Technical Hackathons & Paper Publications</option>
                  <option value="ENTREPRENEURSHIP_INNOVATION">Entrepreneurship & Start-up Initiatives</option>
                  <option value="COMMUNITY_OUTREACH">Community Outreach & Rural Engagement</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Certificate / Activity Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart India Hackathon 2025 Finalist"
                  value={claimForm.title}
                  onChange={(e) => setClaimForm({ ...claimForm, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Issuing Organization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AICTE / MoE Innovation Cell"
                    value={claimForm.issuingOrganization}
                    onChange={(e) => setClaimForm({ ...claimForm, issuingOrganization: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Points Claimed *
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={50}
                    value={claimForm.pointsClaimed}
                    onChange={(e) => setClaimForm({ ...claimForm, pointsClaimed: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-deep text-white transition-all shadow-sm"
                >
                  {submitting ? "Submitting..." : "Submit Claim for Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
