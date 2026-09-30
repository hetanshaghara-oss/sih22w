import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Lock, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotModal, setForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        'Authentication failed. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
      {/* Left Column: Laboratory Aesthetic Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 p-12 flex-col justify-between border-r border-slate-800 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-blue-900/60 border border-blue-700/60 text-blue-300 text-xs font-mono mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Standard OIML R 76 Metrology
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide uppercase">
                NAWI System
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Laboratory Management & Verification
              </p>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-snug max-w-lg mb-4">
            Non-Automatic Weighing Instruments Compliance Platform
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md">
            Engineered for calibration institutes and legal metrology laboratories
            to register instruments, audit test compliance, and ensure standard
            measurement accuracy according to International Recommendation OIML R 76.
          </p>
        </div>

        {/* Feature Points */}
        <div className="relative z-10 space-y-3 pt-8 border-t border-slate-800">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Role-governed verification workflow (Admin, Tester, Reviewer)</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>High-precision instrument specifications & accuracy classification</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Audit-ready metrological tracking with zero telemetry leakage</span>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white text-slate-900">
        <div className="w-full max-w-md">
          {/* Header Mobile / Brand */}
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Scale className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                NAWI System
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Laboratory Portal Login
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your laboratory credentials to access your testing workspace.
            </p>
          </div>

          {errorMessage && (
            <Alert
              type="error"
              title="Authentication Error"
              message={errorMessage}
              onClose={() => setErrorMessage('')}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Staff Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@nawi-lab.org"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 select-none cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember this terminal</span>
              </label>
              <button
                type="button"
                onClick={() => setForgotModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In to Terminal
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Quick-Fill Test Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@nawi-lab.org', 'Admin@12345')}
                className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('tester@nawi-lab.org', 'Tester@12345')}
                className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-center"
              >
                Tester
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('reviewer@nawi-lab.org', 'Reviewer@12345')}
                className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-center"
              >
                Reviewer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-slate-800 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3 text-amber-600">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-semibold text-sm">Laboratory Account Recovery</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              In accordance with laboratory security policy, password resets must be
              authorized by your System Administrator. Please contact your internal IT
              department or laboratory supervisor at{' '}
              <span className="font-mono text-slate-700">admin@nawi-lab.org</span>.
            </p>
            <Button
              onClick={() => setForgotModal(false)}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Understood
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
