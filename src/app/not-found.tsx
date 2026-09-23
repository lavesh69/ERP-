import Link from "next/link";
import { GraduationCap, ArrowLeft, Home, Search, ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-charcoal-950 flex flex-col items-center justify-center p-6 text-center select-none transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-charcoal-900 rounded-3xl border border-border dark:border-charcoal-800 p-8 shadow-elevated flex flex-col items-center">
        {/* Academic Seal Icon */}
        <div className="h-16 w-16 rounded-2xl bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center mb-6 shadow-sm border border-rose-primary/20">
          <GraduationCap className="h-8 w-8" />
        </div>

        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-rose-primary dark:text-rose-accent mb-2">
          HTTP 404 · REGISTRY EXCEPTION
        </span>

        <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mb-2">
          Academic Record Not Found
        </h1>

        <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mb-6 leading-relaxed">
          The requested institutional route, dossier, or system resource does not exist in the active university registry or has been archived.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-deep text-white text-xs font-bold shadow-sm transition-all"
          >
            <Home className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
          <Link
            href="/students"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 text-xs font-bold hover:bg-ivory-100 dark:hover:bg-charcoal-700 transition-all"
          >
            <Search className="h-4 w-4" />
            <span>Student Directory</span>
          </Link>
        </div>

        <div className="mt-8 pt-4 border-t border-border/60 dark:border-charcoal-800 w-full flex items-center justify-center gap-2 text-[10px] text-charcoal-400">
          <ShieldCheck className="h-3.5 w-3.5 text-rose-primary" />
          <span>CLASSROOM ERP Verified Institutional Boundary</span>
        </div>
      </div>
    </div>
  );
}
