import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  Clock,
  CheckCircle,
  FileText,
  PlusCircle,
  ArrowRight,
  Activity,
  Layers,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { DashboardData } from '../../types/dashboard';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canEdit = role === 'admin' || role === 'tester';
  const canReview = role === 'admin' || role === 'reviewer';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const resp = await dashboardService.getDashboardData();
        setData(resp);
      } catch (err: any) {
        setError('Failed to load dashboard metrics from backend.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Metrology Operations Center
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Welcome back, <strong className="text-slate-700">{user?.name}</strong>. Signed in as{' '}
            <span className="capitalize font-semibold text-blue-600">[{role || 'Viewer'}]</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/testing/history')}
            leftIcon={<History className="w-3.5 h-3.5" />}
          >
            Test History
          </Button>

          {canEdit && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/instruments/new')}
                leftIcon={<Scale className="w-3.5 h-3.5" />}
              >
                Add Instrument
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/testing/new')}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                New Test Run
              </Button>
            </>
          )}

          {canReview && !canEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/testing/history?status=Under%20Review')}
              leftIcon={<ClipboardList className="w-4 h-4" />}
            >
              Review Pending Tests
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Instruments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Instruments
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {isLoading ? '...' : data?.summary.total_instruments ?? 0}
            </h3>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {data?.summary.active_instruments ?? 0} Active Registry
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* Tests In Progress & Pending */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Testing
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {isLoading ? '...' : (data?.summary.tests_in_progress ?? 0) + (data?.summary.tests_pending_review ?? 0)}
            </h3>
            <p className="text-[11px] text-amber-600 mt-1 font-medium">
              {data?.summary.tests_pending_review ?? 0} Pending Authorization
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Tests & Compliance Verdicts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed Tests
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {isLoading ? '...' : data?.summary.completed_tests ?? 0}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[11px]">
              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> {data?.summary.pass_count ?? 0} PASS
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                <XCircle className="w-3 h-3" /> {data?.summary.fail_count ?? 0} FAIL
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Reports Generated */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Reports Generated
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {isLoading ? '...' : data?.summary.reports_generated ?? 0}
            </h3>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">
              OIML Certificates Issued
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Recent Activity & Architecture Staging */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-800">
                Recent Metrological Activity
              </h2>
            </div>
            <button
              onClick={() => navigate('/testing/history')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
            >
              <span>View full history</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-6 flex-1">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-100 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : !data || data.recent_activity.length === 0 ? (
              <EmptyState
                title="No recent metrological activities"
                description="Recently registered NAWI instruments, testing runs, and audit logs will be chronologically tracked here."
                actionText={canEdit ? 'Register First Instrument' : undefined}
                onAction={canEdit ? () => navigate('/instruments/new') : undefined}
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recent_activity.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mt-0.5 shrink-0">
                        {item.type === 'report' ? (
                          <FileText className="w-4 h-4" />
                        ) : item.type === 'test' ? (
                          <ClipboardList className="w-4 h-4" />
                        ) : (
                          <Scale className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.description}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono block mt-1">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                    </div>
                    {item.status && (
                      <Badge
                        variant={
                          item.status.includes('Active') || item.status.includes('COMPLETED') || item.status.includes('PASS')
                            ? 'green'
                            : item.status.includes('FAIL')
                            ? 'red'
                            : 'yellow'
                        }
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metrology & System Security Overview */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>OIML Compliance & Governance</span>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-emerald-900">
                <span>OIML R-76 Rules Engine:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px]">
                  ACTIVE
                </span>
              </div>
              <p className="text-emerald-800/80 leading-relaxed text-[11px]">
                Configurable MPE error tolerance limits, tare evaluation, repeatability, and eccentric loading compliance checking.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-slate-700 font-medium">Audit Trail Logging</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono text-[10px] font-semibold">
                  Continuous
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-slate-700 font-medium">Role Access Control</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono text-[10px] font-semibold">
                  4 Roles Active
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-slate-700 font-medium">Database Snapshots</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono text-[10px] font-semibold">
                  On-Demand
                </span>
              </div>
            </div>
          </div>

          {/* Quick Access Card */}
          <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 shadow-xs text-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Layers className="w-4 h-4" />
              <span>Metrological Procedures</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              All accuracy classes (Class I, II, III, IIII) are supported with dynamic tare evaluation, temperature drift recording, and automated PDF certification.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">Standard: OIML R 76-1 (2006)</span>
              <button
                onClick={() => navigate('/testing/history')}
                className="text-amber-400 hover:text-amber-300 font-medium hover:underline text-[11px]"
              >
                Inspect Records &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
