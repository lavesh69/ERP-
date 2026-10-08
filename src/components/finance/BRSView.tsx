"use client";

import React, { useState, useEffect } from "react";
import { Landmark, ArrowLeftRight, CheckCircle2, AlertCircle, Upload, Check, RefreshCw, FileText, X, Sparkles } from "lucide-react";
import { BankStatementEntry, BRSMatchResult } from "@/lib/finance/finance-engine";

interface BRSViewProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onReconciliationComplete?: () => void;
}

export function BRSView({ showToast, onReconciliationComplete }: BRSViewProps) {
  const [entries, setEntries] = useState<BankStatementEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileSummary, setReconcileSummary] = useState<any | null>(null);

  async function loadEntries() {
    try {
      setLoading(true);
      const res = await fetch("/api/finance/brs");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch {
      showToast("Failed to load bank entries", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  const handleAutoReconcile = async () => {
    setIsReconciling(true);
    try {
      const res = await fetch("/api/finance/brs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "AUTO_RECONCILE" }),
      });

      if (res.ok) {
        const data = await res.json();
        setReconcileSummary(data.reconciliation);
        showToast(data.message || "BRS auto-matching completed!", "success");
        loadEntries();
        if (onReconciliationComplete) onReconciliationComplete();
      } else {
        showToast("Error running bank reconciliation", "error");
      }
    } catch {
      showToast("Network error running BRS match", "error");
    } finally {
      setIsReconciling(false);
    }
  };

  const handleSimulateBankImport = async () => {
    try {
      const simulatedEntries = [
        {
          txnDate: new Date().toISOString().split("T")[0],
          utrNumber: `CMS-RTGS-${Math.floor(100000 + Math.random() * 900000)}`,
          remitterName: "Priya Patel",
          amount: 1500,
          description: "RTGS/2026/PRIYA PATEL/APEX TUIT",
        },
        {
          txnDate: new Date().toISOString().split("T")[0],
          utrNumber: `NEFT-AXIS-${Math.floor(100000 + Math.random() * 900000)}`,
          remitterName: "Rahul Sharma",
          amount: 2000,
          description: "NEFT CREDIT BTECH TERM FEE",
        },
      ];

      const res = await fetch("/api/finance/brs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPLOAD_STATEMENT",
          entries: simulatedEntries,
        }),
      });

      if (res.ok) {
        showToast("Simulated bank feed statement imported!", "success");
        loadEntries();
      }
    } catch {
      showToast("Failed to import bank statement feed", "error");
    }
  };

  // MT940 / ISO 20022 Parser State
  const [isMt940ModalOpen, setIsMt940ModalOpen] = useState(false);
  const [mt940Text, setMt940Text] = useState(`:20:APEX-BANK-STMT-2026
:25:9182374619001/USD
:28C:00142/001
:60F:C261001USD45000,00
:61:2610061006CR1500,00NTRFNONREF//CMS-RTGS-891024
:86:/REMITTER: Priya Patel /PURP: TUITION FEE SEM 5 CS-402
:61:2610071007CR2000,00NTRFNONREF//NEFT-AXIS-774102
:86:/REMITTER: Rahul Sharma /PURP: HOSTEL & MESS ANNUAL CHARGES
:61:2610081008CR1200,00NTRFNONREF//IMPS-HDFC-332190
:86:/REMITTER: Ananya Sengupta /PURP: LAB & EXAMINATION CHARGES
:62F:C261008USD49700,00`);

  const parseMt940Statement = (rawText: string) => {
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: any[] = [];
    let currentEntry: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith(":61:")) {
        const content = line.substring(4);
        const dateMatch = content.match(/^(\d{6})/);
        const amountMatch = content.match(/[CD](\d+([,\.]\d{2})?)/);
        const refMatch = content.match(/\/\/([A-Za-z0-9-]+)/) || content.match(/[A-Z]{3,4}([0-9A-Z-]+)$/);

        const year = dateMatch ? `20${dateMatch[1].substring(0, 2)}` : "2026";
        const month = dateMatch ? dateMatch[1].substring(2, 4) : "10";
        const day = dateMatch ? dateMatch[1].substring(4, 6) : "08";
        const dateStr = `${year}-${month}-${day}`;
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(",", ".")) : 1000;
        const utr = refMatch ? refMatch[1] : `SWIFT-UTR-${Math.floor(100000 + Math.random() * 900000)}`;

        currentEntry = {
          txnDate: dateStr,
          utrNumber: utr,
          remitterName: "Direct Treasury Wire",
          amount,
          description: `MT940 SWIFT Credit // ${utr}`,
        };
        parsed.push(currentEntry);
      } else if (line.startsWith(":86:") && currentEntry) {
        const narration = line.substring(4);
        currentEntry.description = narration;
        const nameMatch = narration.match(/REMITTER:\s*([A-Za-z\s]+?)(?=\/|$)/i) || narration.match(/NAME\/([A-Za-z\s]+?)(?=\/|$)/i);
        if (nameMatch) {
          currentEntry.remitterName = nameMatch[1].trim();
        }
      }
    }

    return parsed;
  };

  const handleParseAndImportMt940 = async () => {
    try {
      const parsedEntries = parseMt940Statement(mt940Text);
      if (parsedEntries.length === 0) {
        showToast("No valid SWIFT :61: transaction lines found in statement", "error");
        return;
      }

      const res = await fetch("/api/finance/brs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPLOAD_STATEMENT",
          entries: parsedEntries,
        }),
      });

      if (res.ok) {
        showToast(`Successfully ingested ${parsedEntries.length} MT940 / ISO 20022 wire lines!`, "success");
        setIsMt940ModalOpen(false);
        loadEntries();
      } else {
        showToast("Failed to upload parsed bank lines", "error");
      }
    } catch {
      showToast("Error parsing bank statement", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl shadow-soft">
        <div>
          <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
            <Landmark className="h-5 w-5 text-rose-primary" />
            Bank Reconciliation Statement (BRS) Auto-Matcher
          </h2>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-0.5">
            Auto-match incoming bank statement UTR numbers and wire transfers with pending student fee challans
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMt940ModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
          >
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Parse MT940 / ISO 20022</span>
          </button>
          <button
            onClick={handleSimulateBankImport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 hover:bg-rose-container text-charcoal-800 dark:text-ivory-100 text-xs font-bold border border-border dark:border-charcoal-600 transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4 text-rose-primary" />
            <span>Import Statement Feed</span>
          </button>
          <button
            onClick={handleAutoReconcile}
            disabled={isReconciling}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>{isReconciling ? "Matching Tokens..." : "Auto-Reconcile Matches"}</span>
          </button>
        </div>
      </div>

      {/* Summary Banner if reconciled */}
      {reconcileSummary && (
        <div className="p-4 rounded-2xl bg-academic-success-subtle border border-green-200 dark:border-green-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-academic-success" />
            <div>
              <span className="font-bold text-academic-success block">Reconciliation Matching Report</span>
              <span className="text-charcoal-600 dark:text-charcoal-300">
                {reconcileSummary.exactMatchCount} exact matches auto-credited • {reconcileSummary.probableMatchCount} flagged for review • {reconcileSummary.unmatchedCount} unmatched.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bank Statement Entries Table */}
      <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
            Treasury Bank Credit Feed (Live NEFT / RTGS / IMPS)
          </span>
          <span className="text-[11px] text-charcoal-500 font-mono">
            {entries.length} statement rows
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-charcoal-500">Loading bank statement...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-xs text-charcoal-500">No bank statement rows found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100 dark:bg-charcoal-900/60 border-b border-border dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">UTR Reference</th>
                  <th className="p-3.5">Remitter Name</th>
                  <th className="p-3.5 text-right">Credit Amount</th>
                  <th className="p-3.5">Bank Narration</th>
                  <th className="p-3.5 text-center">Reconciliation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-charcoal-700">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-ivory-50/70 dark:hover:bg-charcoal-700/40 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] text-charcoal-500">
                      {e.txnDate}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-rose-primary dark:text-rose-light">
                      {e.utrNumber}
                    </td>
                    <td className="p-3.5 font-semibold text-charcoal-900 dark:text-ivory-100">
                      {e.remitterName}
                    </td>
                    <td className="p-3.5 text-right font-bold text-academic-success font-mono">
                      +${e.amount.toLocaleString()}.00
                    </td>
                    <td className="p-3.5 text-charcoal-600 dark:text-charcoal-400 text-[11px] max-w-xs truncate">
                      {e.description}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          e.matchedStatus === "MATCHED"
                            ? "bg-academic-success-subtle text-academic-success"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        {e.matchedStatus === "MATCHED" ? "RECONCILED" : "UNMATCHED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MT940 / ISO 20022 Parser Modal */}
      {isMt940ModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                    MT940 &amp; ISO 20022 Bank Statement Parser
                  </h3>
                  <p className="text-[11px] text-charcoal-500">
                    Parse SWIFT MT940 electronic statements, RTGS/NEFT tags, and CAMT.053 wire feeds.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMt940ModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-600 dark:hover:text-ivory-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-charcoal-700 dark:text-ivory-300">
                  Raw Statement Payload (SWIFT MT940 format)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setMt940Text(`:20:APEX-BANK-STMT-2026
:25:9182374619001/USD
:28C:00142/001
:60F:C261001USD45000,00
:61:2610061006CR1500,00NTRFNONREF//CMS-RTGS-891024
:86:/REMITTER: Priya Patel /PURP: TUITION FEE SEM 5 CS-402
:61:2610071007CR2000,00NTRFNONREF//NEFT-AXIS-774102
:86:/REMITTER: Rahul Sharma /PURP: HOSTEL & MESS ANNUAL CHARGES
:61:2610081008CR1200,00NTRFNONREF//IMPS-HDFC-332190
:86:/REMITTER: Ananya Sengupta /PURP: LAB & EXAMINATION CHARGES
:62F:C261008USD49700,00`)
                  }
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Reset Sample SWIFT Payload
                </button>
              </div>

              <textarea
                rows={10}
                value={mt940Text}
                onChange={(e) => setMt940Text(e.target.value)}
                className="w-full p-3 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl font-mono text-[11px] leading-relaxed text-charcoal-800 dark:text-ivory-200"
                placeholder="Paste raw SWIFT MT940 text starting with :20: / :61:..."
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border dark:border-charcoal-800 text-xs">
              <span className="text-charcoal-500 font-mono text-[11px]">
                Detected: {parseMt940Statement(mt940Text).length} wire credit lines
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMt940ModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 text-charcoal-700 dark:text-ivory-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParseAndImportMt940}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Parse &amp; Import to BRS Ledger</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
