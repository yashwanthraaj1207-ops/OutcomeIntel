import {
  PredictionResult,
  HistoricalAssessmentScore,
  RiskLevel,
  RiskFeatures,
  RiskAssessment,
  RiskOverviewSummary
} from '../types/dataTypes';

/**
 * Calculates deterministic attainment gap (historical mean attainment - target %).
 * Positive = surplus above target, Negative = deficit below target.
 */
export function calculateAttainmentGap(
  historicalAttainment: number | null,
  targetPct: number | null
): number | null {
  if (historicalAttainment === null || targetPct === null || isNaN(historicalAttainment) || isNaN(targetPct)) {
    return null;
  }
  return Math.round((historicalAttainment - targetPct) * 100) / 100;
}

/**
 * Calculates empirical standard deviation across historical assessment scores.
 * Measures student performance consistency across chronological cycles.
 */
export function calculateHistoricalConsistency(
  historicalScores: HistoricalAssessmentScore[]
): { score: number | null; label: string } {
  if (!historicalScores || historicalScores.length < 2) {
    return { score: null, label: 'Not Available' };
  }

  const values = historicalScores.map(s => s.attainmentPct);
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

  let label = 'High Consistency';
  if (stdDev > 12.0) {
    label = 'Inconsistent Performance (High Volatility)';
  } else if (stdDev > 5.0) {
    label = 'Moderate Consistency';
  } else {
    label = 'High Consistency (Stable Scores)';
  }

  return { score: stdDev, label };
}

/**
 * Classifies a student into HIGH RISK, MEDIUM RISK, LOW RISK, or INSUFFICIENT DATA
 * based on multi-signal evidence synthesis.
 */
export function classifyStudentRisk(
  features: RiskFeatures
): { riskLevel: RiskLevel; contributingSignals: string[]; reasons: string[] } {
  const contributingSignals: string[] = [];
  const reasons: string[] = [];

  // 1. INSUFFICIENT DATA
  // If required prediction, target, or historical evidence is unavailable.
  if (
    features.dataSufficiency === 'INSUFFICIENT' ||
    features.predictedProbability === null ||
    features.configuredTarget === null ||
    features.historicalAttainment === null ||
    features.attainmentGap === null
  ) {
    return {
      riskLevel: 'INSUFFICIENT DATA',
      contributingSignals: ['Data Insufficiency'],
      reasons: [features.insufficientReason || 'Required prediction, target, or historical evidence is unavailable']
    };
  }

  const prob = features.predictedProbability;
  const gap = features.attainmentGap;
  const trend = features.performanceTrend;

  // Track key signals for diagnostic evidence
  if (prob < 40.0) {
    contributingSignals.push('Low Predicted Attainment Probability (< 40%)');
  } else if (prob < 70.0) {
    contributingSignals.push('Moderate Predicted Attainment Probability (40%–69%)');
  } else {
    contributingSignals.push('High Predicted Attainment Probability (≥ 70%)');
  }

  if (gap < -10.0) {
    contributingSignals.push('Substantial Target Deficit (< -10%)');
  } else if (gap < 0.0) {
    contributingSignals.push('Moderate Target Deficit (< 0%)');
  } else {
    contributingSignals.push('Target Surplus (≥ 0%)');
  }

  if (trend === 'Declining') {
    contributingSignals.push('Declining Performance Trajectory');
  } else if (trend === 'Improving') {
    contributingSignals.push('Improving Performance Trajectory');
  } else {
    contributingSignals.push('Stable Performance Trajectory');
  }

  // 2. HIGH RISK
  // If:
  // - predicted probability < 40%
  // OR
  // - attainment gap < -10 percentage points AND trend = Declining
  // Boundary rules:
  // - P = 40% is NOT High Risk from probability alone.
  // - Gap = -10% is NOT High Risk from the gap rule alone.
  const isHighByProb = prob < 40.0;
  const isHighByGapAndTrend = gap < -10.0 && trend === 'Declining';

  if (isHighByProb || isHighByGapAndTrend) {
    if (isHighByProb) {
      reasons.push(`Predicted probability of meeting target is critical (${prob.toFixed(1)}% < 40.0%)`);
    }
    if (isHighByGapAndTrend) {
      reasons.push(`Substantial historical deficit (${gap.toFixed(1)}% < -10.0 percentage points) compounding with a Declining performance trend`);
    }
    if (features.historicalAttainment !== null && features.configuredTarget !== null && features.historicalAttainment < features.configuredTarget) {
      reasons.push(`Current historical attainment (${features.historicalAttainment.toFixed(1)}%) is below institutional target (${features.configuredTarget.toFixed(1)}%)`);
    }
    return {
      riskLevel: 'HIGH RISK',
      contributingSignals,
      reasons
    };
  }

  // 3. LOW RISK
  // If:
  // - predicted probability >= 70%
  // AND
  // - attainment gap >= -5 percentage points
  // AND
  // - trend != Declining
  // Boundary rules:
  // - P = 70% can qualify for Low Risk if the other Low Risk conditions are satisfied.
  // - Gap = -5% satisfies the Low Risk gap condition.
  const isLowRisk = prob >= 70.0 && gap >= -5.0 && trend !== 'Declining';

  if (isLowRisk) {
    reasons.push(`Strong predicted probability of meeting target (${prob.toFixed(1)}% ≥ 70.0%)`);
    reasons.push(`Historical attainment aligns with or exceeds target threshold (${gap >= 0 ? '+' : ''}${gap.toFixed(1)}% ≥ -5.0 percentage points)`);
    reasons.push(`Performance trend is non-declining (${trend.toLowerCase()})`);
    return {
      riskLevel: 'LOW RISK',
      contributingSignals,
      reasons
    };
  }

  // 4. MEDIUM RISK
  // All remaining eligible cases.
  // This deterministic catch-all ensures every eligible student receives exactly one mutually exclusive risk category.
  if (prob >= 40.0 && prob < 70.0) {
    reasons.push(`Predicted probability of meeting target is in intermediate band (${prob.toFixed(1)}%)`);
  }
  if (gap < 0.0) {
    reasons.push(`Historical attainment is below institutional target by ${Math.abs(gap).toFixed(1)}%`);
  }
  if (trend === 'Declining') {
    reasons.push(`Declining trajectory offsets favorable historical score`);
  }
  if (reasons.length === 0) {
    reasons.push('Borderline attainment parameters warrant early instructional monitoring');
  }

  return {
    riskLevel: 'MEDIUM RISK',
    contributingSignals,
    reasons
  };
}

/**
 * Calculates a bounded numeric priority score (0 to 100) to order students by urgency of review.
 * Formula:
 * - Predicted Failure Risk (40%): (1 - P/100) * 40
 * - Historical Deficit (25%): (min(30, |deficit|) / 30) * 25
 * - Trend Penalty (20%): Declining: 20, Stable: 8, Improving: 0, Insufficient History: 10
 * - Inconsistency Volatility (15%): min(15, (stdDev / 20) * 15), or 7.5 default
 */
export function calculatePriorityScore(
  features: RiskFeatures,
  riskLevel: RiskLevel
): number | null {
  if (riskLevel === 'INSUFFICIENT DATA' || features.predictedProbability === null) {
    return null;
  }

  const pFail = (1.0 - features.predictedProbability / 100) * 40;

  const gap = features.attainmentGap ?? 0;
  const deficit = gap < 0 ? Math.min(30, Math.abs(gap)) : 0;
  const sGap = (deficit / 30) * 25;

  let sTrend = 8; // Stable
  if (features.performanceTrend === 'Declining') sTrend = 20;
  else if (features.performanceTrend === 'Improving') sTrend = 0;
  else if (features.performanceTrend === 'Insufficient History') sTrend = 10;

  let sConsistency = 7.5;
  if (features.consistencyScore !== null) {
    sConsistency = Math.min(15, (features.consistencyScore / 20) * 15);
  }

  const rawScore = pFail + sGap + sTrend + sConsistency;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

/**
 * Evaluates risk for an individual student case based on prediction outputs and historical evidence.
 */
export function evaluateStudentRisk(
  prediction: PredictionResult | null,
  studentId: string,
  courseId: string,
  coId: string,
  predictionAssessment: string,
  targetThreshold: number | null,
  hasHistoricalData: boolean
): RiskAssessment {
  // Check insufficiency conditions
  if (!hasHistoricalData) {
    const feat: RiskFeatures = {
      studentId,
      courseId,
      coId,
      predictionAssessment,
      predictedProbability: null,
      configuredTarget: targetThreshold,
      historicalAttainment: null,
      attainmentGap: null,
      performanceTrend: 'Insufficient History',
      consistencyScore: null,
      consistencyLabel: 'Not Available',
      dataSufficiency: 'INSUFFICIENT',
      insufficientReason: `Assessment ${predictionAssessment} is baseline cycle with zero preceding assessments.`
    };
    return {
      studentId,
      courseId,
      coId,
      predictionAssessment,
      riskLevel: 'INSUFFICIENT DATA',
      priorityScore: null,
      priorityRank: 9999,
      features: feat,
      contributingSignals: ['Baseline Assessment Horizon'],
      reasons: [feat.insufficientReason!]
    };
  }

  if (targetThreshold === null) {
    const feat: RiskFeatures = {
      studentId,
      courseId,
      coId,
      predictionAssessment,
      predictedProbability: null,
      configuredTarget: null,
      historicalAttainment: null,
      attainmentGap: null,
      performanceTrend: 'Insufficient History',
      consistencyScore: null,
      consistencyLabel: 'Not Available',
      dataSufficiency: 'INSUFFICIENT',
      insufficientReason: `Institutional target percentage is not configured for ${courseId} + ${coId}.`
    };
    return {
      studentId,
      courseId,
      coId,
      predictionAssessment,
      riskLevel: 'INSUFFICIENT DATA',
      priorityScore: null,
      priorityRank: 9999,
      features: feat,
      contributingSignals: ['Missing Target Mapping'],
      reasons: [feat.insufficientReason!]
    };
  }

  if (!prediction) {
    const feat: RiskFeatures = {
      studentId,
      courseId,
      coId,
      predictionAssessment,
      predictedProbability: null,
      configuredTarget: targetThreshold,
      historicalAttainment: null,
      attainmentGap: null,
      performanceTrend: 'Insufficient History',
      consistencyScore: null,
      consistencyLabel: 'Not Available',
      dataSufficiency: 'INSUFFICIENT',
      insufficientReason: 'Prediction output unavailable for this student record.'
    };
    return {
      studentId,
      courseId,
      coId,
      predictionAssessment,
      riskLevel: 'INSUFFICIENT DATA',
      priorityScore: null,
      priorityRank: 9999,
      features: feat,
      contributingSignals: ['Missing Prediction Result'],
      reasons: [feat.insufficientReason!]
    };
  }

  // Extract factual risk features
  const consistency = calculateHistoricalConsistency(prediction.features.historicalAssessmentScores);
  const attainmentGap = calculateAttainmentGap(prediction.features.rollingCOAttainment, targetThreshold);

  const riskFeatures: RiskFeatures = {
    studentId,
    courseId,
    coId,
    predictionAssessment,
    predictedProbability: prediction.probabilityMeetingTarget,
    configuredTarget: targetThreshold,
    historicalAttainment: prediction.features.rollingCOAttainment,
    attainmentGap,
    performanceTrend: prediction.features.performanceTrend,
    consistencyScore: consistency.score,
    consistencyLabel: consistency.label,
    dataSufficiency: 'SUFFICIENT',
    insufficientReason: null
  };

  const { riskLevel, contributingSignals, reasons } = classifyStudentRisk(riskFeatures);
  const priorityScore = calculatePriorityScore(riskFeatures, riskLevel);

  return {
    studentId,
    courseId,
    coId,
    predictionAssessment,
    riskLevel,
    priorityScore,
    priorityRank: 0, // Assigned after cohort sorting
    features: riskFeatures,
    contributingSignals,
    reasons
  };
}

/**
 * Evaluates risk assessments across an entire student cohort and computes overview statistics.
 */
export function evaluateCohortRisk(
  predictions: PredictionResult[],
  allCohortStudentIds: string[],
  courseId: string,
  coId: string,
  predictionAssessment: string,
  targetThreshold: number | null,
  hasHistoricalData: boolean
): {
  assessments: RiskAssessment[];
  summary: RiskOverviewSummary;
} {
  const predMap = new Map<string, PredictionResult>();
  predictions.forEach(p => predMap.set(p.studentId, p));

  const assessments: RiskAssessment[] = allCohortStudentIds.map(sId => {
    const pred = predMap.get(sId) || null;
    return evaluateStudentRisk(
      pred,
      sId,
      courseId,
      coId,
      predictionAssessment,
      targetThreshold,
      hasHistoricalData
    );
  });

  // Sort by Priority Score descending (highest urgency first).
  // Insufficient data records are sorted at the bottom.
  assessments.sort((a, b) => {
    if (a.priorityScore === null && b.priorityScore === null) return a.studentId.localeCompare(b.studentId);
    if (a.priorityScore === null) return 1;
    if (b.priorityScore === null) return -1;
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return a.studentId.localeCompare(b.studentId);
  });

  // Assign 1-indexed priority rank
  assessments.forEach((item, idx) => {
    item.priorityRank = idx + 1;
  });

  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let insufficientCount = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  assessments.forEach(a => {
    if (a.riskLevel === 'HIGH RISK') highCount++;
    else if (a.riskLevel === 'MEDIUM RISK') mediumCount++;
    else if (a.riskLevel === 'LOW RISK') lowCount++;
    else insufficientCount++;

    if (a.priorityScore !== null) {
      scoreSum += a.priorityScore;
      scoreCount++;
    }
  });

  const averagePriorityScore = scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : 0;

  return {
    assessments,
    summary: {
      totalStudents: assessments.length,
      highRiskCount: highCount,
      mediumRiskCount: mediumCount,
      lowRiskCount: lowCount,
      insufficientDataCount: insufficientCount,
      averagePriorityScore
    }
  };
}

