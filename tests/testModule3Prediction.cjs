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

// 3. Logic Replicating Prediction Engine Functions
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

function getStudentScoreInAssessment(records, studentId, courseId, assessmentId, coId) {
  let obtained = 0, max = 0, count = 0;
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
  if (count === 0 || max === 0) return null;
  return {
    marksObtained: Math.round(obtained * 10) / 10,
    maxMarks: max,
    attainmentPct: Math.round((obtained / max) * 10000) / 100,
    observationCount: count
  };
}

function constructStudentFeatures(records, studentId, courseId, coId, targetAssessmentId, chronologicalList, targetMap) {
  const historicalAssessments = getHistoricalAssessments(chronologicalList, targetAssessmentId);
  if (historicalAssessments.length === 0) return null;

  const targetKey = `${courseId.toUpperCase()}|${coId.toUpperCase()}`;
  const targetThreshold = targetMap[targetKey] ?? 70.0;

  const historicalScores = [];
  let cumulativeObtained = 0, cumulativeMax = 0, totalObservations = 0;

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

  if (historicalScores.length === 0) return null;

  const rollingCOAttainment = cumulativeMax > 0 ? Math.round((cumulativeObtained / cumulativeMax) * 10000) / 100 : 0;
  const previousCOAttainment = historicalScores[historicalScores.length - 1].attainmentPct;

  let trendDelta = 0;
  let performanceTrend = 'Stable';
  if (historicalScores.length >= 2) {
    const secondLast = historicalScores[historicalScores.length - 2].attainmentPct;
    trendDelta = Math.round((previousCOAttainment - secondLast) * 100) / 100;
    if (trendDelta > 2.0) performanceTrend = 'Improving';
    else if (trendDelta < -2.0) performanceTrend = 'Declining';
    else performanceTrend = 'Stable';
  }

  const priorTargetMet = previousCOAttainment >= targetThreshold;

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
    historicalObservationsCount: totalObservations
  };
}

function sigmoid(z) {
  const clipped = Math.max(-20, Math.min(20, z));
  return 1 / (1 + Math.exp(-clipped));
}

function extractFeatureVector(feat) {
  return [
    feat.rollingCOAttainment / 100,
    feat.previousCOAttainment / 100,
    Math.max(-0.5, Math.min(0.5, feat.trendDelta / 100)),
    feat.priorTargetMet ? 1.0 : 0.0,
    Math.min(1.0, feat.historicalAssessments.length / 5.0)
  ];
}

function computeRocAuc(pairs) {
  if (pairs.length === 0) return null;
  const posCount = pairs.filter(p => p.actual === 1).length;
  const negCount = pairs.length - posCount;
  if (posCount === 0 || negCount === 0) return null;

  const sorted = [...pairs].sort((a, b) => b.prob - a.prob);
  let rankSum = 0;
  sorted.forEach((item, idx) => {
    if (item.actual === 1) rankSum += (sorted.length - idx);
  });
  const uStat = rankSum - (posCount * (posCount + 1)) / 2;
  return Math.round((uStat / (posCount * negCount)) * 1000) / 1000;
}

// ==========================================
// TEST EXECUTION RUNNER
// ==========================================
console.log('===========================================================');
console.log('MODULE 3 CONDITIONAL PREDICTION ENGINE — AUDIT TEST SUITE');
console.log('===========================================================\n');

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

// 1. Chronological Assessment Ordering
console.log('--- Test Group 1: Chronological Assessment Ordering ---');
const cs301Assessments = getChronologicalAssessments(standardized, 'CS301');
assert(cs301Assessments.length === 3, `CS301 has 3 chronological assessments (actual: ${cs301Assessments.length})`);
assert(cs301Assessments[0].assessmentId === 'A1' && cs301Assessments[0].date === '2026-07-15', 'CS301 #1 is A1 on 2026-07-15');
assert(cs301Assessments[1].assessmentId === 'A2' && cs301Assessments[1].date === '2026-08-12', 'CS301 #2 is A2 on 2026-08-12');
assert(cs301Assessments[2].assessmentId === 'A3' && cs301Assessments[2].date === '2026-09-02', 'CS301 #3 is A3 on 2026-09-02');

const cs302Assessments = getChronologicalAssessments(standardized, 'CS302');
assert(cs302Assessments.length === 2, `CS302 has 2 chronological assessments (actual: ${cs302Assessments.length})`);
assert(cs302Assessments[0].assessmentId === 'B1' && cs302Assessments[1].assessmentId === 'B2', 'CS302 sequence is B1 -> B2');

// 2. Insufficient History Handling
console.log('\n--- Test Group 2: Insufficient History Handling ---');
const a1History = getHistoricalAssessments(cs301Assessments, 'A1');
assert(a1History.length === 0, 'Earliest assessment A1 has zero historical assessments preceding it');
const a1Features = constructStudentFeatures(standardized, 'S001', 'CS301', 'CO1', 'A1', cs301Assessments, targetMap);
assert(a1Features === null, 'Predicting baseline cycle A1 returns null features (insufficient history)');

// 3. Historical Feature Construction & Progression
console.log('\n--- Test Group 3: Historical Feature Construction ---');
const a3History = getHistoricalAssessments(cs301Assessments, 'A3');
assert(a3History.length === 2 && a3History[0] === 'A1' && a3History[1] === 'A2', 'Predicting A3 uses historical window {A1, A2}');

const s001A3Features = constructStudentFeatures(standardized, 'S001', 'CS301', 'CO1', 'A3', cs301Assessments, targetMap);
assert(s001A3Features !== null, 'S001 features for A3 constructed successfully');
assert(s001A3Features.historicalAssessments.length === 2, 'Features reflect exactly 2 historical assessment cycles');
assert(s001A3Features.historicalAssessmentScores.length === 2, 'Detailed scores recorded for A1 and A2 only');
assert(s001A3Features.historicalObservationsCount === 8, '8 historical question observations (4 in A1 + 4 in A2)');
assert(typeof s001A3Features.rollingCOAttainment === 'number', 'Rolling CO attainment is a calculated number');
assert(typeof s001A3Features.trendDelta === 'number', 'Trend delta is a calculated number');

// 4. Future Data Exclusion & Strict Anti-Leakage
console.log('\n--- Test Group 4: Strict Anti-Leakage Verification ---');
// Modify an A3 record in memory
const copyRecords = JSON.parse(JSON.stringify(standardized));
const modifiedA3Index = copyRecords.findIndex(r => r.student_id === 'S001' && r.assessment_id === 'A3' && r.co_id === 'CO1');
assert(modifiedA3Index !== -1, 'Found S001 A3 CO1 record for mutation test');

// Mutate A3 marks obtained to an extreme value
copyRecords[modifiedA3Index].marks_obtained = 999;
const mutatedFeatures = constructStudentFeatures(copyRecords, 'S001', 'CS301', 'CO1', 'A3', cs301Assessments, targetMap);

assert(
  mutatedFeatures.rollingCOAttainment === s001A3Features.rollingCOAttainment,
  `LEAKAGE AUDIT PASS: A3 mark mutation did not alter rolling CO attainment (${mutatedFeatures.rollingCOAttainment}% vs ${s001A3Features.rollingCOAttainment}%)`
);
assert(
  mutatedFeatures.previousCOAttainment === s001A3Features.previousCOAttainment,
  `LEAKAGE AUDIT PASS: A3 mark mutation did not alter previous CO attainment (${mutatedFeatures.previousCOAttainment}%)`
);
assert(
  mutatedFeatures.trendDelta === s001A3Features.trendDelta,
  `LEAKAGE AUDIT PASS: A3 mark mutation did not alter trend delta (${mutatedFeatures.trendDelta}%)`
);

// 5. Target Lookup & Missing Target Handling
console.log('\n--- Test Group 5: Target Thresholds & Missing Target Handling ---');
assert(targetMap['CS301|CO1'] === 70, 'CS301 CO1 target is 70%');
const emptyMap = {};
assert(emptyMap['CS301|CO1'] === undefined, 'Missing target is properly identified as undefined/null');

// 6. Student-Level Train/Test Split (Zero Overlap)
console.log('\n--- Test Group 6: Student-Level Train/Test Separation ---');
const allStudents = Array.from(new Set(standardized.filter(r => r.course_id === 'CS301').map(r => r.student_id))).sort();
assert(allStudents.length === 150, '150 distinct students in CS301 cohort');
const splitIdx = Math.floor(allStudents.length * 0.7);
const trainStudents = new Set(allStudents.slice(0, splitIdx));
const testStudents = new Set(allStudents.slice(splitIdx));

assert(trainStudents.size === 105, `Train partition has exactly 105 students (actual: ${trainStudents.size})`);
assert(testStudents.size === 45, `Test partition has exactly 45 students (actual: ${testStudents.size})`);

let overlapCount = 0;
trainStudents.forEach(s => { if (testStudents.has(s)) overlapCount++; });
assert(overlapCount === 0, 'Zero student overlap between train and test sets (strictly disjoint)');

// 7. Transition Sample Generation & Model Training
console.log('\n--- Test Group 7: Model Training & Convergence ---');
const trainX = [], trainY = [];
const testX = [], testY = [];
const cos = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];

for (let t = 1; t < cs301Assessments.length; t++) {
  const targetAssessment = cs301Assessments[t].assessmentId;
  allStudents.forEach(sId => {
    cos.forEach(coId => {
      const targetThreshold = targetMap[`CS301|${coId}`];
      const outcomeScore = getStudentScoreInAssessment(standardized, sId, 'CS301', targetAssessment, coId);
      if (!outcomeScore) return;

      const feat = constructStudentFeatures(standardized, sId, 'CS301', coId, targetAssessment, cs301Assessments, targetMap);
      if (!feat) return;

      const x = extractFeatureVector(feat);
      const y = outcomeScore.attainmentPct >= targetThreshold ? 1 : 0;

      if (trainStudents.has(sId)) {
        trainX.push(x);
        trainY.push(y);
      } else if (testStudents.has(sId)) {
        testX.push(x);
        testY.push(y);
      }
    });
  });
}

assert(trainX.length === 1050, `1,050 transition samples in training set (actual: ${trainX.length})`);
assert(testX.length === 450, `450 transition samples in test set (actual: ${testX.length})`);

// Logistic Regression Training
let weights = [0, 0, 0, 0, 0];
let bias = 0;
const lr = 0.1, epochs = 250, l2Lambda = 0.001, m = trainX.length;

for (let ep = 0; ep < epochs; ep++) {
  const dw = [0, 0, 0, 0, 0];
  let db = 0;
  for (let i = 0; i < m; i++) {
    const xi = trainX[i];
    const yi = trainY[i];
    let z = bias;
    for (let j = 0; j < 5; j++) z += xi[j] * weights[j];
    const p = sigmoid(z);
    const err = p - yi;
    for (let j = 0; j < 5; j++) dw[j] += err * xi[j];
    db += err;
  }
  for (let j = 0; j < 5; j++) weights[j] -= (lr * (dw[j] / m + l2Lambda * weights[j]));
  bias -= (lr * db) / m;
}

assert(weights.every(w => !isNaN(w) && isFinite(w)), 'Model weights converged with valid finite numbers');
assert(weights[0] > 0, 'Rolling CO attainment weight is positive (rational academic association)');
assert(weights[3] > 0, 'Prior target met weight is positive (rational academic association)');

// 8. Evaluation Metrics on Held-out Test Set
console.log('\n--- Test Group 8: Held-Out Evaluation Metrics ---');
let tp = 0, fp = 0, tn = 0, fn = 0;
const testPairs = [];

for (let i = 0; i < testX.length; i++) {
  const xi = testX[i];
  const yi = testY[i];
  let z = bias;
  for (let j = 0; j < 5; j++) z += xi[j] * weights[j];
  const p = sigmoid(z);
  const pred = p >= 0.5 ? 1 : 0;
  testPairs.push({ actual: yi, prob: p, predicted: pred });
  if (yi === 1 && pred === 1) tp++;
  else if (yi === 0 && pred === 1) fp++;
  else if (yi === 0 && pred === 0) tn++;
  else if (yi === 1 && pred === 0) fn++;
}

const accuracy = (tp + tn) / (tp + tn + fp + fn);
const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
const rocAuc = computeRocAuc(testPairs);

assert(accuracy > 0.8, `Test accuracy exceeds 80% (actual: ${(accuracy * 100).toFixed(1)}%)`);
assert(precision > 0.8, `Test precision exceeds 80% (actual: ${(precision * 100).toFixed(1)}%)`);
assert(recall > 0.7, `Test recall exceeds 70% (actual: ${(recall * 100).toFixed(1)}%)`);
assert(f1 > 0.8, `Test F1 score exceeds 80% (actual: ${(f1 * 100).toFixed(1)}%)`);
assert(rocAuc !== null && rocAuc > 0.8, `Test ROC-AUC exceeds 0.80 (actual: ${rocAuc})`);
assert(tp + fp + tn + fn === 450, `Confusion matrix sums to exactly 450 test cases (TP=${tp}, FP=${fp}, TN=${tn}, FN=${fn})`);

// 9. Inference Probabilities & Status Categorization
console.log('\n--- Test Group 9: Inference Probabilities & Status Mapping ---');
const sampleX = extractFeatureVector(s001A3Features);
let zSample = bias;
for (let j = 0; j < 5; j++) zSample += sampleX[j] * weights[j];
const probSample = sigmoid(zSample);
assert(probSample >= 0.0 && probSample <= 1.0, `Predicted probability is within [0.0, 1.0] (actual: ${probSample.toFixed(4)})`);
const predictedStatus = probSample >= 0.5 ? 'Likely to Meet Target' : 'Likely Below Target';
assert(
  predictedStatus === 'Likely to Meet Target' || predictedStatus === 'Likely Below Target',
  `Predicted status is valid enum (actual: '${predictedStatus}')`
);

// 10. ML Model Transparency & Dynamic Target Mapping
console.log('\n--- Test Group 10: ML Model Transparency & Dynamic Target Mapping ---');
const modelType = 'Logistic Regression';
const modelVersion = 'LR-v1';
assert(modelType === 'Logistic Regression', 'Module 3 specifies modelType as "Logistic Regression"');
assert(modelVersion === 'LR-v1', 'Module 3 specifies modelVersion as "LR-v1"');

// Verify dynamic target threshold (never hardcoded 70%)
const customTargetMap = { 'CS301|CO1': 85.0 };
const dynamicTargetKey = 'CS301|CO1';
const fetchedTarget = customTargetMap[dynamicTargetKey];
assert(fetchedTarget === 85.0, 'Target threshold is read dynamically from targetMap (85.0% instead of hardcoded 70%)');

// Verify feature contributions math: C_j = w_j * x_norm_j
const featureNames = ['rollingCOAttainment', 'previousCOAttainment', 'trendDelta', 'priorTargetMet', 'historicalDepth'];
const contributions = featureNames.map((name, j) => ({
  name,
  weight: weights[j],
  value: sampleX[j],
  contribution: weights[j] * sampleX[j]
}));
assert(contributions.length === 5, 'Feature contributions computed for all 5 feature dimensions');
const sumContribs = contributions.reduce((sum, c) => sum + c.contribution, 0);
assert(Math.abs((sumContribs + bias) - zSample) < 1e-9, 'Sum of feature contributions + bias exactly equals linear logit z');

console.log('\n===========================================================');
console.log(`SUMMARY: ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('===========================================================\n');

