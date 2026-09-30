import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, PlusCircle, CheckCircle, Scale, Info } from 'lucide-react';
import { instrumentService } from '../../services/instrumentService';
import { InstrumentCreateInput, InstrumentStatus, AccuracyClass } from '../../types/instrument';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';

export const AddInstrumentPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<InstrumentCreateInput>({
    instrument_id: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    instrument_type: 'Electronic Non-Automatic Weighing Instrument',
    instrument_class: 'Class III',
    maximum_capacity: 0,
    minimum_capacity: 0,
    verification_scale_interval: 0,
    accuracy_class: 'Class III',
    country_of_manufacture: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.instrument_id.trim()) {
      newErrors.instrument_id = 'Instrument ID is required (e.g. NAWI-2026-005).';
    }
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer name is required.';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Model designation is required.';
    }
    if (!formData.serial_number.trim()) {
      newErrors.serial_number = 'Serial number is required.';
    }
    if (!formData.instrument_type.trim()) {
      newErrors.instrument_type = 'Instrument type description is required.';
    }
    if (!formData.country_of_manufacture.trim()) {
      newErrors.country_of_manufacture = 'Country of origin is required.';
    }

    if (isNaN(Number(formData.maximum_capacity)) || Number(formData.maximum_capacity) <= 0) {
      newErrors.maximum_capacity = 'Max capacity must be a positive number greater than 0.';
    }
    if (isNaN(Number(formData.minimum_capacity)) || Number(formData.minimum_capacity) < 0) {
      newErrors.minimum_capacity = 'Min capacity must be zero or a positive number.';
    }
    if (
      !newErrors.maximum_capacity &&
      !newErrors.minimum_capacity &&
      Number(formData.maximum_capacity) <= Number(formData.minimum_capacity)
    ) {
      newErrors.maximum_capacity = 'Max capacity must be strictly greater than Min capacity.';
    }

    if (
      isNaN(Number(formData.verification_scale_interval)) ||
      Number(formData.verification_scale_interval) <= 0
    ) {
      newErrors.verification_scale_interval = "Verification scale interval 'e' must be > 0.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await instrumentService.createInstrument({
        ...formData,
        maximum_capacity: Number(formData.maximum_capacity),
        minimum_capacity: Number(formData.minimum_capacity),
        verification_scale_interval: Number(formData.verification_scale_interval),
      });

      // Redirect to instrument list
      navigate('/instruments');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setSubmitError(detail);
      } else if (Array.isArray(detail)) {
        setSubmitError(detail.map((d: any) => d.msg).join(', '));
      } else {
        setSubmitError('Failed to register instrument. Please verify your inputs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccuracyClassChange = (ac: string) => {
    setFormData({
      ...formData,
      accuracy_class: ac,
      instrument_class: ac,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/instruments')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Register New NAWI Instrument
            </h1>
            <p className="text-xs text-slate-500">
              Enter manufacturer specifications and metrological bounds per OIML R 76
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <Alert
          type="error"
          title="Registration Rejected"
          message={submitError}
          onClose={() => setSubmitError(null)}
        />
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identification */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Scale className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Instrument Identification
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Instrument ID (Unique Identifier)"
              required
              placeholder="e.g. NAWI-2026-005"
              value={formData.instrument_id}
              onChange={(e) =>
                setFormData({ ...formData, instrument_id: e.target.value })
              }
              error={errors.instrument_id}
              helperText="Laboratory inventory tracking reference"
            />

            <Input
              label="Serial Number (S/N)"
              required
              placeholder="e.g. MT-9923841"
              value={formData.serial_number}
              onChange={(e) =>
                setFormData({ ...formData, serial_number: e.target.value })
              }
              error={errors.serial_number}
              helperText="Manufacturer serial code engraved on rating plate"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Manufacturer"
              required
              placeholder="e.g. Mettler Toledo, Sartorius, OHAUS"
              value={formData.manufacturer}
              onChange={(e) =>
                setFormData({ ...formData, manufacturer: e.target.value })
              }
              error={errors.manufacturer}
            />

            <Input
              label="Model Designation"
              required
              placeholder="e.g. XPR205, Cubis II, Defender 5000"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              error={errors.model}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Instrument Type"
              required
              placeholder="e.g. Analytical Balance, Platform Scale, Bench Scale"
              value={formData.instrument_type}
              onChange={(e) =>
                setFormData({ ...formData, instrument_type: e.target.value })
              }
              error={errors.instrument_type}
            />

            <Input
              label="Country of Manufacture"
              required
              placeholder="e.g. Switzerland, Germany, United States, Japan"
              value={formData.country_of_manufacture}
              onChange={(e) =>
                setFormData({ ...formData, country_of_manufacture: e.target.value })
              }
              error={errors.country_of_manufacture}
            />
          </div>
        </div>

        {/* Section 2: Metrological Parameters (OIML R 76) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Info className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Metrological Characteristics (OIML R 76 Standard)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Maximum Capacity (Max)"
              type="number"
              step="any"
              required
              placeholder="e.g. 220"
              value={formData.maximum_capacity || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maximum_capacity: parseFloat(e.target.value) || 0,
                })
              }
              error={errors.maximum_capacity}
              helperText="Upper weighing limit (kg or g)"
            />

            <Input
              label="Minimum Capacity (Min)"
              type="number"
              step="any"
              required
              placeholder="e.g. 0.01"
              value={formData.minimum_capacity || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minimum_capacity: parseFloat(e.target.value) || 0,
                })
              }
              error={errors.minimum_capacity}
              helperText="Lower weighing limit"
            />

            <Input
              label="Verification Scale Interval (e)"
              type="number"
              step="any"
              required
              placeholder="e.g. 0.001"
              value={formData.verification_scale_interval || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  verification_scale_interval: parseFloat(e.target.value) || 0,
                })
              }
              error={errors.verification_scale_interval}
              helperText="Interval value used for verification"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Accuracy Class (OIML R 76)"
              required
              value={formData.accuracy_class}
              onChange={(e) => handleAccuracyClassChange(e.target.value)}
              options={[
                { value: 'Class I', label: 'Class I - Special Accuracy' },
                { value: 'Class II', label: 'Class II - High Accuracy' },
                { value: 'Class III', label: 'Class III - Medium Accuracy' },
                { value: 'Class IIII', label: 'Class IIII - Ordinary Accuracy' },
              ]}
              helperText="Governs permissible maximum error bounds"
            />

            <Select
              label="Operational Status"
              required
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as InstrumentStatus,
                })
              }
              options={[
                { value: 'Active', label: 'Active (Available for testing)' },
                { value: 'Under Testing', label: 'Under Testing (Test in progress)' },
                { value: 'Inactive', label: 'Inactive (Decommissioned / Maintenance)' },
              ]}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/instruments')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Instrument to Database
          </Button>
        </div>
      </form>
    </div>
  );
};
