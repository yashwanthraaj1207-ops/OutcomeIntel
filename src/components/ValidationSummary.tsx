import React from 'react';
import {
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Hash,
  Layers,
  CopyX,
  FileWarning,
  SlidersHorizontal
} from 'lucide-react';
import { ValidationSummaryStats } from '../types/dataTypes';

interface ValidationSummaryProps {
  summary: ValidationSummaryStats;
  canProceed: boolean;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ summary, canProceed }) => {
  const statusCards = [
    {
      label: 'Valid Records',
      count: summary.validRecords,
      status: summary.validRecords > 0 && summary.invalidRecords === 0 ? 'good' : 'neutral',
      icon: CheckCircle,
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border-emerald-200'
    },
    {
      label: 'Invalid Records',
      count: summary.invalidRecords,
      status: summary.invalidRecords === 0 ? 'good' : 'danger',
      icon: AlertCircle,
      textColor: summary.invalidRecords > 0 ? 'text-rose-700' : 'text-slate-600',
      bgColor: summary.invalidRecords > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
    },
    {
      label: 'Missing Required Values',
      count: summary.missingRequiredValues,
      status: summary.missingRequiredValues === 0 ? 'good' : 'danger',
      icon: Hash,
      textColor: summary.missingRequiredValues > 0 ? 'text-rose-700' : 'text-slate-600',
      bgColor: summary.missingRequiredValues > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
    },
    {
      label: 'Invalid Marks',
      count: summary.invalidMarks,
      status: summary.invalidMarks === 0 ? 'good' : 'danger',
      icon: SlidersHorizontal,
      textColor: summary.invalidMarks > 0 ? 'text-rose-700' : 'text-slate-600',
      bgColor: summary.invalidMarks > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
    },
    {
      label: 'Duplicate Records',
      count: summary.duplicateRecords,
      status: summary.duplicateRecords === 0 ? 'good' : 'danger',
      icon: CopyX,
      textColor: summary.duplicateRecords > 0 ? 'text-rose-700' : 'text-slate-600',
      bgColor: summary.duplicateRecords > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
    },
    {
      label: 'Missing Topic Mappings',
      count: summary.missingTopicMappings,
      status: summary.missingTopicMappings === 0 ? 'good' : 'danger',
      icon: Layers,
      textColor: summary.missingTopicMappings > 0 ? 'text-rose-700' : 'text-slate-600',
      bgColor: summary.missingTopicMappings > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
    },
    {
      label: 'Missing CO Mappings',
      count: summary.missingCOMappings,
      status: summary.missingCOMappings === 0 ? 'good' : 'danger',
      icon: FileWarning,
      textColor: summary.missingCOMappings > 0 ? 'text-rose-700' : 'text-slate-600',
      bgColor: summary.missingCOMappings > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
    },
    {
      label: 'Structural Errors',
      count: summary.structuralErrors,
      status: summary.structuralErrors === 0 ? 'good' : 'danger',
      icon: AlertCircle,
      textColor: summary.structuralErrors > 0 ? 'text-rose-700' : 'text-slate-600',
      bgColor: summary.structuralErrors > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              SECTION 6 — VALIDATION INTEGRITY SUMMARY
            </h2>
            <p className="text-xs text-slate-500">
              Evaluates 17 structural rules and cross-file relational dependencies across all uploaded records
            </p>
          </div>
        </div>

        <div>
          {canProceed ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              All Blocking Validations Passed
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
              <AlertCircle className="h-3.5 w-3.5 mr-1 text-rose-600" />
              Blocking Validation Issues Detected
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {statusCards.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`p-3 rounded-xl border ${item.bgColor} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`h-4 w-4 ${item.textColor}`} />
              </div>
              <div>
                <span className={`text-xl font-bold font-mono ${item.textColor}`}>
                  {item.count.toLocaleString()}
                </span>
                <p className="text-[11px] font-semibold text-slate-600 mt-0.5 leading-tight">
                  {item.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
