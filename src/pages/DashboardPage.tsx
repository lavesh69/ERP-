import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAnnouncements, fetchCourses } from '@/lib/firebase';
import { Announcement, Course } from '@/types';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Award, 
  Bell, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [loadedAnnouncements, loadedCourses] = await Promise.all([
          fetchAnnouncements(),
          fetchCourses()
        ]);
        setAnnouncements(loadedAnnouncements);
        setCourses(loadedCourses);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = [
    { label: 'Active Courses', value: courses.length.toString(), icon: BookOpen, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400' },
    { label: 'Weekly Classes', value: '18 hrs', icon: Calendar, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400' },
    { label: 'Attendance Rate', value: '94.2%', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400' },
    { label: 'Credits Completed', value: '84 / 120', icon: Award, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 text-white p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-rose-300" />
            <span>Academic Portal • Spring 2026</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome back, {user?.displayName || 'Scholar'}!
          </h1>
          <p className="text-stone-200 text-base leading-relaxed">
            Here is your live academic overview. You are currently authenticated via Google Sign-In with full 
            role-based privileges as <span className="font-semibold text-rose-200 uppercase">{profile?.role || 'student'}</span>.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-rose-900 shadow hover:bg-stone-100 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              <span>Explore My Courses</span>
            </Link>
            <Link
              to="/timetable"
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600/40 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-rose-600/60 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              <span>Weekly Timetable</span>
            </Link>
          </div>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 h-64 w-64 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
                  {s.label}
                </span>
                <div className={`rounded-xl p-2.5 ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
                  {s.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Courses & Announcements */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Enrolled Courses Highlights */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              Active Courses
            </h2>
            <Link
              to="/courses"
              className="text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {courses.slice(0, 3).map((course) => (
              <div
                key={course.id}
                className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-rose-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-rose-800"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                        {course.code}
                      </span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        {course.credits} Credits • {course.department}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-stone-900 dark:text-white group-hover:text-rose-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Instructor: {course.instructor} • Room: {course.room}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:self-center">
                    <span className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full">
                      <Clock className="h-3 w-3" />
                      {course.schedule}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Real-time Campus Notices */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              Notices & Bulletins
            </h2>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
              Live Firestore
            </span>
          </div>

          <div className="space-y-4">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : item.priority === 'important'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300'
                    }`}
                  >
                    {item.category.toUpperCase()}
                  </span>
                  <span className="text-xs text-stone-400">
                    {item.createdAt}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {item.content}
                </p>
                <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />
                  <span>Posted by: {item.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
