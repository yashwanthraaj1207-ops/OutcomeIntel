import {
  StandardizedAssessmentRecord,
  RiskAssessment,
  PredictionResult,
  TopicDiagnosisCategory,
  TopicDiagnosisItem,
  QuestionDiagnosisItem,
  COEvidenceData,
  EvidenceFactor,
  DiagnosisSummary,
  StudentExplanationPayload,
  TopicProgressionMilestone
} from '../types/dataTypes';
import {
  getChronologicalAssessments,
  getHistoricalAssessments
} from './predictionFeatureEngine';

/**
 * Filter standardized records to ONLY those belonging to the course and
 * chronologically preceding the prediction assessment horizon.
 * STRICT ANTI-LEAKAGE: Future assessments and the target horizon itself are excluded.
 */
export function getHistoricalEvidenceBeforePrediction(
  records: StandardizedAssessmentRecord[],
  courseId: string,
  predictionAssessment: string
): { historicalRecords: StandardizedAssessmentRecord[]; historicalAssessments: string[] } {
  const chronological = getChronologicalAssessments(records, courseId);
  const historicalAssessments = getHistoricalAssessments(chronological, predictionAssessment);

  if (historicalAssessments.length === 0) {
    return { historicalRecords: [], historicalAssessments: [] };
  }

  const histSet = new Set(historicalAssessments.map(a => a.toUpperCase()));
  const filtered = records.filter(r => {
    const cMatch = courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase();
    return cMatch && histSet.has(r.assessment_id.toUpperCase());
  });

  return { historicalRecords: filtered, historicalAssessments };
}

/**
 * Classifies a topic into a transparent diagnosis category.
 * Rules:
 * - Critical Weakness: attainment < 50.0%
 * - Needs Attention: 50.0% <= attainment < target
 * - Adequate: target <= attainment < 80.0%
 * - Strong: attainment >= 80.0%
 * Fallback target: 70.0% if institutional target is unconfigured.
 */
export function classifyTopicDiagnosis(
  attainmentPct: number,
  targetPct: number | null
): TopicDiagnosisCategory {
  if (attainmentPct < 50.0) {
    return 'Critical Weakness';
  }

  const effectiveTarget = targetPct !== null ? targetPct : 70.0;

  if (attainmentPct < effectiveTarget) {
    return 'Needs Attention';
  }

  if (attainmentPct < 80.0) {
    return 'Adequate';
  }

  return 'Strong';
}

/**
 * Calculates CO-level historical performance evidence for a specific student.
 */
export function calculateCOEvidence(
  studentId: string,
  courseId: string,
  coId: string,
  targetThreshold: number | null,
  historicalRecords: StandardizedAssessmentRecord[],
  historicalAssessments: string[]
): COEvidenceData {
  const matching = historicalRecords.filter(r =>
    r.student_id.toUpperCase() === studentId.toUpperCase() &&
    (courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase()) &&
    r.co_id.toUpperCase() === coId.toUpperCase()
  );

  if (matching.length === 0) {
    return {
      coId,
      courseId,
      configuredTarget: targetThreshold,
      historicalAttainment: null,
      attainmentGap: null,
      questionCount: 0,
      topicCount: 0,
      observationCount: 0,
      progression: []
    };
  }

  const totalObtained = matching.reduce((sum, r) => sum + r.marks_obtained, 0);
  const totalMax = matching.reduce((sum, r) => sum + r.max_marks, 0);
  const historicalAttainment = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(1)) : 0;
  const attainmentGap = targetThreshold !== null ? parseFloat((historicalAttainment - targetThreshold).toFixed(1)) : null;

  const uniqueQuestions = new Set(matching.map(r => r.question_id));
  const uniqueTopics = new Set(matching.map(r => r.topic));

  // Progression by historical assessment in chronological sequence
  const progression: TopicProgressionMilestone[] = [];
  historicalAssessments.forEach(assId => {
    const assRecords = matching.filter(r => r.assessment_id.toUpperCase() === assId.toUpperCase());
    if (assRecords.length > 0) {
      const assObtained = assRecords.reduce((sum, r) => sum + r.marks_obtained, 0);
      const assMax = assRecords.reduce((sum, r) => sum + r.max_marks, 0);
      const assPct = assMax > 0 ? parseFloat(((assObtained / assMax) * 100).toFixed(1)) : 0;
      progression.push({
        assessmentId: assId,
        marksObtained: parseFloat(assObtained.toFixed(1)),
        maxMarks: parseFloat(assMax.toFixed(1)),
        attainmentPct: assPct
      });
    }
  });

  return {
    coId,
    courseId,
    configuredTarget: targetThreshold,
    historicalAttainment,
    attainmentGap,
    questionCount: uniqueQuestions.size,
    topicCount: uniqueTopics.size,
    observationCount: matching.length,
    progression
  };
}

/**
 * Calculates topic-level performance metrics for all topics under the specified CO.
 */
export function calculateTopicEvidence(
  studentId: string,
  courseId: string,
  coId: string,
  targetThreshold: number | null,
  historicalRecords: StandardizedAssessmentRecord[],
  historicalAssessments: string[]
): TopicDiagnosisItem[] {
  const matching = historicalRecords.filter(r =>
    r.student_id.toUpperCase() === studentId.toUpperCase() &&
    (courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase()) &&
    r.co_id.toUpperCase() === coId.toUpperCase()
  );

  const topicGroups = new Map<string, StandardizedAssessmentRecord[]>();
  matching.forEach(r => {
    const list = topicGroups.get(r.topic) || [];
    list.push(r);
    topicGroups.set(r.topic, list);
  });

  const results: TopicDiagnosisItem[] = [];

  topicGroups.forEach((records, topic) => {
    const totalObtained = records.reduce((sum, r) => sum + r.marks_obtained, 0);
    const totalMax = records.reduce((sum, r) => sum + r.max_marks, 0);
    const attainmentPct = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(1)) : 0;
    const gapPct = targetThreshold !== null ? parseFloat((attainmentPct - targetThreshold).toFixed(1)) : null;
    const diagnosisCategory = classifyTopicDiagnosis(attainmentPct, targetThreshold);

    const uniqueQuestions = new Set(records.map(r => r.question_id));

    // Historical progression for this topic
    const progression: TopicProgressionMilestone[] = [];
    historicalAssessments.forEach(assId => {
      const assRecords = records.filter(r => r.assessment_id.toUpperCase() === assId.toUpperCase());
      if (assRecords.length > 0) {
        const assObtained = assRecords.reduce((sum, r) => sum + r.marks_obtained, 0);
        const assMax = assRecords.reduce((sum, r) => sum + r.max_marks, 0);
        const assPct = assMax > 0 ? parseFloat(((assObtained / assMax) * 100).toFixed(1)) : 0;
        progression.push({
          assessmentId: assId,
          marksObtained: parseFloat(assObtained.toFixed(1)),
          maxMarks: parseFloat(assMax.toFixed(1)),
          attainmentPct: assPct
        });
      }
    });

    results.push({
      topic,
      coId,
      courseId,
      totalMarksObtained: parseFloat(totalObtained.toFixed(1)),
      totalMaxMarks: parseFloat(totalMax.toFixed(1)),
      attainmentPct,
      targetPct: targetThreshold,
      gapPct,
      questionCount: uniqueQuestions.size,
      observationCount: records.length,
      diagnosisCategory,
      progression
    });
  });

  return rankWeakTopics(results);
}

/**
 * Calculates question-level performance for all questions answered under the CO.
 */
export function calculateQuestionEvidence(
  studentId: string,
  courseId: string,
  coId: string,
  historicalRecords: StandardizedAssessmentRecord[]
): QuestionDiagnosisItem[] {
  const matching = historicalRecords.filter(r =>
    r.student_id.toUpperCase() === studentId.toUpperCase() &&
    (courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase()) &&
    r.co_id.toUpperCase() === coId.toUpperCase()
  );

  // Group by question_id + assessment_id so multi-assessment attempts remain distinct
  const qMap = new Map<string, StandardizedAssessmentRecord[]>();
  matching.forEach(r => {
    const key = `${r.question_id}|${r.assessment_id}`;
    const list = qMap.get(key) || [];
    list.push(r);
    qMap.set(key, list);
  });

  const results: QuestionDiagnosisItem[] = [];

  qMap.forEach((records, key) => {
    const [questionId, assessmentId] = key.split('|');
    const topic = records[0].topic;
    const totalObtained = records.reduce((sum, r) => sum + r.marks_obtained, 0);
    const totalMax = records.reduce((sum, r) => sum + r.max_marks, 0);
    const attainmentPct = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(1)) : 0;

    let diagnosis = 'Satisfactory';
    if (attainmentPct < 40.0) diagnosis = 'Critical Weakness';
    else if (attainmentPct < 60.0) diagnosis = 'Needs Reinforcement';
    else if (attainmentPct >= 80.0) diagnosis = 'Mastered';

    results.push({
      questionId,
      topic,
      coId,
      assessmentId,
      marksObtained: parseFloat(totalObtained.toFixed(1)),
      maxMarks: parseFloat(totalMax.toFixed(1)),
      attainmentPct,
      observationCount: records.length,
      diagnosis
    });
  });

  return rankWeakQuestions(results);
}

/**
 * Ranks topics ascending by attainment % (weakest first).
 */
export function rankWeakTopics(topics: TopicDiagnosisItem[]): TopicDiagnosisItem[] {
  return [...topics].sort((a, b) => {
    if (a.attainmentPct !== b.attainmentPct) {
      return a.attainmentPct - b.attainmentPct;
    }
    return (a.gapPct ?? 0) - (b.gapPct ?? 0);
  });
}

/**
 * Ranks questions ascending by attainment % (weakest first).
 */
export function rankWeakQuestions(questions: QuestionDiagnosisItem[]): QuestionDiagnosisItem[] {
  return [...questions].sort((a, b) => {
    if (a.attainmentPct !== b.attainmentPct) {
      return a.attainmentPct - b.attainmentPct;
    }
    return a.questionId.localeCompare(b.questionId, undefined, { numeric: true });
  });
}

/**
 * Generates deterministic evidence factors connecting measurable performance facts.
 */
export function generateEvidenceFactors(
  coEvidence: COEvidenceData,
  weakTopics: TopicDiagnosisItem[],
  weakQuestions: QuestionDiagnosisItem[],
  prediction: PredictionResult | null,
  riskAssessment: RiskAssessment | null
): EvidenceFactor[] {
  const factors: EvidenceFactor[] = [];

  // 1. Below Target
  if (coEvidence.historicalAttainment !== null) {
    if (coEvidence.configuredTarget === null) {
      factors.push({
        category: 'Below Target',
        severity: 'warning',
        actualValue: `${coEvidence.historicalAttainment.toFixed(1)}%`,
        referenceValue: 'Target reference unavailable',
        sourceLevel: 'CO',
        description: 'Institutional target unconfigured for this course and CO. Evaluated using prototype fallback diagnostic rule.'
      });
    } else if (coEvidence.historicalAttainment < coEvidence.configuredTarget) {
      factors.push({
        category: 'Below Target',
        severity: 'critical',
        actualValue: `${coEvidence.historicalAttainment.toFixed(1)}%`,
        referenceValue: `Target = ${coEvidence.configuredTarget.toFixed(1)}%`,
        sourceLevel: 'CO',
        description: `Historical attainment for ${coEvidence.coId} is below institutional target threshold.`
      });
    } else {
      factors.push({
        category: 'Below Target',
        severity: 'positive',
        actualValue: `${coEvidence.historicalAttainment.toFixed(1)}%`,
        referenceValue: `Target = ${coEvidence.configuredTarget.toFixed(1)}%`,
        sourceLevel: 'CO',
        description: `Historical attainment for ${coEvidence.coId} currently meets institutional target threshold.`
      });
    }
  }

  // 2. Large Attainment Gap
  if (coEvidence.attainmentGap !== null) {
    if (coEvidence.attainmentGap < -10.0) {
      factors.push({
        category: 'Large Attainment Gap',
        severity: 'critical',
        actualValue: `${coEvidence.attainmentGap.toFixed(1)}%`,
        referenceValue: 'Threshold = -10.0%',
        sourceLevel: 'CO',
        description: `Substantial historical deficit exceeds 10 percentage points below target.`
      });
    } else if (coEvidence.attainmentGap < 0.0) {
      factors.push({
        category: 'Large Attainment Gap',
        severity: 'warning',
        actualValue: `${coEvidence.attainmentGap.toFixed(1)}%`,
        referenceValue: 'Target Deficit',
        sourceLevel: 'CO',
        description: `Moderate negative gap relative to institutional target.`
      });
    }
  }

  // 3. Declining Trend
  const trend = riskAssessment?.features.performanceTrend || prediction?.features.performanceTrend;
  if (trend === 'Declining') {
    factors.push({
      category: 'Declining Trend',
      severity: 'critical',
      actualValue: 'Declining Trajectory',
      referenceValue: 'Stable Baseline',
      sourceLevel: 'Trend',
      description: 'Scores dropped progressively across successive historical assessments.'
    });
  } else if (trend === 'Improving') {
    factors.push({
      category: 'Declining Trend',
      severity: 'positive',
      actualValue: 'Improving Trajectory',
      referenceValue: 'Upward Trend',
      sourceLevel: 'Trend',
      description: 'Scores improved progressively across successive historical assessments.'
    });
  }

  // 4. Weak Topics
  const criticalTopics = weakTopics.filter(t => t.diagnosisCategory === 'Critical Weakness');
  const attentionTopics = weakTopics.filter(t => t.diagnosisCategory === 'Needs Attention');

  if (criticalTopics.length > 0) {
    factors.push({
      category: 'Weak Topic',
      severity: 'critical',
      actualValue: criticalTopics.map(t => `${t.topic} (${t.attainmentPct.toFixed(1)}%)`).join(', '),
      referenceValue: 'Target Threshold',
      sourceLevel: 'Topic',
      description: `Critical weakness identified in ${criticalTopics.length} topic(s) with attainment < 50.0%.`
    });
  } else if (attentionTopics.length > 0) {
    factors.push({
      category: 'Weak Topic',
      severity: 'warning',
      actualValue: attentionTopics.map(t => `${t.topic} (${t.attainmentPct.toFixed(1)}%)`).join(', '),
      referenceValue: 'Target Threshold',
      sourceLevel: 'Topic',
      description: `Topic(s) require instructional reinforcement below target.`
    });
  }

  // 5. Weak Questions
  const weakQs = weakQuestions.filter(q => q.attainmentPct < 50.0);
  if (weakQs.length > 0) {
    factors.push({
      category: 'Weak Question',
      severity: 'warning',
      actualValue: weakQs.slice(0, 3).map(q => `${q.questionId} (${q.attainmentPct.toFixed(1)}%)`).join(', '),
      referenceValue: 'Passing Threshold 50%',
      sourceLevel: 'Question',
      description: `${weakQs.length} question assessment response(s) demonstrated low attainment (< 50.0%).`
    });
  }

  // 6. Consistent Underperformance
  if (coEvidence.progression.length >= 2) {
    const allBelow = coEvidence.configuredTarget !== null &&
      coEvidence.progression.every(p => p.attainmentPct < coEvidence.configuredTarget!);
    if (allBelow) {
      factors.push({
        category: 'Consistent Underperformance',
        severity: 'critical',
        actualValue: coEvidence.progression.map(p => `${p.assessmentId}: ${p.attainmentPct.toFixed(1)}%`).join(' → '),
        referenceValue: `Target = ${coEvidence.configuredTarget}%`,
        sourceLevel: 'Data',
        description: 'Student underperformed target across all recorded historical assessment milestones.'
      });
    }
  }

  // 7. Limited Historical Evidence
  if (coEvidence.observationCount < 3 || coEvidence.progression.length <= 1) {
    factors.push({
      category: 'Limited Historical Evidence',
      severity: 'info',
      actualValue: `${coEvidence.observationCount} observations across ${coEvidence.progression.length} cycle(s)`,
      referenceValue: 'Standard Sample Size',
      sourceLevel: 'Data',
      description: 'Historical evidence is based on limited observation depth.'
    });
  }

  return factors;
}

/**
 * Builds deterministic natural language synthesis without LLM dependency.
 */
export function buildDiagnosisSummary(
  coEvidence: COEvidenceData,
  weakTopics: TopicDiagnosisItem[],
  weakQuestions: QuestionDiagnosisItem[],
  riskAssessment: RiskAssessment | null
): DiagnosisSummary {
  const targetAvailable = coEvidence.configuredTarget !== null;
  const targetStr = targetAvailable ? `${coEvidence.configuredTarget!.toFixed(1)}%` : 'Target reference unavailable';
  const histStr = coEvidence.historicalAttainment !== null ? `${coEvidence.historicalAttainment.toFixed(1)}%` : 'N/A';
  const gapStr = coEvidence.attainmentGap !== null
    ? `${coEvidence.attainmentGap > 0 ? '+' : ''}${coEvidence.attainmentGap.toFixed(1)} percentage points`
    : 'N/A';
  const trendStr = riskAssessment?.features.performanceTrend || 'Stable';

  let primaryDiagnosis = '';
  if (coEvidence.historicalAttainment === null) {
    primaryDiagnosis = `Insufficient historical evidence available to establish ${coEvidence.coId} baseline.`;
  } else if (!targetAvailable) {
    primaryDiagnosis = `${coEvidence.coId} attainment is ${histStr} (Target reference unavailable; evaluated under prototype diagnostic fallback rule). Performance trajectory is ${trendStr.toLowerCase()}.`;
  } else if (coEvidence.historicalAttainment < coEvidence.configuredTarget!) {
    primaryDiagnosis = `${coEvidence.coId} attainment (${histStr}) is below institutional target (${targetStr}) with a ${trendStr.toLowerCase()} trajectory.`;
  } else {
    primaryDiagnosis = `${coEvidence.coId} attainment (${histStr}) currently meets institutional target (${targetStr}) with a ${trendStr.toLowerCase()} trajectory.`;
  }

  const supportingEvidence: string[] = [];
  if (coEvidence.historicalAttainment !== null) {
    if (targetAvailable) {
      supportingEvidence.push(`Historical attainment is ${histStr} against a ${targetStr} institutional target (gap: ${gapStr}).`);
    } else {
      supportingEvidence.push(`Historical attainment is ${histStr}. Target reference unavailable — evaluated under prototype diagnostic fallback rule (70.0%).`);
    }
  }
  supportingEvidence.push(`Chronological performance trajectory across assessments is ${trendStr.toLowerCase()}.`);

  let priorityArea = 'General Reinforcement';
  if (weakTopics.length > 0) {
    const weakest = weakTopics[0];
    priorityArea = weakest.topic;
    const fallbackNote = !targetAvailable ? ' [Evaluated via prototype diagnostic rule]' : '';
    supportingEvidence.push(`Weakest contributing topic is "${weakest.topic}" at ${weakest.attainmentPct.toFixed(1)}% attainment (${weakest.diagnosisCategory})${fallbackNote}.`);
  }

  if (weakQuestions.length > 0) {
    const weakQs = weakQuestions.filter(q => q.attainmentPct < 50.0).slice(0, 2);
    if (weakQs.length > 0) {
      supportingEvidence.push(`Primary question-level deficits observed in ${weakQs.map(q => `${q.questionId} (${q.attainmentPct.toFixed(1)}%)`).join(' and ')}.`);
    }
  }

  // Narrative summary paragraph
  let narrativeSummary = '';
  if (weakTopics.length > 0) {
    const weakest = weakTopics[0];
    if (targetAvailable) {
      narrativeSummary = `${coEvidence.coId} is currently ${coEvidence.attainmentGap !== null && coEvidence.attainmentGap < 0 ? 'below' : 'at'} the configured institutional target. Historical attainment is ${histStr} against a ${targetStr} target, with a ${trendStr.toLowerCase()} assessment trend. The weakest contributing topic is ${weakest.topic} at ${weakest.attainmentPct.toFixed(1)}%, primarily associated with low-performing question responses.`;
    } else {
      narrativeSummary = `${coEvidence.coId} has Target reference unavailable. Historical attainment is ${histStr} with a ${trendStr.toLowerCase()} assessment trend. Evaluated under the prototype diagnostic fallback rule, the weakest contributing topic is ${weakest.topic} at ${weakest.attainmentPct.toFixed(1)}%, primarily associated with low-performing question responses.`;
    }
  } else {
    narrativeSummary = `${coEvidence.coId} baseline is established with historical attainment of ${histStr}. No critical topic weaknesses were identified under current historical observations.`;
  }

  return {
    primaryDiagnosis,
    supportingEvidence,
    priorityArea,
    narrativeSummary
  };
}

/**
 * Builds the complete explanation payload for a selected student.
 */
export function buildStudentExplanation(
  studentId: string,
  courseId: string,
  coId: string,
  predictionAssessment: string,
  records: StandardizedAssessmentRecord[],
  targetThreshold: number | null,
  prediction: PredictionResult | null,
  riskAssessment: RiskAssessment | null
): StudentExplanationPayload {
  // 1. Get historical evidence strictly preceding prediction horizon
  const { historicalRecords, historicalAssessments } = getHistoricalEvidenceBeforePrediction(
    records,
    courseId,
    predictionAssessment
  );

  // 2. Guard for insufficient data
  if (historicalAssessments.length === 0 || historicalRecords.length === 0) {
    const emptyCO: COEvidenceData = {
      coId,
      courseId,
      configuredTarget: targetThreshold,
      historicalAttainment: null,
      attainmentGap: null,
      questionCount: 0,
      topicCount: 0,
      observationCount: 0,
      progression: []
    };

    const emptySummary: DiagnosisSummary = {
      primaryDiagnosis: `Insufficient historical assessment data to diagnose ${coId} for student ${studentId}.`,
      supportingEvidence: [
        `Assessment horizon ${predictionAssessment} is an earliest baseline cycle.`,
        'No prior assessment records exist in the chronological sequence.'
      ],
      priorityArea: 'Baseline Data Collection',
      narrativeSummary: `Assessment ${predictionAssessment} represents the earliest assessment cycle. No preceding historical evidence is available to compute topic diagnosis or attribution factors.`
    };

    return {
      studentId,
      courseId,
      coId,
      predictionAssessment,
      riskLevel: riskAssessment?.riskLevel || 'INSUFFICIENT DATA',
      priorityScore: riskAssessment?.priorityScore ?? null,
      predictedProbability: prediction?.probabilityMeetingTarget ?? null,
      targetThreshold,
      historicalAttainment: null,
      attainmentGap: null,
      performanceTrend: 'Insufficient History',
      hasSufficientData: false,
      insufficientReason: `Assessment ${predictionAssessment} has zero preceding historical assessment cycles.`,
      coEvidence: emptyCO,
      topics: [],
      questions: [],
      evidenceFactors: [{
        category: 'Limited Historical Evidence',
        severity: 'info',
        actualValue: '0 historical cycles',
        referenceValue: 'At least 1 prior assessment',
        sourceLevel: 'Data',
        description: 'No prior assessment milestones exist before the selected horizon.'
      }],
      diagnosisSummary: emptySummary,
      historicalAssessmentsUsed: []
    };
  }

  // 3. Compute CO Evidence
  const coEvidence = calculateCOEvidence(
    studentId,
    courseId,
    coId,
    targetThreshold,
    historicalRecords,
    historicalAssessments
  );

  // 4. Compute Topic & Question Evidence
  const topics = calculateTopicEvidence(
    studentId,
    courseId,
    coId,
    targetThreshold,
    historicalRecords,
    historicalAssessments
  );

  const questions = calculateQuestionEvidence(
    studentId,
    courseId,
    coId,
    historicalRecords
  );

  // 5. Generate Evidence Factors & Diagnosis Summary
  const evidenceFactors = generateEvidenceFactors(
    coEvidence,
    topics,
    questions,
    prediction,
    riskAssessment
  );

  const diagnosisSummary = buildDiagnosisSummary(
    coEvidence,
    topics,
    questions,
    riskAssessment
  );

  return {
    studentId,
    courseId,
    coId,
    predictionAssessment,
    riskLevel: riskAssessment?.riskLevel || 'MEDIUM RISK',
    priorityScore: riskAssessment?.priorityScore ?? null,
    predictedProbability: prediction?.probabilityMeetingTarget ?? null,
    targetThreshold,
    historicalAttainment: coEvidence.historicalAttainment,
    attainmentGap: coEvidence.attainmentGap,
    performanceTrend: riskAssessment?.features.performanceTrend || prediction?.features.performanceTrend || 'Stable',
    hasSufficientData: true,
    insufficientReason: null,
    coEvidence,
    topics,
    questions,
    evidenceFactors,
    diagnosisSummary,
    historicalAssessmentsUsed: historicalAssessments
  };
}
