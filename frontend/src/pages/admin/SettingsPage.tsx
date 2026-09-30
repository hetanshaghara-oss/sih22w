import React, { useState, useEffect } from 'react';
import { Settings, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { Badge } from '../../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const [engineStatus, setEngineStatus] = useState<any>(null);

  useEffect(() => {
    dashboardService.getEngineStatus().then(setEngineStatus).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Laboratory System Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Global metrological standards, backend connectors, and environment parameters
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
        {/* Metrological Standard */}
        <div>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
              Primary Metrology Standard
            </h3>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Recommendation:</span>
              <span className="font-mono text-slate-900 font-bold">OIML R 76-1 (Edition 2006 E)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Scope:</span>
              <span className="text-slate-600">Non-Automatic Weighing Instruments - Metrological and technical requirements</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Compliance Engine Status:</span>
              <Badge variant="yellow">{engineStatus?.status || 'Phase 1 Architecture'}</Badge>
            </div>
          </div>
        </div>

        {/* Database & Backend Connectivity */}
        <div>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-3">
            <Database className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
              Database & Infrastructure
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-slate-400 block font-mono text-[10px] uppercase">
                Database Engine
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                PostgreSQL 16 (or local SQLite fallback)
              </span>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Connection Active
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-slate-400 block font-mono text-[10px] uppercase">
                Backend API Framework
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                FastAPI (Python 3.11) + SQLAlchemy 2.0
              </span>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> JWT HS256 Authenticated
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
