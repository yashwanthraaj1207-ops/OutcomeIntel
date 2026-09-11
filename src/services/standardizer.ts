import {
  RawAssessmentRow,
  StandardizedAssessmentRecord,
  DatasetStats
} from '../types/dataTypes';

/**
 * Standardizes validated raw assessment rows without changing academic meaning.
 * - Trims whitespace
 * - Normalizes identifier casing (CO1, CS301)
 * - Strictly preserves original question IDs and student IDs (no zero-padding or reformatting)
 * - Safely parses numerical values
 */
export function standardizeAssessmentData(
  rawRows: RawAssessmentRow[]
): StandardizedAssessmentRecord[] {
  return rawRows.map((row, idx) => {
    const studentId = (row.student_id || '').trim(); // original identifier preserved
    const courseId = (row.course_id || '').trim().toUpperCase();
    const semester = parseInt((row.semester || '0').trim(), 10) || 0;
    const assessId = (row.assessment_id || '').trim();
    const assessType = (row.assessment_type || '').trim();
    const assessDate = (row.assessment_date || '').trim();
    const questionId = (row.question_id || '').trim(); // original question ID preserved
    const topic = (row.topic || '').trim();
    const coId = (row.co_id || '').trim().toUpperCase();
    const marksObtained = parseFloat((row.marks_obtained || '0').trim());
    const maxMarks = parseFloat((row.max_marks || '10').trim());

    const attStr = (row.attendance_percentage || '').trim();
    const assignStr = (row.assignment_score || '').trim();
    const labStr = (row.lab_score || '').trim();
    const cohort = (row.cohort || '').trim();

    return {
      rowNumber: idx + 2,
      student_id: studentId,
      course_id: courseId,
      semester,
      assessment_id: assessId,
      assessment_type: assessType,
      assessment_date: assessDate,
      question_id: questionId,
      topic,
      co_id: coId,
      marks_obtained: marksObtained,
      max_marks: maxMarks,
      attendance_percentage: attStr ? parseFloat(attStr) : undefined,
      assignment_score: assignStr ? parseFloat(assignStr) : undefined,
      lab_score: labStr ? parseFloat(labStr) : undefined,
      cohort: cohort || undefined
    };
  });
}

/**
 * Dynamically computes statistics from a list of standardized assessment records.
 * No hardcoded values.
 */
export function computeDatasetStats(records: StandardizedAssessmentRecord[]): DatasetStats {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      uniqueStudents: 0,
      uniqueCourses: [],
      uniqueAssessments: [],
      uniqueQuestions: 0,
      uniqueTopics: 0,
      uniqueCOs: [],
      averageMarksRatio: 0,
      cohort: 'N/A'
    };
  }

  const studentSet = new Set<string>();
  const courseSet = new Set<string>();
  const assessSet = new Set<string>();
  const questionSet = new Set<string>();
  const topicSet = new Set<string>();
  const coSet = new Set<string>();
  const cohortSet = new Set<string>();

  let totalObtained = 0;
  let totalMax = 0;

  records.forEach(r => {
    studentSet.add(r.student_id);
    courseSet.add(r.course_id);
    assessSet.add(r.assessment_id);
    questionSet.add(r.question_id);
    topicSet.add(r.topic);
    coSet.add(r.co_id);
    if (r.cohort) cohortSet.add(r.cohort);

    totalObtained += r.marks_obtained;
    totalMax += r.max_marks;
  });

  const avgRatio = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const cohortStr = cohortSet.size > 0 ? Array.from(cohortSet).join(', ') : '2026-Current';

  return {
    totalRecords: records.length,
    uniqueStudents: studentSet.size,
    uniqueCourses: Array.from(courseSet).sort(),
    uniqueAssessments: Array.from(assessSet).sort(),
    uniqueQuestions: questionSet.size,
    uniqueTopics: topicSet.size,
    uniqueCOs: Array.from(coSet).sort(),
    averageMarksRatio: Math.round(avgRatio * 10) / 10,
    cohort: cohortStr
  };
}
