import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { submitRegistrationApplication } from '@/lib/firebase';
import { UserRole } from '@/types';
import { 
  GraduationCap, 
  ShieldCheck, 
  User, 
  Mail, 
  Building2, 
  CreditCard, 
  Phone, 
  FileText, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signInWithGoogle } = useAuth();

  const [fullName, setFullName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [requestedRole, setRequestedRole] = useState<UserRole>('STUDENT');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  const departments = [
    'Computer Science & Engineering',
    'Artificial Intelligence & Data Science',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Mathematics & Computational Sciences',
    'Management Studies (MBA)',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !idNumber) {
      alert('Please fill in your Full Name, Email, and Roll Number / Employee ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const applicantUid = user?.uid || `applicant_${Date.now()}`;
      const app = await submitRegistrationApplication({
        uid: applicantUid,
        fullName,
        email,
        requestedRole,
        department,
        idNumber,
        phone,
        notes,
      });

      setSubmittedAppId(app.id);
      setTimeout(() => {
        navigate('/pending-approval', { state: { application: app } });
      }, 1500);
    } catch (err) {
      console.error('Registration submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGooglePreFill = async () => {
    try {
      const p = await signInWithGoogle();
      if (p) {
        setFullName(p.displayName || '');
        setEmail(p.email || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/30">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
            Institutional Self-Registration
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Apply for Scholar, Faculty, or Guardian access with Institutional Admin verification.
          </p>
        </div>

        {/* Security / Policy Callout */}
        <div className="mt-6 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-xs text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Administrative Verification Required:</span>
            <p className="mt-0.5 leading-relaxed text-stone-600 dark:text-stone-300">
              To prevent unauthorized record access, all self-registrations enter a secure review queue. The Registrar or Department Head will verify your Roll No / ID against official admission rosters before approving full privileges.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-stone-900 py-8 px-6 shadow-xl rounded-2xl border border-stone-200 dark:border-stone-800 sm:px-10">
          {submittedAppId ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                Application Submitted Successfully!
              </h3>
              <p className="text-xs text-stone-500">
                Application Reference: <span className="font-mono font-bold text-rose-600">{submittedAppId}</span>
              </p>
              <p className="text-xs text-stone-400">
                Redirecting to your application tracking view...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Optional Google Auto-fill */}
              {!user && (
                <div className="pb-4 border-b border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={handleGooglePreFill}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white py-2.5 px-4 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Auto-fill identity using Google Account</span>
                  </button>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                  Applying For Role
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { role: 'STUDENT' as UserRole, label: 'Scholar / Student' },
                    { role: 'FACULTY' as UserRole, label: 'Faculty / Staff' },
                    { role: 'PARENT' as UserRole, label: 'Parent / Guardian' },
                  ].map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setRequestedRole(r.role)}
                      className={`rounded-xl border py-2.5 px-3 text-xs font-semibold text-center transition-all ${
                        requestedRole === r.role
                          ? 'border-rose-600 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:border-rose-500 dark:text-rose-200 ring-2 ring-rose-500/20'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@college.edu or gmail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Department & ID Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Department / Discipline *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {requestedRole === 'FACULTY' ? 'Employee ID / Staff Code *' : 'Roll Number / Admission No *'}
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder={requestedRole === 'FACULTY' ? 'FAC-CSE-09' : '2026-CS-104'}
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Application Notes */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Admission / Appointment Notes (Optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                  <textarea
                    rows={2}
                    placeholder="Mention batch, merit rank, or appointment letter reference..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 px-4 text-sm font-semibold text-white shadow hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit for Admin Approval</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Already registered and approved?{' '}
                  <Link to="/login" className="font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400">
                    Sign in to Portal
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
