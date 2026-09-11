const fs = require('fs');
const path = require('path');

// 1. Basic CSV Parser
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').trim();
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = parts[idx] !== undefined ? parts[idx] : '';
    });
    rows.push(obj);
  }
  return { headers, rows };
}

// 2. Standardize Assessment Rows
function standardizeRecords(rawRows) {
  return rawRows.map((r, idx) => ({
    rowNumber: idx + 2,
    student_id: (r.student_id || '').trim().toUpperCase(),
    course_id: (r.course_id || '').trim().toUpperCase(),
    semester: parseInt((r.semester || '0').trim(), 10) || 0,
    assessment_id: (r.assessment_id || '').trim().toUpperCase(),
    assessment_type: (r.assessment_type || '').trim(),
    assessment_date: (r.assessment_date || '').trim(),
    question_id: (r.question_id || '').trim().toUpperCase(),
    topic: (r.topic || '').trim(),
    co_id: (r.co_id || '').trim().toUpperCase(),
    marks_obtained: parseFloat((r.marks_obtained || '0').trim()) || 0,
    max_marks: parseFloat((r.max_marks || '10').trim()) || 10
  }));
}

// 3. Replicate / Test the Pure Functions from coAnalyticsEngine.ts
function filterRecords(records, filters) {
  return records.filter(r => {
    if (filters.courseId !== 'ALL' && r.course_id.toUpperCase() !== filters.courseId.toUpperCase()) return false;
    if (filters.semester !== 'ALL' && r.semester.toString() !== filters.semester) return false;
    if (filters.assessmentId !== 'ALL' && r.assessment_id.toUpperCase() !== filters.assessmentId.toUpperCase()) return false;
    if (filters.coId !== 'ALL' && r.co_id.toUpperCase() !== filters.coId.toUpperCase()) return false;
    return true;
  });
}

function computeCourseSummary(filteredRecords, filters) {
  const students = new Set();
  const assessments = new Set();
  const questions = new Set();
  const topics = new Set();
  const cos = new Set();

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

function computeCOAttainmentSummary(filteredRecords, targetMap) {
  const groups = new Map();

  filteredRecords.forEach(r => {
    const key = `${r.course_id}|${r.co_id}`;
    let grp = groups.get(key);
    if (!grp) {
      grp = {
        courseId: r.course_id,
        coId: r.co_id,
        totalObtained: 0,
        totalMax: 0,
        observations: 0,
        questions: new Set(),
        topics: new Set(),
        studentScores: new Map()
      };
      groups.set(key, grp);
    }

    grp.totalObtained += r.marks_obtained;
    grp.totalMax += r.max_marks;
    grp.observations++;
    grp.questions.add(r.question_id);
    grp.topics.add(r.topic);

    let studentAcc = grp.studentScores.get(r.student_id);
    if (!studentAcc) {
      studentAcc = { obtained: 0, max: 0 };
      grp.studentScores.set(r.student_id, studentAcc);
    }
    studentAcc.obtained += r.marks_obtained;
    studentAcc.max += r.max_marks;
  });

  const result = [];
  groups.forEach(grp => {
    const attainmentPct = grp.totalMax > 0 ? (grp.totalObtained / grp.totalMax) * 100 : 0;
    const targetKey = `${grp.courseId.toUpperCase()}|${grp.coId.toUpperCase()}`;
    const targetVal = targetMap[targetKey];
    const targetConfigured = targetVal !== undefined && targetVal !== null && !isNaN(targetVal);
    const targetPct = targetConfigured ? targetVal : null;
    const gap = targetPct !== null ? attainmentPct - targetPct : null;

    let status = 'Target Not Configured';
    if (targetConfigured && targetPct !== null) {
      status = attainmentPct >= targetPct ? 'Target Met' : 'Below Target';
    }

    let targetMetCount = 0;
    const totalStudents = grp.studentScores.size;
    grp.studentScores.forEach(score => {
      const studentPct = score.max > 0 ? (score.obtained / score.max) * 100 : 0;
      if (targetPct !== null && studentPct >= targetPct) {
        targetMetCount++;
      }
    });
    const studentThresholdAttainmentPct = totalStudents > 0 ? (targetMetCount / totalStudents) * 100 : 0;

    result.push({
      coId: grp.coId,
      courseId: grp.courseId,
      attainmentPct: Math.round(attainmentPct * 100) / 100,
      targetPct,
      targetConfigured,
      gap: gap !== null ? Math.round(gap * 100) / 100 : null,
      status,
      contributingQuestionsCount: grp.questions.size,
      contributingTopicsCount: grp.topics.size,
      observationCount: grp.observations,
      studentThresholdAttainmentPct: Math.round(studentThresholdAttainmentPct * 100) / 100,
      studentsMeetingTarget: targetMetCount,
      totalStudents
    });
  });

  return result.sort((a, b) => {
    if (a.courseId !== b.courseId) return a.courseId.localeCompare(b.courseId);
    return a.coId.localeCompare(b.coId, undefined, { numeric: true });
  });
}

// 4. Test Suite Execution
console.log('====================================================');
console.log('MODULE 2 ANALYTICS ENGINE — VERIFICATION TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${message}`);
  } else {
    console.error(`  [FAIL] Test ${totalTests}: ${message}`);
    process.exitCode = 1;
  }
}

// Load real data
const assessData = parseCSV(path.join(__dirname, '../data/sample_co_assessment_v2.csv'));
const targetData = parseCSV(path.join(__dirname, '../data/co_target_mapping.csv'));
const standardized = standardizeRecords(assessData.rows);

const targetMap = {};
targetData.rows.forEach(r => {
  const cId = (r.course_id || '').trim().toUpperCase();
  const coId = (r.co_id || '').trim().toUpperCase();
  const val = parseFloat(r.target_attainment_percentage || '');
  if (cId && coId && !isNaN(val)) {
    targetMap[`${cId}|${coId}`] = val;
  }
});

// Test 1: Total records & Course filtering
console.log('--- Test Group 1: Dataset Partitioning & Course Scope Filtering ---');
assert(standardized.length === 9320, `Total standardized records is 9,320 (actual: ${standardized.length})`);
const cs301Records = filterRecords(standardized, { courseId: 'CS301', semester: 'ALL', assessmentId: 'ALL', coId: 'ALL' });
assert(cs301Records.length === 9000, `CS301 has exactly 9,000 records (actual: ${cs301Records.length})`);
const cs302Records = filterRecords(standardized, { courseId: 'CS302', semester: 'ALL', assessmentId: 'ALL', coId: 'ALL' });
assert(cs302Records.length === 320, `CS302 has exactly 320 records (actual: ${cs302Records.length})`);

// Test 2: Assessment & CO Filtering
console.log('\n--- Test Group 2: Sub-filter Scope (Assessment & CO) ---');
const cs301A1Records = filterRecords(standardized, { courseId: 'CS301', semester: 'ALL', assessmentId: 'A1', coId: 'ALL' });
assert(cs301A1Records.length === 3000, `CS301 A1 has exactly 3,000 records (actual: ${cs301A1Records.length})`);
const cs301CO1Records = filterRecords(standardized, { courseId: 'CS301', semester: 'ALL', assessmentId: 'ALL', coId: 'CO1' });
assert(cs301CO1Records.length === 1800, `CS301 CO1 has exactly 1,800 records (actual: ${cs301CO1Records.length})`);

// Test 3: Course Summary Metrics
console.log('\n--- Test Group 3: Course Summary Metrics ---');
const summaryCS301 = computeCourseSummary(cs301Records, { courseId: 'CS301', semester: 'ALL', assessmentId: 'ALL', coId: 'ALL' });
assert(summaryCS301.totalStudents === 150, `CS301 student count is 150 (actual: ${summaryCS301.totalStudents})`);
assert(summaryCS301.totalAssessments === 3, `CS301 assessments count is 3 (actual: ${summaryCS301.totalAssessments})`);
assert(summaryCS301.totalQuestions === 20, `CS301 questions count is 20 (actual: ${summaryCS301.totalQuestions})`);
assert(summaryCS301.totalTopics === 10, `CS301 topics count is 10 (actual: ${summaryCS301.totalTopics})`);
assert(summaryCS301.totalCOs === 5, `CS301 COs count is 5 (actual: ${summaryCS301.totalCOs})`);
assert(summaryCS301.overallAttainmentPct === 67.67, `CS301 overall attainment is 67.67% (actual: ${summaryCS301.overallAttainmentPct})`);

// Test 4: CO Attainment Overview & Threshold Attainment
console.log('\n--- Test Group 4: CO Attainment & Target Gap Logic ---');
const coAttainCS301 = computeCOAttainmentSummary(cs301Records, targetMap);
assert(coAttainCS301.length === 5, `CS301 has 5 CO attainment items (actual: ${coAttainCS301.length})`);

const co1 = coAttainCS301.find(c => c.coId === 'CO1');
assert(co1.attainmentPct === 72.27, `CS301 CO1 Mean Attainment is 72.27% (actual: ${co1.attainmentPct})`);
assert(co1.targetPct === 70, `CS301 CO1 Target is 70% (actual: ${co1.targetPct})`);
assert(co1.gap === 2.27, `CS301 CO1 Gap is +2.27% (actual: ${co1.gap})`);
assert(co1.status === 'Target Met', `CS301 CO1 Status is 'Target Met' (actual: ${co1.status})`);
assert(co1.studentsMeetingTarget === 88, `CS301 CO1 Students Meeting Target is 88/150 (actual: ${co1.studentsMeetingTarget})`);
assert(co1.studentThresholdAttainmentPct === 58.67, `CS301 CO1 Student Threshold Attainment is 58.67% (actual: ${co1.studentThresholdAttainmentPct})`);

const co3 = coAttainCS301.find(c => c.coId === 'CO3');
assert(co3.attainmentPct === 52.61, `CS301 CO3 Mean Attainment is 52.61% (actual: ${co3.attainmentPct})`);
assert(co3.gap === -17.39, `CS301 CO3 Gap is -17.39% (actual: ${co3.gap})`);
assert(co3.status === 'Below Target', `CS301 CO3 Status is 'Below Target' (lagging) (actual: ${co3.status})`);
assert(co3.studentsMeetingTarget === 10, `CS301 CO3 Students Meeting Target is 10/150 (actual: ${co3.studentsMeetingTarget})`);
assert(co3.studentThresholdAttainmentPct === 6.67, `CS301 CO3 Student Threshold Attainment is 6.67% (actual: ${co3.studentThresholdAttainmentPct})`);

// Test 5: CS302 Target & Attainment
console.log('\n--- Test Group 5: CS302 Target & Attainment ---');
const coAttainCS302 = computeCOAttainmentSummary(cs302Records, targetMap);
assert(coAttainCS302.length === 1, `CS302 has 1 CO attainment item (actual: ${coAttainCS302.length})`);
const cs302CO1 = coAttainCS302[0];
assert(cs302CO1.coId === 'CO1', `CS302 CO is CO1 (actual: ${cs302CO1.coId})`);
assert(cs302CO1.attainmentPct === 72.59, `CS302 CO1 Mean Attainment is 72.59% (actual: ${cs302CO1.attainmentPct})`);
assert(cs302CO1.status === 'Target Met', `CS302 CO1 Status is 'Target Met' (actual: ${cs302CO1.status})`);
assert(cs302CO1.studentsMeetingTarget === 22, `CS302 CO1 Students Meeting Target is 22/40 (actual: ${cs302CO1.studentsMeetingTarget})`);

// Test 6: Missing Target Graceful Handling
console.log('\n--- Test Group 6: Missing Target Graceful Handling ---');
const emptyTargetMap = {};
const unconfiguredAttain = computeCOAttainmentSummary(cs301Records, emptyTargetMap);
const unconfiguredCO1 = unconfiguredAttain.find(c => c.coId === 'CO1');
assert(unconfiguredCO1.status === 'Target Not Configured', `Missing target sets status to 'Target Not Configured' (actual: ${unconfiguredCO1.status})`);
assert(unconfiguredCO1.targetPct === null, `Missing target sets targetPct to null (actual: ${unconfiguredCO1.targetPct})`);
assert(unconfiguredCO1.gap === null, `Missing target sets gap to null (actual: ${unconfiguredCO1.gap})`);

console.log('\n====================================================');
console.log(`SUMMARY: ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('====================================================\n');
