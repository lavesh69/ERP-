import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { PendingApprovalPage } from '@/pages/PendingApprovalPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CoursesPage } from '@/pages/CoursesPage';
import { TimetablePage } from '@/pages/TimetablePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AdminApprovalsPage } from '@/pages/AdminApprovalsPage';

import { IdleSessionGuard } from '@/components/auth/IdleSessionGuard';

export const App: React.FC = () => {
  return (
    <>
      {/* FERPA/SOC-2 Inactivity Auto-Logout Guard (15 minutes idle timeout) */}
      <IdleSessionGuard idleTimeoutMinutes={15} warningDurationSeconds={60} />

      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />

      {/* Protected Academic Routes wrapped in AppLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route
          path="admin/approvals"
          element={
            <ProtectedRoute allowedRoles={['INSTITUTION_ADMIN', 'SUPER_ADMIN']}>
              <AdminApprovalsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  );
};

export default App;
