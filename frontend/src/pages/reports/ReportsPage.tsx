import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Printer, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { ReportSummary } from '../../types/report';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';


const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [verdictFilter, setVerdictFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportService.getReports({
        page,
        page_size: 10,
        search: search || undefined,
        verdict: verdictFilter || undefined,
      });
      setReports(res.items);
      setTotalPages(res.total_pages);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, verdictFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  const handleDownloadPdf = async (report: ReportSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDownloadingId(report.id);
      const blob = await reportService.getReportPdfBlob(report.id);
      reportService.downloadBlob(blob, `${report.report_number}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Could not download PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'PASS':
        return <Badge variant="green" size="sm"><CheckCircle className="w-3.5 h-3.5 mr-1" /> PASS</Badge>;
      case 'FAIL':
        return <Badge variant="red" size="sm"><XCircle className="w-3.5 h-3.5 mr-1" /> FAIL</Badge>;
      case 'REVIEW':
      default:
        return <Badge variant="yellow" size="sm"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> REVIEW</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">OIML R-76 Test Reports Archive</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, preview, and download standardized verification certificates with tamper-evident checksums.
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Reports</p>
            <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Standard</p>
            <p className="text-sm font-bold text-slate-800">OIML R 76-1:2006</p>
            <p className="text-xs text-slate-500">Non-Automatic Weighing</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Integrity</p>
            <p className="text-sm font-bold text-slate-800">SHA-256 Verified</p>
            <p className="text-xs text-slate-500">Cryptographic audit trail</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Report #, Test ID, Instrument..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={verdictFilter}
              onChange={(e) => {
                setVerdictFilter(e.target.value);
                setPage(1);
              }}
              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Verdicts</option>
              <option value="PASS">PASS (Compliant)</option>
              <option value="FAIL">FAIL (Non-Compliant)</option>
              <option value="REVIEW">Under Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading report records...</p>
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-7 h-7 text-slate-400" />}
            title="No test reports found"
            description="Generate official reports from completed test sessions in the Test Workspace."
            actionText="View Test History"
            onAction={() => navigate('/testing/history')}
          />
        ) : (

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Report Number</th>
                  <th className="py-3.5 px-4">Test Reference</th>
                  <th className="py-3.5 px-4">Instrument EUT</th>
                  <th className="py-3.5 px-4">OIML Verdict</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Issued By</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {reports.map((report) => (
                  <tr 
                    key={report.id}
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                      {report.report_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono text-xs">
                      {report.test?.test_id || `TEST-${report.test_id}`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-medium text-slate-900">
                        {report.test?.instrument?.manufacturer} {report.test?.instrument?.model}
                      </div>
                      <div className="text-xs text-slate-500">
                        Class {report.test?.instrument?.accuracy_class} &bull; S/N: {report.test?.instrument?.serial_number}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getVerdictBadge(report.overall_verdict)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs flex items-center gap-1.5 mt-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {report.issued_by?.name || 'Authorized Tester'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <Button

                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/reports/${report.id}`)}
                          title="View In-Browser Certificate"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleDownloadPdf(report, e)}
                          disabled={downloadingId === report.id}
                          title="Download Standard PDF"
                        >
                          {downloadingId === report.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          ) : (
                            <Download className="w-4 h-4 text-slate-600" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={10}
              onPageChange={setPage}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default ReportsPage;
