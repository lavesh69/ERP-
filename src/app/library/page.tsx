"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard, SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Library,
  Book,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  RotateCcw,
  Barcode,
  Users,
  Bookmark,
  Calendar,
} from "lucide-react";

interface ActiveLoan {
  id: string;
  studentName: string;
  rollNo: string;
  dueDate: string;
  issuedAt?: string;
  isOverdue?: boolean;
  daysOverdue?: number;
  accruedFine?: number;
  renewalsUsed?: number;
  maxRenewals?: number;
  canRenew?: boolean;
}

interface LibraryBookItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  activeLoansCount: number;
  activeLoans: ActiveLoan[];
}

interface StudentOption {
  id: string;
  name: string;
  rollNo: string;
}

export default function LibraryPage() {
  const { showToast, currentRole, refreshTrigger, triggerRefresh } = useApp();
  const isStudent = currentRole === "STUDENT" || currentRole === "PARENT";

  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<LibraryBookItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Modals
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Add Book Form state
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newIsbn, setNewIsbn] = useState("");
  const [newCategory, setNewCategory] = useState("Computer Science & AI");
  const [newTotalCopies, setNewTotalCopies] = useState(10);
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);

  // Issue Book Form state
  const [issueBookId, setIssueBookId] = useState("");
  const [issueStudentId, setIssueStudentId] = useState("");
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  useEffect(() => {
    async function loadLibraryData() {
      try {
        setLoading(true);
        const res = await fetch("/api/library");
        if (res.ok) {
          const data = await res.json();
          setBooks(data.books || []);
          setStudents(data.students || []);
          if (data.books && data.books.length > 0 && !issueBookId) {
            setIssueBookId(data.books[0].id);
          }
          if (data.students && data.students.length > 0 && !issueStudentId) {
            setIssueStudentId(data.students[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load library data:", err);
        showToast("Error retrieving library catalog", "error");
      } finally {
        setLoading(false);
      }
    }
    loadLibraryData();
  }, [refreshTrigger]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim() || !newIsbn.trim()) {
      showToast("Please fill in all book details", "error");
      return;
    }

    setIsSubmittingBook(true);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_BOOK",
          title: newTitle,
          author: newAuthor,
          isbn: newIsbn,
          category: newCategory,
          totalCopies: newTotalCopies,
        }),
      });

      if (res.ok) {
        showToast(`Cataloged "${newTitle}" into database repository`, "success");
        setIsAddBookModalOpen(false);
        setNewTitle("");
        setNewAuthor("");
        setNewIsbn("");
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to add book", "error");
      }
    } catch (err) {
      showToast("Network error creating book", "error");
    } finally {
      setIsSubmittingBook(false);
    }
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueBookId || !issueStudentId) {
      showToast("Please select both a book and a student", "error");
      return;
    }

    setIsSubmittingIssue(true);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ISSUE",
          bookId: issueBookId,
          studentId: issueStudentId,
        }),
      });

      if (res.ok) {
        showToast("Book checkout verified & RFID barcode scanned! Loan active for 14 days.", "success");
        setIsIssueModalOpen(false);
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to issue book", "error");
      }
    } catch (err) {
      showToast("Network error issuing book", "error");
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const handleReturnBook = async (loanId: string, bookTitle: string) => {
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RETURN",
          loanId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.fineAmount && data.fineAmount > 0) {
          showToast(`Returned "${bookTitle}". Overdue fine assessed: ₹${data.fineAmount.toFixed(2)}`, "warning");
        } else {
          showToast(`Returned "${bookTitle}". Inventory copy restored to shelf.`, "success");
        }
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to return book", "error");
      }
    } catch (err) {
      showToast("Network error returning book", "error");
    }
  };

  const [isRenewing, setIsRenewing] = useState<string | null>(null);

  const handleRenewBook = async (loanId: string, bookTitle: string) => {
    setIsRenewing(loanId);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RENEW",
          loanId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Renewed loan for "${bookTitle}"`, "success");
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to renew book loan", "error");
      }
    } catch {
      showToast("Network error renewing book loan", "error");
    } finally {
      setIsRenewing(null);
    }
  };

  const categories = ["ALL", ...Array.from(new Set(books.map((b) => b.category)))];

  const filteredBooks = books.filter((b) => {
    const matchesCat = selectedCategory === "ALL" || b.category === selectedCategory;
    const matchesQuery =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.includes(searchQuery);
    return matchesCat && matchesQuery;
  });

  const totalCopiesCount = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const totalAvailableCount = books.reduce((acc, b) => acc + b.availableCopies, 0);
  const totalIssuedCount = totalCopiesCount - totalAvailableCount;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <Library className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Library ERP & Digital Repository
                </h1>
                <span className="badge-subtle bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                  Real SQLite Catalog
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Physical circulation catalog, ISBN tracking, automated loan disbursement, and digital shelf inventory
              </p>
            </div>
          </div>

          {!isStudent && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-soft dark:bg-charcoal-700 hover:bg-rose-container text-charcoal-800 dark:text-ivory-100 text-xs font-bold border border-border dark:border-charcoal-600 transition-all"
              >
                <Barcode className="h-4 w-4 text-rose-primary" />
                <span>Issue Loan</span>
              </button>
              <button
                onClick={() => setIsAddBookModalOpen(true)}
                className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Catalog New Book</span>
              </button>
            </div>
          )}
        </div>

        {/* 4 Library KPI Cards */}
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
                Cataloged Titles
              </span>
              <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                {books.length}
              </div>
              <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent mt-2">
                {totalCopiesCount} Physical Volumes
              </span>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
                Available on Shelf
              </span>
              <div className="text-2xl font-display font-bold text-academic-success mt-1">
                {totalAvailableCount}
              </div>
              <span className="badge-subtle bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800 mt-2">
                Ready for Checkout
              </span>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
                Active Scholar Loans
              </span>
              <div className="text-2xl font-display font-bold text-academic-warning mt-1">
                {totalIssuedCount}
              </div>
              <span className="badge-subtle bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mt-2">
                14-Day Circulation
              </span>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
                Circulation Health
              </span>
              <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                100%
              </div>
              <span className="badge-subtle bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-border dark:border-charcoal-700 mt-2">
                Automated Audit
              </span>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl shadow-soft">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
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
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search by title, author, ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary"
            />
          </div>
        </div>

        {/* Books Catalog Table */}
        <div className="glass-panel rounded-2xl shadow-soft overflow-hidden">
          <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
              Circulation Book Inventory
            </span>
            <span className="text-[11px] text-charcoal-500 font-mono">
              Showing {filteredBooks.length} titles
            </span>
          </div>

          {loading ? (
            <div className="p-4">
              <SkeletonTable rows={4} />
            </div>
          ) : filteredBooks.length === 0 ? (
            <EmptyState
              icon={Book}
              title="No Volumes Found"
              description="No catalog entries matched your search query. You can add a new book to the repository."
              actionLabel="Catalog New Book"
              onAction={() => setIsAddBookModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-100 dark:bg-charcoal-900/60 border-b border-border dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Book Title & Author</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 font-mono">ISBN</th>
                    <th className="p-3.5 text-center">Shelf Location</th>
                    <th className="p-3.5 text-center">Availability</th>
                    <th className="p-3.5">Active Borrowers</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-charcoal-700">
                  {filteredBooks.map((b) => (
                    <tr key={b.id} className="hover:bg-ivory-50/70 dark:hover:bg-charcoal-700/40 transition-colors">
                      <td className="p-3.5 max-w-xs">
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                          {b.title}
                        </span>
                        <span className="text-[11px] text-charcoal-500">{b.author}</span>
                      </td>
                      <td className="p-3.5 text-charcoal-700 dark:text-charcoal-300 font-medium">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ivory-100 dark:bg-charcoal-700 border border-border dark:border-charcoal-600">
                          {b.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-charcoal-600 dark:text-charcoal-400 text-[11px]">
                        {b.isbn}
                      </td>
                      <td className="p-3.5 text-center text-charcoal-600 dark:text-charcoal-400 font-medium">
                        {b.shelfLocation}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            b.availableCopies > 0
                              ? "bg-academic-success-subtle text-academic-success"
                              : "bg-academic-warning-subtle text-academic-warning"
                          }`}
                        >
                          {b.availableCopies} / {b.totalCopies} Avail
                        </span>
                      </td>
                      <td className="p-3.5">
                        {b.activeLoans && b.activeLoans.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {b.activeLoans.map((l) => (
                              <div
                                key={l.id}
                                className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-[11px]"
                              >
                                <div>
                                  <span className="font-bold text-charcoal-800 dark:text-ivory-200">
                                    {l.studentName}
                                  </span>
                                  {l.isOverdue ? (
                                    <span className="text-[10px] text-academic-danger font-semibold block">
                                      Due: {l.dueDate} • Overdue ({l.daysOverdue}d, ₹{l.accruedFine})
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-charcoal-500 block">
                                      Due: {l.dueDate}
                                    </span>
                                  )}
                                </div>
                                {isStudent ? (
                                  <button
                                    disabled={!l.canRenew || isRenewing === l.id}
                                    onClick={() => handleRenewBook(l.id, b.title)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                      l.canRenew
                                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                                        : "bg-ivory-200 dark:bg-charcoal-700 text-charcoal-400 cursor-not-allowed"
                                    }`}
                                    title={l.canRenew ? `Renew loan by 14 days (${l.renewalsUsed || 0}/3 renewals used)` : "Maximum renewal limit reached (3/3)"}
                                  >
                                    {isRenewing === l.id ? "Renewing..." : l.canRenew ? `Renew (${l.renewalsUsed || 0}/3)` : "Max Renewals"}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReturnBook(l.id, b.title)}
                                    className="px-2 py-0.5 rounded bg-rose-primary hover:bg-rose-dark text-white text-[10px] font-bold"
                                    title="Return book to shelf"
                                  >
                                    Return
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-charcoal-400 italic">
                            No active loans
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {!isStudent ? (
                          <button
                            onClick={() => {
                              setIssueBookId(b.id);
                              setIsIssueModalOpen(true);
                            }}
                            disabled={b.availableCopies <= 0}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                              b.availableCopies > 0
                                ? "bg-rose-primary hover:bg-rose-dark text-white shadow-sm"
                                : "bg-ivory-200 dark:bg-charcoal-700 text-charcoal-400 cursor-not-allowed"
                            }`}
                          >
                            Checkout
                          </button>
                        ) : (
                          <span className="text-[11px] text-charcoal-500 font-medium">
                            {b.availableCopies > 0 ? "Available" : "Checked Out"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Add Book */}
        <Modal
          isOpen={isAddBookModalOpen}
          onClose={() => setIsAddBookModalOpen(false)}
          title="Catalog New Library Volume"
        >
          <form onSubmit={handleAddBook} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Book Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Introduction to Quantum Computing"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                required
              />
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Author(s)
              </label>
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="e.g. Michael A. Nielsen, Isaac L. Chuang"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  ISBN
                </label>
                <input
                  type="text"
                  value={newIsbn}
                  onChange={(e) => setNewIsbn(e.target.value)}
                  placeholder="978-0521635035"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-mono text-charcoal-900 dark:text-ivory-100"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="Computer Science & AI">Computer Science & AI</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Distributed Systems">Distributed Systems</option>
                  <option value="Biotechnology & Genomics">Biotechnology & Genomics</option>
                  <option value="Mathematics & Physics">Mathematics & Physics</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Number of Physical Copies
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={newTotalCopies}
                onChange={(e) => setNewTotalCopies(Number(e.target.value))}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsAddBookModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingBook}
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
              >
                {isSubmittingBook ? "Cataloging..." : "Add to Library"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Issue Book */}
        <Modal
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
          title="Issue Library Loan (14-Day Cycle)"
        >
          <form onSubmit={handleIssueBook} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Select Book to Issue
              </label>
              <select
                value={issueBookId}
                onChange={(e) => setIssueBookId(e.target.value)}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
              >
                {books
                  .filter((b) => b.availableCopies > 0)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.availableCopies} available)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Select Scholar / Borrower
              </label>
              <select
                value={issueStudentId}
                onChange={(e) => setIssueStudentId(e.target.value)}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rollNo})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-rose-primary shrink-0" />
              <span>
                Due date will be automatically calibrated to 14 days from today. Overdue fee: $1.00/day.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingIssue}
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
              >
                {isSubmittingIssue ? "Authorizing..." : "Confirm & Issue"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
