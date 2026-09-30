import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Scale,
  ClipboardCheck,
  FileText,
  Users,
  Settings,
  ChevronDown,
  PlusCircle,
  List,
  Sparkles,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();
  const location = useLocation();

  const [instrumentsOpen, setInstrumentsOpen] = useState(
    location.pathname.startsWith('/instruments')
  );
  const [testingOpen, setTestingOpen] = useState(
    location.pathname.startsWith('/testing')
  );
  const [reportsOpen, setReportsOpen] = useState(
    location.pathname.startsWith('/reports')
  );

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow-xs'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const subNavItemClass = (isActive: boolean) =>
    `flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-colors pl-9 ${
      isActive
        ? 'text-blue-400 font-semibold bg-blue-950/40'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen text-slate-100 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 gap-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Scale className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white tracking-wider uppercase">
            NAWI System
          </h1>
          <p className="text-[10px] text-slate-400 font-mono tracking-tight">
            OIML R 76 Standard
          </p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => navItemClass(isActive)}
        >
          <LayoutDashboard className="w-4 h-4 text-slate-400" />
          <span>Dashboard</span>
        </NavLink>

        {/* Instruments (Phase 1 Core) */}
        <div>
          <button
            type="button"
            onClick={() => setInstrumentsOpen(!instrumentsOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <Scale className="w-4 h-4 text-blue-400" />
              <span>Instruments</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                instrumentsOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {instrumentsOpen && (
            <div className="mt-1 space-y-1">
              <NavLink
                to="/instruments"
                end
                className={({ isActive }) => subNavItemClass(isActive)}
              >
                <List className="w-3.5 h-3.5" />
                <span>All Instruments</span>
              </NavLink>
              {role !== 'viewer' && (
                <NavLink
                  to="/instruments/new"
                  className={({ isActive }) => subNavItemClass(isActive)}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Instrument</span>
                </NavLink>
              )}
            </div>
          )}
        </div>

        {/* Testing (Phase 2 & 3 Active) */}
        <div>
          <button
            type="button"
            onClick={() => setTestingOpen(!testingOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              <span>Testing</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                testingOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {testingOpen && (
            <div className="mt-1 space-y-1">
              {role !== 'viewer' && (
                <NavLink
                  to="/testing/new"
                  className={({ isActive }) => subNavItemClass(isActive)}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Test</span>
                </NavLink>
              )}
              <NavLink
                to="/testing/history"
                className={({ isActive }) => subNavItemClass(isActive)}
              >
                <List className="w-3.5 h-3.5" />
                <span>Test History</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Reports (Phase 4 & 5 Active) */}
        <NavLink
          to="/reports"
          className={({ isActive }) => navItemClass(isActive)}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          <span>Test Reports</span>
        </NavLink>

        {/* Admin Navigation */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1">
          {role === 'admin' && (
            <>
              <NavLink
                to="/admin/rules"
                className={({ isActive }) => navItemClass(isActive)}
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>OIML Rules</span>
              </NavLink>

              <NavLink
                to="/admin/audit-logs"
                className={({ isActive }) => navItemClass(isActive)}
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Audit Trail</span>
              </NavLink>
            </>
          )}

          <NavLink
            to="/admin/users"
            className={({ isActive }) => navItemClass(isActive)}
          >
            <Users className="w-4 h-4 text-slate-400" />
            <span className="flex-1">Users</span>
            {role !== 'admin' && (
              <span title="Admin Only">
                <Shield className="w-3 h-3 text-slate-500" />
              </span>
            )}
          </NavLink>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) => navItemClass(isActive)}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>

      {/* Laboratory System Badge Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="text-[11px] leading-tight">
            <p className="font-semibold text-slate-200">Phase 1 - 6 Production</p>
            <p className="text-slate-400 text-[10px]">OIML R-76 & RBAC Audit</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

