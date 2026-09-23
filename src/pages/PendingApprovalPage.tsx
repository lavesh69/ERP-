import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchRegistrationApplications } from '@/lib/firebase';
import { RegistrationApplication } from '@/types';
import { 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  LogOut, 
  GraduationCap, 
  User, 
  Building2, 
  CreditCard,
  Mail,
  AlertTriangle
} from 'lucide-react';

export const PendingApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, logout } = useAuth();

  const [application, setApplication] = useState<RegistrationApplication | null>(
    (location.state as any)?.application || null
  );
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const checkStatus = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      const apps = await fetchRegistrationApplications();
      // Match by current user email or uid
      const currentEmail = user?.email || application?.email;
      const currentUid = user?.uid || application?.uid;
      const matched = apps.find(
        (a) => (currentUid && a.uid === currentUid) || (currentEmail && a.email === currentEmail)
      );

      if (matched) {
        setApplication(matched);
        if (matched.status === 'APPROVED') {
          setStatusMessage('Congratulations! Your application has been approved. Redirecting to dashboard...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else if (matched.status === 'REJECTED') {
          setStatusMessage(`Application declined: ${matched.rejectionReason || 'Please contact the Registrar office.'}`);
        } else {
          setStatusMessage('Application is still in review with the Institutional Registrar.');
        }
      } else {
        setStatusMessage('Application record active in queue. Please allow 12-24 hours for administrative review.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Unable to connect to verification queue. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!application) {
      checkStatus();
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white sm:text-3xl">
            Account Under Administrative Review
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Your self-registration application has been logged and is awaiting Registrar approval.
          </p>
        </div>

        <div className="mt-8 bg-white dark:bg-stone-900 py-8 px-6 shadow-xl rounded-2xl border border-stone-200 dark:border-stone-800 sm:px-10 space-y-6">
          {/* Status Badge Banner */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 text-center space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:bg-amber-900/40 dark:text-amber-300">
              <Clock className="h-3 w-3" />
              STATUS: PENDING INSTITUTIONAL APPROVAL
            </span>
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed pt-1">
              All academic records, timetable access, and gradebooks are locked until an authorized administrator verifies your institutional identity.
            </p>
          </div>

          {/* Stepper tracker */}
          <div className="border-t border-b border-stone-100 dark:border-stone-800 py-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="space-y-1">
                <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-xs font-bold">
                  ✓
                </div>
                <div className="text-[11px] font-bold text-stone-800 dark:text-stone-200">1. Submitted</div>
                <div className="text-[10px] text-stone-400">Completed</div>
              </div>

              <div className="space-y-1">
                <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 text-xs font-bold animate-pulse">
                  2
                </div>
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">2. Review</div>
                <div className="text-[10px] text-stone-400">In Progress</div>
              </div>

              <div className="space-y-1">
                <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 text-xs font-bold">
                  3
                </div>
                <div className="text-[11px] font-bold text-stone-400">3. Portal Access</div>
                <div className="text-[10px] text-stone-400">Awaiting</div>
              </div>
            </div>
          </div>

          {/* Application Details Summary */}
          <div className="space-y-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl p-4 border border-stone-100 dark:border-stone-800 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-stone-200/60 dark:border-stone-700/60">
              <span className="text-stone-500">Applicant:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {application?.fullName || user?.displayName || 'Applicant'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-stone-200/60 dark:border-stone-700/60">
              <span className="text-stone-500">Email:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {application?.email || user?.email || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-stone-200/60 dark:border-stone-700/60">
              <span className="text-stone-500">Requested Role:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {application?.requestedRole || profile?.requestedRole || 'STUDENT'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-stone-200/60 dark:border-stone-700/60">
              <span className="text-stone-500">Department:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {application?.department || 'Computer Science & Engineering'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-stone-500">ID / Roll No:</span>
              <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                {application?.idNumber || 'Pending assignment'}
              </span>
            </div>
          </div>

          {statusMessage && (
            <div className="rounded-xl bg-stone-100 dark:bg-stone-800 p-3 text-xs text-stone-700 dark:text-stone-300 text-center">
              {statusMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={checkStatus}
              disabled={checking}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 px-4 text-xs font-semibold text-white shadow hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking...' : 'Check Approval Status'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800 py-2.5 px-4 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Quick link for testing administrator view */}
          <div className="text-center pt-2 border-t border-stone-100 dark:border-stone-800">
            <p className="text-[11px] text-stone-400">
              Are you an institutional administrator?{' '}
              <Link to="/admin/approvals" className="font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 underline">
                Go to Admin Verification Queue
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
