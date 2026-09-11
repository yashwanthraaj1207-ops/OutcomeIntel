import {
  StandardizedAssessmentRecord,
  TargetMappingDictionary,
  ChronologicalAssessmentInfo,
  HistoricalAssessmentScore,
  PredictionFeatures
} from '../types/dataTypes';

/**
 * Derives chronological sequence of assessments for a course based strictly on assessment_date.
 */
export function getChronologicalAssessments(
  records: StandardizedAssessmentRecord[],
  courseId: string
): ChronologicalAssessmentInfo[] {
  const dateMap = new Map<string, string>();

  records.forEach(r => {
    if (courseId !== 'ALL' && r.course_id.toUpperCase() !== courseId.toUpperCase()) {
      return;
    }
    const aId = r.assessment_id;
    if (!dateMap.has(aId)) {
      dateMap.set(aId, r.assessment_date);
    }
  });

  const sorted = Array.from(dateMap.entries()).sort((a, b) => {
    const dateA = new Date(a[1]).getTime();
    const dateB = new Date(b[1]).getTime();
    if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
      return dateA - dateB;
    }
    return a[0].localeCompare(b[0], undefined, { numeric: true });
  });

  return sorted.map(([assessmentId, date], sequenceIndex) => ({
    assessmentId,
    date,
    sequenceIndex
  }));
}

/**
 * Returns assessment IDs strictly preceding the target prediction assessment.
 */
export function getHistoricalAssessments(
  chronologicalList: ChronologicalAssessmentInfo[],
  targetAssessmentId: string
): string[] {
  const targetIndex = chronologicalList.findIndex(
    a => a.assessmentId.toUpperCase() === targetAssessmentId.toUpperCase()
  );

  if (targetIndex <= 0) {
    return []; // No historical predecessor
  }

  return chronologicalList.slice(0, targetIndex).map(a => a.assessmentId);
}

/**
 * Extracts student score (obtained, max, attainment %) in a specific assessment and CO.
 */
export function getStudentScoreInAssessment(
  records: StandardizedAssessmentRecord[],
  studentId: string,
  courseId: string,
  assessmentId: string,
  coId: string
): { marksObtained: number; maxMarks: number; attainmentPct: number; observationCount: number } | null {
  let obtained = 0;
  let max = 0;
  let count = 0;

  records.forEach(r => {
    if (
      r.student_id.toUpperCase() === studentId.toUpperCase() &&
      (courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase()) &&
      r.assessment_id.toUpperCase() === assessmentId.toUpperCase() &&
      r.co_id.toUpperCase() === coId.toUpperCase()
    ) {
      obtained += r.marks_obtained;
      max += r.max_marks;
      count++;
    }
  });

  if (count === 0 || max === 0) {
    return null;
  }

  return {
    marksObtained: Math.round(obtained * 10) / 10,
    maxMarks: max,
    attainmentPct: Math.round((obtained / max) * 10000) / 100,
    observationCount: count
  };
}

/**
 * Constructs factual features for a student strictly using data prior to targetAssessmentId.
 * Guarantees zero data leakage from target or future assessments.
 */
export function constructStudentFeatures(
  records: StandardizedAssessmentRecord[],
  studentId: string,
  courseId: string,
  coId: string,
  targetAssessmentId: string,
  chronologicalList: ChronologicalAssessmentInfo[],
  targetMap: TargetMappingDictionary
): PredictionFeatures | null {
  const historicalAssessments = getHistoricalAssessments(chronologicalList, targetAssessmentId);

  if (historicalAssessments.length === 0) {
    return null; // Insufficient history (e.g. predicting A1)
  }

  const targetKey = `${courseId.toUpperCase()}|${coId.toUpperCase()}`;
  const targetThreshold = targetMap[targetKey] ?? 70.0;

  const historicalScores: HistoricalAssessmentScore[] = [];
  let cumulativeObtained = 0;
  let cumulativeMax = 0;
  let totalObservations = 0;

  historicalAssessments.forEach(aId => {
    const score = getStudentScoreInAssessment(records, studentId, courseId, aId, coId);
    if (score) {
      historicalScores.push({
        assessmentId: aId,
        marksObtained: score.marksObtained,
        maxMarks: score.maxMarks,
        attainmentPct: score.attainmentPct
      });
      cumulativeObtained += score.marksObtained;
      cumulativeMax += score.maxMarks;
      totalObservations += score.observationCount;
    }
  });

  if (historicalScores.length === 0) {
    return null;
  }

  const rollingCOAttainment =
    cumulativeMax > 0
      ? Math.round((cumulativeObtained / cumulativeMax) * 10000) / 100
      : 0;

  const previousScoreObj = historicalScores[historicalScores.length - 1];
  const previousCOAttainment = previousScoreObj.attainmentPct;

  let trendDelta = 0;
  let performanceTrend: 'Improving' | 'Stable' | 'Declining' = 'Stable';

  if (historicalScores.length >= 2) {
    const secondLastScore = historicalScores[historicalScores.length - 2].attainmentPct;
    trendDelta = Math.round((previousCOAttainment - secondLastScore) * 100) / 100;
    if (trendDelta > 2.0) {
      performanceTrend = 'Improving';
    } else if (trendDelta < -2.0) {
      performanceTrend = 'Declining';
    } else {
      performanceTrend = 'Stable';
    }
  }

  const priorTargetMet = previousCOAttainment >= targetThreshold;

  // Calculate consistency standard deviation across historical assessment scores
  let scoreConsistencyStdDev = 0;
  if (historicalScores.length >= 2) {
    const mean = historicalScores.reduce((sum, s) => sum + s.attainmentPct, 0) / historicalScores.length;
    const variance =
      historicalScores.reduce((sum, s) => sum + Math.pow(s.attainmentPct - mean, 2), 0) /
      historicalScores.length;
    scoreConsistencyStdDev = Math.round(Math.sqrt(variance) * 100) / 100;
  }

  return {
    studentId,
    courseId,
    coId,
    predictionAssessment: targetAssessmentId,
    historicalAssessments,
    historicalAssessmentScores: historicalScores,
    rollingCOAttainment,
    previousCOAttainment,
    performanceTrend,
    trendDelta,
    priorTargetMet,
    historicalObservationsCount: totalObservations,
    priorAssessmentAttainment: previousCOAttainment,
    latestCOAttainment: previousCOAttainment,
    historicalMeanCOAttainment: rollingCOAttainment,
    scoreConsistencyStdDev
  };
}

/**
 * Returns strictly historical assessment records prior to targetAssessmentId.
 * Guarantees zero data leakage by discarding any record at or after the target horizon.
 */
export function getHistoricalRecordsBeforePrediction(
  records: StandardizedAssessmentRecord[],
  targetAssessmentId: string,
  chronologicalList: ChronologicalAssessmentInfo[]
): StandardizedAssessmentRecord[] {
  const historicalAssessments = new Set(getHistoricalAssessments(chronologicalList, targetAssessmentId));
  return records.filter(r => historicalAssessments.has(r.assessment_id.toUpperCase()));
}

/**
 * Constructs features for all distinct students enrolled in the course for a specific CO & target assessment.
 */
export function constructAllCohortFeatures(
  records: StandardizedAssessmentRecord[],
  courseId: string,
  coId: string,
  targetAssessmentId: string,
  chronologicalList: ChronologicalAssessmentInfo[],
  targetMap: TargetMappingDictionary
): PredictionFeatures[] {
  const students = new Set<string>();
  records.forEach(r => {
    if (courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase()) {
      students.add(r.student_id);
    }
  });

  const sortedStudents = Array.from(students).sort();
  const featuresList: PredictionFeatures[] = [];

  sortedStudents.forEach(sId => {
    const feat = constructStudentFeatures(
      records,
      sId,
      courseId,
      coId,
      targetAssessmentId,
      chronologicalList,
      targetMap
    );
    if (feat) {
      featuresList.push(feat);
    }
  });

  return featuresList;
}
