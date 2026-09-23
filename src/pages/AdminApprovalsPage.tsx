import React, { useState, useEffect } from 'react';
import { 
  fetchRegistrationApplications, 
  reviewRegistrationApplication 
} from '@/lib/firebase';
import { RegistrationApplication, UserRole } from '@/types';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  Mail, 
  Building2, 
  CreditCard, 
  Phone, 
  Filter, 
  Search, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const AdminApprovalsPage: React.FC = () => {
  const [applications, setApplications] = useState<RegistrationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionModalApp, setRejectionModalApp] = useState<RegistrationApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchRegistrationApplications();
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (app: RegistrationApplication) => {
    setProcessingId(app.id);
    try {
      await reviewRegistrationApplication(
        app.id,
        app.uid,
        'APPROVED',
        app.requestedRole,
        undefined,
        'Registrar Office'
      );
      setNotification(`Approved ${app.fullName} as ${app.requestedRole}!`);
      setTimeout(() => setNotification(null), 4000);
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Failed to approve application.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectionModalApp) return;
    setProcessingId(rejectionModalApp.id);
    try {
      await reviewRegistrationApplication(
        rejectionModalApp.id,
        rejectionModalApp.uid,
        'REJECTED',
        rejectionModalApp.requestedRole,
        rejectionReason || 'Institutional records mismatch.',
        'Registrar Office'
      );
      setNotification(`Rejected application for ${rejectionModalApp.fullName}.`);
      setTimeout(() => setNotification(null), 4000);
      setRejectionModalApp(null);
      setRejectionReason('');
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Failed to reject application.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = applications.filter((a) => a.status === 'PENDING_APPROVAL').length;
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;

  const filtered = applications.filter((a) => {
    const matchesTab =
      activeTab === 'ALL' ||
      (activeTab === 'PENDING' && a.status === 'PENDING_APPROVAL') ||
      (activeTab === 'APPROVED' && a.status === 'APPROVED') ||
      (activeTab === 'REJECTED' && a.status === 'REJECTED');

    const matchesSearch =
      a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.idNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.department.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title & Queue Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white sm:text-3xl flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-rose-600 dark:text-rose-400" />
            Registration Approval Desk
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Verify student admissions, faculty appointments, and parent enrollments before granting portal access.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 shadow-sm hover:bg-stone-50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {notification && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('PENDING')}
          className={`cursor-pointer rounded-2xl border p-5 shadow-sm transition-all ${
            activeTab === 'PENDING'
              ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 ring-2 ring-amber-400/30'
              : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Pending Verification
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900 dark:text-white">
            {pendingCount}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('APPROVED')}
          className={`cursor-pointer rounded-2xl border p-5 shadow-sm transition-all ${
            activeTab === 'APPROVED'
              ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-400/30'
              : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Approved Accounts
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900 dark:text-white">
            {approvedCount}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('REJECTED')}
          className={`cursor-pointer rounded-2xl border p-5 shadow-sm transition-all ${
            activeTab === 'REJECTED'
              ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20 ring-2 ring-rose-400/30'
              : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Rejected / Flagged
            </span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900 dark:text-white">
            {rejectedCount}
          </div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search applicants by name, email, roll/emp ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-4 py-2.5 text-xs text-stone-900 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
          />
        </div>

        <div className="flex rounded-xl bg-stone-100 p-1 dark:bg-stone-800 text-xs">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-white'
                  : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
              }`}
            >
              {tab === 'PENDING' ? `Pending (${pendingCount})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-stone-200 dark:bg-stone-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center dark:border-stone-800 dark:bg-stone-900">
          <CheckCircle2 className="mx-auto h-8 w-8 text-stone-300 dark:text-stone-600" />
          <h3 className="mt-2 text-sm font-semibold text-stone-800 dark:text-stone-200">
            No registration requests found
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            The verification queue is clear for the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-stone-900 dark:text-white">
                      {app.fullName}
                    </h3>
                    <span className="rounded-md bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                      Requested: {app.requestedRole}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-stone-600 dark:text-stone-300">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-stone-400" />
                      {app.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-stone-400" />
                      {app.department}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <CreditCard className="h-3.5 w-3.5 text-stone-400" />
                      ID: {app.idNumber}
                    </span>
                    {app.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-stone-400" />
                        {app.phone}
                      </span>
                    )}
                  </div>

                  {app.notes && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
                      "{app.notes}"
                    </p>
                  )}

                  {app.rejectionReason && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      Rejection Reason: {app.rejectionReason}
                    </p>
                  )}

                  <p className="text-[11px] text-stone-400">
                    Submitted: {new Date(app.submittedAt).toLocaleString()}
                    {app.reviewedBy && ` • Reviewed by ${app.reviewedBy}`}
                  </p>
                </div>

                {/* Action Buttons for Pending items */}
                {app.status === 'PENDING_APPROVAL' && (
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      onClick={() => handleApprove(app)}
                      disabled={processingId === app.id}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => {
                        setRejectionModalApp(app);
                        setRejectionReason('');
                      }}
                      disabled={processingId === app.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decline Reason Modal */}
      {rejectionModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Decline Registration Request
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Please specify why {rejectionModalApp.fullName}'s registration is being declined. This message will be presented to the applicant.
            </p>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Roll number not found in admission roster. Fee receipt missing."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white p-3 text-xs text-stone-900 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectionModalApp(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
