import React from 'react';
import { X, Cpu, UserCheck, CheckCircle2, Lock, Scale } from 'lucide-react';

interface AIMLTransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIMLTransparencyModal: React.FC<AIMLTransparencyModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                AI / ML Transparency & Algorithmic Boundary Disclosure
              </h2>
              <p className="text-xs text-slate-500">
                Honest technical specification of machine learning models, deterministic logic, and faculty governance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs">
          {/* Section 1: Machine Learning Boundary */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-2.5">
            <div className="flex items-center space-x-2 text-indigo-900 font-bold">
              <Cpu className="h-4 w-4 text-indigo-600" />
              <span className="text-sm">1. Machine Learning (Statistical Pattern Recognition)</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Machine learning is utilized strictly where inductive probabilistic pattern recognition across historical assessment sequences is mathematically required:
            </p>
            <div className="bg-white p-3 rounded-lg border border-indigo-100 space-y-1 font-mono text-[11px] text-slate-800">
              <div className="flex items-center text-indigo-700 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                Module 3: Logistic Regression Outcome Prediction
              </div>
              <p className="font-sans text-xs text-slate-600 pl-5">
                Estimates the conditional probability P(Attainment &ge; Target | History) using logistic loss optimization on chronological assessment trajectories. Trained on a 70/30 student-level disjoint partition to prevent data leakage.
              </p>
            </div>
          </div>

          {/* Section 2: Deterministic Intelligence */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <Scale className="h-4 w-4 text-emerald-600" />
              <span className="text-sm">2. Deterministic Intelligence (Transparent Rule Engines)</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              All other pipeline stages are deliberately implemented using deterministic, fully reproducible algorithms rather than black-box models or generative LLMs:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block">Module 1: Validation Gate</strong>
                <span className="text-slate-600">Strict structural schema, negative mark checks, duplicate deduplication.</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block">Module 2: CO Analytics</strong>
                <span className="text-slate-600">Weighted attainment calculations and institutional target gap benchmarks.</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block">Module 4: Risk Detection</strong>
                <span className="text-slate-600">Precedence-ordered deterministic rules (\(P &lt; 40\%\) or Deficit &gt; 10 pp with Declining Trend).</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block">Module 5: Topic Diagnosis</strong>
                <span className="text-slate-600">Curricular aggregation without leakage or speculative attribution.</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block">Module 6: Strategy Catalog</strong>
                <span className="text-slate-600">Evidence-based pedagogical mapping to validated remedial methods.</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block">Module 7: Learning Gain</strong>
                <span className="text-slate-600">Exact percentage points difference (Post Attainment - Pre Attainment), zero causal claims.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Faculty Governance */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-sm">3. Human-in-the-Loop Faculty Governance</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              The platform operates as an academic <strong>decision-support system</strong>, never an automated decision-maker:
            </p>
            <ul className="space-y-1.5 text-slate-700 list-disc pl-5">
              <li><strong>Faculty Review:</strong> Instructors review complete question-level failure evidence and student trends before acting.</li>
              <li><strong>Discretionary Approval:</strong> Interventions must be explicitly approved or rejected by the faculty member.</li>
              <li><strong>Clinical Notes:</strong> Faculty can customize intensity, timing, and assign customized tutoring notes.</li>
              <li><strong>Closed-Loop Reassessment:</strong> Instructors verify post-intervention learning gains through scheduled reassessment quizzes.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-600">
            <Lock className="h-3.5 w-3.5 text-indigo-500" />
            <span>Zero External API Calls • 100% Local Execution • FERPA Privacy Compliant</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer transition shadow-xs"
          >
            Close Disclosure
          </button>
        </div>
      </div>
    </div>
  );
};
