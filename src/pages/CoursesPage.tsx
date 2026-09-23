import React, { useEffect, useState } from 'react';
import { Course } from '@/types';
import { fetchCourses } from '@/lib/firebase';
import { 
  BookOpen, 
  Search, 
  Filter, 
  User, 
  MapPin, 
  Clock, 
  Award,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCourses();
        setCourses(data);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const departments = ['all', ...Array.from(new Set(courses.map((c) => c.department)))];

  const filtered = courses.filter((c) => {
    const instructorName = c.instructor || c.facultyName || '';
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      instructorName.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === 'all' || c.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white sm:text-3xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            Course Catalog & Enrollment
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Browse active departmental courses, assigned faculty, class venues, and credit requirements.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by course code, title, or instructor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-stone-400" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-stone-200 dark:bg-stone-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center dark:border-stone-800 dark:bg-stone-900">
          <p className="text-base font-semibold text-stone-700 dark:text-stone-300">
            No courses found matching your criteria.
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Try adjusting your search terms or department filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-rose-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-rose-800 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                    {course.code}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 dark:text-stone-400">
                    <Award className="h-3.5 w-3.5 text-amber-500" />
                    {course.credits} Credits
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    {course.department}
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-xs text-stone-600 dark:text-stone-300 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-stone-400" />
                    <span>{course.instructor || course.facultyName || 'Faculty Assigned'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-stone-400" />
                    <span>{course.room || 'Main Academic Hall'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-stone-400" />
                    <span>{course.schedule || 'Mon, Wed 10:00 AM'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Enrolled
                </span>
                <button
                  onClick={() => alert(`Syllabus and modules for ${course.code} are synchronized via Firestore repository.`)}
                  className="rounded-lg bg-stone-100 dark:bg-stone-800 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
