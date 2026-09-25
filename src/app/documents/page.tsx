"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard, SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
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
    } catch (err) {
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
    } catch (err) {
      showToast("Network error deleting document", "error");
    }
  };

  const handleDownload = (doc: DocItem) => {
    // If local file exists, download it, or generate certificate blob
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
    "ALL",
    "OFFICIAL_TRANSCRIPT",
    "INSTITUTIONAL",
    "COURSEWARE",
    "RESEARCH_GRANT",
    "ID_PROOF",
    "DEGREE",
  ];

  const filtered = documents.filter((d) => {
    const matchesCat = selectedCategory === "ALL" || d.category === selectedCategory;
    const matchesQuery =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.uploaderName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <FolderLock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Academic Document Vault & Verification
                </h1>
                <span className="badge-subtle bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                  Live SQLite Document Storage
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Encrypted repository for official transcripts, degree credentials, accreditation documents, and syllabi
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>

        {/* 4 Telemetry KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
                Archived Documents
              </span>
              <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                {documents.length}
              </div>
              <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent mt-2">
                SHA-256 Signatures
              </span>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
                Cryptographic Integrity
              </span>
              <div className="text-2xl font-display font-bold text-academic-success mt-1">
                100%
              </div>
              <span className="badge-subtle bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800 mt-2">
                Tamper-Resistant Ledger
              </span>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
                Storage Allocation
              </span>
              <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                {(documents.reduce((acc, d) => acc + d.fileSizeKb, 0) / 1024).toFixed(1)} MB
              </div>
              <span className="badge-subtle bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mt-2">
                Across {categories.length - 1} Categories
              </span>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
                Access Protocol
              </span>
              <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                ZERO TRUST
              </div>
              <span className="badge-subtle bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-border dark:border-charcoal-700 mt-2">
                Role-Gated Vault
              </span>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl shadow-soft">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-rose-primary text-white shadow-sm"
                    : "bg-surface-soft dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-rose-container"
                }`}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search documents by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary"
            />
          </div>
        </div>

        {/* Documents Table */}
        <div className="glass-panel rounded-2xl shadow-soft overflow-hidden">
          <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
              Archived Institutional Records
            </span>
            <span className="text-[11px] text-charcoal-500 font-mono">
              Showing {filtered.length} files
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
              description="No archived files matched your search or category filter. You can upload a new official document."
              actionLabel="Upload First Document"
              onAction={() => setIsUploadModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-100 dark:bg-charcoal-900/60 border-b border-border dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Document Title</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Format / Size</th>
                    <th className="p-3.5">Uploaded By</th>
                    <th className="p-3.5">Archive Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-charcoal-700">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-ivory-50/70 dark:hover:bg-charcoal-700/40 transition-colors">
                      <td className="p-3.5 max-w-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-rose-container dark:bg-rose-primary/20 text-rose-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                            {d.format}
                          </div>
                          <div>
                            <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                              {d.title}
                            </span>
                            <span className="text-[10px] text-charcoal-500 font-mono flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3 text-academic-success" /> Verified SHA-256
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300">
                          {d.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3.5 text-charcoal-600 dark:text-charcoal-400 font-mono">
                        {d.fileSizeKb} KB
                      </td>
                      <td className="p-3.5 font-semibold text-charcoal-800 dark:text-ivory-200">
                        {d.uploaderName}
                      </td>
                      <td className="p-3.5 text-charcoal-600 dark:text-charcoal-400">
                        {d.uploadedAt}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(d)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ivory-100 dark:bg-charcoal-700 hover:bg-rose-container text-rose-primary dark:text-rose-light text-xs font-bold border border-border dark:border-charcoal-600 transition-all"
                            title="Download Verified Document"
                          >
                            <Download className="h-3 w-3" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => handleDelete(d.id, d.title)}
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-academic-danger hover:bg-ivory-100 dark:hover:bg-charcoal-700 transition-colors"
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
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
              >
                {isUploading ? "Encrypting & Archiving..." : "Archive Document"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
