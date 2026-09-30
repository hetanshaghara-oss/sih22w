import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const UnauthorizedPage: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div className="inline-block mb-3">
        <Badge variant="red" size="md">
          403 Access Denied
        </Badge>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
        Restricted Laboratory Zone
      </h1>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        Your current credentials as <span className="font-semibold text-slate-700 capitalize">[{role}]</span> do not grant authorization to access this administrative or specialized section.
      </p>
      <div className="flex gap-3">
        <Button
          onClick={() => navigate('/dashboard')}
          variant="secondary"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
