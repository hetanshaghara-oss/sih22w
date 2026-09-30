import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  Loader2, 
  Save, 
  X,
  Code2
} from 'lucide-react';
import { complianceRuleService, ComplianceRule, ComplianceRuleCreateInput } from '../../services/complianceRuleService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { EmptyState } from '../../components/common/EmptyState';


const RuleManagementPage: React.FC = () => {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedProcedure, setSelectedProcedure] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<ComplianceRule | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState<ComplianceRuleCreateInput>({
    rule_code: '',
    test_code: 'OIML_WEIGHING_PERFORMANCE',
    accuracy_class: 'Class III',
    version: 'OIML R 76-1:2006',
    parameter_name: '',
    formula_type: 'stepped_mpe_tiers',
    criteria_json: '{\n  "tiers": [\n    {"max_m_over_e": 500, "mpe_e": 0.5},\n    {"max_m_over_e": 2000, "mpe_e": 1.0},\n    {"max_m_over_e": null, "mpe_e": 1.5}\n  ]\n}',
    description: '',
    is_active: true,
  });

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await complianceRuleService.getRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenAdd = () => {
    setEditingRule(null);
    setFormData({
      rule_code: `RULE_NEW_${Date.now().toString().slice(-4)}`,
      test_code: 'OIML_WEIGHING_PERFORMANCE',
      accuracy_class: 'Class III',
      version: 'OIML R 76-1:2006',
      parameter_name: 'Maximum Permissible Error',
      formula_type: 'stepped_mpe_tiers',
      criteria_json: '{\n  "tiers": [\n    {"max_m_over_e": 500, "mpe_e": 0.5},\n    {"max_m_over_e": 2000, "mpe_e": 1.0},\n    {"max_m_over_e": null, "mpe_e": 1.5}\n  ]\n}',
      description: '',
      is_active: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: ComplianceRule) => {
    setEditingRule(rule);
    let prettyJson = rule.criteria_json;
    try {
      prettyJson = JSON.stringify(JSON.parse(rule.criteria_json), null, 2);
    } catch (e) {
      // keep raw string
    }

    setFormData({
      rule_code: rule.rule_code,
      test_code: rule.test_code,
      accuracy_class: rule.accuracy_class,
      version: rule.version,
      parameter_name: rule.parameter_name,
      formula_type: rule.formula_type,
      criteria_json: prettyJson,
      description: rule.description || '',
      is_active: rule.is_active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate JSON
    try {
      JSON.parse(formData.criteria_json);
    } catch (err: any) {
      setFormError(`Invalid JSON in criteria field: ${err.message}`);
      return;
    }

    try {
      setSaving(true);
      if (editingRule) {
        await complianceRuleService.updateRule(editingRule.id, formData);
      } else {
        await complianceRuleService.createRule(formData);
      }
      setIsModalOpen(false);
      await fetchRules();
    } catch (err: any) {
      console.error('Failed to save compliance rule:', err);
      setFormError(err.response?.data?.detail || 'Failed to save rule. Ensure rule code is unique.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule: ComplianceRule) => {
    if (!window.confirm(`Are you sure you want to delete rule "${rule.rule_code}"?`)) {
      return;
    }
    try {
      await complianceRuleService.deleteRule(rule.id);
      await fetchRules();
    } catch (err: any) {
      console.error('Failed to delete rule:', err);
      alert(err.response?.data?.detail || 'Could not delete rule.');
    }
  };

  // Filter rules
  const filteredRules = rules.filter((r) => {
    const matchesSearch = 
      r.rule_code.toLowerCase().includes(search.toLowerCase()) ||
      r.parameter_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()));

    const matchesClass = !selectedClass || r.accuracy_class === selectedClass;
    const matchesProc = !selectedProcedure || r.test_code === selectedProcedure;

    return matchesSearch && matchesClass && matchesProc;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">OIML R-76 Compliance Rules Engine</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure metrological tolerances, maximum permissible error (MPE) tiers, and criteria for verification tests.
          </p>
        </div>
        <Button onClick={handleOpenAdd} variant="primary" size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add New Rule
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules, parameters..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={selectedProcedure}
            onChange={(e) => setSelectedProcedure(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Procedures</option>
            <option value="OIML_REPEATABILITY">Repeatability (A.4.4)</option>
            <option value="OIML_ECCENTRICITY">Eccentricity (A.4.7)</option>
            <option value="OIML_WEIGHING_PERFORMANCE">Weighing Performance (A.4.4.1)</option>
            <option value="OIML_TARE">Tare Performance (A.4.6)</option>
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Accuracy Classes</option>
            <option value="Class I">Class I</option>
            <option value="Class II">Class II</option>
            <option value="Class III">Class III</option>
            <option value="Class IIII">Class IIII</option>
          </select>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading OIML rules...</p>
          </div>
        ) : filteredRules.length === 0 ? (
          <EmptyState
            icon={<Sliders className="w-7 h-7 text-slate-400" />}
            title="No compliance rules found"
            description="Adjust your search filters or add a new configurable rule."
            actionText="Add New Rule"
            onAction={handleOpenAdd}
          />
        ) : (

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Rule Code</th>
                  <th className="py-3.5 px-4">Procedure</th>
                  <th className="py-3.5 px-4">Accuracy Class</th>
                  <th className="py-3.5 px-4">Formula / Criteria</th>
                  <th className="py-3.5 px-4">Standard</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {rule.rule_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{rule.test_code}</div>
                      <div className="text-xs text-slate-500">{rule.parameter_name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-blue-700">
                      {rule.accuracy_class}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded max-w-xs truncate" title={rule.criteria_json}>
                        {rule.formula_type}: {rule.criteria_json}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {rule.version}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={rule.is_active ? 'green' : 'gray'} size="sm">
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(rule)}
                          title="Edit Rule Parameters"
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rule)}
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Add Rule Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingRule ? `Edit Rule: ${editingRule.rule_code}` : 'Add New OIML Compliance Rule'}
          maxWidth="lg"
        >

          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Code *</label>
                <input
                  type="text"
                  required
                  value={formData.rule_code}
                  onChange={(e) => setFormData({ ...formData, rule_code: e.target.value })}
                  placeholder="e.g. RULE_ECC_III_OIML"
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Version *</label>
                <input
                  type="text"
                  required
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="OIML R 76-1:2006"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test Procedure Code *</label>
                <select
                  value={formData.test_code}
                  onChange={(e) => setFormData({ ...formData, test_code: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OIML_REPEATABILITY">OIML_REPEATABILITY</option>
                  <option value="OIML_ECCENTRICITY">OIML_ECCENTRICITY</option>
                  <option value="OIML_WEIGHING_PERFORMANCE">OIML_WEIGHING_PERFORMANCE</option>
                  <option value="OIML_TARE">OIML_TARE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Accuracy Class *</label>
                <select
                  value={formData.accuracy_class}
                  onChange={(e) => setFormData({ ...formData, accuracy_class: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Class I">Class I</option>
                  <option value="Class II">Class II</option>
                  <option value="Class III">Class III</option>
                  <option value="Class IIII">Class IIII</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parameter Name *</label>
                <input
                  type="text"
                  required
                  value={formData.parameter_name}
                  onChange={(e) => setFormData({ ...formData, parameter_name: e.target.value })}
                  placeholder="e.g. Max Permissible Error at 1/3 Max"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Formula Type *</label>
                <input
                  type="text"
                  required
                  value={formData.formula_type}
                  onChange={(e) => setFormData({ ...formData, formula_type: e.target.value })}
                  placeholder="stepped_mpe_tiers / eccentricity_single_load"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Criteria JSON Structure *
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Valid JSON Required</span>
              </div>
              <textarea
                rows={6}
                required
                value={formData.criteria_json}
                onChange={(e) => setFormData({ ...formData, criteria_json: e.target.value })}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Metrological Notes</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional notes regarding OIML revision or lab requirements"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active_toggle"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active_toggle" className="text-xs font-semibold text-slate-700">
                Rule is Active for Automated Verification
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                Save Rule
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default RuleManagementPage;
