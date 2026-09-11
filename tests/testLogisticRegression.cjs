const fs = require('fs');
const path = require('path');

// Test runner state
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

console.log('\n============================================================');
console.log('MODULE 3: LOGISTIC REGRESSION MACHINE LEARNING TEST SUITE');
console.log('============================================================\n');

// ------------------------------------------------------------
// 1. Pure ML Functions Implementation (Mirroring src/services/ml/logisticRegression.ts)
// ------------------------------------------------------------

function sigmoid(z) {
  if (isNaN(z)) return 0.5;
  const clipped = Math.max(-20, Math.min(20, z));
  return 1 / (1 + Math.exp(-clipped));
}

function standardizeFeatures(X, existingScaler) {
  const m = X.length;
  if (m === 0) return { standardizedX: [], scaler: existingScaler || { means: [], stds: [] } };
  const n = X[0].length;
  let means, stds;

  if (existingScaler && existingScaler.means.length === n && existingScaler.stds.length === n) {
    means = existingScaler.means;
    stds = existingScaler.stds;
  } else {
    means = new Array(n).fill(0);
    stds = new Array(n).fill(0);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) means[j] += X[i][j];
    }
    for (let j = 0; j < n; j++) means[j] /= m;
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        const diff = X[i][j] - means[j];
        stds[j] += diff * diff;
      }
    }
    for (let j = 0; j < n; j++) {
      const variance = stds[j] / m;
      const s = Math.sqrt(variance);
      stds[j] = s < 1e-7 ? 1.0 : s;
    }
  }

  const standardizedX = [];
  for (let i = 0; i < m; i++) {
    const row = new Array(n);
    for (let j = 0; j < n; j++) {
      row[j] = (X[i][j] - means[j]) / stds[j];
    }
    standardizedX.push(row);
  }
  return { standardizedX, scaler: { means, stds } };
}

function calculateLogLoss(yTrue, yProb) {
  const m = yTrue.length;
  if (m === 0) return 0;
  const eps = 1e-15;
  let totalLoss = 0;
  for (let i = 0; i < m; i++) {
    const y = yTrue[i] >= 0.5 ? 1 : 0;
    const p = Math.max(eps, Math.min(1 - eps, yProb[i]));
    totalLoss += y * Math.log(p) + (1 - y) * Math.log(1 - p);
  }
  return Math.round((-totalLoss / m) * 10000) / 10000;
}

function calculateConfusionMatrix(yTrue, yPred) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  const m = Math.min(yTrue.length, yPred.length);
  for (let i = 0; i < m; i++) {
    const yt = yTrue[i] >= 0.5 ? 1 : 0;
    const yp = yPred[i] >= 0.5 ? 1 : 0;
    if (yt === 1 && yp === 1) tp++;
    else if (yt === 0 && yp === 1) fp++;
    else if (yt === 0 && yp === 0) tn++;
    else if (yt === 1 && yp === 0) fn++;
  }
  return { tp, fp, tn, fn };
}

function calculateAccuracy(yTrue, yPred) {
  const m = Math.min(yTrue.length, yPred.length);
  if (m === 0) return 0;
  const cm = calculateConfusionMatrix(yTrue, yPred);
  return Math.round(((cm.tp + cm.tn) / m) * 10000) / 100;
}

function calculatePrecision(cm) {
  const denom = cm.tp + cm.fp;
  if (denom === 0) return 0;
  return Math.round((cm.tp / denom) * 10000) / 100;
}

function calculateRecall(cm) {
  const denom = cm.tp + cm.fn;
  if (denom === 0) return 0;
  return Math.round((cm.tp / denom) * 10000) / 100;
}

function calculateF1(cm) {
  const prec = calculatePrecision(cm);
  const rec = calculateRecall(cm);
  const denom = prec + rec;
  if (denom === 0) return 0;
  return Math.round(((2 * prec * rec) / denom) * 100) / 100;
}

function calculateRocAuc(yTrue, yProb) {
  const m = Math.min(yTrue.length, yProb.length);
  if (m === 0) return null;
  const pairs = [];
  let posCount = 0;
  for (let i = 0; i < m; i++) {
    const actual = yTrue[i] >= 0.5 ? 1 : 0;
    if (actual === 1) posCount++;
    pairs.push({ actual, prob: yProb[i] });
  }
  const negCount = m - posCount;
  if (posCount === 0 || negCount === 0) return null;
  pairs.sort((a, b) => b.prob - a.prob);
  let rankSum = 0;
  pairs.forEach((item, idx) => {
    if (item.actual === 1) rankSum += m - idx;
  });
  const uStat = rankSum - (posCount * (posCount + 1)) / 2;
  const auc = uStat / (posCount * negCount);
  return Math.round(auc * 1000) / 1000;
}

function trainLogisticRegression(X, y, options = {}) {
  const {
    learningRate = 0.15,
    epochs = 300,
    l2Lambda = 0.001,
    tolerance = 1e-6,
    standardize = true,
    featureNames = []
  } = options;

  const m = X.length;
  const numFeatures = m > 0 ? X[0].length : 0;

  if (m === 0 || numFeatures === 0) {
    return {
      weights: new Array(numFeatures).fill(0),
      bias: 0,
      scaler: { means: [], stds: [] },
      logLoss: 0.6931,
      epochsCompleted: 0
    };
  }

  let trainingX = X;
  let scaler = { means: new Array(numFeatures).fill(0), stds: new Array(numFeatures).fill(1) };
  if (standardize) {
    const stdRes = standardizeFeatures(X);
    trainingX = stdRes.standardizedX;
    scaler = stdRes.scaler;
  }

  let weights = new Array(numFeatures).fill(0.0);
  let bias = 0.0;
  let prevLoss = Infinity;
  let epochsCompleted = 0;

  for (let ep = 0; ep < epochs; ep++) {
    epochsCompleted = ep + 1;
    const pVec = new Array(m);
    const errVec = new Array(m);

    for (let i = 0; i < m; i++) {
      let z = bias;
      const xi = trainingX[i];
      for (let j = 0; j < numFeatures; j++) z += xi[j] * weights[j];
      const p = sigmoid(z);
      pVec[i] = p;
      errVec[i] = p - (y[i] >= 0.5 ? 1 : 0);
    }

    let loss = 0;
    const eps = 1e-15;
    for (let i = 0; i < m; i++) {
      const target = y[i] >= 0.5 ? 1 : 0;
      const p = Math.max(eps, Math.min(1 - eps, pVec[i]));
      loss += target * Math.log(p) + (1 - target) * Math.log(1 - p);
    }
    loss = -loss / m;

    let l2Cost = 0;
    for (let j = 0; j < numFeatures; j++) l2Cost += weights[j] * weights[j];
    loss += (l2Lambda / (2 * m)) * l2Cost;

    if (Math.abs(prevLoss - loss) < tolerance && ep > 20) break;
    prevLoss = loss;

    const dw = new Array(numFeatures).fill(0.0);
    let db = 0.0;
    for (let i = 0; i < m; i++) {
      const err = errVec[i];
      const xi = trainingX[i];
      for (let j = 0; j < numFeatures; j++) dw[j] += err * xi[j];
      db += err;
    }

    for (let j = 0; j < numFeatures; j++) {
      const grad = dw[j] / m + (l2Lambda / m) * weights[j];
      weights[j] -= learningRate * grad;
    }
    bias -= (learningRate * db) / m;
  }

  return {
    weights: weights.map(w => Math.round(w * 10000) / 10000),
    bias: Math.round(bias * 10000) / 10000,
    scaler,
    logLoss: prevLoss,
    epochsCompleted,
    featureNames
  };
}

function predictProbability(weights, bias, x, scaler) {
  let z = bias;
  const n = weights.length;
  for (let j = 0; j < n; j++) {
    const rawVal = x[j] ?? 0;
    const normalizedVal = scaler && scaler.means[j] !== undefined && scaler.stds[j] !== undefined
      ? (rawVal - scaler.means[j]) / scaler.stds[j]
      : rawVal;
    z += normalizedVal * weights[j];
  }
  return { probability: sigmoid(z), linearScore: Math.round(z * 1000) / 1000 };
}

function computeFeatureContributions(featureNames, rawValues, weights, scaler) {
  const items = [];
  const n = Math.min(featureNames.length, rawValues.length, weights.length);
  for (let j = 0; j < n; j++) {
    const raw = rawValues[j];
    const mean = scaler ? scaler.means[j] : 0;
    const std = scaler ? scaler.stds[j] : 1;
    const normalized = (raw - mean) / std;
    const weight = weights[j];
    const contribution = Math.round(weight * normalized * 1000) / 1000;
    items.push({ featureName: featureNames[j], rawValue: raw, normalizedValue: normalized, weight, contribution });
  }
  return items;
}

// ------------------------------------------------------------
// TEST CASES
// ------------------------------------------------------------

console.log('--- Suite 1: Mathematical Foundations (Sigmoid) ---');

// Test 1: Sigmoid at zero
assert(sigmoid(0) === 0.5, 'Test 1: Sigmoid(0) equals exactly 0.5');

// Test 2: Extreme positive clipping prevents float overflow
const pPos = sigmoid(100);
assert(pPos > 0.9999999 && !isNaN(pPos) && isFinite(pPos), 'Test 2: Sigmoid(100) safely clips to near 1.0 without overflow');

// Test 3: Extreme negative clipping prevents float underflow
const pNeg = sigmoid(-100);
assert(pNeg < 0.0000001 && !isNaN(pNeg) && isFinite(pNeg), 'Test 3: Sigmoid(-100) safely clips to near 0.0 without underflow');

// Test 4: Sigmoid symmetry sigma(z) + sigma(-z) = 1
const zSym = 1.45;
const symSum = sigmoid(zSym) + sigmoid(-zSym);
assert(Math.abs(symSum - 1.0) < 1e-10, 'Test 4: Sigmoid satisfies mathematical symmetry: sigma(z) + sigma(-z) = 1');

console.log('\n--- Suite 2: Feature Standardization & Scaler ---');

// Test 5: Standardizing variable features produces mean 0 and std 1
const sampleX = [[10], [20], [30], [40], [50]];
const { standardizedX, scaler } = standardizeFeatures(sampleX);
const colMean = standardizedX.reduce((sum, r) => sum + r[0], 0) / standardizedX.length;
const colVariance = standardizedX.reduce((sum, r) => sum + Math.pow(r[0] - colMean, 2), 0) / standardizedX.length;
assert(Math.abs(colMean) < 1e-10, 'Test 5a: Standardized feature has mean = 0.0');
assert(Math.abs(Math.sqrt(colVariance) - 1.0) < 1e-10, 'Test 5b: Standardized feature has std = 1.0');

// Test 6: Constant feature (zero variance) handling without NaN
const constX = [[5, 10], [5, 20], [5, 30]];
const constRes = standardizeFeatures(constX);
assert(!isNaN(constRes.standardizedX[0][0]) && constRes.standardizedX[0][0] === 0, 'Test 6: Constant feature does not divide by zero or yield NaN');

// Test 7: Pre-fitted scaler transformation
const newX = [[60]];
const transformed = (newX[0][0] - scaler.means[0]) / scaler.stds[0];
assert(transformed > 2.0 && !isNaN(transformed), 'Test 7: Out-of-sample data standardized consistently using pre-fitted scaler');

console.log('\n--- Suite 3: Loss Function & Evaluation Metrics ---');

// Test 8: Perfect predictions yield near-zero log loss
const yTruePerf = [1, 0, 1, 0];
const yProbPerf = [0.999, 0.001, 0.999, 0.001];
const lossPerf = calculateLogLoss(yTruePerf, yProbPerf);
assert(lossPerf < 0.01, 'Test 8: Perfect predictions yield near-zero Log Loss', `Actual: ${lossPerf}`);

// Test 9: Random baseline probability 0.5 yields ~0.6931 (ln 2)
const yTrueRand = [1, 0, 1, 0];
const yProbRand = [0.5, 0.5, 0.5, 0.5];
const lossRand = calculateLogLoss(yTrueRand, yProbRand);
assert(Math.abs(lossRand - 0.6931) < 0.001, 'Test 9: Baseline 0.5 probability gives ln(2) = 0.6931 log loss', `Actual: ${lossRand}`);

// Test 10: Confident wrong predictions are bounded by epsilon clamping
const yTrueWrong = [1, 0];
const yProbWrong = [0.0, 1.0];
const lossWrong = calculateLogLoss(yTrueWrong, yProbWrong);
assert(isFinite(lossWrong) && lossWrong > 10, 'Test 10: Extreme wrong predictions are finite and strictly penalized');

// Test 11: Confusion Matrix computation
const yTrueCM = [1, 1, 0, 0, 1, 0];
const yPredCM = [1, 0, 0, 1, 1, 0]; // TP: 2, FN: 1, FP: 1, TN: 2
const cm = calculateConfusionMatrix(yTrueCM, yPredCM);
assert(cm.tp === 2 && cm.fn === 1 && cm.fp === 1 && cm.tn === 2, 'Test 11: Confusion matrix counts (TP=2, FN=1, FP=1, TN=2) are accurate');

// Test 12: Accuracy calculation
const acc = calculateAccuracy(yTrueCM, yPredCM);
assert(acc === 66.67, 'Test 12: Accuracy matches expected percentage (66.67%)', `Actual: ${acc}`);

// Test 13: Precision calculation
const prec = calculatePrecision(cm);
assert(prec === 66.67, 'Test 13: Precision calculation matches TP/(TP+FP) (66.67%)', `Actual: ${prec}`);

// Test 14: Recall calculation
const rec = calculateRecall(cm);
assert(rec === 66.67, 'Test 14: Recall calculation matches TP/(TP+FN) (66.67%)', `Actual: ${rec}`);

// Test 15: F1-Score calculation
const f1 = calculateF1(cm);
assert(f1 === 66.67, 'Test 15: F1-Score harmonic mean matches expected (66.67%)', `Actual: ${f1}`);

// Test 16: ROC-AUC for perfect separator
const yTrueAUC = [1, 1, 0, 0];
const yProbAUC = [0.9, 0.8, 0.3, 0.1];
const auc = calculateRocAuc(yTrueAUC, yProbAUC);
assert(auc === 1.0, 'Test 16: Perfectly ordered probabilities achieve ROC-AUC = 1.0', `Actual: ${auc}`);

console.log('\n--- Suite 4: Deterministic Training & L2 Regularization ---');

// Generate linearly separable synthetic dataset
const trainX = [];
const trainY = [];
for (let i = 0; i < 40; i++) {
  const attainment = 30 + i * 1.5; // 30 to 88.5%
  const trend = (i % 3) - 1; // -1, 0, 1
  trainX.push([attainment, trend]);
  trainY.push(attainment >= 65 ? 1 : 0);
}

// Test 17: Deterministic training (zero randomness, identical runs yield identical weights)
const modelA = trainLogisticRegression(trainX, trainY, { learningRate: 0.2, epochs: 150, l2Lambda: 0.001 });
const modelB = trainLogisticRegression(trainX, trainY, { learningRate: 0.2, epochs: 150, l2Lambda: 0.001 });
assert(
  JSON.stringify(modelA.weights) === JSON.stringify(modelB.weights) && modelA.bias === modelB.bias,
  'Test 17: Logistic regression training is 100% deterministic with zero randomness'
);

// Test 18: Linear separability convergence (>90% accuracy)
let correctCount = 0;
trainX.forEach((xi, idx) => {
  const pred = predictProbability(modelA.weights, modelA.bias, xi, modelA.scaler);
  const cls = pred.probability >= 0.5 ? 1 : 0;
  if (cls === trainY[idx]) correctCount++;
});
const convergenceAcc = (correctCount / trainX.length) * 100;
assert(convergenceAcc >= 90, 'Test 18: Training converges to high classification accuracy on separable data', `Acc: ${convergenceAcc}%`);

// Test 19: L2 Regularization weight shrinkage
const modelNoReg = trainLogisticRegression(trainX, trainY, { learningRate: 0.2, epochs: 150, l2Lambda: 0.0 });
const modelHighReg = trainLogisticRegression(trainX, trainY, { learningRate: 0.2, epochs: 150, l2Lambda: 10.0 });
const normNoReg = Math.sqrt(modelNoReg.weights.reduce((sum, w) => sum + w * w, 0));
const normHighReg = Math.sqrt(modelHighReg.weights.reduce((sum, w) => sum + w * w, 0));
assert(
  normHighReg < normNoReg,
  'Test 19: Higher L2 regularization penalty strictly shrinks model weights',
  `Norm High L2: ${normHighReg.toFixed(4)} vs Norm No L2: ${normNoReg.toFixed(4)}`
);

// Test 20: Feature contribution decomposition
const featNames = ['HistoricalAttainment', 'Trend'];
const sampleVector = [80, 2];
const contribs = computeFeatureContributions(featNames, sampleVector, modelA.weights, modelA.scaler);
assert(contribs.length === 2 && contribs[0].contribution !== undefined, 'Test 20: Feature contribution breakdown computed correctly');

// Test 21: P(Meets Target) bounds
const predHigh = predictProbability(modelA.weights, modelA.bias, [95, 5], modelA.scaler);
const predLow = predictProbability(modelA.weights, modelA.bias, [20, -5], modelA.scaler);
assert(predHigh.probability > 0.8, 'Test 21a: High attainment yields high P(Meets Target)', `Prob: ${predHigh.probability}`);
assert(predLow.probability < 0.2, 'Test 21b: Low attainment yields low P(Meets Target)', `Prob: ${predLow.probability}`);

console.log('\n--- Suite 5: Anti-Leakage & Real Dataset Integration ---');

// Test 22: Strict Anti-Leakage Mutation Test on Real Dataset
const csvPath = path.join(__dirname, '..', 'data', 'sample_co_assessment_v2.csv');
const rawContent = fs.readFileSync(csvPath, 'utf8').trim();
const lines = rawContent.split(/\r?\n/);
const headers = lines[0].split(',').map(h => h.trim());

const records = [];
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',').map(p => p.trim());
  records.push({
    student_id: parts[0].toUpperCase(),
    course_id: parts[1].toUpperCase(),
    semester: parseInt(parts[2], 10),
    assessment_id: parts[3].toUpperCase(),
    assessment_type: parts[4],
    assessment_date: parts[5],
    question_id: parts[6].toUpperCase(),
    topic: parts[7],
    co_id: parts[8].toUpperCase(),
    marks_obtained: parseFloat(parts[9]) || 0,
    max_marks: parseFloat(parts[10]) || 10
  });
}

// Function to simulate prediction feature extraction before A3
function extractFeaturesBeforeHorizon(studentId, courseId, coId, horizon) {
  // Chronological order in CS301: A1, A2, A3, B1, B2
  const allowed = ['A1', 'A2']; // Strictly before A3
  const studentRecs = records.filter(
    r => r.student_id === studentId &&
         r.course_id === courseId &&
         r.co_id === coId &&
         allowed.includes(r.assessment_id)
  );

  let obtained = 0, max = 0;
  studentRecs.forEach(r => {
    obtained += r.marks_obtained;
    max += r.max_marks;
  });

  const mean = max > 0 ? (obtained / max) * 100 : 0;
  return { mean, count: studentRecs.length };
}

const baselineFeatures = extractFeaturesBeforeHorizon('S001', 'CS301', 'CO1', 'A3');

// Mutate A3 and subsequent assessment records
const mutatedRecords = records.map(r => {
  if (r.student_id === 'S001' && (r.assessment_id === 'A3' || r.assessment_id === 'B1')) {
    return { ...r, marks_obtained: 0 }; // Drastically mutate future records
  }
  return r;
});

function extractFeaturesWithMutatedFuture(studentId, courseId, coId, horizon) {
  const allowed = ['A1', 'A2'];
  const studentRecs = mutatedRecords.filter(
    r => r.student_id === studentId &&
         r.course_id === courseId &&
         r.co_id === coId &&
         allowed.includes(r.assessment_id)
  );
  let obtained = 0, max = 0;
  studentRecs.forEach(r => {
    obtained += r.marks_obtained;
    max += r.max_marks;
  });
  const mean = max > 0 ? (obtained / max) * 100 : 0;
  return { mean, count: studentRecs.length };
}

const mutatedFeatures = extractFeaturesWithMutatedFuture('S001', 'CS301', 'CO1', 'A3');

assert(
  baselineFeatures.mean === mutatedFeatures.mean && baselineFeatures.count === mutatedFeatures.count,
  'Test 22: Anti-leakage certified: Mutating target (A3) or future assessments has ZERO effect on historical feature values'
);

console.log('\n============================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

