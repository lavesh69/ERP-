import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { 
  User, 
  Mail, 
  Shield, 
  Fingerprint, 
  Calendar, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Lock,
  Layers
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, profile, updateRole, logout } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleRoleChange = async (role: UserRole) => {
    setSwitching(true);
    try {
      await updateRole(role);
      setSuccessMsg(`Active role updated to ${role}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to change role:', err);
    } finally {
      setSwitching(false);
    }
  };

  const roles: { id: UserRole; title: string; desc: string }[] = [
    { id: 'STUDENT', title: 'Scholar / Student', desc: 'Access course materials, assignment submissions, and weekly timetable.' },
    { id: 'FACULTY', title: 'Faculty / Professor', desc: 'Manage grades, upload lecture syllabi, and conduct attendance rosters.' },
    { id: 'INSTITUTION_ADMIN', title: 'Administrator', desc: 'Full institutional governance, audit logs, and directory controls.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white sm:text-3xl">
          Account & Profile Security
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Manage your verified Google identity, assigned roles, and session security credentials.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Identity Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-stone-100 dark:border-stone-800">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Profile'}
              className="h-24 w-24 rounded-full ring-4 ring-rose-100 dark:ring-rose-950 object-cover shadow-md"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-3xl font-bold">
              {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-white">
                {user?.displayName || 'Academic User'}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                <Shield className="h-3 w-3" />
                {profile?.role.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="h-4 w-4 text-stone-400" />
              {user?.email}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 pt-1">
              Provider: <span className="font-mono text-stone-700 dark:text-stone-300">{user?.providerData[0]?.providerId || 'google.com'}</span>
            </p>
          </div>

          <div>
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 shadow-sm hover:bg-rose-50 dark:hover:bg-stone-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Security & Authentication Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
          <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-4 border border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Fingerprint className="h-4 w-4 text-rose-600" />
              <span>Firebase Unique UID</span>
            </div>
            <p className="font-mono text-xs text-stone-800 dark:text-stone-200 break-all select-all">
              {user?.uid}
            </p>
          </div>

          <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-4 border border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Calendar className="h-4 w-4 text-rose-600" />
              <span>Session Initialized</span>
            </div>
            <p className="text-xs text-stone-800 dark:text-stone-200">
              {user?.metadata.lastSignInTime || 'Live Session active'}
            </p>
          </div>
        </div>
      </div>

      {/* Role Switching for Development & Testing */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-white">
          <Layers className="h-5 w-5 text-rose-600" />
          <h3>Role Privileges & Authorization Matrix</h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Switch your active role below to preview how the ERP adapts navigation, views, and data authorizations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {roles.map((r) => {
            const isCurrent = profile?.role === r.id;
            return (
              <div
                key={r.id}
                onClick={() => !switching && handleRoleChange(r.id)}
                className={`relative cursor-pointer rounded-xl p-4 border transition-all ${
                  isCurrent
                    ? 'border-rose-600 bg-rose-50/50 dark:border-rose-500 dark:bg-rose-950/20 ring-2 ring-rose-500/20'
                    : 'border-stone-200 hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700 bg-white dark:bg-stone-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-stone-900 dark:text-white">
                    {r.title}
                  </span>
                  {isCurrent && (
                    <CheckCircle2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  )}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {r.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Best Practices Disclosures */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-white">
          <Lock className="h-4 w-4 text-rose-600" />
          <span>Security & Privacy Compliance</span>
        </div>
        <ul className="text-xs text-stone-500 dark:text-stone-400 space-y-2 list-disc pl-5 leading-relaxed">
          <li>
            <strong>OAuth 2.0 Token Isolation:</strong> No client-side code has access to your raw Google account password or OAuth client secrets. Authentication tokens are verified securely via Firebase Auth.
          </li>
          <li>
            <strong>Zero Hardcoded Service Keys:</strong> Frontend utilizes public API keys restricted to authorized domains in Firebase Console. No private private_key or service-account JSON is bundled in the static build.
          </li>
          <li>
            <strong>Cloud Firestore Guardrails:</strong> Firestore Security Rules restrict writes exclusively to authenticated users updating their own <code>{'/users/{userId}'}</code> record.
          </li>
        </ul>
      </div>
    </div>
  );
};
