"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  BookOpen,
  Share2,
  CheckCircle2,
  Lock,
  Globe,
  Upload,
  Search,
  Filter,
  ExternalLink,
  Award,
  Layers,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { RepositoryItem, DownloadAuditPass } from "@/lib/library/elibrary-repository-engine";

export default function DigitalELibraryTab() {
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedAccess, setSelectedAccess] = useState("ALL");

  // Citation modal
  const [citationModalItem, setCitationModalItem] = useState<RepositoryItem | null>(null);
  const [citationStyle, setCitationStyle] = useState<"APA" | "IEEE" | "BIBTEX">("APA");
  const [citationText, setCitationText] = useState("");
  const [copied, setCopied] = useState(false);

  // Secure download modal
  const [downloadModalPass, setDownloadModalPass] = useState<DownloadAuditPass | null>(null);
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null);

  // Deposit modal
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositForm, setDepositForm] = useState({
    itemType: "THESIS",
    title: "",
    author: "",
    authorAffiliation: "Apex Institute of Technology",
    department: "Computer Science",
    publicationYear: new Date().getFullYear(),
    license: "CC-BY-4.0",
    abstract: "",
    keywords: "",
    accessLevel: "OPEN_ACCESS",
    advisor: "",
    peerReviewed: true,
  });
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (selectedDept !== "ALL") params.set("department", selectedDept);
      if (selectedType !== "ALL") params.set("itemType", selectedType);
      if (selectedAccess !== "ALL") params.set("accessLevel", selectedAccess);

      const res = await fetch(`/api/library/elibrary?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setAnalytics(data.analytics || null);
      }
    } catch (err) {
      console.error("Failed to load e-library repository items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [searchQuery, selectedDept, selectedType, selectedAccess]);

  const handleOpenCitation = async (item: RepositoryItem, style: "APA" | "IEEE" | "BIBTEX" = "APA") => {
    setCitationModalItem(item);
    setCitationStyle(style);
    setCopied(false);
    try {
      const res = await fetch("/api/library/elibrary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GENERATE_CITATION", itemId: item.id, style }),
      });
      if (res.ok) {
        const data = await res.json();
        setCitationText(data.citation?.citation || "");
      }
    } catch (err) {
      console.error("Failed to generate citation:", err);
    }
  };

  const handleSwitchCitationStyle = async (style: "APA" | "IEEE" | "BIBTEX") => {
    if (!citationModalItem) return;
    setCitationStyle(style);
    setCopied(false);
    try {
      const res = await fetch("/api/library/elibrary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GENERATE_CITATION", itemId: citationModalItem.id, style }),
      });
      if (res.ok) {
        const data = await res.json();
        setCitationText(data.citation?.citation || "");
      }
    } catch (err) {
      console.error("Failed to switch citation:", err);
    }
  };

  const handleSecureDownload = async (item: RepositoryItem) => {
    setDownloadingItemId(item.id);
    try {
      const res = await fetch("/api/library/elibrary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SECURE_DOWNLOAD",
          itemId: item.id,
          requesterName: "Dr. Faculty / Researcher",
          requesterEmail: "scholar@apex.edu",
          requesterRole: "RESEARCH_FACULTY",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDownloadModalPass(data.pass);
        fetchItems(); // refresh counts
      }
    } catch (err) {
      console.error("Error generating secure download pass:", err);
    } finally {
      setDownloadingItemId(null);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDeposit(true);
    try {
      const res = await fetch("/api/library/elibrary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DEPOSIT_ITEM",
          ...depositForm,
          keywords: depositForm.keywords.split(",").map((s) => s.trim()),
        }),
      });
      if (res.ok) {
        setShowDepositModal(false);
        setDepositForm({
          itemType: "THESIS",
          title: "",
          author: "",
          authorAffiliation: "Apex Institute of Technology",
          department: "Computer Science",
          publicationYear: new Date().getFullYear(),
          license: "CC-BY-4.0",
          abstract: "",
          keywords: "",
          accessLevel: "OPEN_ACCESS",
          advisor: "",
          peerReviewed: true,
        });
        fetchItems();
      }
    } catch (err) {
      console.error("Error depositing item:", err);
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Repository Items</span>
            <BookOpen className="h-4 w-4 text-rose-primary" />
          </div>
          <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
            {analytics?.totalAssets || items.length}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Dissertations, Theses & Papers</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Total Downloads</span>
            <Download className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
            {analytics?.totalDownloads?.toLocaleString() || "0"}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Cryptographic watermark issued</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Open Access Ratio</span>
            <Globe className="h-4 w-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
            {analytics?.openAccessPct || 0}%
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Freely accessible worldwide</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Global Citations</span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
            {analytics?.totalCitations || 0}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Cross-institutional index citations</p>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl shadow-soft border border-border dark:border-charcoal-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search title, author, DOI, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700"
          >
            <option value="ALL">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
            <option value="Biotechnology">Biotechnology</option>
            <option value="Civil Engineering">Civil Engineering</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700"
          >
            <option value="ALL">All Item Types</option>
            <option value="FACULTY_PAPER">Faculty Papers</option>
            <option value="DISSERTATION">Doctoral Dissertations</option>
            <option value="THESIS">Master's Theses</option>
            <option value="E_BOOK">Institutional E-Books</option>
            <option value="DATASET">Open Datasets</option>
          </select>

          <select
            value={selectedAccess}
            onChange={(e) => setSelectedAccess(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700"
          >
            <option value="ALL">All Access Levels</option>
            <option value="OPEN_ACCESS">Open Access (Public)</option>
            <option value="CAMPUS_ONLY">Campus VPN Only</option>
            <option value="RESTRICTED">Restricted</option>
          </select>
        </div>

        <button
          onClick={() => setShowDepositModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-primary hover:bg-rose-dark active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap"
        >
          <Upload className="h-4 w-4" />
          <span>Deposit Research / Thesis</span>
        </button>
      </div>

      {/* Publications Repository List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-xs text-charcoal-500">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading digital institutional repository...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-12 glass-panel rounded-2xl border border-dashed border-border dark:border-charcoal-800">
          <BookOpen className="h-10 w-10 text-charcoal-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-charcoal-800 dark:text-ivory-200">No Research Artifacts Found</h3>
          <p className="text-xs text-charcoal-500 mt-1">Try modifying your search or filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-800 hover:border-rose-300 dark:hover:border-rose-900/50 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                      {item.itemType.replace(/_/g, " ")}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300">
                      {item.department}
                    </span>
                    {item.accessLevel === "OPEN_ACCESS" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Globe className="h-3 w-3" /> Open Access
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        <Lock className="h-3 w-3" /> Campus Only
                      </span>
                    )}
                    {item.peerReviewed && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                        ★ Peer Reviewed
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 hover:text-rose-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-charcoal-600 dark:text-ivory-400">
                    <span className="font-semibold text-charcoal-800 dark:text-ivory-200">{item.author}</span>
                    {item.advisor && ` (Advised by ${item.advisor})`} • {item.authorAffiliation} • ({item.publicationYear})
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start">
                  <button
                    onClick={() => handleOpenCitation(item, "APA")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:bg-rose-50 hover:text-rose-600 border border-border dark:border-charcoal-700 transition-all"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Cite</span>
                  </button>
                  <button
                    onClick={() => handleSecureDownload(item)}
                    disabled={downloadingItemId === item.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-primary hover:bg-rose-dark text-white shadow-sm transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{downloadingItemId === item.id ? "Sealing..." : "Download PDF"}</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-charcoal-600 dark:text-ivory-400 line-clamp-2 italic">
                "{item.abstract}"
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border dark:border-charcoal-800/80 text-[11px] text-charcoal-500">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-rose-primary dark:text-rose-light">
                    doi:{item.doi}
                  </span>
                  <span>License: {item.license}</span>
                  <span>Size: {item.fileSizeMb} MB ({item.fileFormat})</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>📥 {item.downloadsCount} downloads</span>
                  <span>📄 {item.citationsCount} citations</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Citation Generator */}
      {citationModalItem && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-rose-primary" />
                <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                  Export Citation & Metadata
                </h3>
              </div>
              <button
                onClick={() => setCitationModalItem(null)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 border-b border-border dark:border-charcoal-800 pb-2">
              {(["APA", "IEEE", "BIBTEX"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => handleSwitchCitationStyle(style)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    citationStyle === style
                      ? "bg-rose-primary text-white"
                      : "bg-surface-soft dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300"
                  }`}
                >
                  {style === "BIBTEX" ? "BibTeX" : `${style} 7th`}
                </button>
              ))}
            </div>

            <div className="p-3 bg-surface-soft dark:bg-charcoal-950 rounded-xl font-mono text-xs text-charcoal-800 dark:text-ivory-200 border border-border dark:border-charcoal-800 whitespace-pre-wrap select-all">
              {citationText || "Generating standard academic citation format..."}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-charcoal-500">
                Registered Institutional DOI: {citationModalItem.doi}
              </span>
              <button
                onClick={() => copyToClipboard(citationText)}
                className="flex items-center gap-1.5 px-4 py-2 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied!" : "Copy Citation"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Secure Watermarked Download Pass */}
      {downloadModalPass && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                  Secured Watermark Download Certificate
                </h3>
              </div>
              <button
                onClick={() => setDownloadModalPass(null)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-charcoal-700 dark:text-ivory-300">
              <p>
                <strong>Title:</strong> {downloadModalPass.itemTitle}
              </p>
              <p>
                <strong>Licensed Recipient:</strong> {downloadModalPass.requesterName} ({downloadModalPass.requesterEmail})
              </p>
              <p>
                <strong>Security Seal:</strong>{" "}
                <span className="font-mono text-rose-primary font-bold">
                  {downloadModalPass.watermarkSeal}
                </span>
              </p>
              <p>
                <strong>Authorization Window:</strong> Valid until{" "}
                {new Date(downloadModalPass.expiresAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
              ✓ Digital cryptographic stamp successfully embedded into document metadata for academic integrity tracking.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDownloadModalPass(null)}
                className="px-4 py-2 bg-surface-soft dark:bg-charcoal-800 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <a
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                  `APEX INSTITUTIONAL REPOSITORY DOWNLOAD\n\nDocument: ${downloadModalPass.itemTitle}\nAuthorized Recipient: ${downloadModalPass.requesterName}\nSeal: ${downloadModalPass.watermarkSeal}\nTimestamp: ${downloadModalPass.issuedAt}\n\n[Certified Digital Academic Asset]`
                )}`}
                download={`${downloadModalPass.itemId}-watermarked.txt`}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save Watermarked Package</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Deposit Research Artifact */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-xl w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-rose-primary" />
                <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                  Deposit Academic Work to Institutional Repository
                </h3>
              </div>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Item Category</label>
                <select
                  value={depositForm.itemType}
                  onChange={(e) => setDepositForm({ ...depositForm, itemType: e.target.value })}
                  className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                >
                  <option value="FACULTY_PAPER">Faculty Pre-Print / Published Paper</option>
                  <option value="DISSERTATION">Doctoral Dissertation (Ph.D.)</option>
                  <option value="THESIS">Master's Thesis (M.Tech / M.S.)</option>
                  <option value="E_BOOK">Institutional Monograph / E-Book</option>
                  <option value="DATASET">Research Dataset / Open Data</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Publication Title</label>
                <input
                  type="text"
                  required
                  value={depositForm.title}
                  onChange={(e) => setDepositForm({ ...depositForm, title: e.target.value })}
                  placeholder="e.g. Robust Decentralized Machine Learning on Edge Gateways"
                  className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Lead Author</label>
                  <input
                    type="text"
                    required
                    value={depositForm.author}
                    onChange={(e) => setDepositForm({ ...depositForm, author: e.target.value })}
                    placeholder="e.g. Dr. Priya Venkatesh"
                    className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Advisor / Supervisor (Optional)</label>
                  <input
                    type="text"
                    value={depositForm.advisor}
                    onChange={(e) => setDepositForm({ ...depositForm, advisor: e.target.value })}
                    placeholder="e.g. Prof. R. K. Mukherjee"
                    className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Academic Department</label>
                  <select
                    value={depositForm.department}
                    onChange={(e) => setDepositForm({ ...depositForm, department: e.target.value })}
                    className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Biotechnology">Biotechnology</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Open Access License</label>
                  <select
                    value={depositForm.license}
                    onChange={(e) => setDepositForm({ ...depositForm, license: e.target.value as any })}
                    className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  >
                    <option value="CC-BY-4.0">Creative Commons Attribution (CC-BY 4.0)</option>
                    <option value="CC-BY-NC-4.0">CC Non-Commercial (CC-BY-NC 4.0)</option>
                    <option value="APEX-INSTITUTIONAL-RESTRICTED">Apex Institutional Restricted</option>
                    <option value="PUBLIC_DOMAIN">Public Domain (CC0)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Abstract</label>
                <textarea
                  required
                  rows={3}
                  value={depositForm.abstract}
                  onChange={(e) => setDepositForm({ ...depositForm, abstract: e.target.value })}
                  placeholder="Comprehensive scientific summary of study, methodology, and empirical findings..."
                  className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Keywords (Comma separated)</label>
                <input
                  type="text"
                  value={depositForm.keywords}
                  onChange={(e) => setDepositForm({ ...depositForm, keywords: e.target.value })}
                  placeholder="Edge Computing, Federated Learning, IoT"
                  className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 bg-surface-soft dark:bg-charcoal-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDeposit}
                  className="px-4 py-2 bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingDeposit ? "Assigning DOI & Indexing..." : "Assign DOI & Deposit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
