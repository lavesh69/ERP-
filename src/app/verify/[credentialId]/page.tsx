import React from "react";
import { verifyCredentialRecord } from "@/lib/credentials/credential-verification-engine";
import { ShieldCheck, CheckCircle2, AlertTriangle, GraduationCap, Building2, Calendar, Award } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    credentialId: string;
  }>;
}

export default async function CredentialVerificationPage({ params }: PageProps) {
  const { credentialId } = await params;
  const credential = await verifyCredentialRecord(credentialId);

  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-charcoal-950 text-charcoal-900 dark:text-ivory-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 selection:bg-rose-500 selection:text-white">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Apex University of Science & Technology</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official Public Credential & Degree Verification Portal
          </p>
        </div>

        {credential ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            {/* Status Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50 p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Officially Verified Academic Credential
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                    AUTHENTIC
                  </span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Cryptographic verification succeeded against the university registry.
                </p>
              </div>
            </div>

            {/* Document Details */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Awarded Scholar</div>
                  <div className="text-sm font-semibold mt-0.5 text-slate-800 dark:text-slate-200">
                    {credential.scholarNameMasked}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Roll Identifier</div>
                  <div className="text-sm font-semibold font-mono mt-0.5 text-slate-800 dark:text-slate-200">
                    {credential.rollNumberMasked}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Program & Degree Title</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {credential.programTitle}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {credential.departmentName}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-y border-slate-100 dark:border-slate-800 py-4">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Year
                  </div>
                  <div className="text-sm font-bold mt-1">{credential.graduationYear}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Award className="w-3 h-3" /> CGPA / Grade
                  </div>
                  <div className="text-sm font-bold mt-1 text-indigo-600 dark:text-indigo-400">
                    {credential.cgpa.toFixed(2)} ({credential.letterGrade.split(" ")[0]})
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Standing</div>
                  <div className="text-xs font-semibold mt-1 text-slate-700 dark:text-slate-300">
                    {credential.division.replace(/_/g, " ")}
                  </div>
                </div>
              </div>

              {/* Cryptographic Seal */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Cryptographic Seal (SHA-256)
                  </span>
                  <span>UGC & NEP 2020 Validated</span>
                </div>
                <div className="text-xs font-mono break-all text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  {credential.digitalSeal}
                </div>
                {credential.apaarIdMasked && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    APAAR Account ID: <span className="font-mono">{credential.apaarIdMasked}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xl overflow-hidden p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-rose-700 dark:text-rose-400">
              Credential Verification Failed
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
              No matching record or digital seal could be identified for identifier:{" "}
              <span className="font-mono font-semibold">{credentialId}</span>.
            </p>
            <p className="text-xs text-slate-500 mt-4">
              Please ensure the credential ID or QR scan code was entered accurately. If you believe this is in error, contact the Office of the Controller of Examinations.
            </p>
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Institutional User Login →
          </Link>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 dark:text-slate-600 mt-8">
        CLASSROOM ERP • Apex University Academic Registry Security Gateway • ISO 27001 & SOC 2 Certified
      </footer>
    </div>
  );
}
