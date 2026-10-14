"use client";

import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Award,
  BookOpen,
  DollarSign,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Landmark,
  FileText,
} from "lucide-react";

interface ResearchGrantsPortfolioTabProps {
  facultyId: string;
  facultyName: string;
}

export function ResearchGrantsPortfolioTab({ facultyId, facultyName }: ResearchGrantsPortfolioTabProps) {
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any>(null);

  // Modal States
  const [modalType, setModalType] = useState<"PUB" | "GRANT" | "PATENT" | null>(null);

  // Form States
  const [pubForm, setPubForm] = useState({
    title: "",
    journalName: "",
    issnOrIsbn: "",
    indexing: "SCOPUS",
    impactFactor: 3.5,
    authorshipRole: "FIRST_AUTHOR",
    totalAuthors: 3,
    doi: "",
    publicationYear: new Date().getFullYear(),
  });

  const [grantForm, setGrantForm] = useState({
    projectTitle: "",
    fundingAgency: "DST",
    sanctionOrderNumber: "",
    sanctionYear: new Date().getFullYear(),
    durationMonths: 36,
    totalOutlayInr: 2500000,
    fundsDisbursedInr: 1500000,
    investigatorRole: "PRINCIPAL_INVESTIGATOR",
    status: "ACTIVE",
  });

  const [patentForm, setPatentForm] = useState({
    title: "",
    patentOffice: "INDIA_IPO",
    applicationNumber: "",
    stage: "FILED",
    isNational: true,
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/faculty/research-portfolio?facultyId=${facultyId}`);
      const json = await res.json();
      if (json.success) {
        setPortfolio(json.portfolio);
      }
    } catch (err) {
      console.error("Failed to load faculty research portfolio", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [facultyId]);

  const handleAddPub = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/faculty/research-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_PUBLICATION",
          facultyId,
          facultyName,
          ...pubForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setModalType(null);
        fetchPortfolio();
      }
    } catch (err) {
      console.error("Failed to add publication", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/faculty/research-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_GRANT",
          facultyId,
          facultyName,
          ...grantForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setModalType(null);
        fetchPortfolio();
      }
    } catch (err) {
      console.error("Failed to log grant", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPatent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/faculty/research-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_PATENT",
          facultyId,
          facultyName,
          ...patentForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setModalType(null);
        fetchPortfolio();
      }
    } catch (err) {
      console.error("Failed to add patent", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-charcoal-800 p-8 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft text-center text-charcoal-500 text-xs">
        Auditing research outputs and calculating UGC Regulation 2018 Table 2 API score...
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="bg-white dark:bg-charcoal-800 p-8 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft text-center text-charcoal-500 text-xs">
        No research portfolio dossier found for this faculty member.
      </div>
    );
  }

  const ugc = portfolio.ugcApiSummary || {};

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-container dark:bg-rose-primary/20 text-rose-primary dark:text-rose-light flex items-center justify-center shrink-0 border border-rose-accent/30">
            <FlaskConical className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
                UGC Research, Grants, Patents &amp; Consultancy Ledger
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                UGC REGULATION 2018
              </span>
            </div>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
              Statutory Academic Performance Indicator (API) scoring under UGC Regulations 2018 Appendix II Table 2 for Career Advancement Scheme (CAS) promotions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setModalType("PUB")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-ivory-100 dark:bg-charcoal-700 text-charcoal-800 dark:text-ivory-100 border border-border dark:border-charcoal-600 hover:bg-rose-container transition-all"
          >
            <Plus className="h-3.5 w-3.5 text-rose-primary" />
            <span>Add Paper</span>
          </button>
          <button
            onClick={() => setModalType("GRANT")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-ivory-100 dark:bg-charcoal-700 text-charcoal-800 dark:text-ivory-100 border border-border dark:border-charcoal-600 hover:bg-rose-container transition-all"
          >
            <Plus className="h-3.5 w-3.5 text-rose-primary" />
            <span>Log Grant</span>
          </button>
          <button
            onClick={() => setModalType("PATENT")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-deep text-white transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Patent</span>
          </button>
        </div>
      </div>

      {/* UGC Research Score Summary Card */}
      <div className="bg-gradient-to-br from-white via-surface-ground to-rose-container/20 dark:from-charcoal-800 dark:via-charcoal-800 dark:to-charcoal-900/50 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold text-charcoal-500 uppercase">Total UGC Research Score</span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-4xl font-display font-extrabold text-charcoal-900 dark:text-ivory-100">
              {ugc.totalUgcResearchScore || 0}
            </span>
            <span className="text-xs font-bold text-rose-primary">API Points</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                ugc.eligibleForProfessorCas
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-300"
                  : "bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-300"
              }`}
            >
              {ugc.eligibleForProfessorCas ? "✓ Eligible for Professor CAS (>= 110 Pts)" : "Professor CAS Threshold: 110 Pts"}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                ugc.eligibleForAssociateProfessorCas
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-300"
                  : "bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-700 dark:text-charcoal-300"
              }`}
            >
              {ugc.eligibleForAssociateProfessorCas ? "✓ Eligible for Assoc. Professor CAS (>= 70 Pts)" : "Assoc. Professor CAS Threshold: 70 Pts"}
            </span>
          </div>
        </div>

        {/* 4 Category Breakdown Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-center">
            <span className="text-[10px] text-charcoal-500 font-bold block">Cat 1: Papers</span>
            <span className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
              {ugc.category1PublicationsScore || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-center">
            <span className="text-[10px] text-charcoal-500 font-bold block">Cat 2: Grants</span>
            <span className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
              {ugc.category2GrantsScore || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-center">
            <span className="text-[10px] text-charcoal-500 font-bold block">Cat 3: Patents</span>
            <span className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
              {ugc.category3PatentsPolicyScore || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-center">
            <span className="text-[10px] text-charcoal-500 font-bold block">Cat 4: Consultancy</span>
            <span className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
              {ugc.category4ConsultancyScore || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Publications Section */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-rose-primary" />
            Peer-Reviewed Journal Publications ({portfolio.publications?.length || 0})
          </h4>
          <span className="text-xs text-charcoal-500 font-medium">Scopus / Web of Science / UGC CARE</span>
        </div>

        <div className="divide-y divide-border dark:divide-charcoal-700">
          {portfolio.publications?.map((pub: any) => (
            <div key={pub.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-1 max-w-2xl">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">{pub.title}</span>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-charcoal-500">
                  <span>{pub.journalName} ({pub.publicationYear})</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {pub.indexing}
                  </span>
                  <span>•</span>
                  <span>IF: <strong>{pub.impactFactor}</strong></span>
                  <span>•</span>
                  <span>Role: <strong>{pub.authorshipRole}</strong></span>
                  {pub.doi && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-charcoal-400">DOI: {pub.doi}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200">
                  +{pub.apiPointsAwarded} API Pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extramural Research Grants Section */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
            <Landmark className="h-4 w-4 text-purple-600" />
            Extramural Sponsored Research Grants ({portfolio.grants?.length || 0})
          </h4>
          <span className="text-xs text-charcoal-500 font-medium">DST / SERB / ISRO / DRDO / AICTE</span>
        </div>

        <div className="divide-y divide-border dark:divide-charcoal-700">
          {portfolio.grants?.map((grant: any) => (
            <div key={grant.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">{grant.projectTitle}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                    {grant.fundingAgency}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-charcoal-500">
                  <span>Sanction #: <strong className="font-mono">{grant.sanctionOrderNumber}</strong></span>
                  <span>•</span>
                  <span>Outlay: <strong>₹{(grant.totalOutlayInr / 100000).toFixed(1)} Lakhs</strong></span>
                  <span>•</span>
                  <span>Role: <strong>{grant.investigatorRole}</strong></span>
                  <span>•</span>
                  <span>Duration: <strong>{grant.durationMonths} Mos</strong></span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200">
                  +{grant.apiPointsAwarded} API Pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patents & IPR Section */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Intellectual Property &amp; Patents ({portfolio.patents?.length || 0})
          </h4>
          <span className="text-xs text-charcoal-500 font-medium">IPO / USPTO / PCT</span>
        </div>

        <div className="divide-y divide-border dark:divide-charcoal-700">
          {portfolio.patents?.map((pat: any) => (
            <div key={pat.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">{pat.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pat.stage === "GRANTED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {pat.stage}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-charcoal-500">
                  <span>Office: <strong>{pat.patentOffice}</strong></span>
                  <span>•</span>
                  <span>App #: <strong className="font-mono">{pat.applicationNumber}</strong></span>
                  <span>•</span>
                  <span>Filed: {pat.filingDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200">
                  +{pat.apiPointsAwarded} API Pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seal Footer */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-charcoal-400">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          Integrity Verification Seal: {portfolio.integrityVerificationSeal}
        </span>
        <span>Last Recalculated: {new Date(portfolio.lastUpdated).toLocaleDateString()}</span>
      </div>

      {/* Add Publication Modal */}
      {modalType === "PUB" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4">
            <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
              Register Peer-Reviewed Publication (UGC Table 2)
            </h3>
            <form onSubmit={handleAddPub} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Byzantine Consensus with Provable Bounds"
                  value={pubForm.title}
                  onChange={(e) => setPubForm({ ...pubForm, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Journal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IEEE Transactions on Cloud Computing"
                    value={pubForm.journalName}
                    onChange={(e) => setPubForm({ ...pubForm, journalName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Indexing *
                  </label>
                  <select
                    value={pubForm.indexing}
                    onChange={(e) => setPubForm({ ...pubForm, indexing: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="SCOPUS">Scopus Indexed</option>
                    <option value="WEB_OF_SCIENCE">Web of Science (WoS)</option>
                    <option value="IEEE_XPLORE">IEEE Xplore</option>
                    <option value="UGC_CARE">UGC-CARE Listed</option>
                    <option value="PEER_REVIEWED">Peer-Reviewed Journal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Impact Factor *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={pubForm.impactFactor}
                    onChange={(e) => setPubForm({ ...pubForm, impactFactor: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Role *
                  </label>
                  <select
                    value={pubForm.authorshipRole}
                    onChange={(e) => setPubForm({ ...pubForm, authorshipRole: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="FIRST_AUTHOR">First Author (70%)</option>
                    <option value="CORRESPONDING_AUTHOR">Corresponding Author (70%)</option>
                    <option value="PRINCIPAL_SUPERVISOR">Supervisor (70%)</option>
                    <option value="CO_AUTHOR">Co-Author (30%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Total Authors *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={pubForm.totalAuthors}
                    onChange={(e) => setPubForm({ ...pubForm, totalAuthors: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  DOI (Digital Object Identifier)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10.1109/TPDS.2024.123456"
                  value={pubForm.doi}
                  onChange={(e) => setPubForm({ ...pubForm, doi: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-deep text-white transition-all shadow-sm"
                >
                  {submitting ? "Saving..." : "Add to Research Dossier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Grant Modal */}
      {modalType === "GRANT" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4">
            <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
              Log Extramural Sponsored Research Grant
            </h3>
            <form onSubmit={handleAddGrant} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Generation AI Accelerator Architecture"
                  value={grantForm.projectTitle}
                  onChange={(e) => setGrantForm({ ...grantForm, projectTitle: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Funding Agency *
                  </label>
                  <select
                    value={grantForm.fundingAgency}
                    onChange={(e) => setGrantForm({ ...grantForm, fundingAgency: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="DST">DST (Dept of Science &amp; Technology)</option>
                    <option value="SERB">SERB</option>
                    <option value="ISRO">ISRO (Respond Basket)</option>
                    <option value="DRDO">DRDO</option>
                    <option value="AICTE">AICTE (RPS)</option>
                    <option value="ICMR">ICMR</option>
                    <option value="INDUSTRY">Industry Sponsored</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Sanction Order Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DST/TMD/CERI/2026/19"
                    value={grantForm.sanctionOrderNumber}
                    onChange={(e) => setGrantForm({ ...grantForm, sanctionOrderNumber: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Total Sanctioned Outlay (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100000}
                    value={grantForm.totalOutlayInr}
                    onChange={(e) => setGrantForm({ ...grantForm, totalOutlayInr: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Investigator Role *
                  </label>
                  <select
                    value={grantForm.investigatorRole}
                    onChange={(e) => setGrantForm({ ...grantForm, investigatorRole: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="PRINCIPAL_INVESTIGATOR">Principal Investigator (PI - 100%)</option>
                    <option value="CO_PRINCIPAL_INVESTIGATOR">Co-PI (50%)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-deep text-white transition-all shadow-sm"
                >
                  {submitting ? "Logging..." : "Log Research Grant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Patent Modal */}
      {modalType === "PATENT" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4">
            <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
              Register Intellectual Property / Patent
            </h3>
            <form onSubmit={handleAddPatent} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Invention / Patent Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System and Method for Hardware-Sealed Verifiable Credentials"
                  value={patentForm.title}
                  onChange={(e) => setPatentForm({ ...patentForm, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Patent Office *
                  </label>
                  <select
                    value={patentForm.patentOffice}
                    onChange={(e) => setPatentForm({ ...patentForm, patentOffice: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="INDIA_IPO">Indian Patent Office (IPO)</option>
                    <option value="USPTO">United States (USPTO)</option>
                    <option value="EPO">European Patent Office (EPO)</option>
                    <option value="PCT_WIPO">PCT / WIPO</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Application / Grant # *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 202611098231"
                    value={patentForm.applicationNumber}
                    onChange={(e) => setPatentForm({ ...patentForm, applicationNumber: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Current Stage *
                </label>
                <select
                  value={patentForm.stage}
                  onChange={(e) => setPatentForm({ ...patentForm, stage: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="FILED">Application Filed</option>
                  <option value="PUBLISHED">Published in Official Gazette</option>
                  <option value="GRANTED">Granted &amp; Sealed</option>
                  <option value="COMMERCIALIZED">Commercialized &amp; Licensed</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-deep text-white transition-all shadow-sm"
                >
                  {submitting ? "Registering..." : "Register Patent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
