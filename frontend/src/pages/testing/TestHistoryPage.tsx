import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ClipboardCheck,
  Search,
  RefreshCw,
  PlusCircle,
  Eye,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  HelpCircle,
  FileText,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import { testingService, TestQueryParams } from '../../services/testingService';
import { Test, TestStatus, OverallVerdict } from '../../types/testing';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

export const TestHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role } = useAuth();

  const [tests, setTests] = useState<Test[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [verdictFilter, setVerdictFilter] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [serialFilter, setSerialFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Delete modal
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = role === 'admin' || role === 'tester';
  const canDelete = role === 'admin';

  const fetchTests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: TestQueryParams = {
        page: currentPage,
        page_size: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (verdictFilter) params.verdict = verdictFilter;
      if (manufacturerFilter.trim()) params.manufacturer = manufacturerFilter.trim();
      if (serialFilter.trim()) params.serial_number = serialFilter.trim();
      if (dateFrom) params.date_from = new Date(dateFrom).toISOString();
      if (dateTo) params.date_to = new Date(dateTo + 'T23:59:59').toISOString();

      const data = await testingService.getTestHistory(params);
      setTests(data.items);
      setTotalItems(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load test history.');
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    search,
    statusFilter,
    verdictFilter,
    manufacturerFilter,
    serialFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTests();
  };

  const handleClear = () => {
    setSearch('');
    setStatusFilter('');
    setVerdictFilter('');
    setManufacturerFilter('');
    setSerialFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handleDeleteTest = async () => {
    if (!testToDelete) return;
    try {
      setIsDeleting(true);
      await testingService.deleteTest(testToDelete.id);
      setTestToDelete(null);
      fetchTests();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete test record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getVerdictBadge = (verdict?: string) => {
    switch (verdict) {
      case 'PASS':
        return <Badge variant="green" size="sm">PASS</Badge>;
      case 'FAIL':
        return <Badge variant="red" size="sm">FAIL</Badge>;
      case 'REVIEW':
        return <Badge variant="yellow" size="sm">REVIEW</Badge>;
      case 'INCOMPLETE':
        return <Badge variant="gray" size="sm">INCOMPLETE</Badge>;
      default:
        return <Badge variant="blue" size="sm">PENDING</Badge>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="green" size="sm">Completed</Badge>;
      case 'Failed':
        return <Badge variant="red" size="sm">Failed</Badge>;
      case 'Under Review':
        return <Badge variant="yellow" size="sm">Under Review</Badge>;
      case 'In Progress':
        return <Badge variant="blue" size="sm">In Progress</Badge>;
      default:
        return <Badge variant="gray" size="sm">Draft</Badge>;
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Metrological Test Records & History
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Comprehensive audit archive of all calibration sessions, observations, and OIML R-76 legal verdicts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTests}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/testing/new')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              New Test Session
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Test ID, Instrument ID, Lab..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-300 rounded-lg text-xs py-2 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
              </select>

              {/* Verdict Filter */}
              <select
                value={verdictFilter}
                onChange={(e) => {
                  setVerdictFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-300 rounded-lg text-xs py-2 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Verdicts</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="REVIEW">REVIEW</option>
                <option value="INCOMPLETE">INCOMPLETE</option>
                <option value="PENDING">PENDING</option>
              </select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              >
                Filters {showAdvancedFilters ? '▲' : '▼'}
              </Button>

              <Button type="submit" variant="secondary" size="sm">
                Apply
              </Button>

              {(search || statusFilter || verdictFilter || manufacturerFilter || serialFilter || dateFrom || dateTo) && (
                <Button type="button" onClick={handleClear} variant="ghost" size="sm">
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters Drawer */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mettler Toledo"
                  value={manufacturerFilter}
                  onChange={(e) => setManufacturerFilter(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. SN-89210"
                  value={serialFilter}
                  onChange={(e) => setSerialFilter(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-mono">Loading laboratory test records...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No test records found"
              description="No OIML R 76 test records match your filter criteria."
              icon={<ClipboardCheck className="w-8 h-8 text-slate-400" />}
              actionText={canCreate ? 'Initiate Test' : undefined}
              onAction={canCreate ? () => navigate('/testing/new') : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-600 select-none">
                  <th className="py-3 px-4">Test ID</th>
                  <th className="py-3 px-4">Instrument ID</th>
                  <th className="py-3 px-4">Manufacturer & Model</th>
                  <th className="py-3 px-4">Tester</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Overall Verdict</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {t.test_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {t.instrument?.instrument_id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {t.instrument?.manufacturer} {t.instrument?.model}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {t.tester?.name || 'Tester'}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="py-3 px-4">
                      {getVerdictBadge(t.overall_verdict)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {formatDate(t.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/testing/${t.id}`)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Workspace
                        </Button>

                        {canDelete && (
                          <button
                            onClick={() => setTestToDelete(t)}
                            disabled={t.status === 'Completed' || t.status === 'Under Review'}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                            title={
                              t.status === 'Completed' || t.status === 'Under Review'
                                ? 'Completed or under-review records cannot be deleted'
                                : 'Delete Draft Test'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!testToDelete}
        onClose={() => setTestToDelete(null)}
        title="Confirm Test Record Deletion"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to delete test run{' '}
            <strong className="text-slate-900 font-mono">{testToDelete?.test_id}</strong>?
          </p>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800">
            <strong>Warning:</strong> All entered observations and calculation logs for this draft session will be permanently purged.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTestToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteTest}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
