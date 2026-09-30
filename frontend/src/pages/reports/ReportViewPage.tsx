import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar, 
  Building2, 
  User, 
  Loader2,
  FileCheck,
  Scale
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { ReportDetail, ReportSnapshot } from '../../types/report';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';


const ReportViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [snapshot, setSnapshot] = useState<ReportSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const rep = await reportService.getReportById(parseInt(id, 10));
        setReport(rep);
        try {
          const parsed = JSON.parse(rep.report_data_json);
          setSnapshot(parsed);
        } catch (e) {
          console.error('Failed to parse snapshot json:', e);
        }
      } catch (err: any) {
        console.error('Failed to load report:', err);
        setError('Report not found or could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!report) return;
    try {
      setDownloading(true);
      const blob = await reportService.getReportPdfBlob(report.id);
      reportService.downloadBlob(blob, `${report.report_number}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Could not download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-base font-medium">Loading Verification Certificate...</p>
      </div>
    );
  }

  if (error || !report || !snapshot) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200">
        <h3 className="font-semibold text-lg">Error loading report</h3>
        <p className="mt-1 text-sm">{error || 'Data snapshot could not be processed.'}</p>
        <Button onClick={() => navigate('/reports')} variant="outline" size="sm" className="mt-4">
          Back to Reports
        </Button>
      </div>
    );
  }

  const { metadata, instrument, environmental_conditions, compliance_summary, procedures } = snapshot;
  const verdict = compliance_summary?.overall_status || report.overall_verdict;

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden on print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Archive
          </Button>
          <div className="h-5 w-[1px] bg-slate-200" />
          <span className="font-mono text-sm font-semibold text-slate-900">{report.report_number}</span>
          <Badge variant={verdict === 'PASS' ? 'green' : (verdict === 'FAIL' ? 'red' : 'yellow')} size="sm">
            {verdict}
          </Badge>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5 text-slate-600" /> Print Certificate
          </Button>
          <Button variant="primary" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1.5" />
            )}
            Download Official PDF
          </Button>
        </div>
      </div>

      {/* Official Certificate Paper Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 sm:p-12 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-slate-900 font-sans">
        
        {/* Header / Laboratory Letterhead */}
        <div className="text-center pb-6 border-b-2 border-blue-700">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Scale className="w-7 h-7 text-blue-700" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              NATIONAL LEGAL METROLOGY LABORATORY
            </h1>
          </div>
          <p className="text-xs font-bold tracking-widest text-blue-700 uppercase">
            Accredited Verification Center &bull; ISO/IEC 17025 Compliant
          </p>
          <h2 className="text-base font-bold text-slate-800 mt-3 uppercase tracking-wide">
            Official Metrological Verification Report & Test Certificate
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            In Accordance with OIML Recommendation R 76-1:2006 (Non-Automatic Weighing Instruments)
          </p>
        </div>

        {/* Certificate Metadata Header Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 my-4 bg-slate-50 rounded-xl px-5 border border-slate-200 text-xs">
          <div>
            <p className="text-slate-500 uppercase font-semibold">Certificate No.</p>
            <p className="font-mono font-bold text-slate-900 text-sm">{report.report_number}</p>
          </div>
          <div>
            <p className="text-slate-500 uppercase font-semibold">Test Session ID</p>
            <p className="font-mono font-medium text-slate-800">{metadata.test_id_str}</p>
          </div>
          <div>
            <p className="text-slate-500 uppercase font-semibold">Date of Verification</p>
            <p className="font-medium text-slate-800">{metadata.test_date || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-500 uppercase font-semibold">Conducted By</p>
            <p className="font-medium text-slate-800">{metadata.tester_name}</p>
          </div>
        </div>

        {/* Overall Verdict Banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between my-5 ${
          verdict === 'PASS' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : verdict === 'FAIL' 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            {verdict === 'PASS' ? (
              <CheckCircle className="w-7 h-7 text-emerald-600 flex-shrink-0" />
            ) : verdict === 'FAIL' ? (
              <XCircle className="w-7 h-7 text-rose-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-amber-600 flex-shrink-0" />
            )}
            <div>
              <p className="font-bold text-base leading-tight">
                OVERALL VERDICT: {verdict === 'PASS' ? 'COMPLIANT (PASS)' : verdict === 'FAIL' ? 'NON-COMPLIANT (FAIL)' : 'PENDING REVIEW'}
              </p>
              <p className="text-xs mt-0.5 opacity-90">
                {verdict === 'PASS' 
                  ? 'The instrument under test conforms to all applicable maximum permissible error (MPE) requirements of OIML R 76-1.'
                  : verdict === 'FAIL'
                    ? 'The instrument exceeded maximum permissible error limits on one or more metrological test procedures.'
                    : 'The test results require further technical review or complete observation records.'}
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <Badge variant={verdict === 'PASS' ? 'green' : (verdict === 'FAIL' ? 'red' : 'yellow')} size="md">
              {verdict}
            </Badge>
          </div>
        </div>

        {/* Section 1: Instrument Under Test (EUT) */}
        <div className="my-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 pb-1 border-b border-slate-200">
            1. Equipment Under Test (EUT) Specifications
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4 text-xs bg-white border border-slate-200 rounded-lg p-4">
            <div>
              <span className="text-slate-500 block">Instrument ID:</span>
              <span className="font-bold font-mono text-slate-900">{instrument.instrument_id}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Manufacturer:</span>
              <span className="font-semibold text-slate-800">{instrument.manufacturer}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Model:</span>
              <span className="font-semibold text-slate-800">{instrument.model}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Serial Number:</span>
              <span className="font-semibold font-mono text-slate-800">{instrument.serial_number}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Accuracy Class:</span>
              <span className="font-bold text-blue-700">{instrument.accuracy_class}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Max Capacity:</span>
              <span className="font-semibold text-slate-800">{instrument.max_capacity} {instrument.unit}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Min Capacity:</span>
              <span className="font-semibold text-slate-800">{instrument.min_capacity} {instrument.unit}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Verification Interval (e):</span>
              <span className="font-semibold text-slate-800">{instrument.verification_scale_interval_e} {instrument.unit}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Scale Interval (d):</span>
              <span className="font-semibold text-slate-800">{instrument.scale_interval_d} {instrument.unit}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Tare Capacity:</span>
              <span className="font-semibold text-slate-800">{instrument.tare_capacity} {instrument.unit}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Number of Intervals (n):</span>
              <span className="font-semibold text-slate-800">{instrument.n_intervals}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Classification:</span>
              <span className="font-semibold text-slate-800">OIML NAWI R 76-1</span>
            </div>
          </div>
        </div>

        {/* Section 2: Environmental Conditions */}
        <div className="my-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 pb-1 border-b border-slate-200">
            2. Laboratory & Environmental Conditions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white border border-slate-200 rounded-lg p-4">
            <div>
              <span className="text-slate-500 block">Ambient Temperature:</span>
              <span className="font-semibold text-slate-800">
                {environmental_conditions.temperature_celsius != null ? `${environmental_conditions.temperature_celsius} °C` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Relative Humidity:</span>
              <span className="font-semibold text-slate-800">
                {environmental_conditions.relative_humidity_percent != null ? `${environmental_conditions.relative_humidity_percent} %` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Atmospheric Pressure:</span>
              <span className="font-semibold text-slate-800">
                {environmental_conditions.atmospheric_pressure_kpa != null ? `${environmental_conditions.atmospheric_pressure_kpa} kPa` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Test Location:</span>
              <span className="font-semibold text-slate-800">{metadata.laboratory_location || 'Main Metrology Lab'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 block">Reference Standards Used:</span>
              <span className="font-semibold text-slate-800">{environmental_conditions.reference_standards || 'Standard Weights'}</span>
            </div>
          </div>
        </div>

        {/* Section 3: OIML Compliance Evaluation Summary */}
        <div className="my-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 pb-1 border-b border-slate-200">
            3. OIML R-76 Regulatory Compliance Summary Matrix
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Test Procedure</th>
                  <th className="py-2.5 px-3">OIML Clause</th>
                  <th className="py-2.5 px-3 text-center">Points</th>
                  <th className="py-2.5 px-3 text-right">Max Deviation</th>
                  <th className="py-2.5 px-3 text-right">Permissible Limit</th>
                  <th className="py-2.5 px-3 text-center">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compliance_summary.procedures.map((p, idx) => (
                  <tr key={idx} className={p.verdict === 'FAIL' ? 'bg-rose-50/50' : ''}>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{p.definition_name}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">{p.clause_reference}</td>
                    <td className="py-2.5 px-3 text-center">{p.total_points_evaluated}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {p.max_deviation_found != null ? p.max_deviation_found.toFixed(4) : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {p.permissible_limit_e ? `≤ ${p.permissible_limit_e} e` : 'Formula'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        p.verdict === 'PASS' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : p.verdict === 'FAIL' 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Detailed Metrological Calculations & Raw Observations Breakdown */}
        <div className="my-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 pb-1 border-b border-slate-200">
            4. Metrological Observations & Turning Point Calculations
          </h3>

          <div className="space-y-4">
            {procedures.map((proc, pidx) => (
              <div key={pidx} className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-800">
                    4.{pidx + 1} {proc.definition_name} ({proc.clause_reference})
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    proc.verdict === 'PASS' ? 'bg-emerald-100 text-emerald-800' : (proc.verdict === 'FAIL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')
                  }`}>
                    {proc.verdict}
                  </span>
                </div>

                {proc.observations.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No observation records captured.</p>
                ) : (
                  <div className="overflow-x-auto bg-white rounded border border-slate-200">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-1.5 px-2">#</th>
                          <th className="py-1.5 px-2">Load ({instrument.unit})</th>
                          <th className="py-1.5 px-2">Indication ({instrument.unit})</th>
                          <th className="py-1.5 px-2">&Delta;L ({instrument.unit})</th>
                          <th className="py-1.5 px-2">Calc P ({instrument.unit})</th>
                          <th className="py-1.5 px-2">Error E ({instrument.unit})</th>
                          <th className="py-1.5 px-2">Position / Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {proc.observations.map((obs: any, oidx: number) => {
                          const e_val = instrument.verification_scale_interval_e;
                          const P = obs.indicated_value + 0.5 * e_val - obs.extra_load_added;
                          const E = P - obs.load_point;
                          return (
                            <tr key={oidx} className="hover:bg-slate-50">
                              <td className="py-1.5 px-2 text-slate-500">{obs.sequence_order || oidx + 1}</td>
                              <td className="py-1.5 px-2 text-slate-900 font-medium">{obs.load_point.toFixed(3)}</td>
                              <td className="py-1.5 px-2">{obs.indicated_value.toFixed(3)}</td>
                              <td className="py-1.5 px-2 text-slate-600">{obs.extra_load_added.toFixed(4)}</td>
                              <td className="py-1.5 px-2 text-blue-700 font-bold">{P.toFixed(4)}</td>
                              <td className="py-1.5 px-2 font-bold">{E >= 0 ? `+${E.toFixed(4)}` : E.toFixed(4)}</td>
                              <td className="py-1.5 px-2 font-sans text-slate-600">{obs.position_label || obs.notes || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Metrological Statement & Remarks */}
        <div className="my-6 text-xs text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="font-bold text-slate-900 mb-1">Metrological Statement:</p>
          <p>
            {metadata.remarks || (
              `This certificate certifies that the non-automatic weighing instrument was inspected and tested in accordance with OIML Recommendation R 76-1:2006. The instrument achieved an overall verdict of ${verdict}.`
            )}
          </p>
        </div>

        {/* Cryptographic Checksum Banner */}
        <div className="my-6 p-3 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">SHA-256 Tamper-Evident Hash:</span>
          </div>
          <span className="truncate max-w-xs sm:max-w-md">{report.checksum_hash}</span>
        </div>

        {/* Section 6: Signatures Block */}
        <div className="grid grid-cols-3 gap-6 pt-8 mt-8 border-t border-slate-200 text-center text-xs">
          <div>
            <div className="h-14 flex items-end justify-center font-cursive text-slate-600 italic">
              {metadata.tester_name}
            </div>
            <div className="border-t border-slate-400 pt-1.5">
              <p className="font-bold text-slate-900">{metadata.tester_name}</p>
              <p className="text-slate-500">Authorized Metrology Tester</p>
            </div>
          </div>

          <div>
            <div className="h-14 flex items-end justify-center font-cursive text-slate-600 italic">
              {metadata.reviewer_name}
            </div>
            <div className="border-t border-slate-400 pt-1.5">
              <p className="font-bold text-slate-900">{metadata.reviewer_name}</p>
              <p className="text-slate-500">Lead Metrologist / Reviewer</p>
            </div>
          </div>

          <div>
            <div className="h-14 flex items-center justify-center">
              <div className="border-2 border-dashed border-slate-300 rounded-lg px-3 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Official Lab Seal
              </div>
            </div>
            <div className="border-t border-slate-400 pt-1.5">
              <p className="font-bold text-slate-900">Accredited Laboratory</p>
              <p className="text-slate-500">ISO/IEC 17025 Standard</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportViewPage;
