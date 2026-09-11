import React from 'react';
import {
  FileSpreadsheet,
  BarChart2,
  TrendingUp,
  ShieldAlert,
  Search,
  Stethoscope,
  RefreshCw,
  FileText
} from 'lucide-react';

export type ModuleKey =
  | 'module1'
  | 'module2'
  | 'module3'
  | 'module4'
  | 'module5'
  | 'module6'
  | 'module7'
  | 'module8';

export type AppView =
  | 'login'
  | ModuleKey
  | 'history'
  | 'analytics'
  | 'comparison';

interface DemoJourneyBarProps {
  currentView: AppView;
  onNavigate: (module: ModuleKey) => void;
  canNavigate: boolean;
}

interface JourneyStep {
  key: ModuleKey;
  stepNum: number;
  label: string;
  stageName: string;
  icon: React.ComponentType<{ className?: string }>;
}

const JOURNEY_STEPS: JourneyStep[] = [
  { key: 'module1', stepNum: 1, label: 'DATA INTAKE', stageName: 'Data Intake', icon: FileSpreadsheet },
  { key: 'module2', stepNum: 2, label: 'OUTCOME MAP', stageName: 'Outcome Mapping', icon: BarChart2 },
  { key: 'module3', stepNum: 3, label: 'LR PREDICTION', stageName: 'Logistic Regression Prediction', icon: TrendingUp },
  { key: 'module4', stepNum: 4, label: 'RISK', stageName: 'Risk Classification', icon: ShieldAlert },
  { key: 'module5', stepNum: 5, label: 'EXPLAINABILITY', stageName: 'Explainability', icon: Search },
  { key: 'module6', stepNum: 6, label: 'INTERVENTION', stageName: 'Instructional Intervention', icon: Stethoscope },
  { key: 'module7', stepNum: 7, label: 'REASSESSMENT', stageName: 'Reassessment', icon: RefreshCw },
  { key: 'module8', stepNum: 8, label: 'FINAL REPORT', stageName: 'Final Report', icon: FileText }
];

export const DemoJourneyBar: React.FC<DemoJourneyBarProps> = ({
  currentView,
  onNavigate,
  canNavigate
}) => {
  const currentIdx = JOURNEY_STEPS.findIndex(s => s.key === currentView);

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-300 py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Label */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded">
            Closed-Loop Flow
          </span>
          <span className="text-xs font-semibold text-slate-200 hidden lg:inline">
            End-to-End Pipeline:
          </span>
        </div>

        {/* The 8-Stage Progress Track */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {JOURNEY_STEPS.map((step, idx) => {
            const isActive = step.key === currentView;
            const isCompleted = idx < currentIdx;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.key}>
                <button
                  type="button"
                  onClick={() => canNavigate && onNavigate(step.key)}
                  disabled={!canNavigate && !isActive}
                  title={`${step.stepNum}. ${step.label} (${step.stageName})`}
                  className={`group flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                      : isCompleted
                      ? 'bg-slate-800/90 text-emerald-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                      : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-slate-800'
                  } ${!canNavigate && !isActive ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <span className={`text-[10px] font-mono px-1 rounded ${
                    isActive ? 'bg-indigo-700 text-indigo-100' : 'text-slate-400'
                  }`}>
                    {step.stepNum}
                  </span>
                  <Icon className={`h-3 w-3 ${isActive ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="tracking-wider text-[11px]">{step.label}</span>
                </button>

                {idx < JOURNEY_STEPS.length - 1 && (
                  <span className={`text-[10px] select-none ${
                    idx < currentIdx ? 'text-emerald-500 font-bold' : 'text-slate-600'
                  }`}>
                    →
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Current Stage Indicator */}
        <div className="shrink-0 text-right hidden sm:block">
          <span className="text-[11px] font-mono text-indigo-300 font-semibold">
            Stage {currentIdx + 1} of 8: {JOURNEY_STEPS[currentIdx]?.stageName}
          </span>
        </div>
      </div>
    </div>
  );
};

