import {
  RawAssessmentRow,
  RawMappingRow,
  RawTargetRow,
  ValidationError,
  ValidationSummaryStats
} from '../types/dataTypes';

export const REQUIRED_ASSESSMENT_HEADERS = [
  'student_id',
  'course_id',
  'semester',
  'assessment_id',
  'assessment_type',
  'assessment_date',
  'question_id',
  'topic',
  'co_id',
  'marks_obtained',
  'max_marks'
];

export const REQUIRED_MAPPING_HEADERS = [
  'course_id',
  'question_id',
  'topic',
  'co_id'
];

export const REQUIRED_TARGET_HEADERS = [
  'course_id',
  'co_id',
  'target_attainment_percentage'
];

export interface FullValidationResult {
  errors: ValidationError[];
  summary: ValidationSummaryStats;
  canProceed: boolean;
}

/**
 * Validate assessment dataset, mapping dataset, target dataset, and cross-file relational integrity.
 */
export function validateDatasets(
  assessRows: RawAssessmentRow[],
  assessHeaders: string[],
  mappingRows: RawMappingRow[],
  mappingHeaders: string[],
  targetRows: RawTargetRow[],
  targetHeaders: string[],
  selectedCourseId?: string
): FullValidationResult {
  const errors: ValidationError[] = [];

  let missingRequiredValues = 0;
  let invalidMarks = 0;
  let duplicateRecords = 0;
  let missingTopicMappings = 0;
  let missingCOMappings = 0;
  let structuralErrors = 0;

  // 1. Structure Check: Assessment Headers
  const missingAssessHeaders = REQUIRED_ASSESSMENT_HEADERS.filter(
    h => !assessHeaders.map(hdr => hdr.toLowerCase().trim()).includes(h)
  );
  if (missingAssessHeaders.length > 0) {
    structuralErrors++;
    errors.push({
      id: `err-struct-assess`,
      file: 'assessment',
      severity: 'blocking',
      code: 'MISSING_COLUMNS',
      message: `Assessment CSV is missing required column(s): ${missingAssessHeaders.join(', ')}`
    });
  }

  // Structure Check: Mapping Headers
  const missingMapHeaders = REQUIRED_MAPPING_HEADERS.filter(
    h => !mappingHeaders.map(hdr => hdr.toLowerCase().trim()).includes(h)
  );
  if (missingMapHeaders.length > 0 && mappingHeaders.length > 0) {
    structuralErrors++;
    errors.push({
      id: `err-struct-map`,
      file: 'mapping',
      severity: 'blocking',
      code: 'MISSING_COLUMNS',
      message: `Question Mapping CSV is missing required column(s): ${missingMapHeaders.join(', ')}`
    });
  }

  // Structure Check: Target Headers
  const missingTargetHeaders = REQUIRED_TARGET_HEADERS.filter(
    h => !targetHeaders.map(hdr => hdr.toLowerCase().trim()).includes(h)
  );
  if (missingTargetHeaders.length > 0 && targetHeaders.length > 0) {
    structuralErrors++;
    errors.push({
      id: `err-struct-target`,
      file: 'target',
      severity: 'blocking',
      code: 'MISSING_COLUMNS',
      message: `CO Target Mapping CSV is missing required column(s): ${missingTargetHeaders.join(', ')}`
    });
  }

  // Build Mapping Lookup & check internal mapping conflicts
  // key: course_id|question_id
  const mappingLookup = new Map<string, { topic: string; co_id: string; rowNumber: number }>();
  const mappingSeen = new Map<string, { topic: string; co_id: string; rowNumber: number }>();

  mappingRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const cId = (row.course_id || '').trim().toUpperCase();
    const qId = (row.question_id || '').trim();
    const topic = (row.topic || '').trim();
    const coId = (row.co_id || '').trim().toUpperCase();

    if (!cId || !qId) {
      errors.push({
        id: `map-row-${rowNum}-empty-key`,
        file: 'mapping',
        rowNumber: rowNum,
        severity: 'blocking',
        code: 'EMPTY_REQUIRED_KEY',
        message: `Row ${rowNum}: course_id and question_id must not be empty.`
      });
      return;
    }

    const key = `${cId}|${qId}`;
    if (mappingSeen.has(key)) {
      const prev = mappingSeen.get(key)!;
      if (prev.topic !== topic || prev.co_id !== coId) {
        errors.push({
          id: `map-row-${rowNum}-conflict`,
          file: 'mapping',
          rowNumber: rowNum,
          field: 'question_id',
          severity: 'blocking',
          code: 'CONFLICTING_MAPPING',
          message: `Question ${qId} in course ${cId} has conflicting mappings: was (${prev.topic}, ${prev.co_id}) at row ${prev.rowNumber}, but re-defined as (${topic}, ${coId}) at row ${rowNum}.`
        });
      }
    } else {
      mappingSeen.set(key, { topic, co_id: coId, rowNumber: rowNum });
      mappingLookup.set(key, { topic, co_id: coId, rowNumber: rowNum });
    }
  });

  // Build Target Lookup: course_id|co_id -> target %
  const targetLookup = new Map<string, number>();
  targetRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const cId = (row.course_id || '').trim().toUpperCase();
    const coId = (row.co_id || '').trim().toUpperCase();
    const pctStr = (row.target_attainment_percentage || '').trim();

    if (!cId || !coId) {
      errors.push({
        id: `target-row-${rowNum}-empty`,
        file: 'target',
        rowNumber: rowNum,
        severity: 'blocking',
        code: 'EMPTY_TARGET_KEY',
        message: `Row ${rowNum}: course_id and co_id are required in CO Target Mapping.`
      });
      return;
    }

    const pct = parseFloat(pctStr);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      errors.push({
        id: `target-row-${rowNum}-invalid-val`,
        file: 'target',
        rowNumber: rowNum,
        field: 'target_attainment_percentage',
        severity: 'blocking',
        code: 'INVALID_TARGET_PERCENTAGE',
        message: `Row ${rowNum}: target_attainment_percentage '${pctStr}' must be a valid number between 0 and 100.`
      });
      return;
    }

    const key = `${cId}|${coId}`;
    targetLookup.set(key, pct);
  });

  // Track duplicates in assessment: student_id + assessment_id + question_id
  const assessCompositeKeys = new Set<string>();
  const distinctCourseCOsInAssessment = new Set<string>();

  // Validate each Assessment Row
  const invalidRowIndices = new Set<number>();

  assessRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    let isRowInvalid = false;

    // Filter by course if faculty selected a specific course
    const cId = (row.course_id || '').trim().toUpperCase();
    if (selectedCourseId && cId !== selectedCourseId.toUpperCase()) {
      return;
    }

    // Required non-empty fields
    const studentId = (row.student_id || '').trim();
    const semester = (row.semester || '').trim();
    const assessId = (row.assessment_id || '').trim();
    const assessType = (row.assessment_type || '').trim();
    const assessDate = (row.assessment_date || '').trim();
    const questionId = (row.question_id || '').trim(); // original identifier preserved
    const topic = (row.topic || '').trim();
    const coId = (row.co_id || '').trim().toUpperCase();
    const marksObtStr = (row.marks_obtained || '').trim();
    const maxMarksStr = (row.max_marks || '').trim();

    if (!studentId) {
      missingRequiredValues++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-student`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'student_id',
        severity: 'blocking',
        code: 'MISSING_STUDENT_ID',
        message: `Row ${rowNum}: student_id is required and cannot be empty.`
      });
    }

    if (!semester) {
      missingRequiredValues++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-semester`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'semester',
        severity: 'blocking',
        code: 'MISSING_SEMESTER',
        message: `Row ${rowNum}: semester is required and cannot be empty.`
      });
    }

    if (!assessType) {
      missingRequiredValues++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-assess-type`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'assessment_type',
        severity: 'blocking',
        code: 'MISSING_ASSESSMENT_TYPE',
        message: `Row ${rowNum}: assessment_type is required and cannot be empty.`
      });
    }

    if (!cId) {
      missingRequiredValues++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-course`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'course_id',
        severity: 'blocking',
        code: 'MISSING_COURSE_ID',
        message: `Row ${rowNum}: course_id is required and cannot be empty.`
      });
    }

    if (!assessId) {
      missingRequiredValues++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-assess-id`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'assessment_id',
        severity: 'blocking',
        code: 'MISSING_ASSESSMENT_ID',
        message: `Row ${rowNum}: assessment_id is required and cannot be empty.`
      });
    }

    if (!questionId) {
      missingRequiredValues++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-qid`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'question_id',
        severity: 'blocking',
        code: 'MISSING_QUESTION_ID',
        message: `Row ${rowNum}: question_id is required and cannot be empty.`
      });
    }

    if (!topic) {
      missingTopicMappings++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-topic`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'topic',
        severity: 'blocking',
        code: 'MISSING_TOPIC',
        message: `Row ${rowNum}: topic is required and cannot be empty.`
      });
    }

    // CO Format Validation: ^CO[1-9]\d*$
    if (!coId) {
      missingCOMappings++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-co-empty`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'co_id',
        severity: 'blocking',
        code: 'MISSING_CO_ID',
        message: `Row ${rowNum}: co_id is required and cannot be empty.`
      });
    } else if (!/^CO[1-9]\d*$/i.test(coId)) {
      missingCOMappings++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-co-format`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'co_id',
        severity: 'blocking',
        code: 'INVALID_CO_FORMAT',
        message: `Row ${rowNum}: co_id '${coId}' must follow the standard format (e.g. CO1, CO2, CO3).`
      });
    }

    // Marks numeric & boundaries
    const marksObt = parseFloat(marksObtStr);
    const maxMarks = parseFloat(maxMarksStr);

    if (marksObtStr === '' || isNaN(marksObt)) {
      invalidMarks++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-marks-obt-num`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'marks_obtained',
        severity: 'blocking',
        code: 'INVALID_MARKS_OBTAINED',
        message: `Row ${rowNum}: marks_obtained '${marksObtStr}' must be a valid number.`
      });
    } else if (marksObt < 0) {
      invalidMarks++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-marks-negative`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'marks_obtained',
        severity: 'blocking',
        code: 'NEGATIVE_MARKS',
        message: `Row ${rowNum}: marks_obtained cannot be negative (${marksObt}).`
      });
    }

    if (maxMarksStr === '' || isNaN(maxMarks)) {
      invalidMarks++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-max-marks-num`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'max_marks',
        severity: 'blocking',
        code: 'INVALID_MAX_MARKS',
        message: `Row ${rowNum}: max_marks '${maxMarksStr}' must be a valid number.`
      });
    } else if (maxMarks <= 0) {
      invalidMarks++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-max-marks-zero`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'max_marks',
        severity: 'blocking',
        code: 'ZERO_MAX_MARKS',
        message: `Row ${rowNum}: max_marks must be greater than zero (${maxMarks}).`
      });
    }

    if (!isNaN(marksObt) && !isNaN(maxMarks) && marksObt > maxMarks) {
      invalidMarks++;
      isRowInvalid = true;
      errors.push({
        id: `assess-${rowNum}-marks-exceed`,
        file: 'assessment',
        rowNumber: rowNum,
        field: 'marks_obtained',
        severity: 'blocking',
        code: 'MARKS_EXCEED_MAX',
        message: `Row ${rowNum}: marks_obtained (${marksObt}) cannot be greater than max_marks (${maxMarks}).`
      });
    }

    // Duplicate detection: student_id + assessment_id + question_id
    if (studentId && assessId && questionId) {
      const compositeKey = `${studentId}|${assessId}|${questionId}`;
      if (assessCompositeKeys.has(compositeKey)) {
        duplicateRecords++;
        isRowInvalid = true;
        errors.push({
          id: `assess-${rowNum}-dup`,
          file: 'assessment',
          rowNumber: rowNum,
          field: 'student_id',
          severity: 'blocking',
          code: 'DUPLICATE_RECORD',
          message: `Row ${rowNum}: Duplicate record found for Student '${studentId}', Assessment '${assessId}', Question '${questionId}'.`
        });
      } else {
        assessCompositeKeys.add(compositeKey);
      }
    }

    // Date validation (ISO YYYY-MM-DD)
    if (assessDate) {
      const parsedDate = Date.parse(assessDate);
      if (isNaN(parsedDate)) {
        errors.push({
          id: `assess-${rowNum}-date`,
          file: 'assessment',
          rowNumber: rowNum,
          field: 'assessment_date',
          severity: 'warning',
          code: 'INVALID_DATE',
          message: `Row ${rowNum}: assessment_date '${assessDate}' is not a standard date format (expected YYYY-MM-DD).`
        });
      }
    }

    // Cross-file checks for this assessment question
    if (cId && questionId && mappingRows.length > 0) {
      const mapKey = `${cId}|${questionId}`;
      const mapped = mappingLookup.get(mapKey);

      if (!mapped) {
        missingTopicMappings++;
        isRowInvalid = true;
        errors.push({
          id: `assess-${rowNum}-unmapped-q`,
          file: 'cross-file',
          rowNumber: rowNum,
          field: 'question_id',
          severity: 'blocking',
          code: 'UNMAPPED_QUESTION',
          message: `Row ${rowNum}: Question '${questionId}' for course '${cId}' exists in the assessment dataset but has no Question → Topic → CO mapping.`
        });
      } else {
        // Topic consistency check
        if (topic && mapped.topic.toLowerCase() !== topic.toLowerCase()) {
          errors.push({
            id: `assess-${rowNum}-topic-mismatch`,
            file: 'cross-file',
            rowNumber: rowNum,
            field: 'topic',
            severity: 'warning',
            code: 'TOPIC_MISMATCH',
            message: `Row ${rowNum}: Question '${questionId}' topic '${topic}' differs from mapped topic '${mapped.topic}'.`
          });
        }
        // CO consistency check
        if (coId && mapped.co_id.toUpperCase() !== coId) {
          isRowInvalid = true;
          errors.push({
            id: `assess-${rowNum}-co-mismatch`,
            file: 'cross-file',
            rowNumber: rowNum,
            field: 'co_id',
            severity: 'blocking',
            code: 'CO_MISMATCH',
            message: `Row ${rowNum}: Question '${questionId}' is tagged with '${coId}' in assessment, but mapped to '${mapped.co_id}' in Question Mapping.`
          });
        }
      }
    }

    // Record Course + CO combination for target cross-validation
    if (cId && coId) {
      distinctCourseCOsInAssessment.add(`${cId}|${coId}`);
    }

    if (isRowInvalid) {
      invalidRowIndices.add(idx);
    }
  });

  // Cross-File Target Attainment Check:
  // Every Course + CO in Assessment must have an institutional target defined in target mapping
  if (targetRows.length > 0) {
    distinctCourseCOsInAssessment.forEach(courseCOKey => {
      const [cId, coId] = courseCOKey.split('|');
      if (!targetLookup.has(courseCOKey)) {
        errors.push({
          id: `target-missing-${courseCOKey}`,
          file: 'cross-file',
          field: 'target_attainment_percentage',
          severity: 'blocking',
          code: 'MISSING_CO_TARGET',
          message: `Course '${cId}' + Outcome '${coId}' appears in assessment data, but has no configured target attainment percentage in CO Target Mapping.`
        });
      }
    });
  } else if (assessRows.length > 0) {
    errors.push({
      id: `target-not-uploaded`,
      file: 'target',
      severity: 'blocking',
      code: 'TARGET_DATASET_MISSING',
      message: 'CO Target Mapping CSV is required to determine institutional attainment goals.'
    });
  }

  // Calculate high-level summary stats
  const totalRecords = assessRows.length;
  const invalidRecords = invalidRowIndices.size;
  const validRecords = Math.max(0, totalRecords - invalidRecords);
  const warningsCount = errors.filter(e => e.severity === 'warning').length;
  const blockingCount = errors.filter(e => e.severity === 'blocking').length;

  const summary: ValidationSummaryStats = {
    totalRecords,
    validRecords,
    invalidRecords,
    missingRequiredValues,
    invalidMarks,
    duplicateRecords,
    missingTopicMappings,
    missingCOMappings,
    structuralErrors,
    warnings: warningsCount
  };

  const canProceed =
    totalRecords > 0 &&
    mappingRows.length > 0 &&
    targetRows.length > 0 &&
    blockingCount === 0;

  return {
    errors,
    summary,
    canProceed
  };
}
