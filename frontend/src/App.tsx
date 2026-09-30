import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { InstrumentListPage } from './pages/instruments/InstrumentListPage';
import { AddInstrumentPage } from './pages/instruments/AddInstrumentPage';
import { NewTestPage } from './pages/testing/NewTestPage';
import { TestWorkspacePage } from './pages/testing/TestWorkspacePage';
import { TestHistoryPage } from './pages/testing/TestHistoryPage';
import ReportsPage from './pages/reports/ReportsPage';
import ReportViewPage from './pages/reports/ReportViewPage';
import RuleManagementPage from './pages/admin/RuleManagementPage';

import { UsersPage } from './pages/admin/UsersPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Routes (All authenticated roles) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/instruments" element={<InstrumentListPage />} />

              {/* Tester & Admin can add instruments */}
              <Route
                element={<ProtectedRoute allowedRoles={['tester', 'admin']} />}
              >
                <Route path="/instruments/new" element={<AddInstrumentPage />} />
              </Route>

              {/* Phase 2 & 3 Testing Workflow */}
              <Route
                element={<ProtectedRoute allowedRoles={['tester', 'admin']} />}
              >
                <Route path="/testing/new" element={<NewTestPage />} />
              </Route>
              <Route path="/testing/:id" element={<TestWorkspacePage />} />
              <Route path="/testing/history" element={<TestHistoryPage />} />

              {/* Step 4 & 5 Reports Module */}
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:id" element={<ReportViewPage />} />

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/rules" element={<RuleManagementPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>


          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
