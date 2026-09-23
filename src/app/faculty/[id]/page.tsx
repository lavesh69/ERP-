"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Users,
  Building,
  Mail,
  BookOpen,
  Calendar,
  Clock,
  Award,
  ChevronLeft,
  CheckCircle2,
  FileText,
  FlaskConical,
} from "lucide-react";

interface FacultyDossier {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  department: string;
  departmentName: string;
  designation: string;
  specialization: string;
  officeRoom: string;
  weeklyHours: number;
  courses: string[];
}

export default function FacultyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState<FacultyDossier | null>(null);

  useEffect(() => {
    async function loadFaculty() {
      try {
        setLoading(true);
        const res = await fetch("/api/faculty");
        if (res.ok) {
          const data = await res.json();
          const match = (data.faculty || []).find(
            (f: any) => f.id === id || f.employeeCode === id || f.userId === id
          );
          if (match) {
            setFaculty(match);
          } else if (data.faculty && data.faculty.length > 0) {
            setFaculty(data.faculty[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load faculty dossier:", err);
        showToast("Error retrieving faculty dossier", "error");
      } finally {
        setLoading(false);
      }
    }
    loadFaculty();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col gap-6">
          <SkeletonCard />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!faculty) {
    return (
      <AppShell>
        <EmptyState
          icon={Users}
          title="Faculty Record Not Found"
          description="The requested faculty member could not be located in the university directory."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-charcoal-500">
          <Link href="/faculty" className="hover:text-rose-primary flex items-center gap-1 font-semibold">
            <ChevronLeft className="h-4 w-4" /> Faculty Directory
          </Link>
          <span>/</span>
          <span className="text-charcoal-900 dark:text-ivory-100 font-bold">{faculty.name}</span>
        </div>

        {/* Header Hero Banner */}
        <div className="bg-white dark:bg-charcoal-800 rounded-3xl p-6 border border-border dark:border-charcoal-700 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center font-display font-bold text-2xl shadow-sm border border-rose-primary/20">
              {faculty.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-info-subtle text-academic-info border border-blue-200 dark:border-blue-900">
                  {faculty.designation}
                </span>
                <span className="text-xs font-mono text-charcoal-500">{faculty.employeeCode}</span>
              </div>
              <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                {faculty.name}
              </h1>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1 flex items-center gap-2">
                <Building className="h-3.5 w-3.5 text-rose-primary" />
                <span>{faculty.departmentName} ({faculty.department})</span>
                <span>•</span>
                <Mail className="h-3.5 w-3.5 text-rose-primary" />
                <span>{faculty.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`mailto:${faculty.email}`}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary text-white hover:bg-rose-deep shadow-sm transition-all"
            >
              Contact Professor
            </a>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
            <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Weekly Workload</span>
            <div className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 mt-1 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-rose-primary" />
              <span>{faculty.weeklyHours} hrs/week</span>
            </div>
          </div>

          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
            <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Assigned Courses</span>
            <div className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 mt-1 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-academic-info" />
              <span>{faculty.courses?.length || 1} Active</span>
            </div>
          </div>

          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
            <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Faculty Room</span>
            <div className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 mt-1 flex items-center gap-1.5">
              <Building className="h-4 w-4 text-rose-accent" />
              <span>{faculty.officeRoom || "Cabin 304"}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
            <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Specialization</span>
            <div className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 mt-1 truncate">
              {faculty.specialization || "Computer Systems"}
            </div>
          </div>
        </div>

        {/* Curriculum & Teaching Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
            <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-rose-primary" /> Active Course Allocations
            </h3>
            <div className="divide-y divide-border/60 dark:divide-charcoal-700">
              {(faculty.courses || ["CS-402: Distributed Systems Architecture"]).map((course, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">{course}</span>
                    <span className="text-[11px] text-charcoal-500">Department of {faculty.departmentName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-700 border border-green-200 dark:border-green-800">
                    LECTURER IN CHARGE
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
            <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-rose-primary" /> Office Advising Hours
            </h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">Tuesday & Thursday</span>
                  <span className="text-[11px] text-charcoal-500">Student Mentorship & Thesis Review</span>
                </div>
                <span className="font-mono text-xs font-bold text-rose-primary">2:00 PM - 4:30 PM</span>
              </div>
              <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">Friday Afternoon</span>
                  <span className="text-[11px] text-charcoal-500">Department Academic Committee</span>
                </div>
                <span className="font-mono text-xs font-bold text-rose-primary">3:00 PM - 5:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
