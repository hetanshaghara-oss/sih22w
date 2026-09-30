import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Search,
  Building2,
  MapPin,
  FileText,
  Info,
} from 'lucide-react';
import { instrumentService } from '../../services/instrumentService';
import { testingService } from '../../services/testingService';
import { Instrument } from '../../types/instrument';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Alert } from '../../components/common/Alert';

export const NewTestPage: React.FC = () => {
  const navigate = useNavigate();

  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [instrumentSearch, setInstrumentSearch] = useState('');
  const [isLoadingInstruments, setIsLoadingInstruments] = useState(true);

  // Form fields
  const [laboratoryName, setLaboratoryName] = useState('National Metrology Calibration Laboratory');
  const [testLocation, setTestLocation] = useState('Primary Verification Room');
  const [remarks, setRemarks] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        setIsLoadingInstruments(true);
        const data = await instrumentService.getInstruments({ page_size: 100 });
        setInstruments(data.items);
        if (data.items.length > 0) {
          setSelectedInstrument(data.items[0]);
        }
      } catch {
        setError('Failed to fetch instruments registry.');
      } finally {
        setIsLoadingInstruments(false);
      }
    };
    fetchInstruments();
  }, []);

  const filteredInstruments = instruments.filter(
    (i) =>
      i.instrument_id.toLowerCase().includes(instrumentSearch.toLowerCase()) ||
      i.manufacturer.toLowerCase().includes(instrumentSearch.toLowerCase()) ||
      i.model.toLowerCase().includes(instrumentSearch.toLowerCase()) ||
      i.serial_number.toLowerCase().includes(instrumentSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstrument) {
      setError('Please select an instrument to undergo testing.');
      return;
    }
    if (!laboratoryName.trim()) {
      setError('Laboratory name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newTest = await testingService.createTest({
        instrument_id: selectedInstrument.id,
        laboratory_name: laboratoryName.trim(),
        test_location: testLocation.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      // Navigate to the test workspace
      navigate(`/testing/${newTest.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to initialize test session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Initiate New OIML R 76 Test Session
          </h1>
          <p className="text-xs text-slate-500">
            Select a verified instrument, configure laboratory parameters, and generate a unique Test ID
          </p>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          title="Initialization Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Instrument Selection */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Select Instrument to Test
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              {instruments.length} Instruments in Registry
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={instrumentSearch}
              onChange={(e) => setInstrumentSearch(e.target.value)}
              placeholder="Search instrument by ID, manufacturer, model, or serial..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
            {isLoadingInstruments ? (
              <p className="text-xs text-slate-400 col-span-2 py-4 text-center">Loading instruments...</p>
            ) : filteredInstruments.length === 0 ? (
              <p className="text-xs text-slate-400 col-span-2 py-4 text-center">No matching instruments found.</p>
            ) : (
              filteredInstruments.map((inst) => {
                const isSelected = selectedInstrument?.id === inst.id;
                return (
                  <div
                    key={inst.id}
                    onClick={() => setSelectedInstrument(inst)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono font-bold text-blue-600">
                        {inst.instrument_id}
                      </span>
                      <Badge variant="blue" size="sm">
                        {inst.accuracy_class}
                      </Badge>
                    </div>
                    <p className="font-semibold text-slate-800 mt-1">
                      {inst.manufacturer} {inst.model}
                    </p>
                    <p className="text-slate-500 text-[11px]">SN: {inst.serial_number}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100">
                      <span>Max: {inst.maximum_capacity} kg</span>
                      <span>e: {inst.verification_scale_interval} g</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Instrument Specs Sheet */}
          {selectedInstrument && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Selected Instrument Metrological Profile</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-mono text-[9px] uppercase">Accuracy Class</span>
                  <span className="font-bold text-blue-700">{selectedInstrument.accuracy_class}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[9px] uppercase">Max Capacity</span>
                  <span className="font-mono font-medium">{selectedInstrument.maximum_capacity} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[9px] uppercase">Min Capacity</span>
                  <span className="font-mono font-medium">{selectedInstrument.minimum_capacity} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[9px] uppercase">Scale Interval (e)</span>
                  <span className="font-mono font-bold text-blue-700">{selectedInstrument.verification_scale_interval} g</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Laboratory & Session Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Laboratory & Test Session Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Testing Laboratory Name"
              required
              placeholder="e.g. National Metrology Calibration Laboratory"
              value={laboratoryName}
              onChange={(e) => setLaboratoryName(e.target.value)}
              leftIcon={<Building2 className="w-4 h-4" />}
            />

            <Input
              label="Test Room / Location"
              placeholder="e.g. Calibration Chamber 3"
              value={testLocation}
              onChange={(e) => setTestLocation(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4" />}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              General Remarks / Test Objectives
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Specify calibration standards, test protocols, or customer observation requirements..."
              className="block w-full rounded-lg border border-slate-300 text-xs p-3 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Generate Test ID & Open Workspace
          </Button>
        </div>
      </form>
    </div>
  );
};
