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

// 2. Standardize Assessment Records
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

// 3. Chronology & History
function getChronologicalAssessments(records, courseId) {
  const dateMap = new Map();
  records.forEach(r => {
    if (courseId !== 'ALL' && r.course_id.toUpperCase() !== courseId.toUpperCase()) return;
    if (!dateMap.has(r.assessment_id)) dateMap.set(r.assessment_id, r.assessment_date);
  });
  const sorted = Array.from(dateMap.entries()).sort((a, b) => {
    const dateA = new Date(a[1]).getTime();
    const dateB = new Date(b[1]).getTime();
    if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) return dateA - dateB;
    return a[0].localeCompare(b[0], undefined, { numeric: true });
  });
  return sorted.map(([assessmentId, date], sequenceIndex) => ({ assessmentId, date, sequenceIndex }));
}

function getHistoricalAssessments(chronologicalList, targetAssessmentId) {
  const idx = chronologicalList.findIndex(a => a.assessmentId.toUpperCase() === targetAssessmentId.toUpperCase());
  if (idx <= 0) return [];
  return chronologicalList.slice(0, idx).map(a => a.assessmentId);
}

// 4. Pure Explainability Functions Replicated from explainabilityEngine.ts
function getHistoricalEvidenceBeforePrediction(records, courseId, predictionAssessment) {
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

function classifyTopicDiagnosis(attainmentPct, targetPct) {
  if (attainmentPct < 50.0) return 'Critical Weakness';
  const effectiveTarget = targetPct !== null ? targetPct : 70.0;
  if (attainmentPct < effectiveTarget) return 'Needs Attention';
  if (attainmentPct < 80.0) return 'Adequate';
  return 'Strong';
}

function calculateCOEvidence(studentId, courseId, coId, targetThreshold, historicalRecords, historicalAssessments) {
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

  const progression = [];
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

function calculateTopicEvidence(studentId, courseId, coId, targetThreshold, historicalRecords, historicalAssessments) {
  const matching = historicalRecords.filter(r =>
    r.student_id.toUpperCase() === studentId.toUpperCase() &&
    (courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase()) &&
    r.co_id.toUpperCase() === coId.toUpperCase()
  );

  const topicGroups = new Map();
  matching.forEach(r => {
    const list = topicGroups.get(r.topic) || [];
    list.push(r);
    topicGroups.set(r.topic, list);
  });

  const results = [];
  topicGroups.forEach((records, topic) => {
    const totalObtained = records.reduce((sum, r) => sum + r.marks_obtained, 0);
    const totalMax = records.reduce((sum, r) => sum + r.max_marks, 0);
    const attainmentPct = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(1)) : 0;
    const gapPct = targetThreshold !== null ? parseFloat((attainmentPct - targetThreshold).toFixed(1)) : null;
    const diagnosisCategory = classifyTopicDiagnosis(attainmentPct, targetThreshold);

    const uniqueQuestions = new Set(records.map(r => r.question_id));

    const progression = [];
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

  return results.sort((a, b) => a.attainmentPct - b.attainmentPct);
}

function calculateQuestionEvidence(studentId, courseId, coId, historicalRecords) {
  const matching = historicalRecords.filter(r =>
    r.student_id.toUpperCase() === studentId.toUpperCase() &&
    (courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase()) &&
    r.co_id.toUpperCase() === coId.toUpperCase()
  );

  const qMap = new Map();
  matching.forEach(r => {
    const key = `${r.question_id}|${r.assessment_id}`;
    const list = qMap.get(key) || [];
    list.push(r);
    qMap.set(key, list);
  });

  const results = [];
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

  return results.sort((a, b) => a.attainmentPct - b.attainmentPct);
}

// 5. Test Suite Execution
console.log('================================================================');
console.log('MODULE 5: EXPLAINABILITY & TOPIC DIAGNOSIS - AUDIT TEST SUITE');
console.log('================================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

// Group 1: Topic Diagnosis Classification Thresholds
console.log('--- TEST GROUP 1: Topic Diagnosis Classification Thresholds ---');
assert(classifyTopicDiagnosis(42.5, 70.0) === 'Critical Weakness', 'Attainment 42.5% (< 50%) is Critical Weakness');
assert(classifyTopicDiagnosis(49.9, 70.0) === 'Critical Weakness', 'Boundary 49.9% is Critical Weakness');
assert(classifyTopicDiagnosis(50.0, 70.0) === 'Needs Attention', 'Boundary 50.0% is Needs Attention');
assert(classifyTopicDiagnosis(65.0, 70.0) === 'Needs Attention', 'Attainment 65.0% (< target 70%) is Needs Attention');
assert(classifyTopicDiagnosis(70.0, 70.0) === 'Adequate', 'Boundary 70.0% (= target) is Adequate');
assert(classifyTopicDiagnosis(78.5, 70.0) === 'Adequate', 'Attainment 78.5% is Adequate');
assert(classifyTopicDiagnosis(80.0, 70.0) === 'Strong', 'Boundary 80.0% is Strong');
assert(classifyTopicDiagnosis(95.0, 70.0) === 'Strong', 'Attainment 95.0% is Strong');

// Fallback target handling when target is null
assert(classifyTopicDiagnosis(62.0, null) === 'Needs Attention', 'Null target uses fallback threshold 70% (62% is Needs Attention)');
assert(classifyTopicDiagnosis(72.0, null) === 'Adequate', 'Null target uses fallback threshold 70% (72% is Adequate)');

// Group 2: Benchmark Dataset Ingestion
console.log('\n--- TEST GROUP 2: Benchmark Dataset Ingestion & Student Resolution ---');
const dataDir = path.join(__dirname, '..', 'data');
const rawAssess = parseCSV(path.join(dataDir, 'sample_co_assessment_v2.csv'));
const rawTarget = parseCSV(path.join(dataDir, 'co_target_mapping.csv'));
const records = standardizeRecords(rawAssess.rows);

const targetMap = {};
rawTarget.rows.forEach(r => {
  const c = (r.course_id || '').trim().toUpperCase();
  const co = (r.co_id || '').trim().toUpperCase();
  const val = parseFloat((r.target_percentage || '70').trim()) || 70;
  if (c && co) targetMap[`${c}|${co}`] = val;
});

const courseId = 'CS301';
const coId = 'CO1';
const predictionAssessment = 'A3';
const targetKey = `${courseId}|${coId}`;
const targetThreshold = targetMap[targetKey];

assert(records.length === 9320, `Total standardized records = 9320 (got ${records.length})`);
assert(targetThreshold === 70, `CS301 CO1 target is 70% (got ${targetThreshold})`);

// Dynamically extract students belonging to CS301
const distinctStudents = Array.from(new Set(
  records.filter(r => r.course_id === courseId).map(r => r.student_id)
)).sort();

assert(distinctStudents.length === 150, `CS301 has 150 actual students (got ${distinctStudents.length})`);
assert(distinctStudents.every(s => /^S\d+/i.test(s)), 'All student IDs conform to anonymized format (zero PII)');

// Group 3: Historical Evidence Filtering & Anti-Leakage
console.log('\n--- TEST GROUP 3: Historical Evidence Filtering & Anti-Leakage ---');
const { historicalRecords, historicalAssessments } = getHistoricalEvidenceBeforePrediction(
  records,
  courseId,
  predictionAssessment
);

assert(historicalAssessments.length === 2, `Target A3 has exactly 2 historical assessments (got ${historicalAssessments.length})`);
assert(historicalAssessments[0] === 'A1' && historicalAssessments[1] === 'A2', 'Historical assessments are strictly [A1, A2]');

const leakedRecords = historicalRecords.filter(r => r.assessment_id.toUpperCase() === 'A3');
assert(leakedRecords.length === 0, 'ZERO A3 records present in historical evidence set (Strict Anti-Leakage)');

// Group 4: CO Evidence Calculation for Student S001
console.log('\n--- TEST GROUP 4: CO Evidence Calculation (Student S001) ---');
const studentId = 'S001';
const coEvidence = calculateCOEvidence(
  studentId,
  courseId,
  coId,
  targetThreshold,
  historicalRecords,
  historicalAssessments
);

assert(coEvidence.historicalAttainment !== null, `S001 CO1 attainment is calculated: ${coEvidence.historicalAttainment}%`);
assert(coEvidence.configuredTarget === 70, 'Target is accurately retained as 70%');
assert(coEvidence.attainmentGap !== null, `Attainment gap is calculated: ${coEvidence.attainmentGap}%`);
assert(coEvidence.observationCount === 8, `S001 has 8 historical observations for CO1 in A1 & A2 (got ${coEvidence.observationCount})`);
assert(coEvidence.progression.length === 2, `Progression tracks 2 historical milestones (got ${coEvidence.progression.length})`);
assert(coEvidence.progression[0].assessmentId === 'A1', 'Milestone #1 is A1');
assert(coEvidence.progression[1].assessmentId === 'A2', 'Milestone #2 is A2');

// Group 5: Topic Diagnosis & Ranking
console.log('\n--- TEST GROUP 5: Topic Diagnosis & Ranking ---');
const topicEvidence = calculateTopicEvidence(
  studentId,
  courseId,
  coId,
  targetThreshold,
  historicalRecords,
  historicalAssessments
);

assert(topicEvidence.length > 0, `Found ${topicEvidence.length} topics for CO1`);
for (let i = 0; i < topicEvidence.length - 1; i++) {
  assert(
    topicEvidence[i].attainmentPct <= topicEvidence[i + 1].attainmentPct,
    `Topics ranked weakest first: ${topicEvidence[i].topic} (${topicEvidence[i].attainmentPct}%) <= ${topicEvidence[i + 1].topic} (${topicEvidence[i + 1].attainmentPct}%)`
  );
}
assert(
  ['Critical Weakness', 'Needs Attention', 'Adequate', 'Strong'].includes(topicEvidence[0].diagnosisCategory),
  `Weakest topic categorized cleanly: ${topicEvidence[0].diagnosisCategory}`
);

// Group 6: Question Diagnosis & Ranking
console.log('\n--- TEST GROUP 6: Question Diagnosis & Ranking ---');
const questionEvidence = calculateQuestionEvidence(
  studentId,
  courseId,
  coId,
  historicalRecords
);

assert(questionEvidence.length === 8, `S001 has 8 question attempts across A1 & A2 for CO1 (got ${questionEvidence.length})`);
for (let i = 0; i < questionEvidence.length - 1; i++) {
  assert(
    questionEvidence[i].attainmentPct <= questionEvidence[i + 1].attainmentPct,
    `Questions ranked weakest first: ${questionEvidence[i].questionId} (${questionEvidence[i].attainmentPct}%) <= ${questionEvidence[i + 1].questionId} (${questionEvidence[i + 1].attainmentPct}%)`
  );
}

// Group 7: Insufficient Data / Baseline Cycle Handling
console.log('\n--- TEST GROUP 7: Insufficient Data / Earliest Baseline Cycle Handling ---');
const earliestEvidence = getHistoricalEvidenceBeforePrediction(records, courseId, 'A1');
assert(earliestEvidence.historicalAssessments.length === 0, 'Earliest assessment A1 has zero historical assessments');
assert(earliestEvidence.historicalRecords.length === 0, 'Zero historical records admitted for baseline cycle A1');

const baselineCO = calculateCOEvidence(studentId, courseId, coId, targetThreshold, earliestEvidence.historicalRecords, earliestEvidence.historicalAssessments);
assert(baselineCO.historicalAttainment === null, 'Baseline CO attainment is null');
assert(baselineCO.observationCount === 0, 'Baseline observation count is 0');

// Group 8: Unconfigured Target Handling
console.log('\n--- TEST GROUP 8: Unconfigured Target Handling ---');
const unconfiguredCO = calculateCOEvidence(studentId, courseId, coId, null, historicalRecords, historicalAssessments);
assert(unconfiguredCO.configuredTarget === null, 'Configured target is null');
assert(unconfiguredCO.attainmentGap === null, 'Attainment gap is null when target is unconfigured');

// Group 9: Strict Anti-Leakage Mutation Test
console.log('\n--- TEST GROUP 9: Strict Anti-Leakage Mutation Test ---');
// Take original records and find S001's A3 records
const baselineExplanation = calculateCOEvidence(studentId, courseId, coId, targetThreshold, historicalRecords, historicalAssessments);
const baselineTopics = calculateTopicEvidence(studentId, courseId, coId, targetThreshold, historicalRecords, historicalAssessments);

// Mutate A3 marks in raw dataset to 999
const mutatedRecords = records.map(r => {
  if (r.student_id === studentId && r.assessment_id === 'A3') {
    return { ...r, marks_obtained: 999, max_marks: 999 };
  }
  return r;
});

// Re-extract historical evidence for predicting A3 from mutated records
const mutatedHistory = getHistoricalEvidenceBeforePrediction(mutatedRecords, courseId, 'A3');
const mutatedCO = calculateCOEvidence(studentId, courseId, coId, targetThreshold, mutatedHistory.historicalRecords, mutatedHistory.historicalAssessments);
const mutatedTopics = calculateTopicEvidence(studentId, courseId, coId, targetThreshold, mutatedHistory.historicalRecords, mutatedHistory.historicalAssessments);

assert(
  mutatedCO.historicalAttainment === baselineExplanation.historicalAttainment,
  `LEAKAGE AUDIT PASS: A3 mutation did NOT change CO attainment (${baselineExplanation.historicalAttainment}% vs ${mutatedCO.historicalAttainment}%)`
);
assert(
  mutatedCO.observationCount === baselineExplanation.observationCount,
  `LEAKAGE AUDIT PASS: A3 mutation did NOT alter observation count (${baselineExplanation.observationCount})`
);
assert(
  mutatedTopics[0].attainmentPct === baselineTopics[0].attainmentPct,
  `LEAKAGE AUDIT PASS: A3 mutation did NOT alter weakest topic attainment (${baselineTopics[0].attainmentPct}%)`
);

console.log('\n================================================================');
console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('================================================================\n');

if (testsFailed > 0) process.exit(1);
