/**
 * OutcomeIntel Deterministic Comparison Engine
 *
 * Provides mathematically rigorous cross-run comparisons between baseline and comparison analysis snapshots.
 * Strictly distinguishes between Percentage Points (pp) and Percentage Change (%).
 * Generates factual, non-causal observations without using LLM fabrication.
 */

import {
  HistoryRun,
  HistoryCOSummary,
  HistoryRiskSummary,
  HistoryTopicSummary,
  HistoryInterventionSummary,
  HistoryLearningGainSummary
} from '../types/historyTypes';

export interface MetricDelta {
  baselineValue: number | null;
  comparisonValue: number | null;
  deltaPercentagePoints: number | null; // ValueB - ValueA (for % metrics)
  deltaAbsolute: number | null; // CountB - CountA (for integer counts)
  percentageChange: number | null; // ((ValueB - ValueA) / ValueA) * 100
  direction: 'IMPROVED' | 'DECLINED' | 'STABLE' | 'INSUFFICIENT_DATA';
  unit: 'pp' | '%' | 'count';
  isAvailable: boolean;
}

export interface COComparisonResult {
  coId: string;
  courseId: string;
  targetThreshold: number | null;
  attainment: MetricDelta;
  gapToTarget: MetricDelta;
  baselineStatus: string;
  comparisonStatus: string;
  statusChange: 'MET_TARGET' | 'DROPPED_BELOW_TARGET' | 'MAINTAINED_TARGET' | 'STILL_BELOW_TARGET' | 'INSUFFICIENT_DATA';
  observation: string;
}

export interface RiskComparisonResult {
  highRiskCount: MetricDelta;
  highRiskPct: MetricDelta;
  mediumRiskCount: MetricDelta;
  mediumRiskPct: MetricDelta;
  lowRiskCount: MetricDelta;
  lowRiskPct: MetricDelta;
  overallShiftObservation: string;
}

export interface TopicComparisonResult {
  topic: string;
  coId: string;
  attainment: MetricDelta;
  baselineStatus: string;
  comparisonStatus: string;
  observation: string;
}

export interface InterventionComparisonResult {
  approvedCount: MetricDelta;
  reassessedCount: MetricDelta;
  pendingCount: MetricDelta;
  observation: string;
}

export interface LearningGainComparisonResult {
  meanAbsoluteGain: MetricDelta;
  targetAchievedPct: MetricDelta;
  positiveGainPct: MetricDelta;
  negativeChangeCount: MetricDelta;
  observation: string;
}

export interface DeterministicObservation {
  id: string;
  category: 'POSITIVE' | 'ATTENTION' | 'NEUTRAL' | 'DATA_QUALITY';
  title: string;
  statement: string; // Factual observation wording (never claiming causation)
  metricBasis: string;
}

export interface HistoricalComparisonReport {
  comparisonId: string;
  generatedAt: string;
  baselineRun: {
    runId: string;
    createdAt: string;
    courseId: string;
    semester: string;
    dataType: string;
    totalStudents: number;
  };
  comparisonRun: {
    runId: string;
    createdAt: string;
    courseId: string;
    semester: string;
    dataType: string;
    totalStudents: number;
  };
  coComparisons: COComparisonResult[];
  riskComparison: RiskComparisonResult;
  topicComparisons: TopicComparisonResult[];
  interventionComparison: InterventionComparisonResult;
  learningGainComparison: LearningGainComparisonResult;
  observations: DeterministicObservation[];
  summary: {
    improvingCOCount: number;
    decliningCOCount: number;
    stableCOCount: number;
    highRiskStudentDelta: number;
    meanAttainmentDeltaPp: number | null;
  };
}

/**
 * Calculate deterministic metric delta strictly distinguishing pp from %
 */
export function calculateMetricDelta(
  baseline: number | null,
  comparison: number | null,
  isPercentageMetric: boolean = true,
  higherIsBetter: boolean = true
): MetricDelta {
  if (baseline === null || comparison === null || isNaN(baseline) || isNaN(comparison)) {
    return {
      baselineValue: baseline,
      comparisonValue: comparison,
      deltaPercentagePoints: null,
      deltaAbsolute: null,
      percentageChange: null,
      direction: 'INSUFFICIENT_DATA',
      unit: isPercentageMetric ? 'pp' : 'count',
      isAvailable: false
    };
  }

  const deltaAbsolute = comparison - baseline;
  const deltaPercentagePoints = isPercentageMetric ? deltaAbsolute : null;

  let percentageChange: number | null = null;
  if (baseline !== 0) {
    percentageChange = (deltaAbsolute / Math.abs(baseline)) * 100;
  }

  let direction: 'IMPROVED' | 'DECLINED' | 'STABLE' = 'STABLE';
  const epsilon = 0.05; // 0.05 pp threshold for stability
  if (Math.abs(deltaAbsolute) > epsilon) {
    if (higherIsBetter) {
      direction = deltaAbsolute > 0 ? 'IMPROVED' : 'DECLINED';
    } else {
      // Lower is better (e.g. risk counts, failure rates)
      direction = deltaAbsolute < 0 ? 'IMPROVED' : 'DECLINED';
    }
  }

  return {
    baselineValue: baseline,
    comparisonValue: comparison,
    deltaPercentagePoints,
    deltaAbsolute,
    percentageChange,
    direction,
    unit: isPercentageMetric ? 'pp' : 'count',
    isAvailable: true
  };
}

/**
 * Compare Course Outcome attainment between baseline and comparison runs
 */
export function compareCORuns(
  baselineCOs: HistoryCOSummary[],
  comparisonCOs: HistoryCOSummary[]
): COComparisonResult[] {
  // Unique set of all COs present across both runs
  const coKeys = Array.from(new Set([
    ...baselineCOs.map(c => c.coId),
    ...comparisonCOs.map(c => c.coId)
  ])).sort();

  return coKeys.map(coId => {
    const base = baselineCOs.find(c => c.coId === coId);
    const comp = comparisonCOs.find(c => c.coId === coId);

    const baseAttain = base?.attainmentPct ?? null;
    const compAttain = comp?.attainmentPct ?? null;
    const target = comp?.targetThreshold ?? base?.targetThreshold ?? null;

    const attainDelta = calculateMetricDelta(baseAttain, compAttain, true, true);

    const baseGap = (baseAttain !== null && target !== null) ? baseAttain - target : null;
    const compGap = (compAttain !== null && target !== null) ? compAttain - target : null;
    const gapDelta = calculateMetricDelta(baseGap, compGap, true, true);

    const baseMet = (baseAttain !== null && target !== null) ? baseAttain >= target : null;
    const compMet = (compAttain !== null && target !== null) ? compAttain >= target : null;

    let statusChange: COComparisonResult['statusChange'] = 'INSUFFICIENT_DATA';
    if (baseMet !== null && compMet !== null) {
      if (!baseMet && compMet) statusChange = 'MET_TARGET';
      else if (baseMet && !compMet) statusChange = 'DROPPED_BELOW_TARGET';
      else if (baseMet && compMet) statusChange = 'MAINTAINED_TARGET';
      else statusChange = 'STILL_BELOW_TARGET';
    }

    // Deterministic factual observation (never claims causation)
    let observation = 'Insufficient data for longitudinal CO comparison.';
    if (attainDelta.isAvailable && attainDelta.deltaPercentagePoints !== null) {
      const pp = attainDelta.deltaPercentagePoints;
      const sign = pp >= 0 ? '+' : '';
      if (Math.abs(pp) < 0.1) {
        observation = `Observed attainment for ${coId} remained stable at ${compAttain?.toFixed(1)}%.`;
      } else if (pp > 0) {
        observation = `Observed attainment for ${coId} increased by ${sign}${pp.toFixed(1)} percentage points (from ${baseAttain?.toFixed(1)}% to ${compAttain?.toFixed(1)}%).`;
      } else {
        observation = `Observed attainment for ${coId} declined by ${pp.toFixed(1)} percentage points (from ${baseAttain?.toFixed(1)}% to ${compAttain?.toFixed(1)}%).`;
      }
    }

    return {
      coId,
      courseId: comp?.courseId || base?.courseId || 'N/A',
      targetThreshold: target,
      attainment: attainDelta,
      gapToTarget: gapDelta,
      baselineStatus: base?.status || 'NOT EVALUATED',
      comparisonStatus: comp?.status || 'NOT EVALUATED',
      statusChange,
      observation
    };
  });
}

/**
 * Compare cohort risk distribution between baseline and comparison runs
 */
export function compareRiskRuns(
  baseRisk: HistoryRiskSummary,
  compRisk: HistoryRiskSummary
): RiskComparisonResult {
  const highCount = calculateMetricDelta(baseRisk.highRiskCount, compRisk.highRiskCount, false, false);
  const highPct = calculateMetricDelta(baseRisk.highRiskPct, compRisk.highRiskPct, true, false);

  const medCount = calculateMetricDelta(baseRisk.mediumRiskCount, compRisk.mediumRiskCount, false, false);
  const medPct = calculateMetricDelta(baseRisk.mediumRiskPct, compRisk.mediumRiskPct, true, false);

  const lowCount = calculateMetricDelta(baseRisk.lowRiskCount, compRisk.lowRiskCount, false, true);
  const lowPct = calculateMetricDelta(baseRisk.lowRiskPct, compRisk.lowRiskPct, true, true);

  let overallShiftObservation = 'Cohort risk distribution remained consistent between runs.';
  if (highCount.deltaAbsolute !== null && Math.abs(highCount.deltaAbsolute) > 0) {
    const delta = highCount.deltaAbsolute;
    const pp = highPct.deltaPercentagePoints !== null ? highPct.deltaPercentagePoints.toFixed(1) : '0';
    if (delta < 0) {
      overallShiftObservation = `High-risk cohort decreased by ${Math.abs(delta)} students (${pp} percentage points) between selected runs.`;
    } else {
      overallShiftObservation = `High-risk cohort increased by ${delta} students (+${pp} percentage points) between selected runs.`;
    }
  }

  return {
    highRiskCount: highCount,
    highRiskPct: highPct,
    mediumRiskCount: medCount,
    mediumRiskPct: medPct,
    lowRiskCount: lowCount,
    lowRiskPct: lowPct,
    overallShiftObservation
  };
}

/**
 * Compare topic-level performance between runs
 */
export function compareTopicRuns(
  baseTopics: HistoryTopicSummary[],
  compTopics: HistoryTopicSummary[]
): TopicComparisonResult[] {
  const topicNames = Array.from(new Set([
    ...baseTopics.map(t => t.topic),
    ...compTopics.map(t => t.topic)
  ])).sort();

  return topicNames.map(topic => {
    const base = baseTopics.find(t => t.topic === topic);
    const comp = compTopics.find(t => t.topic === topic);

    const baseAttain = base?.attainmentPct ?? null;
    const compAttain = comp?.attainmentPct ?? null;
    const delta = calculateMetricDelta(baseAttain, compAttain, true, true);

    let observation = 'Topic data not available in both runs.';
    if (delta.isAvailable && delta.deltaPercentagePoints !== null) {
      const pp = delta.deltaPercentagePoints;
      const sign = pp >= 0 ? '+' : '';
      observation = `${topic} attainment shifted by ${sign}${pp.toFixed(1)} percentage points (${baseAttain?.toFixed(1)}% to ${compAttain?.toFixed(1)}%).`;
    }

    return {
      topic,
      coId: comp?.coId || base?.coId || 'N/A',
      attainment: delta,
      baselineStatus: base?.diagnosisStatus || 'NOT EVALUATED',
      comparisonStatus: comp?.diagnosisStatus || 'NOT EVALUATED',
      observation
    };
  });
}

/**
 * Compare intervention tracking metrics
 */
export function compareInterventionRuns(
  baseInt: HistoryInterventionSummary,
  compInt: HistoryInterventionSummary
): InterventionComparisonResult {
  const approved = calculateMetricDelta(baseInt.approvedCount, compInt.approvedCount, false, true);
  const reassessed = calculateMetricDelta(baseInt.reassessedCount, compInt.reassessedCount, false, true);
  const pending = calculateMetricDelta(baseInt.pendingCount, compInt.pendingCount, false, false);

  let observation = 'Intervention activity unchanged.';
  if (approved.deltaAbsolute !== null && approved.deltaAbsolute !== 0) {
    const diff = approved.deltaAbsolute;
    observation = diff > 0
      ? `Faculty-approved interventions increased by ${diff} cases.`
      : `Approved interventions decreased by ${Math.abs(diff)} cases.`;
  }

  return {
    approvedCount: approved,
    reassessedCount: reassessed,
    pendingCount: pending,
    observation
  };
}

/**
 * Compare learning gain metrics from reassessments
 */
export function compareLearningGainRuns(
  baseGain: HistoryLearningGainSummary,
  compGain: HistoryLearningGainSummary
): LearningGainComparisonResult {
  const meanGain = calculateMetricDelta(baseGain.meanAbsoluteLearningGainPp, compGain.meanAbsoluteLearningGainPp, true, true);
  const targetMet = calculateMetricDelta(baseGain.targetAchievedPct, compGain.targetAchievedPct, true, true);
  const posGain = calculateMetricDelta(baseGain.positiveGainPct, compGain.positiveGainPct, true, true);
  const negChange = calculateMetricDelta(baseGain.negativeChangePct, compGain.negativeChangePct, true, false);

  let observation = 'Reassessment gains evaluated across cohort cycles.';
  if (meanGain.isAvailable && meanGain.deltaPercentagePoints !== null) {
    const pp = meanGain.deltaPercentagePoints;
    const sign = pp >= 0 ? '+' : '';
    observation = `Mean absolute learning gain shifted by ${sign}${pp.toFixed(1)} percentage points between runs.`;
  }

  return {
    meanAbsoluteGain: meanGain,
    targetAchievedPct: targetMet,
    positiveGainPct: posGain,
    negativeChangeCount: negChange,
    observation
  };
}

/**
 * Build a complete, immutable historical comparison report between two runs
 */
export function buildHistoricalComparison(
  baselineRun: HistoryRun,
  comparisonRun: HistoryRun
): HistoricalComparisonReport {
  const coComparisons = compareCORuns(baselineRun.coSummaries, comparisonRun.coSummaries);
  const riskComparison = compareRiskRuns(baselineRun.riskSummary, comparisonRun.riskSummary);
  const topicComparisons = compareTopicRuns(baselineRun.topicSummaries, comparisonRun.topicSummaries);
  const interventionComparison = compareInterventionRuns(baselineRun.interventionSummary, comparisonRun.interventionSummary);
  const learningGainComparison = compareLearningGainRuns(baselineRun.learningGainSummary, comparisonRun.learningGainSummary);

  // Generate deterministic academic observations
  const observations: DeterministicObservation[] = [];

  // CO Insights
  const improvingCOs = coComparisons.filter(c => c.attainment.direction === 'IMPROVED');
  const decliningCOs = coComparisons.filter(c => c.attainment.direction === 'DECLINED');
  const stableCOs = coComparisons.filter(c => c.attainment.direction === 'STABLE');

  if (improvingCOs.length > 0) {
    observations.push({
      id: 'OBS-CO-IMP',
      category: 'POSITIVE',
      title: 'Course Outcomes Demonstrating Growth',
      statement: `Observed attainment increased for ${improvingCOs.map(c => `${c.coId} (+${c.attainment.deltaPercentagePoints?.toFixed(1)} pp)`).join(', ')}.`,
      metricBasis: 'Course Outcome Longitudinal Attainment Delta'
    });
  }

  if (decliningCOs.length > 0) {
    observations.push({
      id: 'OBS-CO-DEC',
      category: 'ATTENTION',
      title: 'Course Outcomes Requiring Instructional Attention',
      statement: `Observed attainment declined for ${decliningCOs.map(c => `${c.coId} (${c.attainment.deltaPercentagePoints?.toFixed(1)} pp)`).join(', ')}.`,
      metricBasis: 'Course Outcome Longitudinal Attainment Delta'
    });
  }

  // Risk Shift Insight
  if (riskComparison.highRiskCount.deltaAbsolute !== null) {
    const hrDelta = riskComparison.highRiskCount.deltaAbsolute;
    if (hrDelta < 0) {
      observations.push({
        id: 'OBS-RISK-DEC',
        category: 'POSITIVE',
        title: 'Contraction of High-Risk Student Cohort',
        statement: `High-risk student count decreased by ${Math.abs(hrDelta)} students (${riskComparison.highRiskPct.deltaPercentagePoints?.toFixed(1)} percentage points).`,
        metricBasis: 'Empirical Risk Stratification'
      });
    } else if (hrDelta > 0) {
      observations.push({
        id: 'OBS-RISK-INC',
        category: 'ATTENTION',
        title: 'Expansion of High-Risk Student Cohort',
        statement: `High-risk student count increased by ${hrDelta} students (+${riskComparison.highRiskPct.deltaPercentagePoints?.toFixed(1)} percentage points).`,
        metricBasis: 'Empirical Risk Stratification'
      });
    }
  }

  // Reassessment Gain Insight
  if (learningGainComparison.meanAbsoluteGain.isAvailable && learningGainComparison.meanAbsoluteGain.comparisonValue !== null) {
    observations.push({
      id: 'OBS-GAIN-EVAL',
      category: 'POSITIVE',
      title: 'Observed Closed-Loop Learning Gain',
      statement: `Comparison run reflects a mean observed learning gain of ${learningGainComparison.meanAbsoluteGain.comparisonValue.toFixed(1)} percentage points across reassessed students.`,
      metricBasis: 'Module 7 Reassessment Engine'
    });
  }

  // Overall mean attainment calculation
  const validDeltas = coComparisons
    .map(c => c.attainment.deltaPercentagePoints)
    .filter((d): d is number => d !== null);

  const meanAttainmentDeltaPp = validDeltas.length > 0
    ? validDeltas.reduce((a, b) => a + b, 0) / validDeltas.length
    : null;

  return {
    comparisonId: `COMP-${baselineRun.runId}-VS-${comparisonRun.runId}`,
    generatedAt: new Date().toISOString(),
    baselineRun: {
      runId: baselineRun.runId,
      createdAt: baselineRun.createdAt,
      courseId: baselineRun.courseId,
      semester: baselineRun.semester,
      dataType: baselineRun.dataType,
      totalStudents: baselineRun.totalStudents
    },
    comparisonRun: {
      runId: comparisonRun.runId,
      createdAt: comparisonRun.createdAt,
      courseId: comparisonRun.courseId,
      semester: comparisonRun.semester,
      dataType: comparisonRun.dataType,
      totalStudents: comparisonRun.totalStudents
    },
    coComparisons,
    riskComparison,
    topicComparisons,
    interventionComparison,
    learningGainComparison,
    observations,
    summary: {
      improvingCOCount: improvingCOs.length,
      decliningCOCount: decliningCOs.length,
      stableCOCount: stableCOs.length,
      highRiskStudentDelta: riskComparison.highRiskCount.deltaAbsolute || 0,
      meanAttainmentDeltaPp
    }
  };
}

