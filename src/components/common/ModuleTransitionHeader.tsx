import React, { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Cpu, Database, CheckCircle2 } from 'lucide-react';
import { ModuleKey } from './DemoJourneyBar';

interface ModuleTransitionInfo {
  moduleNumber: number;
  moduleName: string;
  inputSource: string;
  inputDescription: string;
  processType: 'ML / Statistical Inference' | 'Deterministic Rule Engine' | 'Data Verification Gate' | 'Faculty Decision Audit';
  processDescription: string;
  outputTarget: string;
  outputDescription: string;
}

const TRANSITION_MAP: Record<ModuleKey, ModuleTransitionInfo> = {
  module1: {
    moduleNumber: 1,
    moduleName: 'Data Ingestion & Integrity Gatekeeper',
    inputSource: 'Raw Faculty CSV Files',
    inputDescription: 'Assessment marks, question-topic-CO mappings, and institutional CO target benchmarks.',
    processType: 'Data Verification Gate',
    processDescription: 'Cross-file referential integrity audit, mark boundary checks (0 <= marks <= max), and duplicate elimination.',
    outputTarget: 'Module 2: CO Analytics',
    outputDescription: '100% standardized, schema-conforming records with zero unvalidated observations.'
  },
  module2: {
    moduleNumber: 2,
    moduleName: 'Course Outcome Analytics & Compliance',
    inputSource: 'Module 1 Validated Dataset',
    inputDescription: 'Verified assessment items mapped to specific Course Outcomes and institutional targets.',
    processType: 'Deterministic Rule Engine',
    processDescription: 'Weighted outcome attainment formulas, institutional benchmark gap analysis, and student-level achievement.',
    outputTarget: 'Module 3: Conditional Prediction',
    outputDescription: 'Calculated attainment benchmarks, compliance gap metrics (pp), and lagging CO identifications.'
  },
  module3: {
    moduleNumber: 3,
    moduleName: 'Conditional Course Outcome Prediction',
    inputSource: 'Module 2 Historical Evidence',
    inputDescription: 'Historical assessment observations strictly prior to the prediction horizon (e.g. A1, A2 for A3).',
    processType: 'ML / Statistical Inference',
    processDescription: 'Disjoint student-partitioned training, empirical Logistic Regression ML model, and strict anti-leakage inference.',
    outputTarget: 'Module 4: Early-Warning Risk',
    outputDescription: 'Calibrated predicted probability (P in [0, 1]) of meeting the institutional CO target threshold.'
  },
  module4: {
    moduleNumber: 4,
    moduleName: 'Early-Warning Risk Stratification',
    inputSource: 'Module 3 Prediction & History',
    inputDescription: 'ML outcome forecast (P), observed target gap, performance trend trajectory, and score consistency.',
    processType: 'Deterministic Rule Engine',
    processDescription: 'Deterministic multi-signal precedence (High Risk: P < 40% OR Gap < -10 pp with Declining Trend).',
    outputTarget: 'Module 5: Topic Diagnosis',
    outputDescription: 'Mutually exclusive cohort risk tiers (High, Medium, Low) and priority-ranked triage roster.'
  },
  module5: {
    moduleNumber: 5,
    moduleName: 'Explainability & Topic Diagnosis',
    inputSource: 'Module 4 Prioritized Risk Queue',
    inputDescription: 'Ranked at-risk student profiles and historical assessment observations across all topics.',
    processType: 'Deterministic Rule Engine',
    processDescription: 'Curricular topic aggregation, chronological trajectory analysis, and question-level deficit diagnosis.',
    outputTarget: 'Module 6: Instructional Action',
    outputDescription: 'Fine-grained concept deficit profile isolating exact foundational weaknesses requiring remediation.'
  },
  module6: {
    moduleNumber: 6,
    moduleName: 'Instructional Intervention Recommendation',
    inputSource: 'Module 5 Diagnostic Profiles',
    inputDescription: 'Topic weakness severity, priority score, target CO, and specific question-item failure evidence.',
    processType: 'Faculty Decision Audit',
    processDescription: 'Curated pedagogical catalog mapping with mandatory human-in-the-loop faculty review and approval.',
    outputTarget: 'Module 7: Closed-Loop Reassessment',
    outputDescription: 'Immutable faculty-approved intervention decision log with customized pedagogical notes.'
  },
  module7: {
    moduleNumber: 7,
    moduleName: 'Reassessment & Learning Gain Evaluation',
    inputSource: 'Module 6 Approvals + Post-Test R1',
    inputDescription: 'Approved intervention records, pre-intervention baseline evidence, and post-reassessment items.',
    processType: 'Deterministic Rule Engine',
    processDescription: 'Chronologically isolated pre/post comparison, absolute gain (pp), and target gap closure.',
    outputTarget: 'Module 8: Intelligence Report',
    outputDescription: 'Empirical post-intervention learning gains, effectiveness status, and accreditation payload.'
  },
  module8: {
    moduleNumber: 8,
    moduleName: 'Consolidated CO Intelligence Report',
    inputSource: 'Modules 1–7 Unified Evidence',
    inputDescription: 'Validated records, analytics, predictions, risks, diagnoses, approvals, and verified gains.',
    processType: 'Deterministic Rule Engine',
    processDescription: 'Cross-pipeline evidence synthesis, rule-based academic attention triggers, and artifact generation.',
    outputTarget: 'Accreditation Dossier & HOD',
    outputDescription: 'Executive decision-support dashboard, compliance audit summaries, and JSON/CSV/PDF artifacts.'
  }
};

interface ModuleTransitionHeaderProps {
  currentModule: ModuleKey;
}

export const ModuleTransitionHeader: React.FC<ModuleTransitionHeaderProps> = ({ currentModule }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const info = TRANSITION_MAP[currentModule];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden mb-6">
      {/* Collapsible Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 hover:from-slate-100 hover:to-indigo-100/40 transition text-left cursor-pointer border-b border-slate-100"
      >
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
            {info.moduleNumber}
          </span>
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            Pipeline Architecture Flow: {info.moduleName}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
            {info.processType}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <span className="hidden sm:inline text-[11px] text-slate-400">
            {isExpanded ? 'Hide Architecture Flow' : 'Show Input → Process → Output'}
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded 3-Step Flow */}
      {isExpanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50/30">
          {/* Step 1: INPUT */}
          <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                1. Inputs Received
              </span>
              <Database className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <span>{info.inputSource}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {info.inputDescription}
            </p>
          </div>

          {/* Step 2: PROCESS */}
          <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                2. Computation & Rules
              </span>
              <Cpu className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <div className="font-bold text-indigo-950 text-xs flex items-center gap-1">
              <span>{info.processType}</span>
            </div>
            <p className="text-[11px] text-indigo-900/80 leading-relaxed">
              {info.processDescription}
            </p>
          </div>

          {/* Step 3: OUTPUT */}
          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                3. Handover Output
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="font-bold text-emerald-950 text-xs flex items-center gap-1">
              <span>{info.outputTarget}</span>
              <ArrowRight className="h-3 w-3 text-emerald-600 ml-auto" />
            </div>
            <p className="text-[11px] text-emerald-900/80 leading-relaxed">
              {info.outputDescription}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
