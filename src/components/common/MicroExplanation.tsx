import React from 'react';
import { HelpCircle } from 'lucide-react';

export type MetricType =
  | 'co_attainment'
  | 'target_gap'
  | 'predicted_probability'
  | 'risk_priority_score'
  | 'learning_gain'
  | 'percentage_points';

const DEFINITIONS: Record<MetricType, { label: string; text: string }> = {
  co_attainment: {
    label: 'Course Outcome Attainment',
    text: 'Percentage of available marks obtained for questions mapped to this CO.'
  },
  target_gap: {
    label: 'Benchmark Target Gap',
    text: 'Difference between observed student attainment and institutional target, expressed in percentage points (pp).'
  },
  predicted_probability: {
    label: 'Predicted Outcome Probability',
    text: 'Bayesian model-estimated probability of meeting the configured CO target threshold on future assessments.'
  },
  risk_priority_score: {
    label: 'Risk Priority Score',
    text: 'Transparent triage score (0–100) combining outcome prediction, historical deficit, trend direction, and score volatility.'
  },
  learning_gain: {
    label: 'Observed Learning Gain',
    text: 'Post-intervention attainment minus pre-intervention attainment, expressed strictly in percentage points (pp).'
  },
  percentage_points: {
    label: 'Percentage Points (pp)',
    text: 'Arithmetic difference between two percentages (e.g. 70% minus 50% equals +20.0 percentage points, not 40% growth).'
  }
};

interface MicroExplanationProps {
  type: MetricType;
  inline?: boolean;
}

export const MicroExplanation: React.FC<MicroExplanationProps> = ({ type, inline = false }) => {
  const def = DEFINITIONS[type];
  if (!def) return null;

  if (inline) {
    return (
      <span className="inline-flex items-center space-x-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
        <HelpCircle className="h-3 w-3 text-indigo-500 shrink-0" />
        <span><strong>{def.label}:</strong> {def.text}</span>
      </span>
    );
  }

  return (
    <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-start space-x-2 text-[11px] text-slate-600">
      <HelpCircle className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
      <div>
        <strong className="text-slate-800">{def.label}:</strong> {def.text}
      </div>
    </div>
  );
};

