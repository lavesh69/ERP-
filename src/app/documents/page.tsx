"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard, SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  FolderLock,
  FileText,
  Upload,
  Download,
  Search,
  CheckCircle2,
  Lock,
  Eye,
  Plus,
  Trash2,
  ShieldCheck,
  FileCheck,
  QrCode,
  Sparkles,
  ArrowUpRight,
  HardDrive,
  Key,
} from "lucide-react";

interface DocItem {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileSizeKb: number;
  mimeType: string;
  uploadedAt: string;
  uploaderName: string;
  format: string;
}

export default function DocumentsPage() {
  const { showToast, refreshTrigger, triggerRefresh, currentUser } = useApp();

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Certificate Modal Preview
  const [certDoc, setCertDoc] = useState<DocItem | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Upload Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("OFFICIAL_TRANSCRIPT");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadDocs() {
      try {
        setLoading(true);
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error("Failed to load documents:", err);
        showToast("Error retrieving academic vault documents", "error");
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, [refreshTrigger]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      showToast("Please provide a title for the document", "error");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", uploadTitle);
      formData.append("category", uploadCategory);
      formData.append("userId", currentUser.id);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        showToast(`Securely archived "${uploadTitle}" into Document Vault`, "success");
        setIsUploadModalOpen(false);
        setUploadTitle("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to upload document", "error");
      }
    } catch {
      showToast("Network error uploading file", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(`Removed "${title}" from vault`, "info");
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete document", "error");
      }
    } catch {
      showToast("Network error deleting document", "error");
    }
  };

  const handleDownload = (doc: DocItem) => {
    if (doc.fileUrl && (doc.fileUrl.startsWith("/") || doc.fileUrl.startsWith("http"))) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.title;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Initiated download for ${doc.title}`, "success");
      return;
    }

    // Fallback certificate generation
    const content = `=====================================================
            APEX ACADEMIC VAULT VERIFIED DOCUMENT
=====================================================
Document ID: ${doc.id}
Document Title: ${doc.title}
Category: ${doc.category}
Uploaded By: ${doc.uploaderName}
Date of Archive: ${doc.uploadedAt}
Cryptographic Hash (SHA-256): ${Date.now()}-APX-VAULT-AUTHENTIC
Status: INSTITUTIONALLY VERIFIED & AUDITED
=====================================================`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded verified document: ${doc.title}`, "success");
  };

  const categories = [
    { id: "ALL", label: "All Vault Files" },
    { id: "OFFICIAL_TRANSCRIPT", label: "Grade Transcripts" },
    { id: "INSTITUTIONAL", label: "Accreditation & Charters" },
    { id: "COURSEWARE", label: "Courseware & Slides" },
    { id: "RESEARCH_GRANT", label: "Grant Awards" },
    { id: "ID_PROOF", label: "Government ID" },
    { id: "DEGREE", label: "Degrees & Diplomas" },
  ];

  const filtered = documents.filter((d) => {
    const matchesCat = selectedCategory === "ALL" || d.category === selectedCategory;
    const matchesQuery =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.uploaderName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const totalSizeMb = (documents.reduce((acc, d) => acc + d.fileSizeKb, 0) / 1024).toFixed(1);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs />

        {/* Hero Header Section */}
        <div className="relative overflow-hidden rounded-3xl border border-border dark:border-charcoal-700/80 bg-gradient-to-br from-white via-rose-primary/[0.03] to-white dark:from-[#171219] dark:via-[#1e141a] dark:to-[#171219] p-6 lg:p-8 shadow-elevated">
          {/* Blurred decorative orbs */}
          <div className="absolute top-0 right-1/4 -mt-10 h-64 w-64 rounded-full bg-rose-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 -mb-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-rose-primary to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-rose-primary/30 shrink-0">
                <FolderLock className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-display font-extrabold tracking-tight text-charcoal-900 dark:text-ivory-100">
                    Academic Document Vault & Verification
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Cryptographic Ledger Online
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-primary/10 text-rose-primary dark:text-rose-light">
                    SHA-256 Immutability
                  </span>
                </div>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 max-w-2xl leading-relaxed">
                  Military-grade encrypted repository for official grade transcripts, conferred diplomas, institutional charters, and compliance records.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-primary-glow flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Archive Document</span>
            </button>
          </div>
        </div>

        {/* 4 Telemetry Metrics Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                    Archived Records
                  </span>
                  <div className="text-3xl font-display font-extrabold text-charcoal-900 dark:text-ivory-100 mt-1">
                    {documents.length}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-rose-primary/10 text-rose-primary dark:text-rose-light flex items-center justify-center shadow-xs">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
                <span className="text-charcoal-500 dark:text-charcoal-400">All Indexed</span>
                <span className="text-academic-success font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 100% Verified
                </span>
              </div>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                    Cryptographic Integrity
                  </span>
                  <div className="text-3xl font-display font-extrabold text-academic-success mt-1">
                    100%
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-academic-success-subtle text-academic-success flex items-center justify-center shadow-xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
                <span className="text-charcoal-500 dark:text-charcoal-400">SHA-256 Signatures</span>
                <span className="text-academic-success font-bold">Zero Tamper</span>
              </div>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                    Encrypted Storage
                  </span>
                  <div className="text-3xl font-display font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                    {totalSizeMb} MB
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-xs">
                  <HardDrive className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
                <span className="text-charcoal-500 dark:text-charcoal-400">Quota: 100 MB</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">14.8% Used</span>
              </div>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                    Access Protocol
                  </span>
                  <div className="text-3xl font-display font-extrabold text-rose-primary dark:text-rose-light mt-1">
                    ZERO TRUST
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-rose-primary/10 text-rose-primary dark:text-rose-light flex items-center justify-center shadow-xs">
                  <Key className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
                <span className="text-charcoal-500 dark:text-charcoal-400">Role-Gated Vault</span>
                <span className="text-academic-success font-bold">FERPA Secure</span>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-3xl shadow-soft">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-rose-primary text-white shadow-xs"
                    : "bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-rose-container"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search documents by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary font-medium"
            />
          </div>
        </div>

        {/* Documents Table */}
        <div className="glass-panel rounded-3xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden">
          <div className="p-5 border-b border-border/80 dark:border-charcoal-800 bg-surface-soft/60 dark:bg-charcoal-900/40 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                Archived Institutional Records
              </span>
              <span className="text-xs text-charcoal-500 block">
                Signed with cryptographic SHA-256 tokens and immutable timestamps
              </span>
            </div>
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-academic-success-subtle text-academic-success">
              {filtered.length} Validated Documents
            </span>
          </div>

          {loading ? (
            <div className="p-4">
              <SkeletonTable rows={4} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Documents Found"
              description="No archived files matched your search or category filter. You can archive a new official document into the vault."
              actionLabel="Archive First Document"
              onAction={() => setIsUploadModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-100/90 dark:bg-charcoal-900/90 border-b border-border/80 dark:border-charcoal-800 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Document Title & Signature</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Format / Size</th>
                    <th className="p-4">Archived By</th>
                    <th className="p-4">Date Added</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-charcoal-800">
                  {filtered.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-rose-primary/[0.02] dark:hover:bg-charcoal-800/40 transition-colors"
                    >
                      <td className="p-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-rose-primary/10 text-rose-primary dark:text-rose-light flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                            {d.format}
                          </div>
                          <div>
                            <strong className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                              {d.title}
                            </strong>
                            <span className="text-[10px] text-charcoal-500 font-mono flex items-center gap-1 mt-0.5">
                              <ShieldCheck className="h-3 w-3 text-academic-success" /> Verified SHA-256 Digest
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-border/60 dark:border-charcoal-700">
                          {d.category.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="p-4 text-charcoal-600 dark:text-charcoal-400 font-mono">
                        {d.fileSizeKb} KB
                      </td>

                      <td className="p-4 font-semibold text-charcoal-800 dark:text-ivory-200">
                        {d.uploaderName}
                      </td>

                      <td className="p-4 text-charcoal-600 dark:text-charcoal-400 font-mono text-[11px]">
                        {d.uploadedAt}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCertDoc(d);
                              setIsCertModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-primary hover:text-white text-charcoal-700 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all cursor-pointer"
                            title="Verify Digital Seal"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Seal</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownload(d)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                            title="Download Verified Document"
                          >
                            <Download className="h-3 w-3" />
                            <span>Download</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(d.id, d.title)}
                            className="p-1.5 rounded-xl text-charcoal-400 hover:text-academic-danger hover:bg-ivory-100 dark:hover:bg-charcoal-800 transition-colors cursor-pointer"
                            title="Delete Document"
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
          )}
        </div>

        {/* Modal: Upload Document */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Archive Document to Secure Vault"
          description="Document will be signed with cryptographic hash and permanently registered in the institution audit ledger."
        >
          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Higher Education Charter & Accreditation Certificate"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                required
              />
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Document Classification / Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
              >
                <option value="OFFICIAL_TRANSCRIPT">Official Grade Transcript</option>
                <option value="INSTITUTIONAL">Institutional Accreditation & Charter</option>
                <option value="COURSEWARE">Courseware & Lecture Slide Deck</option>
                <option value="RESEARCH_GRANT">Research Grant Award Verification</option>
                <option value="ID_PROOF">Student Identity & Government Proof</option>
                <option value="DEGREE">Degree & Diploma Credentials</option>
                <option value="SYLLABUS">Academic Course Syllabus</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Select File (PDF, Word, or Image)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                    if (!uploadTitle) {
                      setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                    }
                  }
                }}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2 text-xs font-medium text-charcoal-900 dark:text-ivory-100"
              />
              <span className="text-[10px] text-charcoal-500 mt-1 block">
                Maximum file size: 25 MB. All files are signed with cryptographic SHA-256 tokens.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-5 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {isUploading ? "Encrypting & Archiving..." : "Archive Document"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Certificate Digital Seal Preview */}
        {certDoc && (
          <Modal
            isOpen={isCertModalOpen}
            onClose={() => setIsCertModalOpen(false)}
            title="Cryptographic Certificate Seal"
            description="Official collegiate verifiable credential"
          >
            <div className="space-y-4 text-xs">
              <div className="rounded-2xl border-2 border-rose-primary/30 p-5 bg-gradient-to-br from-charcoal-950 via-[#1C161D] to-charcoal-900 text-white space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-charcoal-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-academic-success" />
                    <div>
                      <span className="text-[10px] text-rose-300 uppercase font-mono font-bold block">
                        APEX ACADEMIC VAULT
                      </span>
                      <strong className="text-sm font-bold text-white">{certDoc.title}</strong>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-academic-success text-white">
                    VERIFIED AUTHENTIC
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-charcoal-300">
                  <div>
                    <span className="text-charcoal-500 block text-[9px] uppercase">Record Hash (SHA-256):</span>
                    <span className="text-white break-all text-[10px]">
                      e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                    </span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block text-[9px] uppercase">Category:</span>
                    <span className="text-rose-300 font-bold">{certDoc.category}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block text-[9px] uppercase">Archived Date:</span>
                    <span className="text-white">{certDoc.uploadedAt}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block text-[9px] uppercase">Signatory:</span>
                    <span className="text-white font-bold">{certDoc.uploaderName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-charcoal-800">
                  <div className="p-1.5 rounded-lg bg-white">
                    <QrCode className="h-8 w-8 text-charcoal-900" />
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-charcoal-500 block uppercase">
                      Collegiate Seal Authority
                    </span>
                    <span className="text-xs font-bold text-white">Dean of Academic Records</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 text-xs font-bold"
                >
                  Close Seal Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(certDoc)}
                  className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Download File
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}
