import React, { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Search
} from 'lucide-react';
import { ValidationError } from '../types/dataTypes';

interface ValidationDetailsListProps {
  errors: ValidationError[];
}

export const ValidationDetailsList: React.FC<ValidationDetailsListProps> = ({ errors }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'blocking' | 'warning'>('all');
  const [fileFilter, setFileFilter] = useState<'all' | 'assessment' | 'mapping' | 'target' | 'cross-file'>('all');

  const filteredErrors = errors.filter(err => {
    const matchesSearch =
      err.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      err.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (err.field && err.field.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = severityFilter === 'all' || err.severity === severityFilter;
    const matchesFile = fileFilter === 'all' || err.file === fileFilter;

    return matchesSearch && matchesSeverity && matchesFile;
  });

  if (errors.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center transition-all">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-emerald-900">Zero Validation Issues Detected</h3>
        <p className="text-xs text-emerald-700 mt-1 max-w-lg mx-auto">
          All records adhere strictly to structural formats, numeric mark boundaries, non-empty criteria, and cross-file relational taxonomies.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              SECTION 7 — VALIDATION DETAILS & ANOMALY INSPECTOR
            </h2>
            <p className="text-xs text-slate-500">
              Granular inspection of individual field failures, structural mismatches, and taxonomy violations
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredErrors.length}</span> of {errors.length} issue(s)
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search error message, code, or field..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setSeverityFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                severityFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              All ({errors.length})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('blocking')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                severityFilter === 'blocking' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Blocking ({errors.filter(e => e.severity === 'blocking').length})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('warning')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                severityFilter === 'warning' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Warnings ({errors.filter(e => e.severity === 'warning').length})
            </button>
          </div>

          <select
            value={fileFilter}
            onChange={e => setFileFilter(e.target.value as any)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white"
          >
            <option value="all">All Source Files</option>
            <option value="assessment">Assessment File</option>
            <option value="mapping">Question Mapping</option>
            <option value="target">Target Mapping</option>
            <option value="cross-file">Cross-File Relations</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-lg max-h-96">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
            <tr>
              <th scope="col" className="px-3 py-2 w-16 text-center">Row</th>
              <th scope="col" className="px-3 py-2 w-28">Source File</th>
              <th scope="col" className="px-3 py-2 w-28">Target Field</th>
              <th scope="col" className="px-3 py-2 w-24 text-center">Severity</th>
              <th scope="col" className="px-3 py-2 w-44">Error Code</th>
              <th scope="col" className="px-3 py-2">Detailed Academic Explanation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredErrors.slice(0, 50).map(err => (
              <tr key={err.id} className="hover:bg-slate-50 transition">
                <td className="px-3 py-2 text-center font-mono text-slate-500 font-medium">
                  {err.rowNumber !== undefined ? `#${err.rowNumber}` : 'Global'}
                </td>
                <td className="px-3 py-2">
                  <span className="capitalize font-medium text-slate-700">{err.file}</span>
                </td>
                <td className="px-3 py-2 font-mono text-slate-600">
                  {err.field ? (
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-800">
                      {err.field}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {err.severity === 'blocking' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                      Blocking
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                      Warning
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-slate-700 font-semibold">
                  {err.code}
                </td>
                <td className="px-3 py-2 text-slate-800 leading-snug">
                  {err.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredErrors.length > 50 && (
        <p className="text-[11px] text-slate-400 mt-2 text-right">
          Displaying first 50 of {filteredErrors.length} matching issues. Refine your search to see others.
        </p>
      )}
    </div>
  );
};
