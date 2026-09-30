import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Thermometer,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Send,
  ShieldCheck,
  Lock,
  Clock,
  Info,
  Scale,
  XCircle,
  HelpCircle,
  FileText,
  Eye,
  Download,
  Printer,
} from 'lucide-react';
import { testingService } from '../../services/testingService';
import { reportService } from '../../services/reportService';

import { useAuth } from '../../contexts/AuthContext';
import {
  Test,
  TestDefinition,
  TestInstance,
  Observation,
  EnvironmentalCondition,
} from '../../types/testing';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Alert } from '../../components/common/Alert';

export const TestWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [testDefinitions, setTestDefinitions] = useState<TestDefinition[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'environment' | 'selection' | 'observations' | 'evaluation'>('overview');
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Environmental Form State
  const [envForm, setEnvForm] = useState<EnvironmentalCondition>({
    temperature_celsius: 20.0,
    relative_humidity_percent: 50.0,
    atmospheric_pressure_kpa: 101.3,
    test_location: '',
    reference_standards: 'OIML Class F1 Standard Weights Set E2-01',
    remarks: '',
  });
  const [isSavingEnv, setIsSavingEnv] = useState(false);

  // Add Observation Form State
  const [obsForm, setObsForm] = useState({
    load_point: 0,
    indicated_value: 0,
    extra_load_added: 0,
    zero_indicated: 0,
    tare_applied: 0,
    position_label: 'Center',
    notes: '',
  });
  const [isAddingObs, setIsAddingObs] = useState(false);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewComments, setReviewComments] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Evaluation loading
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Report Generation & Preview State
  const [generateReportModalOpen, setGenerateReportModalOpen] = useState(false);
  const [reportRemarks, setReportRemarks] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);


  const loadTestData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const testData = await testingService.getTestById(parseInt(id, 10));
      setTest(testData);

      if (testData.environmental_condition) {
        setEnvForm(testData.environmental_condition);
      } else {
        setEnvForm((prev) => ({
          ...prev,
          test_location: testData.test_location || '',
        }));
      }

      if (testData.test_instances.length > 0 && !selectedInstanceId) {
        setSelectedInstanceId(testData.test_instances[0].id);
      }

      const defs = await testingService.getTestDefinitions();
      setTestDefinitions(defs);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load test session data.');
    } finally {
      setIsLoading(false);
    }
  }, [id, selectedInstanceId]);

  useEffect(() => {
    loadTestData();
  }, [loadTestData]);

  const isTestLocked = test?.status === 'Completed' || test?.status === 'Failed';
  const isUnderReview = test?.status === 'Under Review';

  // Environmental save
  const handleSaveEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!test || isTestLocked) return;
    setIsSavingEnv(true);
    setError(null);
    try {
      await testingService.saveEnvironmentalConditions(test.id, {
        ...envForm,
        temperature_celsius: envForm.temperature_celsius ? Number(envForm.temperature_celsius) : undefined,
        relative_humidity_percent: envForm.relative_humidity_percent ? Number(envForm.relative_humidity_percent) : undefined,
        atmospheric_pressure_kpa: envForm.atmospheric_pressure_kpa ? Number(envForm.atmospheric_pressure_kpa) : undefined,
      });
      setSuccessMsg('Environmental test conditions successfully updated.');
      loadTestData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save environmental conditions.');
    } finally {
      setIsSavingEnv(false);
    }
  };

  // Add Procedure to test
  const handleAddProcedure = async (defId: number) => {
    if (!test || isTestLocked) return;
    try {
      const newInst = await testingService.attachTestInstance(test.id, defId);
      setSelectedInstanceId(newInst.id);
      setSuccessMsg('Test procedure attached to session.');
      loadTestData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to attach test procedure.');
    }
  };

  // Remove Procedure
  const handleRemoveProcedure = async (instId: number) => {
    if (isTestLocked) return;
    if (!confirm('Are you sure you want to remove this procedure and all its observations?')) return;
    try {
      await testingService.deleteTestInstance(instId);
      setSelectedInstanceId(null);
      setSuccessMsg('Procedure removed.');
      loadTestData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove procedure.');
    }
  };

  // Add Observation
  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstanceId || isTestLocked || isUnderReview) return;
    setIsAddingObs(true);
    setError(null);
    try {
      await testingService.addObservation(selectedInstanceId, {
        load_point: Number(obsForm.load_point),
        indicated_value: Number(obsForm.indicated_value),
        extra_load_added: Number(obsForm.extra_load_added),
        zero_indicated: Number(obsForm.zero_indicated),
        tare_applied: Number(obsForm.tare_applied),
        position_label: obsForm.position_label || undefined,
        notes: obsForm.notes || undefined,
      });
      setSuccessMsg('Observation recorded.');
      // Reset form partially
      setObsForm((prev) => ({
        ...prev,
        load_point: 0,
        indicated_value: 0,
        extra_load_added: 0,
        notes: '',
      }));
      loadTestData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record observation.');
    } finally {
      setIsAddingObs(false);
    }
  };

  // Delete Observation
  const handleDeleteObservation = async (obsId: number) => {
    if (!selectedInstanceId || isTestLocked || isUnderReview) return;
    try {
      await testingService.deleteObservation(selectedInstanceId, obsId);
      setSuccessMsg('Observation deleted.');
      loadTestData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete observation.');
    }
  };

  // Evaluate Instance
  const handleEvaluate = async (instanceId: number) => {
    if (isTestLocked) return;
    setIsEvaluating(true);
    setError(null);
    try {
      await testingService.evaluateInstance(instanceId);
      setSuccessMsg('OIML R 76 compliance evaluation complete.');
      loadTestData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Evaluation failed.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Submit for Review
  const handleSubmitForReview = async () => {
    if (!test || isTestLocked) return;
    try {
      await testingService.submitForReview(test.id);
      setSuccessMsg('Test session successfully submitted for reviewer authorization.');
      loadTestData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not submit test for review.');
    }
  };

  // Execute Review (Approve / Reject)
  const handleExecuteReview = async () => {
    if (!test) return;
    setIsReviewing(true);
    try {
      await testingService.reviewTest(test.id, reviewAction, reviewComments);
      setReviewModalOpen(false);
      setSuccessMsg(`Test session marked as ${reviewAction === 'approve' ? 'Completed (Approved)' : 'Failed (Rejected)'}.`);
      loadTestData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Review action failed.');
    } finally {
      setIsReviewing(false);
    }
  };

  // Report Handlers
  const handleOpenReportModal = () => {
    setReportRemarks(`Metrological verification test conducted in accordance with OIML R 76-1:2006. Overall test outcome: ${test?.overall_verdict}.`);
    setGenerateReportModalOpen(true);
  };

  const handleGenerateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!test) return;
    try {
      setIsGeneratingReport(true);
      const rep = await reportService.generateReport({
        test_id: test.id,
        summary_remarks: reportRemarks,
      });
      setGenerateReportModalOpen(false);
      navigate(`/reports/${rep.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate official test report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleOpenPreview = async () => {
    if (!test) return;
    try {
      setIsPreviewLoading(true);
      const res = await reportService.previewReportByTest(test.id);
      setPreviewData(res);
      setPreviewModalOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate live report preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownloadPreviewPdf = async () => {
    if (!test) return;
    try {
      const blob = await reportService.previewReportPdfBlob(test.id);
      reportService.downloadBlob(blob, `PREVIEW-${test.test_id}.pdf`);
    } catch (err) {
      alert('Could not download preview PDF.');
    }
  };


  const getVerdictBadge = (verdict?: string) => {
    switch (verdict) {
      case 'PASS':
        return <Badge variant="green" size="md">PASS</Badge>;
      case 'FAIL':
        return <Badge variant="red" size="md">FAIL</Badge>;
      case 'REVIEW':
        return <Badge variant="yellow" size="md">REVIEW (Manual)</Badge>;
      case 'INCOMPLETE':
        return <Badge variant="gray" size="md">INCOMPLETE</Badge>;
      default:
        return <Badge variant="blue" size="md">PENDING</Badge>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="green">Completed</Badge>;
      case 'Failed':
        return <Badge variant="red">Failed</Badge>;
      case 'Under Review':
        return <Badge variant="yellow">Under Review</Badge>;
      case 'In Progress':
        return <Badge variant="blue">In Progress</Badge>;
      default:
        return <Badge variant="gray">Draft</Badge>;
    }
  };

  const selectedInstance = test?.test_instances.find((i) => i.id === selectedInstanceId);

  if (isLoading && !test) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs text-slate-500 font-mono">Loading laboratory test workspace...</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-slate-600">Test session not found.</p>
        <Button onClick={() => navigate('/testing/history')} className="mt-4" size="sm">
          Return to Test History
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/testing/history')}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  {test.test_id}
                </h1>
                {getStatusBadge(test.status)}
                {getVerdictBadge(test.overall_verdict)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Instrument: <span className="font-semibold text-slate-700">{test.instrument?.manufacturer} {test.instrument?.model}</span> (SN: {test.instrument?.serial_number}) — <span className="font-mono text-blue-600">{test.instrument?.accuracy_class}</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPreview}
              isLoading={isPreviewLoading}
              leftIcon={<Eye className="w-4 h-4 text-slate-600" />}
            >
              Preview Certificate
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenReportModal}
              leftIcon={<FileText className="w-4 h-4 text-purple-600" />}
            >
              Generate Report
            </Button>

            {!isTestLocked && !isUnderReview && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitForReview}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Submit for Review
              </Button>
            )}

            {(role === 'reviewer' || role === 'admin') && isUnderReview && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReviewModalOpen(true)}
                leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
              >
                Authorize / Review Test
              </Button>
            )}
          </div>

        </div>

        {/* Lock or Status Banner */}
        {isTestLocked && (
          <div className="p-3 bg-slate-900 text-white rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>Test Finalized & Locked:</strong> This session has been approved as <strong>{test.status}</strong> with verdict <strong>{test.overall_verdict}</strong>. Metrological data is immutable.
              </span>
            </div>
            {test.reviewer && (
              <span className="text-[11px] text-slate-400">
                Endorsed by: {test.reviewer.name}
              </span>
            )}
          </div>
        )}

        {isUnderReview && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Awaiting Reviewer Endorsement:</strong> Test observations are locked pending authorization by laboratory reviewer or manager.
            </span>
          </div>
        )}

        {/* Feedback alerts */}
        {successMsg && (
          <Alert type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />
        )}
        {error && (
          <Alert type="error" title="Action Error" message={error} onClose={() => setError(null)} />
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pt-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('environment')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'environment'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Environmental Conditions</span>
          </button>

          <button
            onClick={() => setActiveTab('selection')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'selection'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Test Procedures ({test.test_instances.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('observations')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'observations'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Observation Entry</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluation')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'evaluation'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Compliance Results</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Metrological Instrument Profile
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Accuracy Class</span>
                <span className="text-sm font-bold text-blue-600">{test.instrument?.accuracy_class}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Max Capacity (Max)</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{test.instrument?.maximum_capacity} kg</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Min Capacity (Min)</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{test.instrument?.minimum_capacity} kg</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Scale Interval (e)</span>
                <span className="text-sm font-bold text-blue-700 font-mono">{test.instrument?.verification_scale_interval} g</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-slate-400 block font-mono text-[10px] uppercase">Laboratory Location</span>
              <p className="font-semibold text-slate-800">{test.laboratory_name}</p>
              <p className="text-slate-500">{test.test_location || 'Not specified'}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-slate-400 block font-mono text-[10px] uppercase">Conducted By</span>
              <p className="font-semibold text-slate-800">{test.tester?.name || 'Tester'}</p>
              <p className="text-slate-500 font-mono text-[11px]">{test.tester?.email}</p>
            </div>
          </div>

          {test.remarks && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block font-mono text-[10px] uppercase mb-1">Remarks</span>
              <p className="text-slate-700">{test.remarks}</p>
            </div>
          )}

          {test.reviewer_comments && (
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
              <span className="text-emerald-700 block font-mono text-[10px] uppercase mb-1 font-bold">Reviewer Endorsement Comments</span>
              <p className="text-emerald-950">{test.reviewer_comments}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Environmental Conditions */}
      {activeTab === 'environment' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-slate-800">
                Environmental & Atmospheric Test Conditions
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Record temperature, humidity, barometric pressure, and reference weight standards used
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveEnv} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Ambient Temperature (°C)"
                type="number"
                step="0.1"
                required
                disabled={isTestLocked}
                value={envForm.temperature_celsius ?? ''}
                onChange={(e) => setEnvForm({ ...envForm, temperature_celsius: parseFloat(e.target.value) || 0 })}
                leftIcon={<Thermometer className="w-4 h-4" />}
                helperText="OIML R 76 standard: 10°C to 30°C"
              />

              <Input
                label="Relative Humidity (%)"
                type="number"
                step="0.1"
                required
                disabled={isTestLocked}
                value={envForm.relative_humidity_percent ?? ''}
                onChange={(e) => setEnvForm({ ...envForm, relative_humidity_percent: parseFloat(e.target.value) || 0 })}
                helperText="Standard range: 30% to 80%"
              />

              <Input
                label="Barometric Pressure (kPa)"
                type="number"
                step="0.01"
                required
                disabled={isTestLocked}
                value={envForm.atmospheric_pressure_kpa ?? ''}
                onChange={(e) => setEnvForm({ ...envForm, atmospheric_pressure_kpa: parseFloat(e.target.value) || 0 })}
                helperText="Nominal atmospheric: 101.3 kPa"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Reference Weight Standards Used"
                required
                disabled={isTestLocked}
                value={envForm.reference_standards || ''}
                onChange={(e) => setEnvForm({ ...envForm, reference_standards: e.target.value })}
                placeholder="e.g. OIML Class E2 Weights Set SN 44109"
              />

              <Input
                label="Test Location / Chamber"
                disabled={isTestLocked}
                value={envForm.test_location || ''}
                onChange={(e) => setEnvForm({ ...envForm, test_location: e.target.value })}
                placeholder="e.g. Chamber 3 - Clean Room B"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Environmental Remarks
              </label>
              <textarea
                rows={2}
                disabled={isTestLocked}
                value={envForm.remarks || ''}
                onChange={(e) => setEnvForm({ ...envForm, remarks: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-100"
                placeholder="Air draft shielding, thermal stabilization duration..."
              />
            </div>

            {!isTestLocked && (
              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm" isLoading={isSavingEnv} leftIcon={<Save className="w-4 h-4" />}>
                  Save Environmental Data
                </Button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 3: Test Procedures Selection */}
      {activeTab === 'selection' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="font-bold uppercase tracking-wider text-slate-800">
              Applicable OIML R 76 Test Procedures
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Select and attach standardized test procedures to this laboratory verification session
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testDefinitions.map((def) => {
              const isAttached = test.test_instances.some((i) => i.definition_id === def.id);
              return (
                <div
                  key={def.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isAttached
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{def.name}</span>
                      <span className="text-[10px] text-blue-600 font-mono block mt-0.5">
                        {def.clause_reference}
                      </span>
                    </div>
                    {isAttached ? (
                      <Badge variant="green" size="sm">Attached</Badge>
                    ) : (
                      <Badge variant="gray" size="sm">Available</Badge>
                    )}
                  </div>
                  <p className="text-slate-500 text-[11px] mt-2 leading-relaxed">
                    {def.description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Min observations: {def.required_observations_count}
                    </span>
                    {!isTestLocked && (
                      isAttached ? (
                        <button
                          type="button"
                          onClick={() => {
                            const inst = test.test_instances.find((i) => i.definition_id === def.id);
                            if (inst) handleRemoveProcedure(inst.id);
                          }}
                          className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddProcedure(def.id)}
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                        >
                          Attach to Test
                        </Button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Observations Entry */}
      {activeTab === 'observations' && (
        <div className="space-y-6">
          {test.test_instances.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
              <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">No Test Procedures Attached</p>
              <p className="text-slate-500 text-xs mt-1">Please select and attach test procedures from the "Test Procedures" tab first.</p>
              <Button onClick={() => setActiveTab('selection')} className="mt-4" size="sm">
                Go to Test Selection
              </Button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
              {/* Select active instance */}
              <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mr-2">Procedure:</span>
                {test.test_instances.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => setSelectedInstanceId(inst.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all text-xs flex items-center gap-2 ${
                      selectedInstanceId === inst.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{inst.definition?.name}</span>
                    <span className="text-[10px] opacity-80">({inst.observations.length})</span>
                    {inst.is_outdated && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" title="Evaluation Outdated" />
                    )}
                  </button>
                ))}
              </div>

              {selectedInstance && (
                <div className="space-y-6">
                  {/* Warning if observations changed and result is outdated */}
                  {selectedInstance.is_outdated && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Observations modified:</strong> The evaluation result for <em>{selectedInstance.definition?.name}</em> is outdated. Please re-run evaluation in the "Compliance Results" tab.
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleEvaluate(selectedInstance.id)}
                        isLoading={isEvaluating}
                      >
                        Re-evaluate Now
                      </Button>
                    </div>
                  )}

                  {/* Add Observation Form (if not locked) */}
                  {!isTestLocked && !isUnderReview && (
                    <form onSubmit={handleAddObservation} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-blue-600" />
                          Record New Observation ({selectedInstance.definition?.name})
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Scale Interval e = {test.instrument?.verification_scale_interval} g
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Input
                          label="Applied Load L (kg or g)"
                          type="number"
                          step="any"
                          required
                          value={obsForm.load_point || ''}
                          onChange={(e) => setObsForm({ ...obsForm, load_point: parseFloat(e.target.value) || 0 })}
                        />

                        <Input
                          label="Indicated Reading I"
                          type="number"
                          step="any"
                          required
                          value={obsForm.indicated_value || ''}
                          onChange={(e) => setObsForm({ ...obsForm, indicated_value: parseFloat(e.target.value) || 0 })}
                        />

                        <Input
                          label="Extra Load ΔL (g)"
                          type="number"
                          step="any"
                          value={obsForm.extra_load_added || ''}
                          onChange={(e) => setObsForm({ ...obsForm, extra_load_added: parseFloat(e.target.value) || 0 })}
                          helperText="P = I + 0.5e - ΔL"
                        />

                        {selectedInstance.definition?.code === 'OIML_ECCENTRICITY' ? (
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                              Position Label
                            </label>
                            <select
                              value={obsForm.position_label}
                              onChange={(e) => setObsForm({ ...obsForm, position_label: e.target.value })}
                              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white"
                            >
                              <option value="Center">Center (Position 1)</option>
                              <option value="Front-Left">Front-Left (Position 2)</option>
                              <option value="Back-Left">Back-Left (Position 3)</option>
                              <option value="Back-Right">Back-Right (Position 4)</option>
                              <option value="Front-Right">Front-Right (Position 5)</option>
                            </select>
                          </div>
                        ) : (
                          <Input
                            label="Zero Reading (E0)"
                            type="number"
                            step="any"
                            value={obsForm.zero_indicated || ''}
                            onChange={(e) => setObsForm({ ...obsForm, zero_indicated: parseFloat(e.target.value) || 0 })}
                          />
                        )}
                      </div>

                      <div className="flex items-center justify-end pt-1">
                        <Button type="submit" variant="primary" size="sm" isLoading={isAddingObs} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                          Add Observation Row
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Observations Table */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs mb-2">
                      Recorded Observations ({selectedInstance.observations.length})
                    </h4>
                    {selectedInstance.observations.length === 0 ? (
                      <p className="text-slate-400 py-6 text-center italic bg-slate-50 rounded-lg">
                        No raw observations recorded for this procedure yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">Applied Load (L)</th>
                              <th className="py-2.5 px-3">Indication (I)</th>
                              <th className="py-2.5 px-3">Extra Load (ΔL)</th>
                              <th className="py-2.5 px-3">Zero Reading</th>
                              <th className="py-2.5 px-3">Position</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedInstance.observations.map((obs, idx) => (
                              <tr key={obs.id} className="hover:bg-slate-50/70">
                                <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{obs.load_point}</td>
                                <td className="py-2.5 px-3 font-mono text-blue-700">{obs.indicated_value}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-600">{obs.extra_load_added}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-600">{obs.zero_indicated}</td>
                                <td className="py-2.5 px-3 text-slate-700">{obs.position_label || '—'}</td>
                                <td className="py-2.5 px-3 text-right">
                                  {!isTestLocked && !isUnderReview && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteObservation(obs.id)}
                                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                      title="Delete Observation"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Compliance Evaluation & Results */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          {test.test_instances.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-500 text-xs">No test procedures attached to evaluate.</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-slate-800 text-xs">
                    OIML R 76 Compliance Calculation Engine
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Evaluates intrinsic errors, turning points, and maximum permissible error (MPE) thresholds
                  </p>
                </div>

                {selectedInstance && !isTestLocked && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleEvaluate(selectedInstance.id)}
                    isLoading={isEvaluating}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Run Evaluation on {selectedInstance.definition?.name}
                  </Button>
                )}
              </div>

              {/* Procedure selector */}
              <div className="flex flex-wrap items-center gap-2">
                {test.test_instances.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => setSelectedInstanceId(inst.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all text-xs flex items-center gap-2 ${
                      selectedInstanceId === inst.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{inst.definition?.name}</span>
                    {getVerdictBadge(inst.verdict)}
                  </button>
                ))}
              </div>

              {selectedInstance && (
                <div className="space-y-4">
                  {selectedInstance.results.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-semibold text-slate-700">This Procedure Has Not Been Evaluated Yet</p>
                      <p className="text-slate-500 text-[11px] max-w-md mx-auto">
                        Make sure you have entered the required observations, then click "Run Evaluation" to calculate turning points, intrinsic errors, and compare with OIML R 76 limits.
                      </p>
                      {!isTestLocked && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleEvaluate(selectedInstance.id)}
                          isLoading={isEvaluating}
                        >
                          Execute Compliance Engine
                        </Button>
                      )}
                    </div>
                  ) : (
                    selectedInstance.results.map((res) => {
                      let calcData: any = {};
                      try {
                        calcData = JSON.parse(res.calculated_values_json);
                      } catch {}

                      return (
                        <div key={res.id} className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 shadow-xs">
                          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-900">
                                  Compliance Result: {selectedInstance.definition?.name}
                                </h4>
                                {getVerdictBadge(res.verdict)}
                              </div>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Standard: {res.rule_version} — Applied Rule: {res.applicable_rule_code || 'None'}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Evaluated at: {new Date(res.evaluated_at).toLocaleString()}
                            </span>
                          </div>

                          {/* Rule explanation alert */}
                          <div
                            className={`p-3 rounded-lg border text-xs leading-relaxed ${
                              res.verdict === 'PASS'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : res.verdict === 'FAIL'
                                ? 'bg-rose-50 border-rose-200 text-rose-900'
                                : 'bg-amber-50 border-amber-200 text-amber-900'
                            }`}
                          >
                            <strong>Verdict Rationale: </strong> {res.explanation}
                          </div>

                          {/* Technical calculations details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                            <div>
                              <span className="text-slate-400 block font-mono text-[10px] uppercase">
                                Allowable Tolerance Limit
                              </span>
                              <span className="font-semibold text-slate-800 text-xs">
                                {res.allowable_limit_description}
                              </span>
                            </div>

                            {calcData.max_difference_delta_P !== undefined && (
                              <div>
                                <span className="text-slate-400 block font-mono text-[10px] uppercase">
                                  Calculated Range (ΔP = P_max - P_min)
                                </span>
                                <span className="font-mono font-bold text-blue-700 text-xs">
                                  {calcData.max_difference_delta_P} (e = {calcData.verification_interval_e} g)
                                </span>
                              </div>
                            )}

                            {calcData.max_absolute_error !== undefined && (
                              <div>
                                <span className="text-slate-400 block font-mono text-[10px] uppercase">
                                  Max Absolute Error (|E|)
                                </span>
                                <span className="font-mono font-bold text-blue-700 text-xs">
                                  {calcData.max_absolute_error}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Detailed observation calculations table if present */}
                          {calcData.observations && Array.isArray(calcData.observations) && (
                            <div>
                              <h5 className="font-bold text-slate-800 text-[11px] mb-1.5 uppercase tracking-wider">
                                Calculated Point-by-Point Values
                              </h5>
                              <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                      <th className="py-2 px-3">Load L</th>
                                      <th className="py-2 px-3">Reading I</th>
                                      <th className="py-2 px-3">Turning Point P</th>
                                      <th className="py-2 px-3">Error E</th>
                                      <th className="py-2 px-3">MPE Limit</th>
                                      <th className="py-2 px-3 text-right">Point Result</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {calcData.observations.map((pt: any, i: number) => (
                                      <tr key={i} className="hover:bg-slate-50/60 font-mono">
                                        <td className="py-2 px-3 font-semibold text-slate-800">{pt.load_point}</td>
                                        <td className="py-2 px-3 text-blue-700">{pt.indicated}</td>
                                        <td className="py-2 px-3">{pt.turning_point_P}</td>
                                        <td className="py-2 px-3">{pt.intrinsic_error_E}</td>
                                        <td className="py-2 px-3 text-slate-500">{pt.mpe_label || '—'}</td>
                                        <td className="py-2 px-3 text-right">
                                          {pt.passed !== undefined ? (
                                            pt.passed ? (
                                              <span className="text-emerald-600 font-bold">PASS</span>
                                            ) : (
                                              <span className="text-rose-600 font-bold">FAIL</span>
                                            )
                                          ) : (
                                            <span className="text-slate-400">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reviewer Action Modal */}
      {reviewModalOpen && (
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`Reviewer Authorization: ${test.test_id}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Review all evaluated test procedures against OIML R 76 tolerances. Once endorsed, the test session will be finalized and locked against modification.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Review Decision
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewAction('approve')}
                  className={`p-3 rounded-lg border text-center font-bold text-xs transition-all ${
                    reviewAction === 'approve'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  ✓ Endorse & Approve (Completed)
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('reject')}
                  className={`p-3 rounded-lg border text-center font-bold text-xs transition-all ${
                    reviewAction === 'reject'
                      ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  ✗ Reject Test (Failed)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Reviewer Comments & Authorization Notes
              </label>
              <textarea
                rows={3}
                required={reviewAction === 'reject'}
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Include reference standards confirmation, certificate notes, or reasons for rejection..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={reviewAction === 'approve' ? 'primary' : 'danger'}
                size="sm"
                isLoading={isReviewing}
                onClick={handleExecuteReview}
              >
                Submit Authorization Decision
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Generate Report Modal */}
      {generateReportModalOpen && (
        <Modal
          isOpen={generateReportModalOpen}
          onClose={() => setGenerateReportModalOpen(false)}
          title={`Generate Official Test Report: ${test.test_id}`}
          maxWidth="md"
        >
          <form onSubmit={handleGenerateReportSubmit} className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Compile an official, standardized OIML R 76-1:2006 legal metrology test certificate. The resulting document is cryptographically hashed with SHA-256 for archival integrity.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Instrument EUT:</span>
                <span className="font-semibold text-slate-800">{test.instrument?.manufacturer} {test.instrument?.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Accuracy Class:</span>
                <span className="font-semibold text-blue-600">{test.instrument?.accuracy_class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Verdict:</span>
                <span className="font-bold text-slate-900">{test.overall_verdict}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Summary Remarks & Metrological Statement
              </label>
              <textarea
                rows={3}
                value={reportRemarks}
                onChange={(e) => setReportRemarks(e.target.value)}
                placeholder="Include metrological observations or compliance remarks..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setGenerateReportModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isGeneratingReport}
                leftIcon={<FileText className="w-4 h-4" />}
              >
                Compile & Save Certificate
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Live Preview Modal */}
      {previewModalOpen && previewData && (
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          title={`Certificate Preview: ${test.test_id}`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-bold">Standard: OIML R 76-1:2006 (E)</p>
                <p className="text-[11px] opacity-90">Live pre-generation snapshot</p>
              </div>
              <Badge variant={previewData.overall_verdict === 'PASS' ? 'green' : (previewData.overall_verdict === 'FAIL' ? 'red' : 'yellow')} size="md">
                VERDICT: {previewData.overall_verdict}
              </Badge>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Compliance Summary</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-50 rounded">
                  <span className="text-slate-500 block text-[10px]">Total Procedures</span>
                  <span className="font-bold text-slate-800 text-sm">{previewData.data?.compliance_summary?.total_procedures}</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded text-emerald-800">
                  <span className="block text-[10px]">Passed</span>
                  <span className="font-bold text-sm">{previewData.data?.compliance_summary?.passed_procedures}</span>
                </div>
                <div className="p-2 bg-rose-50 rounded text-rose-800">
                  <span className="block text-[10px]">Failed</span>
                  <span className="font-bold text-sm">{previewData.data?.compliance_summary?.failed_procedures}</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Procedure</th>
                    <th className="p-2">Clause</th>
                    <th className="p-2 text-center">Verdict</th>
                    <th className="p-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.data?.compliance_summary?.procedures?.map((p: any, idx: number) => (
                    <tr key={idx} className={p.verdict === 'FAIL' ? 'bg-rose-50/50' : ''}>
                      <td className="p-2 font-medium">{p.definition_name}</td>
                      <td className="p-2 font-mono text-slate-500">{p.clause_reference}</td>
                      <td className="p-2 text-center font-bold">
                        <span className={p.verdict === 'PASS' ? 'text-emerald-600' : (p.verdict === 'FAIL' ? 'text-rose-600' : 'text-amber-600')}>
                          {p.verdict}
                        </span>
                      </td>
                      <td className="p-2 text-slate-500">{p.failure_reason || 'Compliant with permissible limits'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-2 bg-slate-50 rounded border border-slate-200 font-mono text-[10px] text-slate-500 flex items-center justify-between">
              <span>SHA-256 Checksum:</span>
              <span className="truncate max-w-sm">{previewData.checksum}</span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPreviewPdf}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download PDF Preview
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPreviewModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setPreviewModalOpen(false);
                    handleOpenReportModal();
                  }}
                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                >
                  Generate Official Report
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
