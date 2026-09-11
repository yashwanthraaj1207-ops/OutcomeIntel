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

// 3. Pure Module 7 Engine Functions (mirrored from src/services/reassessmentEngine.ts)
function identifyReassessmentAssessment(records, courseId, baselineAssessmentId) {
  const dateMap = new Map();
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

  const subsequent = baselineIdx >= 0 ? sorted.slice(baselineIdx + 1) : sorted;
  return subsequent.map(([assessmentId, date], sequenceIndex) => ({
    assessmentId,
    date,
    sequenceIndex
  }));
}

function getPreInterventionEvidence(records, studentId, courseId, coId, reassessmentDate, reassessmentAssessmentId) {
  const reDateVal = new Date(reassessmentDate).getTime();

  return records.filter(r => {
    const sMatch = r.student_id.toUpperCase() === studentId.toUpperCase();
    const cMatch = courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase();
    const coMatch = r.co_id.toUpperCase() === coId.toUpperCase();
    const notReassessment = r.assessment_id.toUpperCase() !== reassessmentAssessmentId.toUpperCase();

    const rDateVal = new Date(r.assessment_date).getTime();
    const precedesDate = !isNaN(reDateVal) && !isNaN(rDateVal) ? rDateVal < reDateVal : true;

    return sMatch && cMatch && coMatch && notReassessment && precedesDate;
  });
}

function getPostReassessmentEvidence(records, studentId, courseId, coId, reassessmentAssessmentId) {
  return records.filter(r => {
    const sMatch = r.student_id.toUpperCase() === studentId.toUpperCase();
    const cMatch = courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase();
    const coMatch = r.co_id.toUpperCase() === coId.toUpperCase();
    const isReassessment = r.assessment_id.toUpperCase() === reassessmentAssessmentId.toUpperCase();
    return sMatch && cMatch && coMatch && isReassessment;
  });
}

function calculateAttainment(records) {
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

function calculateAbsoluteLearningGain(preAttainment, postAttainment) {
  if (preAttainment === null || postAttainment === null) return null;
  const diff = postAttainment - preAttainment;
  return Math.round(diff * 100) / 100;
}

function calculateRelativeImprovement(preAttainment, postAttainment) {
  if (preAttainment === null || postAttainment === null) return null;
  if (preAttainment <= 0) return null;

  const rel = ((postAttainment - preAttainment) / preAttainment) * 100;
  return Math.round(rel * 100) / 100;
}

function calculateTargetGap(attainment, targetThreshold) {
  if (attainment === null || targetThreshold === null) return null;
  const gap = attainment - targetThreshold;
  return Math.round(gap * 100) / 100;
}

function calculateTargetGapClosure(preGap, postGap) {
  if (preGap === null || postGap === null) return null;
  const closure = postGap - preGap;
  return Math.round(closure * 100) / 100;
}

function classifyEffectiveness(preAttainment, postAttainment, targetThreshold, isSufficient) {
  if (!isSufficient || preAttainment === null || postAttainment === null) {
    return 'INSUFFICIENT DATA';
  }

  if (targetThreshold !== null && postAttainment >= targetThreshold) {
    return 'TARGET ACHIEVED';
  }

  if (targetThreshold === null && postAttainment >= 70.0) {
    return 'TARGET ACHIEVED';
  }

  if (postAttainment > preAttainment) {
    return 'POSITIVE GAIN';
  }

  if (Math.abs(postAttainment - preAttainment) < 0.001) {
    return 'NO MEASURABLE GAIN';
  }

  if (postAttainment < preAttainment) {
    return 'NEGATIVE CHANGE';
  }

  return 'INSUFFICIENT DATA';
}

function evaluateDataSufficiency(studentId, courseId, coId, approvedIntervention, targetThreshold, preRecords, postRecords, reassessmentDate) {
  const missingDetails = [];

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

  let status = 'SUFFICIENT';

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

function compareTopicPerformance(preRecords, postRecords, coId, targetThreshold) {
  const topicSet = new Set();
  preRecords.forEach(r => topicSet.add(r.topic));
  postRecords.forEach(r => topicSet.add(r.topic));

  const comparisons = [];

  topicSet.forEach(topic => {
    const preTRecords = preRecords.filter(r => r.topic.toUpperCase() === topic.toUpperCase());
    const postTRecords = postRecords.filter(r => r.topic.toUpperCase() === topic.toUpperCase());

    const preAtt = calculateAttainment(preTRecords);
    const postAtt = calculateAttainment(postTRecords);
    const gain = calculateAbsoluteLearningGain(preAtt, postAtt);
    const rel = calculateRelativeImprovement(preAtt, postAtt);

    let status = 'Insufficient Data';
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

  return comparisons.sort((a, b) => {
    const gA = a.absoluteGain !== null ? a.absoluteGain : -999;
    const gB = b.absoluteGain !== null ? b.absoluteGain : -999;
    return gB - gA;
  });
}

function compareQuestionPerformance(preRecords, postRecords, coId) {
  const preQMap = new Map();
  preRecords.forEach(r => {
    if (!preQMap.has(r.question_id)) preQMap.set(r.question_id, []);
    preQMap.get(r.question_id).push(r);
  });

  const postQMap = new Map();
  postRecords.forEach(r => {
    if (!postQMap.has(r.question_id)) postQMap.set(r.question_id, []);
    postQMap.get(r.question_id).push(r);
  });

  const allQIds = Array.from(new Set([...preQMap.keys(), ...postQMap.keys()])).sort();
  let matchingCount = 0;

  const comparisons = allQIds.map(qId => {
    const preList = preQMap.get(qId) || [];
    const postList = postQMap.get(qId) || [];

    const topic = preList[0]?.topic || postList[0]?.topic || 'Topic Unknown';

    const preMarks = preList.length > 0 ? preList.reduce((acc, r) => acc + r.marks_obtained, 0) : null;
    const preMax = preList.length > 0 ? preList.reduce((acc, r) => acc + r.max_marks, 0) : null;
    const preAtt = preMarks !== null && preMax !== null && preMax > 0 ? Math.round((preMarks / preMax) * 1000) / 10 : null;

    const postMarks = postList.length > 0 ? postList.reduce((acc, r) => acc + r.marks_obtained, 0) : null;
    const postMax = postList.length > 0 ? postList.reduce((acc, r) => acc + r.max_marks, 0) : null;
    const postAtt = postMarks !== null && postMax !== null && postMax > 0 ? Math.round((postMarks / postMax) * 1000) / 10 : null;

    let status = 'No Direct Match';
    let gain = null;

    if (preAtt !== null && postAtt !== null) {
      matchingCount++;
      gain = Math.round((postAtt - preAtt) * 10) / 10;
      if (postAtt > preAtt) status = 'Improved';
      else if (Math.abs(postAtt - preAtt) < 0.001) status = 'Unchanged';
      else status = 'Declined';
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

function buildCohortOutcomeSummary(profiles) {
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

  const getPct = cnt => (totalEvaluated > 0 ? Math.round((cnt / totalEvaluated) * 1000) / 10 : 0);

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

// =========================================================================
// TEST EXECUTION RUNNER
// =========================================================================
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

console.log('================================================================');
console.log('TEST SUITE: MODULE 7 — REASSESSMENT & LEARNING GAIN');
console.log('================================================================');

// Load Data
const assessmentCSV = path.join(__dirname, '../data/sample_co_assessment_v2.csv');
const targetsCSV = path.join(__dirname, '../data/co_target_mapping.csv');
const reassessmentCSV = path.join(__dirname, '../data/sample_reassessment.csv');

const rawAssessments = parseCSV(assessmentCSV).rows;
const records = standardizeRecords(rawAssessments);

const rawReassessments = parseCSV(reassessmentCSV).rows;
const reassessmentRecords = standardizeRecords(rawReassessments);

const allRecords = [...records, ...reassessmentRecords];

console.log(`Loaded ${records.length} original records and ${reassessmentRecords.length} demonstration reassessment records.`);

// 1. Pre-intervention evidence isolation
console.log('\n--- 1. Evidence Extraction & Pre/Post Isolation ---');
const preS001 = getPreInterventionEvidence(allRecords, 'S001', 'CS301', 'CO1', '2026-09-15', 'R1');
assert(preS001.length > 0, `Isolated ${preS001.length} pre-intervention records for S001 CO1`);
assert(preS001.every(r => r.assessment_id !== 'R1'), 'Pre-intervention records strictly exclude reassessment R1');

// 2. Post-reassessment evidence isolation
const postS001 = getPostReassessmentEvidence(allRecords, 'S001', 'CS301', 'CO1', 'R1');
assert(postS001.length === 4, `Isolated exactly 4 post-reassessment records for S001 CO1 (got ${postS001.length})`);
assert(postS001.every(r => r.assessment_id === 'R1'), 'Post-reassessment records contain only R1');

// 3. Chronological filtering
const preDates = preS001.map(r => new Date(r.assessment_date).getTime());
const reDate = new Date('2026-09-15').getTime();
assert(preDates.every(d => d < reDate), 'Every pre-intervention record date is strictly before reassessment date');

// 4, 5, 6. Student, Course, CO alignment
assert(postS001.every(r => r.student_id === 'S001'), 'Student ID alignment verified');
assert(postS001.every(r => r.course_id === 'CS301'), 'Course ID alignment verified');
assert(postS001.every(r => r.co_id === 'CO1'), 'Course Outcome ID alignment verified');

// 7. Absolute learning gain
console.log('\n--- 2. Learning Gain Formulas ---');
const preAttS001 = calculateAttainment(preS001); // e.g. ~77.5%
const postAttS001 = calculateAttainment(postS001); // (8.5+8.0+7.5+8.0)/40 = 32/40 = 80.0%
const absGainS001 = calculateAbsoluteLearningGain(preAttS001, postAttS001);
assert(typeof absGainS001 === 'number', `Calculated absolute learning gain: ${absGainS001} percentage points`);

// Controlled calculation test:
// Pre = 48.0%, Post = 67.0% => +19.0 pp
const testAbsGain = calculateAbsoluteLearningGain(48.0, 67.0);
assert(testAbsGain === 19.0, `Absolute learning gain formula: 67 - 48 = 19 pp (got ${testAbsGain})`);

// 8. Relative improvement
const testRelGain = calculateRelativeImprovement(50.0, 75.0);
assert(testRelGain === 50.0, `Relative improvement: ((75 - 50) / 50) * 100 = 50% (got ${testRelGain})`);

// 9. Zero-baseline handling
const zeroBaselineRel = calculateRelativeImprovement(0.0, 45.0);
assert(zeroBaselineRel === null, 'Relative improvement returns null when baseline attainment is 0%');

// 10. Target gap
const targetGapPre = calculateTargetGap(65.0, 70.0);
assert(targetGapPre === -5.0, `Pre target gap: 65 - 70 = -5.0% (got ${targetGapPre})`);

// 11. Target gap closure
const targetGapPost = calculateTargetGap(72.0, 70.0); // +2.0
const closure = calculateTargetGapClosure(-5.0, 2.0); // 2 - (-5) = 7.0
assert(closure === 7.0, `Target gap closure: 2.0 - (-5.0) = +7.0 pp (got ${closure})`);

// 12. TARGET ACHIEVED classification
console.log('\n--- 3. Deterministic Effectiveness Classification ---');
const effAchieved = classifyEffectiveness(55.0, 75.0, 70.0, true);
assert(effAchieved === 'TARGET ACHIEVED', 'Post attainment (75%) >= Target (70%) classifies as TARGET ACHIEVED');

// 13. POSITIVE GAIN classification
const effPos = classifyEffectiveness(55.0, 65.0, 70.0, true);
assert(effPos === 'POSITIVE GAIN', 'Post (65%) > Pre (55%) and < Target (70%) classifies as POSITIVE GAIN');

// 14. NO MEASURABLE GAIN classification
const effZero = classifyEffectiveness(60.0, 60.0, 70.0, true);
assert(effZero === 'NO MEASURABLE GAIN', 'Post (60%) == Pre (60%) classifies as NO MEASURABLE GAIN');

// 15. NEGATIVE CHANGE classification
const effNeg = classifyEffectiveness(65.0, 58.0, 70.0, true);
assert(effNeg === 'NEGATIVE CHANGE', 'Post (58%) < Pre (65%) classifies as NEGATIVE CHANGE');

// 16. INSUFFICIENT DATA classification
const effInsuff1 = classifyEffectiveness(null, 75.0, 70.0, true);
assert(effInsuff1 === 'INSUFFICIENT DATA', 'Null pre-attainment classifies as INSUFFICIENT DATA');
const effInsuff2 = classifyEffectiveness(55.0, 75.0, 70.0, false);
assert(effInsuff2 === 'INSUFFICIENT DATA', 'isSufficient = false classifies as INSUFFICIENT DATA');

// 17. Missing target handling
const effNoTarget = classifyEffectiveness(55.0, 72.0, null, true);
assert(effNoTarget === 'TARGET ACHIEVED', 'Unconfigured target uses prototype 70% benchmark (72% >= 70%)');

// 18. Topic comparison
console.log('\n--- 4. Topic Analysis & Ranking ---');
const topicComparisons = compareTopicPerformance(preS001, postS001, 'CO1', 70.0);
assert(topicComparisons.length >= 2, `Topic comparison contains ${topicComparisons.length} topics`);
assert(topicComparisons.every(t => t.coId === 'CO1'), 'All compared topics belong to CO1');

// 19. Topic ranking
const firstTopicGain = topicComparisons[0].absoluteGain !== null ? topicComparisons[0].absoluteGain : -999;
const lastTopicGain = topicComparisons[topicComparisons.length - 1].absoluteGain !== null ? topicComparisons[topicComparisons.length - 1].absoluteGain : -999;
assert(firstTopicGain >= lastTopicGain, 'Topics ranked in descending order of absolute learning gain');

// 20. Matching question comparison
console.log('\n--- 5. Question Item Matching & Honest Mappings ---');
const { comparisons: qComps, matchDirectly } = compareQuestionPerformance(preS001, postS001, 'CO1');
assert(qComps.length > 0, `Question comparisons generated for ${qComps.length} items`);
assert(matchDirectly === true, 'Matching question IDs detected between baseline and R1');
const q01 = qComps.find(q => q.questionId === 'Q01');
assert(q01 && q01.postAttainmentPct !== null, 'Q01 post-reassessment attainment computed');

// 21. Non-matching question handling
const nonMatchingPre = [{ student_id: 'S001', course_id: 'CS301', question_id: 'OLD_Q1', topic: 'T1', co_id: 'CO1', marks_obtained: 5, max_marks: 10, assessment_id: 'A1', assessment_date: '2026-07-01' }];
const nonMatchingPost = [{ student_id: 'S001', course_id: 'CS301', question_id: 'NEW_Q9', topic: 'T1', co_id: 'CO1', marks_obtained: 8, max_marks: 10, assessment_id: 'R1', assessment_date: '2026-09-15' }];
const nonMatchingResult = compareQuestionPerformance(nonMatchingPre, nonMatchingPost, 'CO1');
assert(nonMatchingResult.matchDirectly === false, 'Different question sets identified with matchDirectly = false');
assert(nonMatchingResult.comparisons.every(q => q.status === 'No Direct Match'), 'Non-matching items flagged as "No Direct Match" without fabricating equivalences');

// 22. Future assessment exclusion
console.log('\n--- 6. Strict Anti-Leakage & Mutation Verification ---');
const futureRecords = [
  ...allRecords,
  {
    rowNumber: 99999,
    student_id: 'S001',
    course_id: 'CS301',
    semester: 4,
    assessment_id: 'FINAL_EXAM',
    assessment_type: 'EndSemester',
    assessment_date: '2026-11-20', // Months after R1
    question_id: 'Q01',
    topic: 'Process Scheduling',
    co_id: 'CO1',
    marks_obtained: 1.0,
    max_marks: 10.0
  }
];

const preWithFuture = getPreInterventionEvidence(futureRecords, 'S001', 'CS301', 'CO1', '2026-09-15', 'R1');
const postWithFuture = getPostReassessmentEvidence(futureRecords, 'S001', 'CS301', 'CO1', 'R1');
assert(preWithFuture.length === preS001.length, 'Future assessment FINAL_EXAM strictly excluded from pre-intervention evidence');
assert(postWithFuture.length === postS001.length, 'Future assessment FINAL_EXAM strictly excluded from post-reassessment evidence');

// 23. Mutation test for future marks
const mutatedFutureRecords = [
  ...allRecords,
  {
    rowNumber: 99999,
    student_id: 'S001',
    course_id: 'CS301',
    semester: 4,
    assessment_id: 'FINAL_EXAM',
    assessment_type: 'EndSemester',
    assessment_date: '2026-11-20',
    question_id: 'Q01',
    topic: 'Process Scheduling',
    co_id: 'CO1',
    marks_obtained: 99999.0, // Absurd score
    max_marks: 10.0
  }
];

const mutatedPre = calculateAttainment(getPreInterventionEvidence(mutatedFutureRecords, 'S001', 'CS301', 'CO1', '2026-09-15', 'R1'));
const mutatedPost = calculateAttainment(getPostReassessmentEvidence(mutatedFutureRecords, 'S001', 'CS301', 'CO1', 'R1'));
assert(mutatedPre === preAttS001, `MUTATION AUDIT PASS: Future marks did not alter pre-attainment (${mutatedPre}% vs ${preAttS001}%)`);
assert(mutatedPost === postAttS001, `MUTATION AUDIT PASS: Future marks did not alter post-attainment (${mutatedPost}% vs ${postAttS001}%)`);

// 24. Cohort summary calculations
console.log('\n--- 7. Cohort Outcome Summary & Gating ---');
const sampleProfiles = [
  { studentId: 'S001', learningGains: { postAttainment: 80.0, absoluteGain: 15.0 }, effectiveness: 'TARGET ACHIEVED' },
  { studentId: 'S002', learningGains: { postAttainment: 65.0, absoluteGain: 7.0 }, effectiveness: 'POSITIVE GAIN' },
  { studentId: 'S003', learningGains: { postAttainment: 50.0, absoluteGain: 0.0 }, effectiveness: 'NO MEASURABLE GAIN' },
  { studentId: 'S004', learningGains: { postAttainment: 45.0, absoluteGain: -5.0 }, effectiveness: 'NEGATIVE CHANGE' },
  { studentId: 'S005', learningGains: { postAttainment: null, absoluteGain: null }, effectiveness: 'INSUFFICIENT DATA' }
];

const cohortSum = buildCohortOutcomeSummary(sampleProfiles);
assert(cohortSum.totalEvaluated === 5, 'Cohort summary evaluated 5 profiles');
assert(cohortSum.targetAchievedCount === 1, '1 Target Achieved');
assert(cohortSum.positiveGainCount === 1, '1 Positive Gain');
assert(cohortSum.noMeasurableGainCount === 1, '1 No Measurable Gain');
assert(cohortSum.negativeChangeCount === 1, '1 Negative Change');
assert(cohortSum.insufficientDataCount === 1, '1 Insufficient Data');
assert(cohortSum.meanAbsoluteLearningGain === 4.25, `Mean learning gain: (15+7+0-5)/4 = 4.25 pp (got ${cohortSum.meanAbsoluteLearningGain})`);

// 25. Approved intervention gating
const approvedIntv = { interventionId: 'intv-1', studentId: 'S001', status: 'Approved' };
const suffApproved = evaluateDataSufficiency('S001', 'CS301', 'CO1', approvedIntv, 70.0, preS001, postS001, '2026-09-15');
assert(suffApproved.hasApprovedIntervention === true, 'Approved intervention passes data sufficiency');

// 26. Rejected intervention blocking
const rejectedIntv = { interventionId: 'intv-2', studentId: 'S001', status: 'Rejected' };
const suffRejected = evaluateDataSufficiency('S001', 'CS301', 'CO1', rejectedIntv, 70.0, preS001, postS001, '2026-09-15');
assert(suffRejected.hasApprovedIntervention === false, 'Rejected intervention blocked by sufficiency guard');
assert(suffRejected.status === 'INSUFFICIENT', 'Rejected intervention yields status INSUFFICIENT');

// 27. Suggested intervention blocking
const suggestedIntv = { interventionId: 'intv-3', studentId: 'S001', status: 'Suggested' };
const suffSuggested = evaluateDataSufficiency('S001', 'CS301', 'CO1', suggestedIntv, 70.0, preS001, postS001, '2026-09-15');
assert(suffSuggested.hasApprovedIntervention === false, 'Unapproved/suggested intervention blocked by sufficiency guard');

// 28. No PII
const studentIds = allRecords.map(r => r.student_id);
const allAnonymized = studentIds.every(id => /^S\d{3}$/.test(id));
assert(allAnonymized, 'Every student ID conforms to anonymized regex ^S\\d{3}$ (zero PII)');

// 29. Synthetic data disclaimer
const sampleReassessmentContent = fs.readFileSync(reassessmentCSV, 'utf8');
assert(sampleReassessmentContent.length > 0, 'sample_reassessment.csv exists and is populated');
assert(reassessmentRecords[0].assessment_id === 'R1', 'Reassessment cycle is R1');
assert(reassessmentRecords[0].assessment_date === '2026-09-15', 'Reassessment date is 2026-09-15');

// 30. No fabricated metrics
const missingPost = getPostReassessmentEvidence(records, 'S001', 'CS301', 'CO1', 'R1');
const unassistedAttainment = calculateAttainment(missingPost);
assert(unassistedAttainment === null, 'Without reassessment data, attainment is strictly null (no fabrication)');

console.log('\n================================================================');
console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

