import React from 'react';
import { ClipboardCheck, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

interface Props {
  moduleName?: string;
  phase?: string;
}

export const PlaceholderTestingPage: React.FC<Props> = ({
  moduleName = 'OIML R 76 Testing Module',
  phase = 'Phase 2 & Phase 3',
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 border border-amber-200">
          <ClipboardCheck className="w-8 h-8" />
        </div>

        <div className="inline-flex">
          <Badge variant="yellow" size="md">
            {phase} Roadmap
          </Badge>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {moduleName}
        </h1>

        <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          In strict accordance with the Phase 1 project boundary, testing procedures, observation recording, and automatic OIML calculation engines are scheduled for Phase 2 and Phase 3.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-6 max-w-2xl mx-auto text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-1">Phase 2: Test Procedures</h4>
            <p className="text-slate-500">
              Repeatability test, Eccentricity test, Weighing performance, and Tare weighing forms.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-1">Phase 3: OIML R 76 Engine</h4>
            <p className="text-slate-500">
              Automated MPE calculation, rounding error determination, and compliance verification.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-1">Phase 4: Reports</h4>
            <p className="text-slate-500">
              Standardized certificate generation, digital signatures, and PDF export.
            </p>
          </div>
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
