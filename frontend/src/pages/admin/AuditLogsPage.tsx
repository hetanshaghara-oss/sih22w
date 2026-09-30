import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  Database,
  FileText,
  Clock,
  User as UserIcon,
  Eye,
  RefreshCw,
  Server,
  Activity,
  HardDrive,
} from 'lucide-react';
import { auditService, AuditLogEntry, SystemInfo } from '../../services/auditService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackupLoading, setIsBackupLoading] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [actionsList, setActionsList] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Selected Log for JSON view
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      const res = await auditService.getAuditLogs({
        search: search.trim() || undefined,
        action: selectedAction || undefined,
        date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        date_to: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
        page,
        page_size: pageSize,
      });
      setLogs(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [acts, sys] = await Promise.all([
        auditService.getActions(),
        auditService.getSystemInfo(),
      ]);
      setActionsList(acts);
      setSystemInfo(sys);
    } catch (err) {
      console.error('Failed to load system metadata:', err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [page, selectedAction, dateFrom, dateTo]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  const handleBackupDownload = async () => {
    try {
      setIsBackupLoading(true);
      await auditService.downloadDatabaseBackup();
    } catch (err) {
      alert('Failed to download database backup snapshot.');
    } finally {
      setIsBackupLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVE') || action.includes('SUCCESS')) {
      return <Badge variant="green" size="sm">{action}</Badge>;
    }
    if (action.includes('REJECT') || action.includes('FAIL') || action.includes('DELETE')) {
      return <Badge variant="red" size="sm">{action}</Badge>;
    }
    if (action.includes('REPORT') || action.includes('EXPORT')) {
      return <Badge variant="purple" size="sm">{action}</Badge>;
    }
    if (action.includes('LOGIN')) {
      return <Badge variant="yellow" size="sm">{action}</Badge>;
    }
    return <Badge variant="blue" size="sm">{action}</Badge>;
  };

  const parseJsonDetails = (jsonStr?: string | null) => {
    if (!jsonStr) return null;
    try {
      return JSON.parse(jsonStr);
    } catch {
      return jsonStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Regulatory Audit Trail & System Security
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Immutable log of all metrological actions, user authentication, and system events.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBackupDownload}
          disabled={isBackupLoading}
          leftIcon={<Download className="w-4 h-4 text-slate-600" />}
        >
          {isBackupLoading ? 'Creating Snapshot...' : 'Download Database Backup'}
        </Button>
      </div>

      {/* System Health / Storage Stats */}
      {systemInfo && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Engine Status</span>
            <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">v{systemInfo.version}</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Database Size</span>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {formatFileSize(systemInfo.database_size_bytes)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{systemInfo.database_type.toUpperCase()}</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Audit Records</span>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {systemInfo.total_audit_logs}
            </div>
            <span className="text-[10px] text-emerald-600 font-mono mt-0.5 block">100% Traceable</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Instruments</span>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {systemInfo.total_instruments}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">In Registry</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Test Records</span>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {systemInfo.total_tests}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Executed</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Certificates</span>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {systemInfo.total_reports}
            </div>
            <span className="text-[10px] text-purple-600 font-mono mt-0.5 block">Generated</span>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-800">
              Audit Event Log
            </h2>
            <span className="text-xs text-slate-500 font-mono">({total} events)</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search reference, details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 w-52"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </form>

            {/* Action Select */}
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            >
              <option value="">All Actions</option>
              {actionsList.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="py-1 px-2 text-xs rounded-lg border border-slate-300 bg-white"
                title="Date From"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="py-1 px-2 text-xs rounded-lg border border-slate-300 bg-white"
                title="Date To"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedAction('');
                setDateFrom('');
                setDateTo('');
                setPage(1);
                fetchAuditLogs();
              }}
              leftIcon={<RefreshCw className="w-3 h-3" />}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading audit events...
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              title="No audit events found"
              description="No events matched the selected filter criteria."
              actionText="Reset Filters"
              onAction={() => {
                setSearch('');
                setSelectedAction('');
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
            />
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Reference #</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {log.user ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{log.user.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.user.email} [{log.user.role}]
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-mono text-[11px]">System Process</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 capitalize">
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                      {log.reference_number || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Inspect Log Details Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Event Inspection: #${selectedLog?.id}`}
        maxWidth="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Action</span>
                <span className="font-semibold text-slate-800">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Timestamp</span>
                <span className="font-mono text-slate-800">{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Entity</span>
                <span className="font-semibold text-slate-800">{selectedLog.entity_type} (ID: {selectedLog.entity_id})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Reference Number</span>
                <span className="font-mono font-semibold text-blue-600">{selectedLog.reference_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Operator</span>
                <span className="font-semibold text-slate-800">
                  {selectedLog.user ? `${selectedLog.user.name} (${selectedLog.user.email})` : 'System Service'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">IP Address</span>
                <span className="font-mono text-slate-800">{selectedLog.ip_address || '127.0.0.1 (Local)'}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Event Payload & Metadata
              </span>
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto max-h-60 leading-relaxed">
                {JSON.stringify(parseJsonDetails(selectedLog.details_json), null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
