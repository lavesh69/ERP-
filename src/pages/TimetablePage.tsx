import React, { useState } from 'react';
import { TimetableSlot } from '@/types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Printer, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

const mockSchedule: TimetableSlot[] = [
  { id: 't1', day: 'Monday', time: '09:00 - 10:30 AM', courseCode: 'CS101', courseName: 'Intro to Computer Science', room: 'Hall A-101', instructor: 'Dr. Sarah Lin' },
  { id: 't2', day: 'Monday', time: '11:00 - 12:30 PM', courseCode: 'MATH201', courseName: 'Linear Algebra & Calc III', room: 'Hall B-204', instructor: 'Prof. David Thorne' },
  { id: 't3', day: 'Monday', time: '02:00 - 04:00 PM', courseCode: 'CS101L', courseName: 'CS Lab Session', room: 'Computing Lab 4', instructor: 'Dr. Sarah Lin' },
  { id: 't4', day: 'Tuesday', time: '10:00 - 11:30 AM', courseCode: 'ENG102', courseName: 'Technical Writing', room: 'Hall C-102', instructor: 'Dr. Lisa Ray' },
  { id: 't5', day: 'Tuesday', time: '01:00 - 02:30 PM', courseCode: 'CS301', courseName: 'Data Structures & Algorithms', room: 'Hall A-101', instructor: 'Dr. Alan Turing' },
  { id: 't6', day: 'Wednesday', time: '09:00 - 10:30 AM', courseCode: 'CS101', courseName: 'Intro to Computer Science', room: 'Hall A-101', instructor: 'Dr. Sarah Lin' },
  { id: 't7', day: 'Wednesday', time: '11:00 - 12:30 PM', courseCode: 'MATH201', courseName: 'Linear Algebra & Calc III', room: 'Hall B-204', instructor: 'Prof. David Thorne' },
  { id: 't8', day: 'Thursday', time: '10:00 - 11:30 AM', courseCode: 'ENG102', courseName: 'Technical Writing', room: 'Hall C-102', instructor: 'Dr. Lisa Ray' },
  { id: 't9', day: 'Thursday', time: '02:00 - 03:30 PM', courseCode: 'CS301', courseName: 'Data Structures & Algorithms', room: 'Hall A-101', instructor: 'Dr. Alan Turing' },
  { id: 't10', day: 'Friday', time: '09:00 - 11:00 AM', courseCode: 'PHYS101', courseName: 'Engineering Physics', room: 'Science Auditorium', instructor: 'Dr. Robert Oppen' },
  { id: 't11', day: 'Friday', time: '01:30 - 03:00 PM', courseCode: 'SEM400', courseName: 'Academic Capstone Advisory', room: 'Conference Room 2', instructor: 'Dean Wilson' },
];

export const TimetablePage: React.FC = () => {
  const days = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const [selectedDay, setSelectedDay] = useState('All');

  const filteredSlots = selectedDay === 'All'
    ? mockSchedule
    : mockSchedule.filter((s) => s.day === selectedDay);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white sm:text-3xl flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            Class Schedule & Timetable
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            View your synchronized lecture, recitation, and laboratory sessions for the Spring 2026 semester.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2.5 text-sm font-semibold text-stone-700 dark:text-stone-200 shadow-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors self-start sm:self-auto"
        >
          <Printer className="h-4 w-4" />
          <span>Print Schedule</span>
        </button>
      </div>

      {/* Day Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              selectedDay === day
                ? 'bg-rose-600 text-white shadow'
                : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSlots.map((slot) => (
          <div
            key={slot.id}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-rose-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-rose-800 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  {slot.day}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 dark:text-stone-400">
                  <Clock className="h-3.5 w-3.5 text-stone-400" />
                  {slot.time}
                </span>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  {slot.courseCode}
                </div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-white mt-0.5">
                  {slot.courseName}
                </h3>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-stone-400" />
                  <span>Room: <strong className="text-stone-800 dark:text-stone-200">{slot.room}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-stone-400" />
                  <span>Instructor: <strong className="text-stone-800 dark:text-stone-200">{slot.instructor}</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
              <span>Attendance tracked</span>
              <span className="text-rose-600 font-semibold">Live</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
