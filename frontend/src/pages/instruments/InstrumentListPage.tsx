import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Scale,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { instrumentService, InstrumentQueryParams } from '../../services/instrumentService';
import { Instrument, InstrumentStatus } from '../../types/instrument';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import { Alert } from '../../components/common/Alert';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';

export const InstrumentListPage: React.FC = () => {
  const navigate = useNavigate();

  // Data states
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [accuracyClassFilter, setAccuracyClassFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [viewInstrument, setViewInstrument] = useState<Instrument | null>(null);
  const [editInstrument, setEditInstrument] = useState<Instrument | null>(null);
  const [deleteInstrument, setDeleteInstrument] = useState<Instrument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    manufacturer: '',
    model: '',
    serial_number: '',
    instrument_type: '',
    instrument_class: '',
    maximum_capacity: 0,
    minimum_capacity: 0,
    verification_scale_interval: 0,
    accuracy_class: '',
    country_of_manufacture: '',
    status: 'Active' as InstrumentStatus,
  });

  const fetchInstruments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: InstrumentQueryParams = {
        page: currentPage,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.instrument_type = typeFilter;
      if (accuracyClassFilter) params.accuracy_class = accuracyClassFilter;

      const data = await instrumentService.getInstruments(params);
      setInstruments(data.items);
      setTotalItems(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load instruments.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search, statusFilter, typeFilter, accuracyClassFilter, sortBy, sortOrder]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    if (instruments.length === 0) return;
    const headers = [
      'Instrument ID',
      'Manufacturer',
      'Model',
      'Serial Number',
      'Instrument Type',
      'Accuracy Class',
      'Max Capacity',
      'Min Capacity',
      'Interval e',
      'Country',
      'Status',
      'Date Added',
    ];
    const rows = instruments.map((inst) => [
      `"${inst.instrument_id}"`,
      `"${inst.manufacturer}"`,
      `"${inst.model}"`,
      `"${inst.serial_number}"`,
      `"${inst.instrument_type}"`,
      `"${inst.accuracy_class}"`,
      inst.maximum_capacity,
      inst.minimum_capacity,
      inst.verification_scale_interval,
      `"${inst.country_of_manufacture}"`,
      `"${inst.status}"`,
      `"${inst.created_at}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nawi_instruments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchInstruments();
  }, [fetchInstruments]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInstruments();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setAccuracyClassFilter('');
    setCurrentPage(1);
  };

  // Open Edit Modal
  const openEditModal = (inst: Instrument) => {
    setEditInstrument(inst);
    setEditError(null);
    setEditFormData({
      manufacturer: inst.manufacturer,
      model: inst.model,
      serial_number: inst.serial_number,
      instrument_type: inst.instrument_type,
      instrument_class: inst.instrument_class,
      maximum_capacity: inst.maximum_capacity,
      minimum_capacity: inst.minimum_capacity,
      verification_scale_interval: inst.verification_scale_interval,
      accuracy_class: inst.accuracy_class,
      country_of_manufacture: inst.country_of_manufacture,
      status: inst.status,
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInstrument) return;

    if (Number(editFormData.maximum_capacity) <= Number(editFormData.minimum_capacity)) {
      setEditError('Maximum capacity must be strictly greater than minimum capacity.');
      return;
    }

    setIsSubmitting(true);
    setEditError(null);

    try {
      await instrumentService.updateInstrument(editInstrument.id, {
        ...editFormData,
        maximum_capacity: Number(editFormData.maximum_capacity),
        minimum_capacity: Number(editFormData.minimum_capacity),
        verification_scale_interval: Number(editFormData.verification_scale_interval),
      });
      setFeedbackSuccess(`Instrument ${editInstrument.instrument_id} updated successfully.`);
      setEditInstrument(null);
      fetchInstruments();
    } catch (err: any) {
      setEditError(err.response?.data?.detail || 'Failed to update instrument.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deleteInstrument) return;
    setIsSubmitting(true);
    try {
      await instrumentService.deleteInstrument(deleteInstrument.id);
      setFeedbackSuccess(`Instrument ${deleteInstrument.instrument_id} deleted successfully.`);
      setDeleteInstrument(null);
      fetchInstruments();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete instrument.');
      setDeleteInstrument(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: InstrumentStatus) => {
    switch (status) {
      case 'Active':
        return 'green';
      case 'Under Testing':
        return 'yellow';
      case 'Inactive':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            NAWI Instrument Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered Non-Automatic Weighing Instruments awaiting or undergoing OIML verification
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={instruments.length === 0}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInstruments}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/instruments/new')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Add Instrument
          </Button>
        </div>
      </div>

      {feedbackSuccess && (
        <Alert
          type="success"
          message={feedbackSuccess}
          onClose={() => setFeedbackSuccess(null)}
        />
      )}

      {error && (
        <Alert
          type="error"
          title="Registry Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, manufacturer, model, or serial number..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded-lg text-xs py-2 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Testing">Under Testing</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Accuracy Class Filter */}
            <select
              value={accuracyClassFilter}
              onChange={(e) => {
                setAccuracyClassFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded-lg text-xs py-2 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Accuracy Classes</option>
              <option value="Class I">Class I (Special)</option>
              <option value="Class II">Class II (High)</option>
              <option value="Class III">Class III (Medium)</option>
              <option value="Class IIII">Class IIII (Ordinary)</option>
            </select>

            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>

            {(search || statusFilter || typeFilter || accuracyClassFilter) && (
              <Button type="button" onClick={handleClearFilters} variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-mono">Loading laboratory instrument records...</p>
          </div>
        ) : instruments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No instruments registered yet"
              description="No instruments registered yet. Add your first instrument to begin."
              icon={<Scale className="w-8 h-8 text-slate-400" />}
              actionText="Add First Instrument"
              onAction={() => navigate('/instruments/new')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-600 select-none">
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('instrument_id')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Instrument ID</span>
                      {sortBy === 'instrument_id' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('manufacturer')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Manufacturer</span>
                      {sortBy === 'manufacturer' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('model')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Model</span>
                      {sortBy === 'model' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('serial_number')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Serial Number</span>
                      {sortBy === 'serial_number' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4">Type & Class</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortBy === 'status' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date Added</span>
                      {sortBy === 'created_at' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {instruments.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                      {inst.instrument_id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {inst.manufacturer}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{inst.model}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {inst.serial_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-slate-800">{inst.instrument_type}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {inst.accuracy_class}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadgeVariant(inst.status)}>
                        {inst.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {formatDate(inst.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewInstrument(inst)}
                          title="View Details"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(inst)}
                          title="Edit Instrument"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteInstrument(inst)}
                          title="Delete Instrument"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {/* View Details Modal */}
      {viewInstrument && (
        <Modal
          isOpen={!!viewInstrument}
          onClose={() => setViewInstrument(null)}
          title={`Instrument Details: ${viewInstrument.instrument_id}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {viewInstrument.manufacturer} {viewInstrument.model}
                </h4>
                <p className="text-slate-500 mt-0.5">{viewInstrument.instrument_type}</p>
              </div>
              <Badge variant={getStatusBadgeVariant(viewInstrument.status)} size="md">
                {viewInstrument.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">
                  Serial Number
                </span>
                <span className="font-mono font-medium text-slate-800">
                  {viewInstrument.serial_number}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">
                  Country of Origin
                </span>
                <span className="text-slate-800 font-medium">
                  {viewInstrument.country_of_manufacture}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">
                  Accuracy Class (OIML)
                </span>
                <span className="font-semibold text-blue-700">
                  {viewInstrument.accuracy_class}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">
                  Instrument Class
                </span>
                <span className="text-slate-800 font-medium">
                  {viewInstrument.instrument_class}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">
                  Max Capacity (Max)
                </span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {viewInstrument.maximum_capacity} kg
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">
                  Min Capacity (Min)
                </span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {viewInstrument.minimum_capacity} kg
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px] uppercase">
                  Scale Interval (e)
                </span>
                <span className="text-sm font-bold font-mono text-blue-700">
                  {viewInstrument.verification_scale_interval} g
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100 flex justify-between">
              <span>Date Registered: {formatDate(viewInstrument.created_at)}</span>
              <span>Record ID: #{viewInstrument.id}</span>
            </div>

            <div className="flex justify-end pt-3">
              <Button onClick={() => setViewInstrument(null)} variant="secondary" size="sm">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editInstrument && (
        <Modal
          isOpen={!!editInstrument}
          onClose={() => setEditInstrument(null)}
          title={`Edit Instrument: ${editInstrument.instrument_id}`}
          maxWidth="xl"
        >
          {editError && (
            <Alert
              type="error"
              title="Validation Error"
              message={editError}
              onClose={() => setEditError(null)}
            />
          )}

          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Manufacturer"
                required
                value={editFormData.manufacturer}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, manufacturer: e.target.value })
                }
              />
              <Input
                label="Model"
                required
                value={editFormData.model}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, model: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Serial Number"
                required
                value={editFormData.serial_number}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, serial_number: e.target.value })
                }
              />
              <Input
                label="Instrument Type"
                required
                value={editFormData.instrument_type}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, instrument_type: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Max Capacity (kg)"
                type="number"
                step="any"
                required
                value={editFormData.maximum_capacity}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    maximum_capacity: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <Input
                label="Min Capacity (kg)"
                type="number"
                step="any"
                required
                value={editFormData.minimum_capacity}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    minimum_capacity: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <Input
                label="Verification Scale Interval 'e' (g)"
                type="number"
                step="any"
                required
                value={editFormData.verification_scale_interval}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    verification_scale_interval: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Accuracy Class"
                value={editFormData.accuracy_class}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, accuracy_class: e.target.value })
                }
                options={[
                  { value: 'Class I', label: 'Class I (Special)' },
                  { value: 'Class II', label: 'Class II (High)' },
                  { value: 'Class III', label: 'Class III (Medium)' },
                  { value: 'Class IIII', label: 'Class IIII (Ordinary)' },
                ]}
              />

              <Input
                label="Country of Origin"
                required
                value={editFormData.country_of_manufacture}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    country_of_manufacture: e.target.value,
                  })
                }
              />

              <Select
                label="Operational Status"
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    status: e.target.value as InstrumentStatus,
                  })
                }
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Under Testing', label: 'Under Testing' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditInstrument(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteInstrument && (
        <Modal
          isOpen={!!deleteInstrument}
          onClose={() => setDeleteInstrument(null)}
          title="Confirm Instrument Deletion"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 text-sm">
                  Delete Instrument {deleteInstrument.instrument_id}?
                </p>
                <p className="text-slate-500 mt-1">
                  Are you sure you want to remove {deleteInstrument.manufacturer}{' '}
                  {deleteInstrument.model} (SN: {deleteInstrument.serial_number}) from the
                  database? This action cannot be reversed.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteInstrument(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleDeleteConfirm}
              >
                Delete Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
