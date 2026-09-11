import {
  StandardizedAssessmentRecord,
  TargetMappingDictionary,
  CourseMetadata,
  InterventionRecord,
  StudentLearningProfile,
  CohortOutcomeSummary,
  ReportScopeFilters,
  COExecutiveSummaryItem,
  COProgressionCycleItem,
  TopicIntelligenceItem,
  StudentRiskReportItem,
  InterventionOutcomeReportItem,
  AcademicAttentionItem,
  DataQualityReportSummary,
  FullCOIntelligenceReport,
  COTargetStatus
} from '../types/dataTypes';

import { FullValidationResult } from './validationEngine';
import { evaluateCohortRisk } from './riskDetectionEngine';
import { getChronologicalAssessments } from './predictionFeatureEngine';
import { trainPredictionModel, generateCohortPredictions } from './coPredictionEngine';

/**
 * Helper to look up configured target threshold for a course and CO.
 */
export function getTargetThreshold(
  targetMap: TargetMappingDictionary,
  courseId: string,
  coId: string
): number | null {
  const k1 = `${courseId.toUpperCase()}__${coId.toUpperCase()}`;
  const k2 = `${courseId.toUpperCase()}|${coId.toUpperCase()}`;
  if (targetMap[k1] !== undefined) return targetMap[k1];
  if (targetMap[k2] !== undefined) return targetMap[k2];

  for (const k of Object.keys(targetMap)) {
    const parts = k.includes('__') ? k.split('__') : k.split('|');
    if (
      parts.length === 2 &&
      parts[0].toUpperCase() === courseId.toUpperCase() &&
      parts[1].toUpperCase() === coId.toUpperCase()
    ) {
      return targetMap[k];
    }
  }
  return null;
}

/**
 * Builds Course Outcome Executive Summary metrics.
 * Evaluates actual student attainment against institutional benchmark targets.
 */
export function buildCOExecutiveSummary(
  records: StandardizedAssessmentRecord[],
  courseId: string,
  targetMap: TargetMappingDictionary
): COExecutiveSummaryItem[] {
  // Filter by course if specified
  const filtered = records.filter(r => {
    if (courseId !== 'ALL' && r.course_id.toUpperCase() !== courseId.toUpperCase()) return false;
    return true;
  });

  // Group by CO
  const coGroups = new Map<string, StandardizedAssessmentRecord[]>();
  filtered.forEach(r => {
    const key = r.co_id.toUpperCase();
    if (!coGroups.has(key)) {
      coGroups.set(key, []);
    }
    coGroups.get(key)!.push(r);
  });

  // Also include any COs from targetMap that might not have records
  if (courseId !== 'ALL') {
    Object.keys(targetMap).forEach(key => {
      const parts = key.includes('__') ? key.split('__') : key.split('|');
      if (parts.length === 2 && parts[0].toUpperCase() === courseId.toUpperCase()) {
        const upperCO = parts[1].toUpperCase();
        if (!coGroups.has(upperCO)) {
          coGroups.set(upperCO, []);
        }
      }
    });
  }

  const results: COExecutiveSummaryItem[] = [];

  // Sort CO IDs naturally (CO1, CO2, CO3...)
  const sortedCOs = Array.from(coGroups.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  sortedCOs.forEach(coId => {
    const coRecords = coGroups.get(coId) || [];
    const effCourse = courseId !== 'ALL' ? courseId : (coRecords[0]?.course_id || 'ALL');
    const targetThreshold = getTargetThreshold(targetMap, effCourse, coId);

    if (coRecords.length === 0) {
      results.push({
        coId,
        courseId: effCourse,
        attainmentPct: null,
        targetThreshold,
        gapPct: null,
        status: targetThreshold !== null ? 'INSUFFICIENT DATA' : 'TARGET NOT CONFIGURED',
        totalStudents: 0,
        totalObservations: 0,
        uniqueTopicsCount: 0,
        uniqueAssessmentsCount: 0,
        topics: []
      });
      return;
    }

    let sumMarks = 0;
    let sumMax = 0;
    const students = new Set<string>();
    const topics = new Set<string>();
    const assessments = new Set<string>();

    coRecords.forEach(r => {
      sumMarks += r.marks_obtained;
      sumMax += r.max_marks;
      students.add(r.student_id);
      topics.add(r.topic);
      assessments.add(r.assessment_id);
    });

    const attainmentPct = sumMax > 0 ? Number(((sumMarks / sumMax) * 100).toFixed(1)) : null;
    let gapPct: number | null = null;
    let status: COTargetStatus = 'INSUFFICIENT DATA';

    if (attainmentPct === null) {
      status = 'INSUFFICIENT DATA';
    } else if (targetThreshold === null) {
      status = 'TARGET NOT CONFIGURED';
    } else {
      gapPct = Number((attainmentPct - targetThreshold).toFixed(1));
      status = attainmentPct >= targetThreshold ? 'TARGET MET' : 'BELOW TARGET';
    }

    results.push({
      coId,
      courseId: effCourse,
      attainmentPct,
      targetThreshold,
      gapPct,
      status,
      totalStudents: students.size,
      totalObservations: coRecords.length,
      uniqueTopicsCount: topics.size,
      uniqueAssessmentsCount: assessments.size,
      topics: Array.from(topics).sort()
    });
  });

  return results;
}

/**
 * Builds chronological CO Progression across actual assessment cycles.
 * Anti-fabrication: Never invents cycles; strictly groups existing records by assessment_id.
 */
export function buildCOProgression(
  records: StandardizedAssessmentRecord[],
  courseId: string
): COProgressionCycleItem[] {
  const filtered = records.filter(r => {
    if (courseId !== 'ALL' && r.course_id.toUpperCase() !== courseId.toUpperCase()) return false;
    return true;
  });

  const cycleMap = new Map<string, StandardizedAssessmentRecord[]>();
  filtered.forEach(r => {
    const aId = r.assessment_id;
    if (!cycleMap.has(aId)) {
      cycleMap.set(aId, []);
    }
    cycleMap.get(aId)!.push(r);
  });

  const cycleItems: COProgressionCycleItem[] = [];

  cycleMap.forEach((cycleRecords, assessmentId) => {
    const assessmentDate = cycleRecords[0]?.assessment_date || 'Unknown';
    const isReassessment = assessmentId.toUpperCase().startsWith('R') || assessmentId.toUpperCase().includes('RE');

    let totalMarks = 0;
    let totalMax = 0;
    const coTotals = new Map<string, { marks: number; max: number }>();

    cycleRecords.forEach(r => {
      totalMarks += r.marks_obtained;
      totalMax += r.max_marks;

      const co = r.co_id.toUpperCase();
      if (!coTotals.has(co)) {
        coTotals.set(co, { marks: 0, max: 0 });
      }
      const ct = coTotals.get(co)!;
      ct.marks += r.marks_obtained;
      ct.max += r.max_marks;
    });

    const overallAttainmentPct = totalMax > 0 ? Number(((totalMarks / totalMax) * 100).toFixed(1)) : null;

    const coAttainments: Record<string, number | null> = {};
    coTotals.forEach((val, co) => {
      coAttainments[co] = val.max > 0 ? Number(((val.marks / val.max) * 100).toFixed(1)) : null;
    });

    cycleItems.push({
      assessmentId,
      assessmentDate,
      isReassessment,
      coAttainments,
      overallAttainmentPct,
      observationCount: cycleRecords.length
    });
  });

  // Sort chronologically by assessmentDate, then by assessmentId
  cycleItems.sort((a, b) => {
    const dateA = new Date(a.assessmentDate).getTime();
    const dateB = new Date(b.assessmentDate).getTime();
    if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
      return dateA - dateB;
    }
    return a.assessmentId.localeCompare(b.assessmentId, undefined, { numeric: true });
  });

  return cycleItems;
}

/**
 * Builds Topic Intelligence records with diagnosis status, trends, and reassessment gains.
 */
export function buildTopicIntelligence(
  records: StandardizedAssessmentRecord[],
  courseId: string,
  targetMap: TargetMappingDictionary,
  reassessmentProfiles?: StudentLearningProfile[]
): TopicIntelligenceItem[] {
  const filtered = records.filter(r => {
    if (courseId !== 'ALL' && r.course_id.toUpperCase() !== courseId.toUpperCase()) return false;
    return true;
  });

  const topicMap = new Map<string, { records: StandardizedAssessmentRecord[]; coId: string; courseId: string }>();

  filtered.forEach(r => {
    const key = `${r.course_id}__${r.co_id}__${r.topic}`;
    if (!topicMap.has(key)) {
      topicMap.set(key, { records: [], coId: r.co_id, courseId: r.course_id });
    }
    topicMap.get(key)!.records.push(r);
  });

  const results: TopicIntelligenceItem[] = [];

  topicMap.forEach(({ records: tRecords, coId, courseId: cId }, _key) => {
    const topic = tRecords[0]?.topic || 'Unknown';
    let sumMarks = 0;
    let sumMax = 0;
    const qIds = new Set<string>();

    tRecords.forEach(r => {
      sumMarks += r.marks_obtained;
      sumMax += r.max_marks;
      qIds.add(r.question_id);
    });

    const attainmentPct = sumMax > 0 ? Number(((sumMarks / sumMax) * 100).toFixed(1)) : null;
    const targetThreshold = getTargetThreshold(targetMap, cId, coId);

    let gapPct: number | null = null;
    if (attainmentPct !== null && targetThreshold !== null) {
      gapPct = Number((attainmentPct - targetThreshold).toFixed(1));
    }

    let diagnosisStatus: 'Strong' | 'Satisfactory' | 'Needs Attention' | 'Critical Deficiency' = 'Needs Attention';
    if (attainmentPct === null) {
      diagnosisStatus = 'Needs Attention';
    } else if (attainmentPct >= 80) {
      diagnosisStatus = 'Strong';
    } else if (attainmentPct >= 60) {
      diagnosisStatus = 'Satisfactory';
    } else if (attainmentPct >= 40) {
      diagnosisStatus = 'Needs Attention';
    } else {
      diagnosisStatus = 'Critical Deficiency';
    }

    const assessGroups = new Map<string, { marks: number; max: number; date: string }>();
    tRecords.forEach(r => {
      if (!assessGroups.has(r.assessment_id)) {
        assessGroups.set(r.assessment_id, { marks: 0, max: 0, date: r.assessment_date });
      }
      const ag = assessGroups.get(r.assessment_id)!;
      ag.marks += r.marks_obtained;
      ag.max += r.max_marks;
    });

    const sortedAssess = Array.from(assessGroups.entries()).sort((a, b) => {
      const dateA = new Date(a[1].date).getTime();
      const dateB = new Date(b[1].date).getTime();
      if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) return dateA - dateB;
      return a[0].localeCompare(b[0], undefined, { numeric: true });
    });

    let historicalTrend: 'Improving' | 'Stable' | 'Declining' | 'Insufficient Data' = 'Insufficient Data';
    if (sortedAssess.length >= 2) {
      const first = sortedAssess[0][1];
      const last = sortedAssess[sortedAssess.length - 1][1];
      const firstPct = first.max > 0 ? (first.marks / first.max) * 100 : null;
      const lastPct = last.max > 0 ? (last.marks / last.max) * 100 : null;

      if (firstPct !== null && lastPct !== null) {
        const delta = lastPct - firstPct;
        if (delta >= 3) {
          historicalTrend = 'Improving';
        } else if (delta <= -3) {
          historicalTrend = 'Declining';
        } else {
          historicalTrend = 'Stable';
        }
      }
    } else if (sortedAssess.length === 1) {
      historicalTrend = 'Stable';
    }

    let reassessmentGainPp: number | null = null;
    let reassessmentStatus: 'Improved' | 'Unchanged' | 'Declined' | 'Pending Reassessment' = 'Pending Reassessment';

    if (reassessmentProfiles && reassessmentProfiles.length > 0) {
      const gains: number[] = [];
      reassessmentProfiles.forEach(p => {
        if (p.courseId.toUpperCase() === cId.toUpperCase() && p.coId.toUpperCase() === coId.toUpperCase()) {
          const match = p.topicComparisons.find(tc => tc.topic.toUpperCase() === topic.toUpperCase());
          if (match && match.absoluteGain !== null) {
            gains.push(match.absoluteGain);
          }
        }
      });

      if (gains.length > 0) {
        const avgGain = gains.reduce((sum, g) => sum + g, 0) / gains.length;
        reassessmentGainPp = Number(avgGain.toFixed(1));
        if (reassessmentGainPp > 0) {
          reassessmentStatus = 'Improved';
        } else if (reassessmentGainPp < 0) {
          reassessmentStatus = 'Declined';
        } else {
          reassessmentStatus = 'Unchanged';
        }
      }
    }

    results.push({
      topic,
      coId,
      courseId: cId,
      attainmentPct,
      targetThreshold,
      gapPct,
      diagnosisStatus,
      historicalTrend,
      reassessmentGainPp,
      reassessmentStatus,
      questionCount: qIds.size
    });
  });

  results.sort((a, b) => {
    const coCmp = a.coId.localeCompare(b.coId, undefined, { numeric: true });
    if (coCmp !== 0) return coCmp;
    return a.topic.localeCompare(b.topic);
  });

  return results;
}

/**
 * Builds Student Risk Summary by integrating Module 3 & Module 4 pipelines.
 */
export function buildStudentRiskSummary(
  records: StandardizedAssessmentRecord[],
  courseId: string,
  coId: string,
  predictionAssessment: string,
  targetMap: TargetMappingDictionary,
  approvedInterventions: InterventionRecord[],
  reassessmentProfiles?: StudentLearningProfile[]
): FullCOIntelligenceReport['studentRiskSummary'] {
  const targetThreshold = getTargetThreshold(targetMap, courseId, coId);

  // 1. Train prediction model
  const model = trainPredictionModel(records, courseId, targetMap);

  // 2. Generate cohort predictions
  const { predictions, hasHistoricalData } = generateCohortPredictions(
    records,
    courseId,
    coId,
    predictionAssessment,
    targetMap,
    model
  );

  // 3. Extract cohort student IDs
  const cohortStudentSet = new Set<string>();
  records.forEach(r => {
    if (courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase()) {
      cohortStudentSet.add(r.student_id);
    }
  });
  const allCohortStudentIds = Array.from(cohortStudentSet).sort();

  // 4. Run Module 4 risk evaluation
  const { assessments } = evaluateCohortRisk(
    predictions,
    allCohortStudentIds,
    courseId,
    coId,
    predictionAssessment,
    targetThreshold,
    hasHistoricalData
  );

  const approvedIds = new Set(approvedInterventions.map(i => i.studentId.toUpperCase()));
  const reassessedIds = new Set(
    (reassessmentProfiles || [])
      .filter(p => p.learningGains.postAttainment !== null)
      .map(p => p.studentId.toUpperCase())
  );

  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let insufficientCount = 0;

  const students: StudentRiskReportItem[] = assessments.map(re => {
    if (re.riskLevel === 'HIGH RISK') highCount++;
    else if (re.riskLevel === 'MEDIUM RISK') mediumCount++;
    else if (re.riskLevel === 'LOW RISK') lowCount++;
    else insufficientCount++;

    const sId = re.studentId;
    const isApproved = approvedIds.has(sId.toUpperCase());
    const isReassessed = reassessedIds.has(sId.toUpperCase());

    let primaryWeakness = 'None detected';
    if (re.features.performanceTrend === 'Declining') {
      primaryWeakness = 'Declining historical trajectory';
    } else if (re.features.attainmentGap !== null && re.features.attainmentGap < 0) {
      primaryWeakness = `Attainment deficit (${Math.abs(re.features.attainmentGap).toFixed(1)} pp)`;
    } else if (re.features.predictedProbability !== null && re.features.predictedProbability < 0.4) {
      primaryWeakness = `Low probability (${(re.features.predictedProbability * 100).toFixed(0)}%)`;
    }

    return {
      studentId: sId,
      courseId,
      coId,
      riskLevel: re.riskLevel === 'HIGH RISK' ? 'HIGH'
        : re.riskLevel === 'MEDIUM RISK' ? 'MEDIUM'
        : re.riskLevel === 'LOW RISK' ? 'LOW' : 'INSUFFICIENT',
      predictedProbability: re.features.predictedProbability !== null
        ? Number((re.features.predictedProbability * 100).toFixed(1))
        : null,
      predictionHorizon: predictionAssessment,
      historicalTrend: re.features.performanceTrend === 'Declining' ? 'Declining'
        : re.features.performanceTrend === 'Improving' ? 'Improving'
        : re.features.performanceTrend === 'Stable' ? 'Stable' : 'Insufficient Data',
      primaryWeakness,
      hasApprovedIntervention: isApproved,
      hasReassessmentOutcome: isReassessed
    };
  });

  const total = students.length;

  return {
    totalStudents: total,
    highRiskCount: highCount,
    highRiskPct: total > 0 ? Number(((highCount / total) * 100).toFixed(1)) : 0,
    mediumRiskCount: mediumCount,
    mediumRiskPct: total > 0 ? Number(((mediumCount / total) * 100).toFixed(1)) : 0,
    lowRiskCount: lowCount,
    lowRiskPct: total > 0 ? Number(((lowCount / total) * 100).toFixed(1)) : 0,
    insufficientDataCount: insufficientCount,
    insufficientDataPct: total > 0 ? Number(((insufficientCount / total) * 100).toFixed(1)) : 0,
    students
  };
}

/**
 * Builds Intervention & Reassessment outcome tracking records.
 * Connects Module 6 faculty decisions with Module 7 evaluated gains.
 */
export function buildInterventionOutcomeSummary(
  approvedInterventions: InterventionRecord[],
  targetMap: TargetMappingDictionary,
  reassessmentProfiles?: StudentLearningProfile[]
): FullCOIntelligenceReport['interventionOutcomes'] {
  const profileMap = new Map<string, StudentLearningProfile>();
  (reassessmentProfiles || []).forEach(p => {
    profileMap.set(p.intervention.interventionId, p);
  });

  let reassessedCount = 0;
  let pendingCount = 0;

  const records: InterventionOutcomeReportItem[] = approvedInterventions.map(intv => {
    const profile = profileMap.get(intv.interventionId);
    const targetThreshold = getTargetThreshold(targetMap, intv.courseId, intv.coId);

    let preAttainmentPct: number | null = null;
    let postAttainmentPct: number | null = null;
    let absoluteGainPp: number | null = null;
    let targetAchieved = false;
    let effectivenessStatus: InterventionOutcomeReportItem['effectivenessStatus'] = 'PENDING REASSESSMENT';
    let reassessmentAssessmentId: string | null = null;

    if (profile && profile.learningGains.postAttainment !== null) {
      preAttainmentPct = profile.learningGains.preAttainment;
      postAttainmentPct = profile.learningGains.postAttainment;
      absoluteGainPp = profile.learningGains.absoluteGain;
      targetAchieved = targetThreshold !== null && postAttainmentPct !== null && postAttainmentPct >= targetThreshold;
      effectivenessStatus = profile.effectiveness;
      reassessmentAssessmentId = profile.reassessmentAssessmentId;
      reassessedCount++;
    } else {
      pendingCount++;
    }

    return {
      interventionId: intv.interventionId,
      studentId: intv.studentId,
      courseId: intv.courseId,
      coId: intv.coId,
      topic: intv.topic,
      riskLevel: 'HIGH',
      priority: intv.priority,
      interventionType: intv.interventionType,
      facultyNotes: intv.facultyNotes,
      preAttainmentPct,
      postAttainmentPct,
      absoluteGainPp,
      targetThreshold,
      targetAchieved,
      effectivenessStatus,
      reassessmentAssessmentId,
      approvedDate: intv.createdAt
    };
  });

  return {
    totalInterventions: approvedInterventions.length,
    approvedCount: approvedInterventions.length,
    reassessedCount,
    pendingCount,
    records
  };
}

/**
 * Builds Deterministic Academic Attention Items.
 * No speculative statements; every item points to an exact entity, deficit, or opportunity.
 */
export function buildAcademicAttentionItems(
  coSummary: COExecutiveSummaryItem[],
  topicIntel: TopicIntelligenceItem[],
  studentRisk: FullCOIntelligenceReport['studentRiskSummary'],
  interventionOutcomes: FullCOIntelligenceReport['interventionOutcomes'],
  _targetMap: TargetMappingDictionary
): AcademicAttentionItem[] {
  const items: AcademicAttentionItem[] = [];
  let idCounter = 1;

  // 1. Critical Attention: COs significantly below target (< -10 pp)
  coSummary.forEach(co => {
    if (co.status === 'BELOW TARGET' && co.gapPct !== null && co.gapPct <= -10) {
      items.push({
        id: `att-${idCounter++}`,
        category: 'CRITICAL',
        title: `Severe Attainment Deficit in ${co.coId}`,
        description: `Attainment for ${co.coId} (${co.attainmentPct?.toFixed(1)}%) is ${Math.abs(co.gapPct).toFixed(1)} percentage points below the institutional target (${co.targetThreshold}%).`,
        relatedEntity: co.coId,
        evidenceBasis: `Module 2 CO Analytics • Gap: ${co.gapPct.toFixed(1)} pp across ${co.totalStudents} students`,
        suggestedAction: `Initiate mandatory targeted remedial review for foundational topics in ${co.coId}.`
      });
    }
  });

  // 2. Critical Attention: High Risk Cohort Size > 20%
  if (studentRisk.totalStudents > 0 && studentRisk.highRiskPct >= 20) {
    items.push({
      id: `att-${idCounter++}`,
      category: 'CRITICAL',
      title: `High Cohort At-Risk Concentration (${studentRisk.highRiskPct.toFixed(1)}%)`,
      description: `${studentRisk.highRiskCount} out of ${studentRisk.totalStudents} students (${studentRisk.highRiskPct.toFixed(1)}%) are classified as High Risk based on predictive attainment trajectories.`,
      relatedEntity: 'Cohort Risk Distribution',
      evidenceBasis: `Module 4 Risk Engine • Probability < 40% or Deficit > 10 pp with Declining Trend`,
      suggestedAction: `Schedule immediate faculty-led small-group clinical tutorials before major assessments.`
    });
  }

  // 3. Critical Attention: Topics with Critical Deficiency (< 40%)
  topicIntel.forEach(topic => {
    if (topic.diagnosisStatus === 'Critical Deficiency' && topic.attainmentPct !== null) {
      items.push({
        id: `att-${idCounter++}`,
        category: 'CRITICAL',
        title: `Critical Concept Deficiency: ${topic.topic}`,
        description: `Average student attainment on "${topic.topic}" is ${topic.attainmentPct.toFixed(1)}% (Institutional target: ${topic.targetThreshold ?? 'N/A'}%).`,
        relatedEntity: `${topic.coId} • ${topic.topic}`,
        evidenceBasis: `Module 5 Topic Diagnosis • Average mark ratio: ${topic.attainmentPct.toFixed(1)}% over ${topic.questionCount} question items`,
        suggestedAction: `Deliver supplementary concept review sessions and concrete practice problem sets.`
      });
    }
  });

  // 4. Warning: Topics with Declining Trajectory
  topicIntel.forEach(topic => {
    if (topic.historicalTrend === 'Declining' && topic.diagnosisStatus !== 'Critical Deficiency') {
      items.push({
        id: `att-${idCounter++}`,
        category: 'WARNING',
        title: `Declining Performance Trend in ${topic.topic}`,
        description: `Student attainment trajectory on "${topic.topic}" has declined across sequential assessments by 3+ percentage points.`,
        relatedEntity: `${topic.coId} • ${topic.topic}`,
        evidenceBasis: `Module 5 Topic Diagnosis • Chronological assessment trend is Declining`,
        suggestedAction: `Reinforce concept integration in upcoming lectures prior to summative examination.`
      });
    }
  });

  // 5. Warning: Pending Reassessments
  if (interventionOutcomes.approvedCount > 0 && interventionOutcomes.pendingCount > 0) {
    items.push({
      id: `att-${idCounter++}`,
      category: 'WARNING',
      title: `${interventionOutcomes.pendingCount} Approved Interventions Awaiting Reassessment`,
      description: `Faculty approved ${interventionOutcomes.approvedCount} interventions; ${interventionOutcomes.pendingCount} have not yet undergone closed-loop reassessment verification.`,
      relatedEntity: 'Intervention Loop Closure',
      evidenceBasis: `Module 6 Approvals vs Module 7 Evaluation Log`,
      suggestedAction: `Administer scheduled post-intervention reassessment quizzes to document learning gains.`
    });
  }

  // 6. Opportunity: Strong Learning Gains Observed (> +10 pp)
  interventionOutcomes.records.forEach(rec => {
    if (rec.absoluteGainPp !== null && rec.absoluteGainPp >= 10) {
      items.push({
        id: `att-${idCounter++}`,
        category: 'OPPORTUNITY',
        title: `Strong Learning Gain (+${rec.absoluteGainPp.toFixed(1)} pp) for Student ${rec.studentId}`,
        description: `Post-intervention attainment increased from ${rec.preAttainmentPct?.toFixed(1)}% to ${rec.postAttainmentPct?.toFixed(1)}% (+${rec.absoluteGainPp.toFixed(1)} percentage points) following ${rec.interventionType}.`,
        relatedEntity: `${rec.studentId} • ${rec.topic}`,
        evidenceBasis: `Module 7 Reassessment Verification (${rec.reassessmentAssessmentId || 'R1'})`,
        suggestedAction: `Institutionalize this intervention strategy as a recommended best practice for similar cohorts.`
      });
    }
  });

  // 7. Compliance / Governance: Unconfigured CO Targets
  coSummary.forEach(co => {
    if (co.status === 'TARGET NOT CONFIGURED') {
      items.push({
        id: `att-${idCounter++}`,
        category: 'COMPLIANCE',
        title: `Accreditation Target Missing for ${co.coId}`,
        description: `Institutional attainment target threshold is not defined in co_target_mapping.csv for ${co.coId}. Gap analysis cannot be performed.`,
        relatedEntity: co.coId,
        evidenceBasis: `Module 1 Target Mapping Dictionary`,
        suggestedAction: `Configure official institutional threshold percentage in target mapping repository.`
      });
    }
  });

  return items;
}

/**
 * Summarizes Module 1 Data Validation and dataset integrity.
 */
export function buildDataQualitySummary(
  validationResult: FullValidationResult,
  records: StandardizedAssessmentRecord[]
): DataQualityReportSummary {
  const summary = validationResult.summary;
  let validationStatus: DataQualityReportSummary['validationStatus'] = '100% Validated';

  if (!validationResult.canProceed) {
    validationStatus = 'Validation Blocked';
  } else if (summary.warnings > 0) {
    validationStatus = 'Warnings Present';
  }

  return {
    totalRecords: summary.totalRecords > 0 ? summary.totalRecords : records.length,
    validRecords: summary.validRecords > 0 ? summary.validRecords : records.length,
    invalidRecords: summary.invalidRecords,
    duplicateRecords: summary.duplicateRecords,
    structuralErrors: summary.structuralErrors,
    unmappedTopics: summary.missingTopicMappings,
    unmappedCOs: summary.missingCOMappings,
    canProceed: validationResult.canProceed,
    validationStatus
  };
}

/**
 * Consolidates all verified module outputs into a unified Course Outcome Intelligence Report.
 */
export function buildFinalCOReport(
  records: StandardizedAssessmentRecord[],
  targetMap: TargetMappingDictionary,
  courseMeta: CourseMetadata,
  filters: ReportScopeFilters,
  validationResult: FullValidationResult,
  approvedInterventions: InterventionRecord[],
  reassessmentProfiles?: StudentLearningProfile[],
  cohortOutcomeSummary?: CohortOutcomeSummary | null,
  isSyntheticData: boolean = false
): FullCOIntelligenceReport {
  const chronoAssessments = getChronologicalAssessments(records, filters.courseId);
  const predictionAssessment = chronoAssessments.length > 2
    ? chronoAssessments[chronoAssessments.length - 1].assessmentId
    : 'A3';

  // 1. Executive Summary
  const coExecutiveSummary = buildCOExecutiveSummary(records, filters.courseId, targetMap);

  // 2. Progression Timeline
  const coProgressionTimeline = buildCOProgression(records, filters.courseId);

  // 3. Topic Intelligence
  const topicIntelligence = buildTopicIntelligence(records, filters.courseId, targetMap, reassessmentProfiles);

  // 4. Student Risk Summary
  const studentRiskSummary = buildStudentRiskSummary(
    records,
    filters.courseId,
    filters.coId,
    predictionAssessment,
    targetMap,
    approvedInterventions,
    reassessmentProfiles
  );

  // 5. Intervention Outcomes
  const interventionOutcomes = buildInterventionOutcomeSummary(
    approvedInterventions,
    targetMap,
    reassessmentProfiles
  );

  // 6. Academic Attention Items
  const academicAttentionItems = buildAcademicAttentionItems(
    coExecutiveSummary,
    topicIntelligence,
    studentRiskSummary,
    interventionOutcomes,
    targetMap
  );

  // 7. Data Quality Audit
  const dataQuality = buildDataQualitySummary(validationResult, records);

  // 8. Traceability Stages
  const traceabilityStages = [
    {
      stageNumber: 1,
      stageName: 'Data Ingestion & Integrity',
      sourceModule: 'Module 1: Validation Engine',
      status: dataQuality.canProceed ? ('COMPLETE' as const) : ('PENDING' as const),
      summaryMetric: `${dataQuality.validRecords.toLocaleString()} validated rows (${dataQuality.validationStatus})`
    },
    {
      stageNumber: 2,
      stageName: 'Course Outcome Analytics',
      sourceModule: 'Module 2: CO Analytics Engine',
      status: coExecutiveSummary.length > 0 ? ('COMPLETE' as const) : ('PENDING' as const),
      summaryMetric: `${coExecutiveSummary.length} COs evaluated across cohort`
    },
    {
      stageNumber: 3,
      stageName: 'Conditional Prediction',
      sourceModule: 'Module 3: Bayesian Prediction Engine',
      status: 'COMPLETE' as const,
      summaryMetric: `Horizon [${predictionAssessment}] calibrated against target benchmarks`
    },
    {
      stageNumber: 4,
      stageName: 'Early-Warning Risk Detection',
      sourceModule: 'Module 4: Risk Detection Engine',
      status: 'COMPLETE' as const,
      summaryMetric: `${studentRiskSummary.highRiskCount} High Risk, ${studentRiskSummary.mediumRiskCount} Med Risk, ${studentRiskSummary.lowRiskCount} Low Risk`
    },
    {
      stageNumber: 5,
      stageName: 'Explainability & Topic Diagnosis',
      sourceModule: 'Module 5: Diagnosis Engine',
      status: topicIntelligence.length > 0 ? ('COMPLETE' as const) : ('PENDING' as const),
      summaryMetric: `${topicIntelligence.length} topics diagnosed with trend trajectory`
    },
    {
      stageNumber: 6,
      stageName: 'Instructional Intervention',
      sourceModule: 'Module 6: Intervention Engine',
      status: interventionOutcomes.approvedCount > 0 ? ('COMPLETE' as const) : ('PENDING' as const),
      summaryMetric: `${interventionOutcomes.approvedCount} faculty-approved intervention plans`
    },
    {
      stageNumber: 7,
      stageName: 'Reassessment & Learning Gain',
      sourceModule: 'Module 7: Closed-Loop Engine',
      status: (cohortOutcomeSummary && cohortOutcomeSummary.totalWithReassessment > 0) ? ('COMPLETE' as const) : ('PENDING' as const),
      summaryMetric: cohortOutcomeSummary?.meanAbsoluteLearningGain !== null && cohortOutcomeSummary?.meanAbsoluteLearningGain !== undefined
        ? `Mean absolute gain: ${cohortOutcomeSummary.meanAbsoluteLearningGain >= 0 ? '+' : ''}${cohortOutcomeSummary.meanAbsoluteLearningGain.toFixed(1)} pp`
        : 'Closed-loop reassessment pending'
    },
    {
      stageNumber: 8,
      stageName: 'CO Intelligence Report',
      sourceModule: 'Module 8: Decision Support',
      status: 'COMPLETE' as const,
      summaryMetric: 'Consolidated institutional intelligence report active'
    }
  ];

  return {
    reportId: `CO-REP-${courseMeta.courseId}-${new Date().toISOString().slice(0, 10)}`,
    generatedAt: new Date().toISOString(),
    isSyntheticData,
    courseMeta,
    filters,
    coExecutiveSummary,
    coProgressionTimeline,
    topicIntelligence,
    studentRiskSummary,
    interventionOutcomes,
    learningGainSummary: cohortOutcomeSummary || null,
    academicAttentionItems,
    dataQuality,
    traceabilityStages
  };
}

