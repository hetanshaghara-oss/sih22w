import React from 'react';
import { LogOut, User as UserIcon, Shield, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../common/Badge';

export const TopNavbar: React.FC = () => {
  const { user, role, logout } = useAuth();

  const getRoleBadgeVariant = (r?: string | null) => {
    switch (r) {
      case 'admin':
        return 'purple';
      case 'reviewer':
        return 'green';
      default:
        return 'blue';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 sticky top-0">
      {/* Title / Context */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-800 tracking-tight">
          NAWI Compliance & Test Report System
        </h2>
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
          <Activity className="w-3 h-3 text-blue-600 animate-pulse" />
          OIML R 76 Standard
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* User Badge Info */}
        <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.name || 'Laboratory Staff'}
            </p>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <Badge variant={getRoleBadgeVariant(role)} size="sm">
                <span className="uppercase text-[9px] tracking-wider font-semibold">
                  {role || 'User'}
                </span>
              </Badge>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign out of system"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
