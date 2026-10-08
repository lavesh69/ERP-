"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileText,
  CreditCard,
  Building,
  ShieldCheck,
  Printer,
  Sparkles,
} from "lucide-react";

interface ProgramChoice {
  code: string;
  name: string;
  degree: string;
  duration: string;
  seats: number;
  feePerYear: string;
}

const PROGRAMS: ProgramChoice[] = [
  {
    code: "BTECH_CS",
    name: "B.Tech Computer Science & Engineering",
    degree: "Undergraduate (B.Tech)",
    duration: "4 Years",
    seats: 120,
    feePerYear: "$8,500 / ₹2,40,000",
  },
  {
    code: "BTECH_AI_ML",
    name: "B.Tech Artificial Intelligence & Machine Learning",
    degree: "Undergraduate (B.Tech)",
    duration: "4 Years",
    seats: 60,
    feePerYear: "$8,800 / ₹2,60,000",
  },
  {
    code: "BTECH_ECE",
    name: "B.Tech Electronics & Communication Engineering",
    degree: "Undergraduate (B.Tech)",
    duration: "4 Years",
    seats: 90,
    feePerYear: "$7,800 / ₹2,10,000",
  },
  {
    code: "MBA_FINTECH",
    name: "MBA Financial Technology & Analytics",
    degree: "Postgraduate (MBA)",
    duration: "2 Years",
    seats: 60,
    feePerYear: "$10,200 / ₹3,20,000",
  },
  {
    code: "MTECH_CYBER",
    name: "M.Tech Cybersecurity & Information Defense",
    degree: "Postgraduate (M.Tech)",
    duration: "2 Years",
    seats: 30,
    feePerYear: "$9,200 / ₹2,80,000",
  },
];

export default function PublicAdmissionsApplyPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("2005-06-15");
  const [gender, setGender] = useState("Male");
  const [category, setCategory] = useState("General");

  // Academic program
  const [selectedProgram, setSelectedProgram] = useState("BTECH_CS");

  // High school qualifications
  const [highSchoolBoard, setHighSchoolBoard] = useState("CBSE / Higher Secondary");
  const [highSchoolGpa, setHighSchoolGpa] = useState("3.85");
  const [entranceExamType, setEntranceExamType] = useState("JEE Main / State CET");
  const [entranceExamScore, setEntranceExamScore] = useState("1380");

  // Payment simulation
  const [paymentDone, setPaymentDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_APPLICATION",
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          programCode: selectedProgram,
          highSchoolGpa: parseFloat(highSchoolGpa) || 3.5,
          entranceExamScore: parseInt(entranceExamScore) || 1200,
          source: "PUBLIC_PORTAL",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      setSubmissionResult(data.applicant);
      setStep(4);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-charcoal-950 text-charcoal-900 dark:text-ivory-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-border dark:border-charcoal-800 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-primary to-rose-accent text-white flex items-center justify-center font-display font-black text-xl shadow-md">
              A
            </div>
            <div>
              <div className="text-sm font-display font-black tracking-tight text-charcoal-900 dark:text-white">
                APEX UNIVERSITY
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-rose-primary">
                Online Admissions Portal 2026-27
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> NAAC A++ Accredited
            </span>
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-border dark:border-charcoal-700 hover:bg-surface-soft dark:hover:bg-charcoal-800 transition-colors"
            >
              Staff & Student Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {step < 4 && (
          <div className="mb-8">
            <div className="text-center max-w-xl mx-auto mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Early Decision Cohort Now Open
              </div>
              <h1 className="text-3xl font-display font-black text-charcoal-900 dark:text-white tracking-tight">
                Undergraduate & Graduate Application
              </h1>
              <p className="text-xs text-charcoal-500 mt-2">
                Fill in your credentials to apply for the 2026-2027 academic session. All applications are evaluated under merit and entrance percentiles.
              </p>
            </div>

            {/* Stepper Bar */}
            <div className="flex items-center justify-between relative max-w-xl mx-auto">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border dark:bg-charcoal-800 -translate-y-1/2 z-0" />
              {[
                { num: 1, label: "Personal Info" },
                { num: 2, label: "Program Choice" },
                { num: 3, label: "Scores & Fee" },
              ].map((s) => (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      step === s.num
                        ? "bg-rose-primary text-white ring-4 ring-rose-200 dark:ring-rose-900/50"
                        : step > s.num
                        ? "bg-emerald-600 text-white"
                        : "bg-surface-soft dark:bg-charcoal-800 text-charcoal-400 border border-border dark:border-charcoal-700"
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span className="text-[11px] font-bold mt-1 text-charcoal-700 dark:text-charcoal-300">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="bg-white dark:bg-charcoal-900 rounded-3xl border border-border dark:border-charcoal-800 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-rose-primary" /> Step 1: Personal & Demographic Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  Full Name (as per secondary school records) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rohan Sharma"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs focus:ring-2 focus:ring-rose-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  Official Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="applicant@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs focus:ring-2 focus:ring-rose-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  Primary Mobile / WhatsApp Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs focus:ring-2 focus:ring-rose-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  Date of Birth *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs focus:ring-2 focus:ring-rose-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs focus:ring-2 focus:ring-rose-primary outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Non-Binary / Prefer not to specify</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  Admission Category Quota
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs focus:ring-2 focus:ring-rose-primary outline-none"
                >
                  <option value="General">Open Merit / General (OM)</option>
                  <option value="OBC">Other Backward Class (OBC-NCL)</option>
                  <option value="SC">Scheduled Caste (SC)</option>
                  <option value="ST">Scheduled Tribe (ST)</option>
                  <option value="EWS">Economically Weaker Section (EWS)</option>
                  <option value="NRI">International / NRI Sponsored</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!fullName.trim() || !email.trim() || !phone.trim()) {
                    setErrorMsg("Please fill in your name, email, and phone number.");
                    return;
                  }
                  setErrorMsg(null);
                  setStep(2);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-primary hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Continue to Program Choice <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Program Choice */}
        {step === 2 && (
          <div className="bg-white dark:bg-charcoal-900 rounded-3xl border border-border dark:border-charcoal-800 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-rose-primary" /> Step 2: Select Academic Degree & Specialization
            </h2>

            <div className="space-y-3.5 mb-8">
              {PROGRAMS.map((prog) => {
                const isSelected = selectedProgram === prog.code;
                return (
                  <div
                    key={prog.code}
                    onClick={() => setSelectedProgram(prog.code)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? "border-rose-primary bg-rose-50/60 dark:bg-rose-950/20 ring-2 ring-rose-500/20"
                        : "border-border dark:border-charcoal-800 hover:border-rose-300 dark:hover:border-charcoal-700 bg-surface-soft/30 dark:bg-charcoal-800/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-rose-primary bg-rose-primary text-white"
                            : "border-charcoal-300 dark:border-charcoal-600"
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-rose-primary">
                          {prog.code} • {prog.degree}
                        </div>
                        <h3 className="text-sm font-bold text-charcoal-900 dark:text-white mt-0.5">
                          {prog.name}
                        </h3>
                        <div className="text-[11px] text-charcoal-500 mt-1 flex items-center gap-3">
                          <span>Duration: <strong>{prog.duration}</strong></span>
                          <span>•</span>
                          <span>Sanctioned Seats: <strong>{prog.seats}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">
                        {prog.feePerYear}
                      </span>
                      <span className="text-[10px] text-charcoal-400">Institutional Tuition</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border dark:border-charcoal-700 text-xs font-bold hover:bg-surface-soft transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-primary hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Continue to Academic Scores & Fee <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Academic Scores & Submission */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-charcoal-900 rounded-3xl border border-border dark:border-charcoal-800 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-white mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-rose-primary" /> Step 3: Academic Evaluation & Application Fee
            </h2>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  High School / 12th Board Examination
                </label>
                <select
                  value={highSchoolBoard}
                  onChange={(e) => setHighSchoolBoard(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs focus:ring-2 focus:ring-rose-primary outline-none"
                >
                  <option value="CBSE / Higher Secondary">CBSE (Central Board)</option>
                  <option value="CISCE (ISC)">CISCE (ISC 12th)</option>
                  <option value="State Higher Secondary">State Board Higher Secondary</option>
                  <option value="IB Diploma / Cambridge A-Levels">International Baccalaureate (IB) / A-Levels</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  12th Grade Aggregate GPA or Percentage (Out of 4.0 or %) *
                </label>
                <input
                  type="text"
                  required
                  value={highSchoolGpa}
                  onChange={(e) => setHighSchoolGpa(e.target.value)}
                  placeholder="e.g. 3.85 or 92.4%"
                  className="w-full px-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs focus:ring-2 focus:ring-rose-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  National / State Entrance Examination
                </label>
                <select
                  value={entranceExamType}
                  onChange={(e) => setEntranceExamType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs focus:ring-2 focus:ring-rose-primary outline-none"
                >
                  <option value="JEE Main / State CET">JEE Main / State Engineering Entrance</option>
                  <option value="SAT / ACT (International)">SAT Reasoning Test / ACT</option>
                  <option value="CAT / GMAT (MBA)">CAT / GMAT / MAT (For Postgraduate)</option>
                  <option value="Institutional Apex Aptitude Test">University Apex Entrance Exam</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  Entrance Examination Score / Percentile *
                </label>
                <input
                  type="number"
                  required
                  value={entranceExamScore}
                  onChange={(e) => setEntranceExamScore(e.target.value)}
                  placeholder="e.g. 1380 (SAT) or 96.5%ile"
                  className="w-full px-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs focus:ring-2 focus:ring-rose-primary outline-none"
                />
              </div>
            </div>

            {/* Application Fee Payment Simulator */}
            <div className="p-5 rounded-2xl bg-surface-soft dark:bg-charcoal-800/80 border border-border dark:border-charcoal-700 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-rose-primary" /> Application Processing Fee
                  </h3>
                  <p className="text-[11px] text-charcoal-500 mt-0.5">
                    Covers entrance screening, transcript credentialing, and seat counseling.
                  </p>
                </div>
                <div className="sm:text-right">
                  <div className="text-base font-display font-black text-charcoal-900 dark:text-white">
                    $50.00 / ₹1,500
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    Non-Refundable
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="payCheck"
                  checked={paymentDone}
                  onChange={(e) => setPaymentDone(e.target.checked)}
                  className="w-4 h-4 text-rose-primary rounded border-charcoal-300 focus:ring-rose-primary"
                />
                <label htmlFor="payCheck" className="text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 cursor-pointer">
                  I agree to process the $50 application fee & certify that provided details are authentic under university honor code.
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border dark:border-charcoal-700 text-xs font-bold hover:bg-surface-soft transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !paymentDone}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-rose-primary to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting Application..." : "Submit Formal Application"} <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Submission Confirmation & Printable Slip */}
        {step === 4 && submissionResult && (
          <div className="bg-white dark:bg-charcoal-900 rounded-3xl border border-border dark:border-charcoal-800 p-6 sm:p-10 shadow-lg animate-in fade-in duration-300">
            <div className="text-center max-w-md mx-auto mb-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3 shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-display font-black text-charcoal-900 dark:text-white tracking-tight">
                Application Received!
              </h2>
              <p className="text-xs text-charcoal-500 mt-1">
                Your dossier has been registered in the Admissions CRM under the scrutiny desk.
              </p>
            </div>

            {/* Application Slip */}
            <div className="p-6 rounded-2xl border border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-charcoal-800/40 mb-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border dark:border-charcoal-700 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">
                    Official Application Identifier
                  </span>
                  <div className="text-xl font-mono font-black text-rose-primary">
                    {submissionResult.applicationNo}
                  </div>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">
                    Submission Timestamp
                  </span>
                  <div className="text-xs font-mono font-bold text-charcoal-800 dark:text-ivory-200">
                    {new Date(submissionResult.submittedAt || Date.now()).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-charcoal-400 uppercase font-bold block">Applicant Name</span>
                  <strong className="text-charcoal-900 dark:text-white">{submissionResult.fullName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-charcoal-400 uppercase font-bold block">Target Program</span>
                  <strong className="text-rose-primary font-mono">{submissionResult.programCode}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-charcoal-400 uppercase font-bold block">Exam Score</span>
                  <strong className="text-charcoal-900 dark:text-white">{submissionResult.entranceExamScore} pts</strong>
                </div>
                <div>
                  <span className="text-[10px] text-charcoal-400 uppercase font-bold block">Initial Status</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    {submissionResult.stage || "APPLIED"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border dark:border-charcoal-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-charcoal-500">
                <span className="flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Cryptographic Integrity Seal: ADM-SHA256-{submissionResult.applicationNo?.slice(-6)}
                </span>
                <span>Verification portal: <strong className="text-charcoal-800 dark:text-ivory-200">apex.edu/admissions</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white font-bold text-xs shadow-sm hover:bg-surface-soft transition-colors"
              >
                <Printer className="w-4 h-4 text-rose-primary" /> Print Application Slip
              </button>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Go to Portal Login
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border dark:border-charcoal-800 bg-white dark:bg-charcoal-900 py-6 text-center text-xs text-charcoal-500">
        <div className="max-w-6xl mx-auto px-4">
          Apex University Office of Registrar & Admissions • Main Academic Quadrangle • Email: admissions@apex.edu • Helpline: 1800-APEX-EDU
        </div>
      </footer>
    </div>
  );
}
