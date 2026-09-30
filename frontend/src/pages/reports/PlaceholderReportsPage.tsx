import React from 'react';
import { FileText, ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const PlaceholderReportsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2 border border-purple-200">
          <FileText className="w-8 h-8" />
        </div>

        <div className="inline-flex">
          <Badge variant="purple" size="md">
            Phase 4 Roadmap
          </Badge>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Standardized Laboratory Reports & Archival
        </h1>

        <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          The test report generation engine will compile raw observations, verify compliance against OIML R 76, and produce tamper-evident laboratory certificates.
        </p>

        <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 max-w-lg mx-auto text-left text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-purple-900">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Planned Phase 4 Deliverables</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-purple-800/80">
            <li>Standard OIML R 76 Certificate Layout (A4 format)</li>
            <li>Digital Signatures & Metrologist Approval Workflow</li>
            <li>Cryptographic Verification QR Codes</li>
            <li>Historical Report Archive and Full-Text Search</li>
          </ul>
        </div>

        <div className="pt-6">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="secondary"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
