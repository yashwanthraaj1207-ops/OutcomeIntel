import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  RotateCcw,
  Database
} from 'lucide-react';
import { UploadedFileState } from '../types/dataTypes';
import { useToast } from './common/Toast';

interface DatasetUploadSectionProps {
  assessmentState: UploadedFileState<any>;
  mappingState: UploadedFileState<any>;
  targetState: UploadedFileState<any>;
  onFileUpload: (type: 'assessment' | 'mapping' | 'target', file: File) => void;
  onLoadSample: () => void;
  onResetAll: () => void;
  isLoadingSample: boolean;
}

export const DatasetUploadSection: React.FC<DatasetUploadSectionProps> = ({
  assessmentState,
  mappingState,
  targetState,
  onFileUpload,
  onLoadSample,
  onResetAll,
  isLoadingSample
}) => {
  const { showWarning } = useToast();
  const [dragOverCard, setDragOverCard] = useState<string | null>(null);

  const assessInputRef = useRef<HTMLInputElement>(null);
  const mapInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent, card: string) => {
    e.preventDefault();
    setDragOverCard(card);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCard(null);
  };

  const handleDrop = (e: React.DragEvent, type: 'assessment' | 'mapping' | 'target') => {
    e.preventDefault();
    setDragOverCard(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text')) {
        onFileUpload(type, file);
      } else {
        showWarning('Please upload a valid .csv file format', 'Invalid File Format');
      }
    }
  };

  const renderStatusBadge = (status: string, errorCount: number, warningCount: number) => {
    switch (status) {
      case 'loaded':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>✓ Loaded</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>⚠ Warning ({warningCount})</span>
          </span>
        );
      case 'invalid':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            <span>✕ Invalid ({errorCount})</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <span>Pending Upload</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header: SECTION 2 — DATASET UPLOAD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold tracking-wider uppercase text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
              Pipeline Stage 1
            </span>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
              SECTION 2 — DATASET UPLOAD
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload the three primary prototype datasets or load pre-bundled synthetic files
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={onLoadSample}
            disabled={isLoadingSample}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Database className={`h-4 w-4 text-indigo-200 ${isLoadingSample ? 'animate-spin' : ''}`} />
            <span>{isLoadingSample ? 'Loading Prototype Datasets...' : 'Load Sample Dataset'}</span>
          </button>

          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs font-medium transition border border-slate-700 cursor-pointer"
            title="Reset All Uploads"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* SECTION 3 — DATASET STATUS (3 separated cards with upload & status badges) */}
      <div>
        <div className="flex items-center space-x-2 mb-2 px-1">
          <Database className="h-4 w-4 text-slate-500" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            SECTION 3 — DATASET STATUS & INGESTION CHANNELS
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Assessment Dataset */}
          <div
            onDragOver={e => handleDragOver(e, 'assessment')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'assessment')}
            className={`relative rounded-xl border-2 transition-all p-5 flex flex-col justify-between ${
              dragOverCard === 'assessment'
                ? 'border-indigo-500 bg-indigo-50/50 shadow-md'
                : assessmentState.status === 'loaded'
                ? 'border-emerald-300 bg-emerald-50/25 shadow-sm'
                : assessmentState.status === 'invalid'
                ? 'border-rose-300 bg-rose-50/25 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">1. Assessment Dataset</h4>
                    <p className="text-[11px] text-slate-500">Student marks per question</p>
                  </div>
                </div>
                {renderStatusBadge(
                  assessmentState.status,
                  assessmentState.errorCount,
                  assessmentState.warningCount
                )}
              </div>

              <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center my-3 bg-slate-50/70 hover:bg-slate-50 transition">
                <UploadCloud className="h-7 w-7 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-600 font-medium">Drag & drop assessment CSV here</p>
                <p className="text-[11px] text-slate-400 mt-0.5">or click to browse local file</p>
                <input
                  ref={assessInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      onFileUpload('assessment', e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => assessInputRef.current?.click()}
                  className="mt-2.5 inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Browse File
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-2">
              {assessmentState.fileName ? (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-700 truncate max-w-[190px]">
                    <FileCheck className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    <span className="truncate font-mono font-medium">{assessmentState.fileName}</span>
                  </div>
                  <span className="text-slate-600 font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded">
                    {assessmentState.rawRows.length.toLocaleString()} rows
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>File: sample_co_assessment_v2.csv</span>
                  <span className="font-mono">11 req. fields</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Question -> Topic -> CO Mapping */}
          <div
            onDragOver={e => handleDragOver(e, 'mapping')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'mapping')}
            className={`relative rounded-xl border-2 transition-all p-5 flex flex-col justify-between ${
              dragOverCard === 'mapping'
                ? 'border-indigo-500 bg-indigo-50/50 shadow-md'
                : mappingState.status === 'loaded'
                ? 'border-emerald-300 bg-emerald-50/25 shadow-sm'
                : mappingState.status === 'invalid'
                ? 'border-rose-300 bg-rose-50/25 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">2. Question → Topic → CO</h4>
                    <p className="text-[11px] text-slate-500">Taxonomy linking Question → Topic → CO</p>
                  </div>
                </div>
                {renderStatusBadge(
                  mappingState.status,
                  mappingState.errorCount,
                  mappingState.warningCount
                )}
              </div>

              <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center my-3 bg-slate-50/70 hover:bg-slate-50 transition">
                <UploadCloud className="h-7 w-7 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-600 font-medium">Drag & drop mapping CSV here</p>
                <p className="text-[11px] text-slate-400 mt-0.5">or click to browse local file</p>
                <input
                  ref={mapInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      onFileUpload('mapping', e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => mapInputRef.current?.click()}
                  className="mt-2.5 inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Browse File
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-2">
              {mappingState.fileName ? (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-700 truncate max-w-[190px]">
                    <FileCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="truncate font-mono font-medium">{mappingState.fileName}</span>
                  </div>
                  <span className="text-slate-600 font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded">
                    {mappingState.rawRows.length} mappings
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>File: question_topic_co_mapping_v2.csv</span>
                  <span className="font-mono">4 cols</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: CO Target Mapping */}
          <div
            onDragOver={e => handleDragOver(e, 'target')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'target')}
            className={`relative rounded-xl border-2 transition-all p-5 flex flex-col justify-between ${
              dragOverCard === 'target'
                ? 'border-indigo-500 bg-indigo-50/50 shadow-md'
                : targetState.status === 'loaded'
                ? 'border-emerald-300 bg-emerald-50/25 shadow-sm'
                : targetState.status === 'invalid'
                ? 'border-rose-300 bg-rose-50/25 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">3. CO Target Mapping</h4>
                    <p className="text-[11px] text-slate-500">Course + CO target threshold %</p>
                  </div>
                </div>
                {renderStatusBadge(
                  targetState.status,
                  targetState.errorCount,
                  targetState.warningCount
                )}
              </div>

              <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center my-3 bg-slate-50/70 hover:bg-slate-50 transition">
                <UploadCloud className="h-7 w-7 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-600 font-medium">Drag & drop target CSV here</p>
                <p className="text-[11px] text-slate-400 mt-0.5">or click to browse local file</p>
                <input
                  ref={targetInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      onFileUpload('target', e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => targetInputRef.current?.click()}
                  className="mt-2.5 inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Browse File
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-2">
              {targetState.fileName ? (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-700 truncate max-w-[190px]">
                    <FileCheck className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span className="truncate font-mono font-medium">{targetState.fileName}</span>
                  </div>
                  <span className="text-slate-600 font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded">
                    {targetState.rawRows.length} targets
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>File: co_target_mapping.csv</span>
                  <span className="font-mono">Threshold %</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
