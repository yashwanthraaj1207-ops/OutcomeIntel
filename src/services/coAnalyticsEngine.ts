import {
  StandardizedAssessmentRecord,
  TargetMappingDictionary,
  AnalyticsFilters,
  COAttainmentItem,
  AssessmentBreakdownMatrix,
  AssessmentBreakdownRow,
  AssessmentBreakdownCell,
  TopicPerformanceItem,
  StudentAttainmentDistribution,
  StudentAttainmentBucket,
  QuestionPerformanceItem,
  CourseSummaryMetrics
} from '../types/dataTypes';

/**
 * Filter standardized records based on active analytics filters.
 */
export function filterRecords(
  records: StandardizedAssessmentRecord[],
  filters: AnalyticsFilters
): StandardizedAssessmentRecord[] {
  return records.filter(r => {
    if (filters.courseId !== 'ALL' && r.course_id.toUpperCase() !== filters.courseId.toUpperCase()) {
      return false;
    }
    if (filters.semester !== 'ALL' && r.semester.toString() !== filters.semester) {
      return false;
    }
    if (filters.assessmentId !== 'ALL' && r.assessment_id.toUpperCase() !== filters.assessmentId.toUpperCase()) {
      return false;
    }
    if (filters.coId !== 'ALL' && r.co_id.toUpperCase() !== filters.coId.toUpperCase()) {
      return false;
    }
    return true;
  });
}

/**
 * Dynamically derives available filter dropdown options from the dataset.
 */
export function getAvailableFilterOptions(records: StandardizedAssessmentRecord[]) {
  const courses = new Set<string>();
  const semesters = new Set<string>();
  const assessments = new Set<string>();
  const cos = new Set<string>();

  records.forEach(r => {
    courses.add(r.course_id);
    semesters.add(r.semester.toString());
    assessments.add(r.assessment_id);
    cos.add(r.co_id);
  });

  return {
    courses: Array.from(courses).sort(),
    semesters: Array.from(semesters).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)),
    assessments: Array.from(assessments).sort(),
    cos: Array.from(cos).sort()
  };
}

/**
 * Section 7: Course-level summary metrics.
 */
export function computeCourseSummary(
  filteredRecords: StandardizedAssessmentRecord[],
  filters: AnalyticsFilters
): CourseSummaryMetrics {
  const students = new Set<string>();
  const assessments = new Set<string>();
  const questions = new Set<string>();
  const topics = new Set<string>();
  const cos = new Set<string>();

  let totalObtained = 0;
  let totalMax = 0;

  filteredRecords.forEach(r => {
    students.add(r.student_id);
    assessments.add(r.assessment_id);
    questions.add(r.question_id);
    topics.add(r.topic);
    cos.add(r.co_id);

    totalObtained += r.marks_obtained;
    totalMax += r.max_marks;
  });

  const overallAttainmentPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

  return {
    selectedCourse: filters.courseId === 'ALL' ? 'All Courses' : filters.courseId,
    totalStudents: students.size,
    totalAssessments: assessments.size,
    totalQuestions: questions.size,
    totalTopics: topics.size,
    totalCOs: cos.size,
    totalObservations: filteredRecords.length,
    overallAttainmentPct: Math.round(overallAttainmentPct * 100) / 100
  };
}

/**
 * Section 2: Course Outcome Attainment Overview.
 * Calculates both:
 * 1. Mean Score Attainment: (SUM(marks_obtained) / SUM(max_marks)) * 100
 * 2. Student Threshold Attainment: % of students whose aggregated CO score >= target %
 */
export function computeCOAttainmentSummary(
  filteredRecords: StandardizedAssessmentRecord[],
  targetMap: TargetMappingDictionary
): COAttainmentItem[] {
  // Group by Course + CO
  const groups = new Map<
    string,
    {
      courseId: string;
      coId: string;
      totalObtained: number;
      totalMax: number;
      observations: number;
      questions: Set<string>;
      studentScores: Map<string, { obt: number; max: number }>;
    }
  >();

  filteredRecords.forEach(r => {
    const key = `${r.course_id.toUpperCase()}|${r.co_id.toUpperCase()}`;
    let item = groups.get(key);
    if (!item) {
      item = {
        courseId: r.course_id,
        coId: r.co_id,
        totalObtained: 0,
        totalMax: 0,
        observations: 0,
        questions: new Set<string>(),
        studentScores: new Map<string, { obt: number; max: number }>()
      };
      groups.set(key, item);
    }

    item.totalObtained += r.marks_obtained;
    item.totalMax += r.max_marks;
    item.observations++;
    item.questions.add(r.question_id);

    const sScore = item.studentScores.get(r.student_id) || { obt: 0, max: 0 };
    sScore.obt += r.marks_obtained;
    sScore.max += r.max_marks;
    item.studentScores.set(r.student_id, sScore);
  });

  const result: COAttainmentItem[] = [];

  groups.forEach((data, key) => {
    const attainmentPct = data.totalMax > 0 ? (data.totalObtained / data.totalMax) * 100 : 0;
    const targetVal = targetMap[key];
    const targetConfigured = targetVal !== undefined && targetVal !== null && !isNaN(targetVal);
    const targetPct = targetConfigured ? targetVal : null;

    let gapPct: number | null = null;
    let status: 'Target Met' | 'Below Target' | 'Target Not Configured' = 'Target Not Configured';

    if (targetConfigured && targetPct !== null) {
      gapPct = Math.round((attainmentPct - targetPct) * 100) / 100;
      status = attainmentPct >= targetPct ? 'Target Met' : 'Below Target';
    }

    // Student threshold attainment calculation
    let studentsMeetingTarget = 0;
    const totalStudents = data.studentScores.size;

    if (targetConfigured && targetPct !== null) {
      data.studentScores.forEach(score => {
        const studentPct = score.max > 0 ? (score.obt / score.max) * 100 : 0;
        if (studentPct >= targetPct) {
          studentsMeetingTarget++;
        }
      });
    }

    const studentThresholdAttainmentPct =
      totalStudents > 0 ? (studentsMeetingTarget / totalStudents) * 100 : 0;

    result.push({
      courseId: data.courseId,
      coId: data.coId,
      attainmentPct: Math.round(attainmentPct * 100) / 100,
      targetPct,
      targetConfigured,
      gapPct,
      status,
      questionCount: data.questions.size,
      observationCount: data.observations,
      totalMarksObtained: Math.round(data.totalObtained * 10) / 10,
      totalMaxMarks: data.totalMax,
      studentThresholdAttainmentPct: Math.round(studentThresholdAttainmentPct * 100) / 100,
      studentsMeetingTarget,
      totalStudents
    });
  });

  // Sort by Course, then CO identifier
  return result.sort((a, b) => {
    if (a.courseId !== b.courseId) return a.courseId.localeCompare(b.courseId);
    return a.coId.localeCompare(b.coId, undefined, { numeric: true });
  });
}

/**
 * Section 3: Assessment-wise Progression Breakdown.
 * Produces matrix of CO x Assessment attainment percentages.
 */
export function computeAssessmentBreakdown(
  filteredRecords: StandardizedAssessmentRecord[]
): AssessmentBreakdownMatrix {
  const assessmentSet = new Set<string>();
  const coMap = new Map<string, { courseId: string; coId: string }>();

  // Map: `${course_id}|${co_id}|${assessment_id}` -> { obt, max, count }
  const cellMap = new Map<string, { obt: number; max: number; count: number }>();

  filteredRecords.forEach(r => {
    assessmentSet.add(r.assessment_id);
    const coKey = `${r.course_id}|${r.co_id}`;
    if (!coMap.has(coKey)) {
      coMap.set(coKey, { courseId: r.course_id, coId: r.co_id });
    }

    const cellKey = `${coKey}|${r.assessment_id}`;
    const cell = cellMap.get(cellKey) || { obt: 0, max: 0, count: 0 };
    cell.obt += r.marks_obtained;
    cell.max += r.max_marks;
    cell.count++;
    cellMap.set(cellKey, cell);
  });

  const sortedAssessments = Array.from(assessmentSet).sort();
  const sortedCOs = Array.from(coMap.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const rows: AssessmentBreakdownRow[] = sortedCOs.map(coKey => {
    const { courseId, coId } = coMap.get(coKey)!;
    const assessmentScores: Record<string, AssessmentBreakdownCell | null> = {};

    sortedAssessments.forEach(assessId => {
      const cellKey = `${coKey}|${assessId}`;
      const cellData = cellMap.get(cellKey);
      if (cellData && cellData.max > 0) {
        const pct = (cellData.obt / cellData.max) * 100;
        assessmentScores[assessId] = {
          attainmentPct: Math.round(pct * 100) / 100,
          observations: cellData.count,
          marksObtained: Math.round(cellData.obt * 10) / 10,
          maxMarks: cellData.max
        };
      } else {
        assessmentScores[assessId] = null; // explicit null for "No data available"
      }
    });

    return {
      coId,
      courseId,
      assessmentScores
    };
  });

  return {
    assessments: sortedAssessments,
    cos: sortedCOs,
    rows
  };
}

/**
 * Section 4: Topic-Level Performance Breakdown.
 * Aggregates performance by Topic and linked CO.
 */
export function computeTopicPerformance(
  filteredRecords: StandardizedAssessmentRecord[],
  targetMap: TargetMappingDictionary
): TopicPerformanceItem[] {
  // key: `${course_id}|${topic}|${co_id}`
  const topicMap = new Map<
    string,
    {
      topic: string;
      coId: string;
      courseId: string;
      totalObtained: number;
      totalMax: number;
      observations: number;
      questions: Set<string>;
    }
  >();

  filteredRecords.forEach(r => {
    const key = `${r.course_id}|${r.topic}|${r.co_id}`;
    let item = topicMap.get(key);
    if (!item) {
      item = {
        topic: r.topic,
        coId: r.co_id,
        courseId: r.course_id,
        totalObtained: 0,
        totalMax: 0,
        observations: 0,
        questions: new Set<string>()
      };
      topicMap.set(key, item);
    }

    item.totalObtained += r.marks_obtained;
    item.totalMax += r.max_marks;
    item.observations++;
    item.questions.add(r.question_id);
  });

  const result: TopicPerformanceItem[] = [];

  topicMap.forEach(data => {
    const attainmentPct = data.totalMax > 0 ? (data.totalObtained / data.totalMax) * 100 : 0;
    const targetKey = `${data.courseId.toUpperCase()}|${data.coId.toUpperCase()}`;
    const targetVal = targetMap[targetKey];
    const targetConfigured = targetVal !== undefined && targetVal !== null && !isNaN(targetVal);
    const targetPct = targetConfigured ? targetVal : null;

    let gapPct: number | null = null;
    let status: 'Target Met' | 'Below Target' | 'Target Not Configured' = 'Target Not Configured';

    if (targetConfigured && targetPct !== null) {
      gapPct = Math.round((attainmentPct - targetPct) * 100) / 100;
      status = attainmentPct >= targetPct ? 'Target Met' : 'Below Target';
    }

    const avgMarks = data.observations > 0 ? data.totalObtained / data.observations : 0;
    const avgMaxMarks = data.observations > 0 ? data.totalMax / data.observations : 10;

    result.push({
      topic: data.topic,
      coId: data.coId,
      courseId: data.courseId,
      questionCount: data.questions.size,
      observationCount: data.observations,
      totalMarksObtained: Math.round(data.totalObtained * 10) / 10,
      totalMaxMarks: data.totalMax,
      averageMarks: Math.round(avgMarks * 100) / 100,
      maxMarks: Math.round(avgMaxMarks * 100) / 100,
      attainmentPct: Math.round(attainmentPct * 100) / 100,
      targetPct,
      targetConfigured,
      gapPct,
      status
    });
  });

  return result.sort((a, b) => {
    if (a.courseId !== b.courseId) return a.courseId.localeCompare(b.courseId);
    if (a.coId !== b.coId) return a.coId.localeCompare(b.coId, undefined, { numeric: true });
    return a.topic.localeCompare(b.topic);
  });
}

/**
 * Section 5: Student Attainment Distribution.
 * Aggregates student scores per CO and groups into performance buckets:
 * - Below 50%
 * - 50% to (Target - 1)%
 * - >= Target % (or >= 70% if target is 70)
 */
export function computeStudentDistribution(
  filteredRecords: StandardizedAssessmentRecord[],
  targetMap: TargetMappingDictionary
): StudentAttainmentDistribution[] {
  // key: `${course_id}|${co_id}` -> Map<student_id, { obt, max }>
  const coStudentScores = new Map<string, Map<string, { obt: number; max: number }>>();

  filteredRecords.forEach(r => {
    const key = `${r.course_id.toUpperCase()}|${r.co_id.toUpperCase()}`;
    let sMap = coStudentScores.get(key);
    if (!sMap) {
      sMap = new Map<string, { obt: number; max: number }>();
      coStudentScores.set(key, sMap);
    }

    const sc = sMap.get(r.student_id) || { obt: 0, max: 0 };
    sc.obt += r.marks_obtained;
    sc.max += r.max_marks;
    sMap.set(r.student_id, sc);
  });

  const result: StudentAttainmentDistribution[] = [];

  coStudentScores.forEach((sMap, key) => {
    const [courseId, coId] = key.split('|');
    const targetVal = targetMap[key];
    const targetConfigured = targetVal !== undefined && targetVal !== null && !isNaN(targetVal);
    const targetPct = targetConfigured ? targetVal : null;

    const threshold = targetPct !== null ? targetPct : 70; // fallback reference boundary if unconfigured

    let below50Count = 0;
    let midCount = 0;
    let targetMetCount = 0;
    const totalStudents = sMap.size;

    sMap.forEach(sc => {
      const pct = sc.max > 0 ? (sc.obt / sc.max) * 100 : 0;
      if (pct < 50) {
        below50Count++;
      } else if (pct < threshold) {
        midCount++;
      } else {
        targetMetCount++;
      }
    });

    const studentsBelowTarget = below50Count + midCount;
    const percentMeetingTarget = totalStudents > 0 ? Math.round((targetMetCount / totalStudents) * 1000) / 10 : 0;
    const percentBelowTarget = totalStudents > 0 ? Math.round((studentsBelowTarget / totalStudents) * 1000) / 10 : 0;

    const buckets: StudentAttainmentBucket[] = [
      {
        rangeLabel: 'Below 50%',
        studentCount: below50Count,
        percentage: totalStudents > 0 ? Math.round((below50Count / totalStudents) * 1000) / 10 : 0,
        isTargetMetBucket: false
      },
      {
        rangeLabel: `50% – ${Math.round(threshold - 1)}%`,
        studentCount: midCount,
        percentage: totalStudents > 0 ? Math.round((midCount / totalStudents) * 1000) / 10 : 0,
        isTargetMetBucket: false
      },
      {
        rangeLabel: `≥${threshold}% (Target)`,
        studentCount: targetMetCount,
        percentage: percentMeetingTarget,
        isTargetMetBucket: true
      }
    ];

    result.push({
      coId,
      courseId,
      targetPct,
      targetConfigured,
      totalStudents,
      studentsMeetingTarget: targetMetCount,
      studentsBelowTarget,
      percentMeetingTarget,
      percentBelowTarget,
      buckets
    });
  });

  return result.sort((a, b) => {
    if (a.courseId !== b.courseId) return a.courseId.localeCompare(b.courseId);
    return a.coId.localeCompare(b.coId, undefined, { numeric: true });
  });
}

/**
 * Section 6: Question Performance Matrix.
 * Question-level performance demonstrating Question -> Topic -> CO traceability.
 */
export function computeQuestionMatrix(
  filteredRecords: StandardizedAssessmentRecord[],
  targetMap: TargetMappingDictionary
): QuestionPerformanceItem[] {
  // key: `${course_id}|${assessment_id}|${question_id}`
  const qMap = new Map<
    string,
    {
      questionId: string;
      topic: string;
      coId: string;
      courseId: string;
      assessmentId: string;
      totalObtained: number;
      totalMax: number;
      observations: number;
    }
  >();

  filteredRecords.forEach(r => {
    const key = `${r.course_id}|${r.assessment_id}|${r.question_id}`;
    let item = qMap.get(key);
    if (!item) {
      item = {
        questionId: r.question_id,
        topic: r.topic,
        coId: r.co_id,
        courseId: r.course_id,
        assessmentId: r.assessment_id,
        totalObtained: 0,
        totalMax: 0,
        observations: 0
      };
      qMap.set(key, item);
    }

    item.totalObtained += r.marks_obtained;
    item.totalMax += r.max_marks;
    item.observations++;
  });

  const result: QuestionPerformanceItem[] = [];

  qMap.forEach(data => {
    const attainmentPct = data.totalMax > 0 ? (data.totalObtained / data.totalMax) * 100 : 0;
    const targetKey = `${data.courseId.toUpperCase()}|${data.coId.toUpperCase()}`;
    const targetVal = targetMap[targetKey];
    const targetConfigured = targetVal !== undefined && targetVal !== null && !isNaN(targetVal);
    const targetPct = targetConfigured ? targetVal : null;

    let status: 'Target Met' | 'Below Target' | 'Target Not Configured' = 'Target Not Configured';
    if (targetConfigured && targetPct !== null) {
      status = attainmentPct >= targetPct ? 'Target Met' : 'Below Target';
    }

    const avgMarks = data.observations > 0 ? data.totalObtained / data.observations : 0;
    const avgMaxMarks = data.observations > 0 ? data.totalMax / data.observations : 10;

    result.push({
      questionId: data.questionId,
      topic: data.topic,
      coId: data.coId,
      courseId: data.courseId,
      assessmentId: data.assessmentId,
      totalMarksObtained: Math.round(data.totalObtained * 10) / 10,
      totalMaxMarks: data.totalMax,
      averageMarks: Math.round(avgMarks * 100) / 100,
      maxMarks: Math.round(avgMaxMarks * 100) / 100,
      attainmentPct: Math.round(attainmentPct * 100) / 100,
      observationCount: data.observations,
      targetPct,
      status
    });
  });

  return result.sort((a, b) => {
    if (a.courseId !== b.courseId) return a.courseId.localeCompare(b.courseId);
    if (a.assessmentId !== b.assessmentId) return a.assessmentId.localeCompare(b.assessmentId);
    return a.questionId.localeCompare(b.questionId, undefined, { numeric: true });
  });
}
