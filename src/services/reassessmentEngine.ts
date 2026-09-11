import {
  StandardizedAssessmentRecord,
  InterventionRecord,
  LearningGainMetrics,
  COReassessmentComparison,
  TopicReassessmentComparison,
  QuestionReassessmentComparison,
  EffectivenessStatus,
  DataSufficiencyReport,
  StudentLearningProfile,
  CohortOutcomeSummary,
  Module8HandoverPayload
} from '../types/dataTypes';

/**
 * Identifies potential reassessment assessments for a course that occur
 * chronologically after a baseline assessment horizon.
 */
export function identifyReassessmentAssessment(
  records: StandardizedAssessmentRecord[],
  courseId: string,
  baselineAssessmentId: string
): Array<{ assessmentId: string; date: string; sequenceIndex: number }> {
  const dateMap = new Map<string, string>();
  records.forEach(r => {
    if (courseId !== 'ALL' && r.course_id.toUpperCase() !== courseId.toUpperCase()) return;
    if (!dateMap.has(r.assessment_id)) {
      dateMap.set(r.assessment_id, r.assessment_date);
    }
  });

  const sorted = Array.from(dateMap.entries()).sort((a, b) => {
    const dateA = new Date(a[1]).getTime();
    const dateB = new Date(b[1]).getTime();
    if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) return dateA - dateB;
    return a[0].localeCompare(b[0], undefined, { numeric: true });
  });

  const baselineIdx = sorted.findIndex(
    item => item[0].toUpperCase() === baselineAssessmentId.toUpperCase()
  );

  // Return assessments strictly succeeding the baseline assessment
  const subsequent = baselineIdx >= 0 ? sorted.slice(baselineIdx + 1) : sorted;
  return subsequent.map(([assessmentId, date], sequenceIndex) => ({
    assessmentId,
    date,
    sequenceIndex
  }));
}

/**
 * Extracts pre-intervention evidence strictly prior to the reassessment date.
 * Anti-leakage: Excludes the reassessment assessment itself and any future records.
 */
export function getPreInterventionEvidence(
  records: StandardizedAssessmentRecord[],
  studentId: string,
  courseId: string,
  coId: string,
  reassessmentDate: string,
  reassessmentAssessmentId: string
): StandardizedAssessmentRecord[] {
  const reDateVal = new Date(reassessmentDate).getTime();

  return records.filter(r => {
    const sMatch = r.student_id.toUpperCase() === studentId.toUpperCase();
    const cMatch = courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase();
    const coMatch = r.co_id.toUpperCase() === coId.toUpperCase();
    const notReassessment = r.assessment_id.toUpperCase() !== reassessmentAssessmentId.toUpperCase();

    // Date check: must strictly precede the reassessment date
    const rDateVal = new Date(r.assessment_date).getTime();
    const precedesDate = !isNaN(reDateVal) && !isNaN(rDateVal) ? rDateVal < reDateVal : true;

    return sMatch && cMatch && coMatch && notReassessment && precedesDate;
  });
}

/**
 * Extracts post-intervention reassessment evidence for a specific reassessment cycle.
 * Anti-leakage: Isolates ONLY records belonging to the selected reassessment.
 */
export function getPostReassessmentEvidence(
  records: StandardizedAssessmentRecord[],
  studentId: string,
  courseId: string,
  coId: string,
  reassessmentAssessmentId: string
): StandardizedAssessmentRecord[] {
  return records.filter(r => {
    const sMatch = r.student_id.toUpperCase() === studentId.toUpperCase();
    const cMatch = courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase();
    const coMatch = r.co_id.toUpperCase() === coId.toUpperCase();
    const isReassessment = r.assessment_id.toUpperCase() === reassessmentAssessmentId.toUpperCase();
    return sMatch && cMatch && coMatch && isReassessment;
  });
}

/**
 * Computes deterministic attainment percentage from assessment records:
 * Attainment = (Total Marks Obtained / Total Max Marks) * 100
 */
export function calculateAttainment(records: StandardizedAssessmentRecord[]): number | null {
  if (!records || records.length === 0) return null;

  let totalObtained = 0;
  let totalMax = 0;

  for (const r of records) {
    totalObtained += r.marks_obtained;
    totalMax += r.max_marks;
  }

  if (totalMax <= 0) return null;
  const pct = (totalObtained / totalMax) * 100;
  return Math.round(pct * 100) / 100;
}

/**
 * Computes absolute learning gain in percentage points:
 * Absolute Learning Gain = Post Attainment - Pre Attainment
 */
export function calculateAbsoluteLearningGain(
  preAttainment: number | null,
  postAttainment: number | null
): number | null {
  if (preAttainment === null || postAttainment === null) return null;
  const diff = postAttainment - preAttainment;
  return Math.round(diff * 100) / 100;
}

/**
 * Computes relative improvement percentage:
 * Relative Improvement (%) = ((Post - Pre) / Pre) * 100
 * Strictly guarded: returns null if Pre <= 0.
 */
export function calculateRelativeImprovement(
  preAttainment: number | null,
  postAttainment: number | null
): number | null {
  if (preAttainment === null || postAttainment === null) return null;
  if (preAttainment <= 0) return null; // Avoid division by zero or invalid baseline

  const rel = ((postAttainment - preAttainment) / preAttainment) * 100;
  return Math.round(rel * 100) / 100;
}

/**
 * Computes institutional target gap:
 * Target Gap = Attainment - Target Threshold
 */
export function calculateTargetGap(
  attainment: number | null,
  targetThreshold: number | null
): number | null {
  if (attainment === null || targetThreshold === null) return null;
  const gap = attainment - targetThreshold;
  return Math.round(gap * 100) / 100;
}

/**
 * Computes target gap closure:
 * Target Gap Closure = Post Gap - Pre Gap
 * Positive value indicates the attainment deficit closed toward target.
 */
export function calculateTargetGapClosure(
  preGap: number | null,
  postGap: number | null
): number | null {
  if (preGap === null || postGap === null) return null;
  const closure = postGap - preGap;
  return Math.round(closure * 100) / 100;
}

/**
 * Classifies post-intervention effectiveness based on academic evidence.
 * Deterministic and mutually exclusive rules.
 */
export function classifyEffectiveness(
  preAttainment: number | null,
  postAttainment: number | null,
  targetThreshold: number | null,
  isSufficient: boolean
): EffectivenessStatus {
  if (!isSufficient || preAttainment === null || postAttainment === null) {
    return 'INSUFFICIENT DATA';
  }

  // 1. TARGET ACHIEVED: Post attainment meets or exceeds institutional benchmark
  if (targetThreshold !== null && postAttainment >= targetThreshold) {
    return 'TARGET ACHIEVED';
  }

  // If target threshold is null but post >= 70% prototype default benchmark
  if (targetThreshold === null && postAttainment >= 70.0) {
    return 'TARGET ACHIEVED';
  }

  // 2. POSITIVE GAIN: Post attainment strictly improved but below target
  if (postAttainment > preAttainment) {
    return 'POSITIVE GAIN';
  }

  // 3. NO MEASURABLE GAIN: Post attainment identical to pre attainment
  if (Math.abs(postAttainment - preAttainment) < 0.001) {
    return 'NO MEASURABLE GAIN';
  }

  // 4. NEGATIVE CHANGE: Post attainment lower than pre attainment
  if (postAttainment < preAttainment) {
    return 'NEGATIVE CHANGE';
  }

  return 'INSUFFICIENT DATA';
}

/**
 * Evaluates comprehensive data sufficiency for closed-loop evaluation.
 */
export function evaluateDataSufficiency(
  studentId: string,
  courseId: string,
  coId: string,
  approvedIntervention: InterventionRecord | undefined,
  targetThreshold: number | null,
  preRecords: StandardizedAssessmentRecord[],
  postRecords: StandardizedAssessmentRecord[],
  reassessmentDate: string
): DataSufficiencyReport {
  const missingDetails: string[] = [];

  const hasStudent = Boolean(studentId && studentId.trim().length > 0);
  if (!hasStudent) missingDetails.push('Student identifier not specified.');

  const hasCourse = Boolean(courseId && courseId.trim().length > 0);
  if (!hasCourse) missingDetails.push('Course identifier not specified.');

  const hasCO = Boolean(coId && coId.trim().length > 0);
  if (!hasCO) missingDetails.push('Course Outcome identifier not specified.');

  const hasApprovedIntervention = Boolean(
    approvedIntervention && approvedIntervention.status === 'Approved'
  );
  if (!hasApprovedIntervention) {
    missingDetails.push('No approved instructional intervention record found for this case.');
  }

  const hasTargetMapping = targetThreshold !== null;
  if (!hasTargetMapping) {
    missingDetails.push('Institutional CO target mapping is not configured.');
  }

  const hasPreInterventionEvidence = preRecords.length > 0;
  if (!hasPreInterventionEvidence) {
    missingDetails.push('Baseline pre-intervention assessment evidence is unavailable.');
  }

  const hasPostReassessmentEvidence = postRecords.length > 0;
  if (!hasPostReassessmentEvidence) {
    missingDetails.push('Post-intervention reassessment records have not been uploaded or loaded.');
  }

  // Chronology verification
  let isChronologicallyValid = true;
  if (hasPreInterventionEvidence && hasPostReassessmentEvidence) {
    const reDateVal = new Date(reassessmentDate).getTime();
    if (!isNaN(reDateVal)) {
      const anyPostDated = preRecords.some(r => {
        const d = new Date(r.assessment_date).getTime();
        return !isNaN(d) && d >= reDateVal;
      });
      if (anyPostDated) {
        isChronologicallyValid = false;
        missingDetails.push('Pre-intervention records contain dates on or after reassessment date.');
      }
    }
  }

  let status: 'SUFFICIENT' | 'PARTIAL' | 'INSUFFICIENT' = 'SUFFICIENT';

  if (!hasStudent || !hasCourse || !hasCO || !hasApprovedIntervention || !hasPostReassessmentEvidence) {
    status = 'INSUFFICIENT';
  } else if (!hasPreInterventionEvidence || !hasTargetMapping || !isChronologicallyValid) {
    status = 'PARTIAL';
  }

  return {
    status,
    hasStudent,
    hasCourse,
    hasCO,
    hasApprovedIntervention,
    hasTargetMapping,
    hasPreInterventionEvidence,
    hasPostReassessmentEvidence,
    isChronologicallyValid,
    missingDetails
  };
}

/**
 * Builds Course Outcome reassessment performance comparison.
 */
export function compareCOPerformance(
  preRecords: StandardizedAssessmentRecord[],
  postRecords: StandardizedAssessmentRecord[],
  coId: string,
  courseId: string,
  targetThreshold: number | null,
  isSufficient: boolean
): COReassessmentComparison {
  const preAttainment = calculateAttainment(preRecords);
  const postAttainment = calculateAttainment(postRecords);
  const absoluteGain = calculateAbsoluteLearningGain(preAttainment, postAttainment);
  const relativeImprovement = calculateRelativeImprovement(preAttainment, postAttainment);
  const preTargetGap = calculateTargetGap(preAttainment, targetThreshold);
  const postTargetGap = calculateTargetGap(postAttainment, targetThreshold);
  const targetGapClosure = calculateTargetGapClosure(preTargetGap, postTargetGap);
  const effectiveness = classifyEffectiveness(
    preAttainment,
    postAttainment,
    targetThreshold,
    isSufficient
  );

  return {
    coId,
    courseId,
    targetThreshold,
    preAttainment,
    postAttainment,
    absoluteGain,
    relativeImprovement,
    preTargetGap,
    postTargetGap,
    targetGapClosure,
    effectiveness,
    preObservationCount: preRecords.length,
    postObservationCount: postRecords.length
  };
}

/**
 * Compares topic-level performance before and after intervention.
 * Ranks topics by absolute learning gain (descending).
 */
export function compareTopicPerformance(
  preRecords: StandardizedAssessmentRecord[],
  postRecords: StandardizedAssessmentRecord[],
  coId: string,
  targetThreshold: number | null
): TopicReassessmentComparison[] {
  const topicSet = new Set<string>();
  preRecords.forEach(r => topicSet.add(r.topic));
  postRecords.forEach(r => topicSet.add(r.topic));

  const comparisons: TopicReassessmentComparison[] = [];

  topicSet.forEach(topic => {
    const preTRecords = preRecords.filter(r => r.topic.toUpperCase() === topic.toUpperCase());
    const postTRecords = postRecords.filter(r => r.topic.toUpperCase() === topic.toUpperCase());

    const preAtt = calculateAttainment(preTRecords);
    const postAtt = calculateAttainment(postTRecords);
    const gain = calculateAbsoluteLearningGain(preAtt, postAtt);
    const rel = calculateRelativeImprovement(preAtt, postAtt);

    let status: 'Improved' | 'Unchanged' | 'Declined' | 'Insufficient Data' = 'Insufficient Data';
    if (preAtt !== null && postAtt !== null) {
      if (postAtt > preAtt) status = 'Improved';
      else if (Math.abs(postAtt - preAtt) < 0.001) status = 'Unchanged';
      else status = 'Declined';
    }

    comparisons.push({
      topic,
      coId,
      targetThreshold,
      preAttainment: preAtt,
      postAttainment: postAtt,
      absoluteGain: gain,
      relativeImprovement: rel,
      status,
      preQuestionCount: preTRecords.length,
      postQuestionCount: postTRecords.length
    });
  });

  // Rank topics by absolute gain descending
  return comparisons.sort((a, b) => {
    const gA = a.absoluteGain !== null ? a.absoluteGain : -999;
    const gB = b.absoluteGain !== null ? b.absoluteGain : -999;
    return gB - gA;
  });
}

/**
 * Compares question items between baseline and reassessment.
 * Handles non-matching question IDs honestly.
 */
export function compareQuestionPerformance(
  preRecords: StandardizedAssessmentRecord[],
  postRecords: StandardizedAssessmentRecord[],
  coId: string
): { comparisons: QuestionReassessmentComparison[]; matchDirectly: boolean } {
  const preQMap = new Map<string, StandardizedAssessmentRecord[]>();
  preRecords.forEach(r => {
    if (!preQMap.has(r.question_id)) preQMap.set(r.question_id, []);
    preQMap.get(r.question_id)!.push(r);
  });

  const postQMap = new Map<string, StandardizedAssessmentRecord[]>();
  postRecords.forEach(r => {
    if (!postQMap.has(r.question_id)) postQMap.set(r.question_id, []);
    postQMap.get(r.question_id)!.push(r);
  });

  const allQIds = Array.from(new Set([...preQMap.keys(), ...postQMap.keys()])).sort();
  let matchingCount = 0;

  const comparisons: QuestionReassessmentComparison[] = allQIds.map(qId => {
    const preList = preQMap.get(qId) || [];
    const postList = postQMap.get(qId) || [];

    const topic = preList[0]?.topic || postList[0]?.topic || 'Topic Unknown';

    const preMarks = preList.length > 0 ? preList.reduce((acc, r) => acc + r.marks_obtained, 0) : null;
    const preMax = preList.length > 0 ? preList.reduce((acc, r) => acc + r.max_marks, 0) : null;
    const preAtt = preMarks !== null && preMax !== null && preMax > 0 ? Math.round((preMarks / preMax) * 1000) / 10 : null;

    const postMarks = postList.length > 0 ? postList.reduce((acc, r) => acc + r.marks_obtained, 0) : null;
    const postMax = postList.length > 0 ? postList.reduce((acc, r) => acc + r.max_marks, 0) : null;
    const postAtt = postMarks !== null && postMax !== null && postMax > 0 ? Math.round((postMarks / postMax) * 1000) / 10 : null;

    let status: 'Improved' | 'Unchanged' | 'Declined' | 'No Direct Match' | 'Insufficient Data' = 'No Direct Match';
    let gain: number | null = null;

    if (preAtt !== null && postAtt !== null) {
      matchingCount++;
      gain = Math.round((postAtt - preAtt) * 10) / 10;
      if (postAtt > preAtt) status = 'Improved';
      else if (Math.abs(postAtt - preAtt) < 0.001) status = 'Unchanged';
      else status = 'Declined';
    } else if (postAtt === null && preAtt !== null) {
      status = 'No Direct Match';
    } else if (preAtt === null && postAtt !== null) {
      status = 'No Direct Match';
    }

    return {
      questionId: qId,
      topic,
      coId,
      preMarks,
      preMaxMarks: preMax,
      preAttainmentPct: preAtt,
      postMarks,
      postMaxMarks: postMax,
      postAttainmentPct: postAtt,
      absoluteGainPct: gain,
      status
    };
  });

  const matchDirectly = matchingCount > 0;
  return { comparisons, matchDirectly };
}

/**
 * Builds complete student learning profile closing the intervention loop.
 */
export function buildStudentLearningProfile(
  studentId: string,
  courseId: string,
  coId: string,
  reassessmentAssessmentId: string,
  allRecords: StandardizedAssessmentRecord[],
  targetThreshold: number | null,
  approvedIntervention: InterventionRecord
): StudentLearningProfile {
  // Find reassessment date
  const reassessmentRow = allRecords.find(
    r => r.assessment_id.toUpperCase() === reassessmentAssessmentId.toUpperCase()
  );
  const reassessmentDate = reassessmentRow?.assessment_date || new Date().toISOString().slice(0, 10);

  const preRecords = getPreInterventionEvidence(
    allRecords,
    studentId,
    courseId,
    coId,
    reassessmentDate,
    reassessmentAssessmentId
  );

  const postRecords = getPostReassessmentEvidence(
    allRecords,
    studentId,
    courseId,
    coId,
    reassessmentAssessmentId
  );

  const sufficiency = evaluateDataSufficiency(
    studentId,
    courseId,
    coId,
    approvedIntervention,
    targetThreshold,
    preRecords,
    postRecords,
    reassessmentDate
  );

  const isSufficient = sufficiency.status !== 'INSUFFICIENT';

  const preAttainment = calculateAttainment(preRecords);
  const postAttainment = calculateAttainment(postRecords);
  const absoluteGain = calculateAbsoluteLearningGain(preAttainment, postAttainment);
  const relativeImprovement = calculateRelativeImprovement(preAttainment, postAttainment);
  const preTargetGap = calculateTargetGap(preAttainment, targetThreshold);
  const postTargetGap = calculateTargetGap(postAttainment, targetThreshold);
  const targetGapClosure = calculateTargetGapClosure(preTargetGap, postTargetGap);

  const learningGains: LearningGainMetrics = {
    preAttainment,
    postAttainment,
    absoluteGain,
    relativeImprovement,
    preTargetGap,
    postTargetGap,
    targetGapClosure
  };

  const effectiveness = classifyEffectiveness(
    preAttainment,
    postAttainment,
    targetThreshold,
    isSufficient
  );

  const coComparison = compareCOPerformance(
    preRecords,
    postRecords,
    coId,
    courseId,
    targetThreshold,
    isSufficient
  );

  const topicComparisons = compareTopicPerformance(
    preRecords,
    postRecords,
    coId,
    targetThreshold
  );

  const { comparisons: questionComparisons, matchDirectly: questionsMatchDirectly } =
    compareQuestionPerformance(preRecords, postRecords, coId);

  return {
    studentId,
    courseId,
    coId,
    intervention: approvedIntervention,
    targetThreshold,
    reassessmentAssessmentId,
    reassessmentDate,
    learningGains,
    effectiveness,
    sufficiency,
    coComparison,
    topicComparisons,
    questionComparisons,
    questionsMatchDirectly
  };
}

/**
 * Builds cohort outcome summary based on actual evaluated students.
 * Does not make causal claims.
 */
export function buildCohortOutcomeSummary(
  profiles: StudentLearningProfile[]
): CohortOutcomeSummary {
  const totalEvaluated = profiles.length;
  let withReassessment = 0;
  let targetAchieved = 0;
  let positiveGain = 0;
  let noMeasurableGain = 0;
  let negativeChange = 0;
  let insufficientData = 0;
  let sumGains = 0;
  let gainCount = 0;

  profiles.forEach(p => {
    if (p.learningGains.postAttainment !== null) {
      withReassessment++;
    }

    if (p.learningGains.absoluteGain !== null) {
      sumGains += p.learningGains.absoluteGain;
      gainCount++;
    }

    switch (p.effectiveness) {
      case 'TARGET ACHIEVED':
        targetAchieved++;
        break;
      case 'POSITIVE GAIN':
        positiveGain++;
        break;
      case 'NO MEASURABLE GAIN':
        noMeasurableGain++;
        break;
      case 'NEGATIVE CHANGE':
        negativeChange++;
        break;
      case 'INSUFFICIENT DATA':
      default:
        insufficientData++;
        break;
    }
  });

  const getPct = (cnt: number) => (totalEvaluated > 0 ? Math.round((cnt / totalEvaluated) * 1000) / 10 : 0);

  return {
    totalEvaluated,
    totalWithReassessment: withReassessment,
    targetAchievedCount: targetAchieved,
    targetAchievedPct: getPct(targetAchieved),
    positiveGainCount: positiveGain,
    positiveGainPct: getPct(positiveGain),
    noMeasurableGainCount: noMeasurableGain,
    noMeasurableGainPct: getPct(noMeasurableGain),
    negativeChangeCount: negativeChange,
    negativeChangePct: getPct(negativeChange),
    insufficientDataCount: insufficientData,
    insufficientDataPct: getPct(insufficientData),
    meanAbsoluteLearningGain: gainCount > 0 ? Math.round((sumGains / gainCount) * 100) / 100 : null
  };
}

/**
 * Prepares verified, auditable outcome payload for handover to Module 8.
 */
export function buildModule8HandoverPayload(
  profile: StudentLearningProfile
): Module8HandoverPayload {
  const targetAchieved =
    profile.learningGains.postAttainment !== null &&
    profile.targetThreshold !== null &&
    profile.learningGains.postAttainment >= profile.targetThreshold;

  return {
    handoverId: `m8-handover-${profile.studentId}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    studentId: profile.studentId,
    courseId: profile.courseId,
    coId: profile.coId,
    reassessmentAssessmentId: profile.reassessmentAssessmentId,
    approvedIntervention: profile.intervention,
    learningGains: profile.learningGains,
    targetThreshold: profile.targetThreshold,
    targetAchieved,
    effectivenessStatus: profile.effectiveness,
    dataSufficiency: profile.sufficiency.status,
    topicOutcomes: profile.topicComparisons,
    questionOutcomes: profile.questionComparisons,
    academicIntegrityDisclaimer:
      'Observed post-intervention performance only. Reflects actual assessment marks without speculative or causal claims.'
  };
}

