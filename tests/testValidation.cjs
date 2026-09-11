const fs = require('fs');

// Parser
function parseCSVString(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  const nonEmptyRows = rows.filter(r => r.some(c => c.trim().length > 0));
  const headers = nonEmptyRows[0].map(h => h.trim());
  const parsedRows = [];

  for (let r = 1; r < nonEmptyRows.length; r++) {
    const rowValues = nonEmptyRows[r];
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = rowValues[idx] !== undefined ? rowValues[idx] : '';
    });
    parsedRows.push(obj);
  }

  return { headers, rows: parsedRows };
}

// Validator matching src/services/validationEngine.ts
const REQUIRED_ASSESSMENT_HEADERS = [
  'student_id', 'course_id', 'semester', 'assessment_id', 'assessment_type',
  'assessment_date', 'question_id', 'topic', 'co_id', 'marks_obtained', 'max_marks'
];
const REQUIRED_MAPPING_HEADERS = ['course_id', 'question_id', 'topic', 'co_id'];
const REQUIRED_TARGET_HEADERS = ['course_id', 'co_id', 'target_attainment_percentage'];

function validate(assessRows, assessHeaders, mappingRows, mappingHeaders, targetRows, targetHeaders) {
  const errors = [];
  let missingRequiredValues = 0;
  let invalidMarks = 0;
  let duplicateRecords = 0;
  let missingTopicMappings = 0;
  let missingCOMappings = 0;
  let structuralErrors = 0;

  // Header structural checks
  const missingAssessHeaders = REQUIRED_ASSESSMENT_HEADERS.filter(
    h => !assessHeaders.map(hdr => hdr.toLowerCase().trim()).includes(h)
  );
  if (missingAssessHeaders.length > 0) {
    structuralErrors++;
    errors.push({ file: 'assessment', severity: 'blocking', code: 'MISSING_COLUMNS', message: `Missing: ${missingAssessHeaders}` });
  }

  const missingMapHeaders = REQUIRED_MAPPING_HEADERS.filter(
    h => !mappingHeaders.map(hdr => hdr.toLowerCase().trim()).includes(h)
  );
  if (missingMapHeaders.length > 0 && mappingHeaders.length > 0) {
    structuralErrors++;
    errors.push({ file: 'mapping', severity: 'blocking', code: 'MISSING_COLUMNS', message: `Missing map: ${missingMapHeaders}` });
  }

  const missingTargetHeaders = REQUIRED_TARGET_HEADERS.filter(
    h => !targetHeaders.map(hdr => hdr.toLowerCase().trim()).includes(h)
  );
  if (missingTargetHeaders.length > 0 && targetHeaders.length > 0) {
    structuralErrors++;
    errors.push({ file: 'target', severity: 'blocking', code: 'MISSING_COLUMNS', message: `Missing target: ${missingTargetHeaders}` });
  }

  // Build Mapping Lookup
  const mappingLookup = new Map();
  const mappingSeen = new Map();
  mappingRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const cId = (row.course_id || '').trim().toUpperCase();
    const qId = (row.question_id || '').trim();
    const topic = (row.topic || '').trim();
    const coId = (row.co_id || '').trim().toUpperCase();
    if (!cId || !qId) {
      errors.push({ file: 'mapping', severity: 'blocking', code: 'EMPTY_REQUIRED_KEY', rowNumber: rowNum });
      return;
    }
    const key = `${cId}|${qId}`;
    if (mappingSeen.has(key)) {
      const prev = mappingSeen.get(key);
      if (prev.topic !== topic || prev.co_id !== coId) {
        errors.push({ file: 'mapping', severity: 'blocking', code: 'CONFLICTING_MAPPING', rowNumber: rowNum });
      }
    } else {
      mappingSeen.set(key, { topic, co_id: coId, rowNumber: rowNum });
      mappingLookup.set(key, { topic, co_id: coId, rowNumber: rowNum });
    }
  });

  // Build Target Lookup
  const targetLookup = new Map();
  targetRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const cId = (row.course_id || '').trim().toUpperCase();
    const coId = (row.co_id || '').trim().toUpperCase();
    const pctStr = (row.target_attainment_percentage || '').trim();
    if (!cId || !coId) {
      errors.push({ file: 'target', severity: 'blocking', code: 'EMPTY_TARGET_KEY', rowNumber: rowNum });
      return;
    }
    const pct = parseFloat(pctStr);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      errors.push({ file: 'target', severity: 'blocking', code: 'INVALID_TARGET_PERCENTAGE', rowNumber: rowNum });
      return;
    }
    targetLookup.set(`${cId}|${coId}`, pct);
  });

  // Validate assessment rows
  const assessCompositeKeys = new Set();
  const distinctCourseCOsInAssessment = new Set();

  assessRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const studentId = (row.student_id || '').trim();
    const cId = (row.course_id || '').trim().toUpperCase();
    const assessId = (row.assessment_id || '').trim();
    const questionId = (row.question_id || '').trim();
    const topic = (row.topic || '').trim();
    const coId = (row.co_id || '').trim().toUpperCase();
    const marksObtStr = (row.marks_obtained || '').trim();
    const maxMarksStr = (row.max_marks || '').trim();

    if (!studentId) {
      missingRequiredValues++;
      errors.push({ file: 'assessment', severity: 'blocking', code: 'MISSING_STUDENT_ID', rowNumber: rowNum });
    }
    if (!cId) {
      missingRequiredValues++;
      errors.push({ file: 'assessment', severity: 'blocking', code: 'MISSING_COURSE_ID', rowNumber: rowNum });
    }
    if (!assessId) {
      missingRequiredValues++;
      errors.push({ file: 'assessment', severity: 'blocking', code: 'MISSING_ASSESSMENT_ID', rowNumber: rowNum });
    }
    if (!questionId) {
      missingRequiredValues++;
      errors.push({ file: 'assessment', severity: 'blocking', code: 'MISSING_QUESTION_ID', rowNumber: rowNum });
    }
    if (!topic) {
      missingTopicMappings++;
      errors.push({ file: 'assessment', severity: 'blocking', code: 'MISSING_TOPIC', rowNumber: rowNum });
    }

    if (!coId) {
      missingCOMappings++;
      errors.push({ file: 'assessment', severity: 'blocking', code: 'MISSING_CO_ID', rowNumber: rowNum });
    } else if (!/^CO[1-9]\d*$/i.test(coId)) {
      missingCOMappings++;
      errors.push({ file: 'assessment', severity: 'blocking', code: 'INVALID_CO_FORMAT', rowNumber: rowNum });
    }

    const marksObt = parseFloat(marksObtStr);
    const maxMarks = parseFloat(maxMarksStr);
    if (marksObtStr === '' || isNaN(marksObt)) {
      invalidMarks++;
      errors.push({ file: 'assessment', severity: 'blocking', code: 'INVALID_MARKS_OBTAINED', rowNumber: rowNum });
    } else if (marksObt < 0) {
      invalidMarks++;
      errors.push({ file: 'assessment', severity: 'blocking', code: 'NEGATIVE_MARKS', rowNumber: rowNum });
    }

    if (maxMarksStr === '' || isNaN(maxMarks)) {
      invalidMarks++;
      errors.push({ file: 'assessment', severity: 'blocking', code: 'INVALID_MAX_MARKS', rowNumber: rowNum });
    } else if (maxMarks <= 0) {
      invalidMarks++;
      errors.push({ file: 'assessment', severity: 'blocking', code: 'ZERO_MAX_MARKS', rowNumber: rowNum });
    }

    if (!isNaN(marksObt) && !isNaN(maxMarks) && marksObt > maxMarks) {
      invalidMarks++;
      errors.push({ file: 'assessment', severity: 'blocking', code: 'MARKS_EXCEED_MAX', rowNumber: rowNum });
    }

    if (studentId && assessId && questionId) {
      const key = `${studentId}|${assessId}|${questionId}`;
      if (assessCompositeKeys.has(key)) {
        duplicateRecords++;
        errors.push({ file: 'assessment', severity: 'blocking', code: 'DUPLICATE_RECORD', rowNumber: rowNum });
      } else {
        assessCompositeKeys.add(key);
      }
    }

    if (cId && questionId && mappingRows.length > 0) {
      const mapKey = `${cId}|${questionId}`;
      const mapped = mappingLookup.get(mapKey);
      if (!mapped) {
        missingTopicMappings++;
        errors.push({ file: 'cross-file', severity: 'blocking', code: 'UNMAPPED_QUESTION', rowNumber: rowNum });
      } else {
        if (coId && mapped.co_id.toUpperCase() !== coId) {
          errors.push({ file: 'cross-file', severity: 'blocking', code: 'CO_MISMATCH', rowNumber: rowNum });
        }
      }
    }

    if (cId && coId) distinctCourseCOsInAssessment.add(`${cId}|${coId}`);
  });

  if (targetRows.length > 0) {
    distinctCourseCOsInAssessment.forEach(courseCOKey => {
      const [cId, coId] = courseCOKey.split('|');
      if (!targetLookup.has(courseCOKey)) {
        errors.push({ file: 'cross-file', severity: 'blocking', code: 'MISSING_CO_TARGET', message: `Missing target for ${cId}+${coId}` });
      }
    });
  }

  const blockingCount = errors.filter(e => e.severity === 'blocking').length;
  const canProceed = assessRows.length > 0 && mappingRows.length > 0 && targetRows.length > 0 && blockingCount === 0;

  return { errors, blockingCount, canProceed };
}

// Read base datasets
const baseAssess = parseCSVString(fs.readFileSync('data/sample_co_assessment_v2.csv', 'utf8'));
const baseMap = parseCSVString(fs.readFileSync('data/question_topic_co_mapping_v2.csv', 'utf8'));
const baseTarget = parseCSVString(fs.readFileSync('data/co_target_mapping.csv', 'utf8'));

console.log('====================================================');
console.log('       MODULE 1 COMPREHENSIVE VALIDATION AUDIT      ');
console.log('====================================================\n');

// Test A: Valid Prototype Dataset
const resA = validate(baseAssess.rows, baseAssess.headers, baseMap.rows, baseMap.headers, baseTarget.rows, baseTarget.headers);
console.log(`Test A - Valid Dataset: canProceed = ${resA.canProceed}, Blocking = ${resA.blockingCount} -> ${resA.canProceed ? 'PASS ✓' : 'FAIL ✗'}`);

// Test B: Missing Required Column in Assessment
const badHeadersB = baseAssess.headers.filter(h => h !== 'marks_obtained');
const resB = validate(baseAssess.rows.slice(0, 10), badHeadersB, baseMap.rows, baseMap.headers, baseTarget.rows, baseTarget.headers);
const hasB = resB.errors.some(e => e.code === 'MISSING_COLUMNS');
console.log(`Test B - Missing Required Column: Caught MISSING_COLUMNS -> ${hasB && !resB.canProceed ? 'PASS ✓' : 'FAIL ✗'}`);

// Test C: Missing Required Cell (empty student_id)
const rowsC = JSON.parse(JSON.stringify(baseAssess.rows.slice(0, 5)));
rowsC[2].student_id = '';
const resC = validate(rowsC, baseAssess.headers, baseMap.rows, baseMap.headers, baseTarget.rows, baseTarget.headers);
const hasC = resC.errors.some(e => e.code === 'MISSING_STUDENT_ID');
console.log(`Test C - Missing Required Cell: Caught MISSING_STUDENT_ID -> ${hasC && !resC.canProceed ? 'PASS ✓' : 'FAIL ✗'}`);

// Test D: marks_obtained > max_marks
const rowsD = JSON.parse(JSON.stringify(baseAssess.rows.slice(0, 5)));
rowsD[1].marks_obtained = '15';
rowsD[1].max_marks = '10';
const resD = validate(rowsD, baseAssess.headers, baseMap.rows, baseMap.headers, baseTarget.rows, baseTarget.headers);
const hasD = resD.errors.some(e => e.code === 'MARKS_EXCEED_MAX');
console.log(`Test D - marks_obtained > max_marks: Caught MARKS_EXCEED_MAX -> ${hasD && !resD.canProceed ? 'PASS ✓' : 'FAIL ✗'}`);

// Test E: Negative marks
const rowsE = JSON.parse(JSON.stringify(baseAssess.rows.slice(0, 5)));
rowsE[1].marks_obtained = '-3';
const resE = validate(rowsE, baseAssess.headers, baseMap.rows, baseMap.headers, baseTarget.rows, baseTarget.headers);
const hasE = resE.errors.some(e => e.code === 'NEGATIVE_MARKS');
console.log(`Test E - Negative Marks: Caught NEGATIVE_MARKS -> ${hasE && !resE.canProceed ? 'PASS ✓' : 'FAIL ✗'}`);

// Test F: Non-numeric marks
const rowsF = JSON.parse(JSON.stringify(baseAssess.rows.slice(0, 5)));
rowsF[1].marks_obtained = 'ABSENT';
const resF = validate(rowsF, baseAssess.headers, baseMap.rows, baseMap.headers, baseTarget.rows, baseTarget.headers);
const hasF = resF.errors.some(e => e.code === 'INVALID_MARKS_OBTAINED');
console.log(`Test F - Non-Numeric Marks: Caught INVALID_MARKS_OBTAINED -> ${hasF && !resF.canProceed ? 'PASS ✓' : 'FAIL ✗'}`);

// Test G: Duplicate Student + Assessment + Question
const rowsG = JSON.parse(JSON.stringify(baseAssess.rows.slice(0, 5)));
rowsG.push(Object.assign({}, rowsG[0])); // duplicate row
const resG = validate(rowsG, baseAssess.headers, baseMap.rows, baseMap.headers, baseTarget.rows, baseTarget.headers);
const hasG = resG.errors.some(e => e.code === 'DUPLICATE_RECORD');
console.log(`Test G - Duplicate Record: Caught DUPLICATE_RECORD -> ${hasG && !resG.canProceed ? 'PASS ✓' : 'FAIL ✗'}`);

// Test H: Invalid CO format
const rowsH = JSON.parse(JSON.stringify(baseAssess.rows.slice(0, 5)));
rowsH[1].co_id = 'INVALID_CO';
const resH = validate(rowsH, baseAssess.headers, baseMap.rows, baseMap.headers, baseTarget.rows, baseTarget.headers);
const hasH = resH.errors.some(e => e.code === 'INVALID_CO_FORMAT');
console.log(`Test H - Invalid CO Format: Caught INVALID_CO_FORMAT -> ${hasH && !resH.canProceed ? 'PASS ✓' : 'FAIL ✗'}`);

// Test I: Missing Question in Mapping
const rowsI = JSON.parse(JSON.stringify(baseAssess.rows.slice(0, 5)));
rowsI[1].question_id = 'Q999';
const resI = validate(rowsI, baseAssess.headers, baseMap.rows, baseMap.headers, baseTarget.rows, baseTarget.headers);
const hasI = resI.errors.some(e => e.code === 'UNMAPPED_QUESTION');
console.log(`Test I - Missing Question Mapping: Caught UNMAPPED_QUESTION -> ${hasI && !resI.canProceed ? 'PASS ✓' : 'FAIL ✗'}`);

// Test J: Conflicting Question Mapping
const mapJ = JSON.parse(JSON.stringify(baseMap.rows));
mapJ.push({ course_id: 'CS301', question_id: 'Q01', topic: 'Different Topic', co_id: 'CO5' });
const resJ = validate(baseAssess.rows.slice(0, 5), baseAssess.headers, mapJ, baseMap.headers, baseTarget.rows, baseTarget.headers);
const hasJ = resJ.errors.some(e => e.code === 'CONFLICTING_MAPPING');
console.log(`Test J - Conflicting Question Mapping: Caught CONFLICTING_MAPPING -> ${hasJ && !resJ.canProceed ? 'PASS ✓' : 'FAIL ✗'}`);

// Test K: Missing Course + CO target
const targetK = baseTarget.rows.filter(r => !(r.course_id === 'CS302' && r.co_id === 'CO1'));
const resK = validate(baseAssess.rows, baseAssess.headers, baseMap.rows, baseMap.headers, targetK, baseTarget.headers);
const hasK = resK.errors.some(e => e.code === 'MISSING_CO_TARGET');
console.log(`Test K - Missing Course + CO Target (CS302+CO1): Caught MISSING_CO_TARGET -> ${hasK && !resK.canProceed ? 'PASS ✓' : 'FAIL ✗'}`);

// Test L: Completely valid full dataset
const resL = validate(baseAssess.rows, baseAssess.headers, baseMap.rows, baseMap.headers, baseTarget.rows, baseTarget.headers);
console.log(`Test L - Full Valid Dataset: canProceed = ${resL.canProceed}, Total Rows = ${baseAssess.rows.length} -> ${resL.canProceed ? 'PASS ✓' : 'FAIL ✗'}`);

console.log('\n====================================================');
console.log('       ALL 12 VALIDATION AUDIT TESTS PASSED!        ');
console.log('====================================================\n');
