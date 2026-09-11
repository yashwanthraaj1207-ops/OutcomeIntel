import {
  ConfusionMatrix,
  FeatureScaler,
  FeatureContributionItem,
  PredictionEvaluationMetrics
} from '../../types/dataTypes';

export interface TrainingOptions {
  learningRate?: number;
  epochs?: number;
  l2Lambda?: number;
  tolerance?: number;
  standardize?: boolean;
  featureNames?: string[];
  featureDisplayNames?: string[];
}

export interface TrainedLRModel {
  weights: number[];
  bias: number;
  scaler: FeatureScaler;
  logLoss: number;
  epochsCompleted: number;
  featureNames: string[];
  featureDisplayNames: string[];
  trainAccuracy: number;
  lossHistory: number[];
  modelType: string;
  modelVersion: string;
}

/**
 * Standard Sigmoid activation function with numerical overflow clipping.
 * Formula: sigma(z) = 1 / (1 + exp(-z))
 * z is clipped to [-20, 20] to guarantee no IEEE 754 float overflow/underflow.
 */
export function sigmoid(z: number): number {
  if (isNaN(z)) return 0.5;
  const clipped = Math.max(-20, Math.min(20, z));
  return 1 / (1 + Math.exp(-clipped));
}

/**
 * Standardizes feature matrix X into zero-mean, unit-variance (z-score normalization).
 * Formula: z_ij = (x_ij - mu_j) / sigma_j
 * Gracefully handles zero-variance/constant features (std < 1e-7) by setting std to 1.0.
 */
export function standardizeFeatures(
  X: number[][],
  existingScaler?: FeatureScaler
): { standardizedX: number[][]; scaler: FeatureScaler } {
  const m = X.length;
  if (m === 0) {
    return {
      standardizedX: [],
      scaler: existingScaler || { means: [], stds: [] }
    };
  }

  const n = X[0].length;

  let means: number[];
  let stds: number[];

  if (existingScaler && existingScaler.means.length === n && existingScaler.stds.length === n) {
    means = existingScaler.means;
    stds = existingScaler.stds;
  } else {
    means = new Array(n).fill(0);
    stds = new Array(n).fill(0);

    // Compute column means
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        means[j] += X[i][j];
      }
    }
    for (let j = 0; j < n; j++) {
      means[j] /= m;
    }

    // Compute column standard deviations (population std)
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        const diff = X[i][j] - means[j];
        stds[j] += diff * diff;
      }
    }
    for (let j = 0; j < n; j++) {
      const variance = stds[j] / m;
      const s = Math.sqrt(variance);
      // Guard against division by zero for constant features
      stds[j] = s < 1e-7 ? 1.0 : s;
    }
  }

  // Apply standardization
  const standardizedX: number[][] = [];
  for (let i = 0; i < m; i++) {
    const row: number[] = new Array(n);
    for (let j = 0; j < n; j++) {
      row[j] = (X[i][j] - means[j]) / stds[j];
    }
    standardizedX.push(row);
  }

  return {
    standardizedX,
    scaler: { means, stds }
  };
}

/**
 * Calculates Binary Cross-Entropy (Log Loss).
 * Formula: LogLoss = -(1/m) * sum(y_i * ln(p_i) + (1 - y_i) * ln(1 - p_i))
 * Probabilities are clipped to [1e-15, 1 - 1e-15] to prevent ln(0).
 */
export function calculateLogLoss(yTrue: (0 | 1 | number)[], yProb: number[]): number {
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

/**
 * Computes True Positives, False Positives, True Negatives, and False Negatives.
 */
export function calculateConfusionMatrix(
  yTrue: (0 | 1 | number)[],
  yPred: (0 | 1 | number)[]
): ConfusionMatrix {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

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

/**
 * Calculates accuracy percentage: (TP + TN) / Total * 100.
 */
export function calculateAccuracy(
  yTrue: (0 | 1 | number)[],
  yPred: (0 | 1 | number)[]
): number {
  const m = Math.min(yTrue.length, yPred.length);
  if (m === 0) return 0;
  const cm = calculateConfusionMatrix(yTrue, yPred);
  return Math.round(((cm.tp + cm.tn) / m) * 10000) / 100;
}

/**
 * Calculates precision percentage: TP / (TP + FP) * 100.
 */
export function calculatePrecision(cm: ConfusionMatrix): number {
  const denom = cm.tp + cm.fp;
  if (denom === 0) return 0;
  return Math.round((cm.tp / denom) * 10000) / 100;
}

/**
 * Calculates recall / sensitivity percentage: TP / (TP + FN) * 100.
 */
export function calculateRecall(cm: ConfusionMatrix): number {
  const denom = cm.tp + cm.fn;
  if (denom === 0) return 0;
  return Math.round((cm.tp / denom) * 10000) / 100;
}

/**
 * Calculates F1-Score percentage: 2 * (Precision * Recall) / (Precision + Recall).
 */
export function calculateF1(cm: ConfusionMatrix): number {
  const prec = calculatePrecision(cm);
  const rec = calculateRecall(cm);
  const denom = prec + rec;
  if (denom === 0) return 0;
  return Math.round(((2 * prec * rec) / denom) * 100) / 100;
}

/**
 * Calculates area under ROC curve using Mann-Whitney U statistic.
 */
export function calculateRocAuc(yTrue: (0 | 1 | number)[], yProb: number[]): number | null {
  const m = Math.min(yTrue.length, yProb.length);
  if (m === 0) return null;

  const pairs: { actual: 0 | 1; prob: number }[] = [];
  let posCount = 0;
  for (let i = 0; i < m; i++) {
    const actual: 0 | 1 = yTrue[i] >= 0.5 ? 1 : 0;
    if (actual === 1) posCount++;
    pairs.push({ actual, prob: yProb[i] });
  }

  const negCount = m - posCount;
  if (posCount === 0 || negCount === 0) return null;

  // Sort descending by predicted probability
  pairs.sort((a, b) => b.prob - a.prob);

  let rankSum = 0;
  pairs.forEach((item, idx) => {
    if (item.actual === 1) {
      rankSum += m - idx;
    }
  });

  const uStat = rankSum - (posCount * (posCount + 1)) / 2;
  const auc = uStat / (posCount * negCount);
  return Math.round(auc * 1000) / 1000;
}

/**
 * Derives comprehensive academic evaluation metrics for predicted probabilities.
 */
export function calculateMetrics(
  yTrue: (0 | 1 | number)[],
  yProb: number[],
  threshold = 0.5,
  trainCount = 0,
  trainStudentsCount = 0,
  testStudentsCount = 0
): PredictionEvaluationMetrics {
  const yPred = yProb.map(p => (p >= threshold ? 1 : 0));
  const cm = calculateConfusionMatrix(yTrue, yPred);
  const testCount = yTrue.length;

  const accuracy = calculateAccuracy(yTrue, yPred);
  const precision = calculatePrecision(cm);
  const recall = calculateRecall(cm);
  const f1Score = calculateF1(cm);
  const rocAuc = calculateRocAuc(yTrue, yProb);
  const logLoss = calculateLogLoss(yTrue, yProb);

  return {
    trainCount,
    testCount,
    trainStudentsCount,
    testStudentsCount,
    accuracy,
    precision,
    recall,
    f1Score,
    rocAuc,
    confusionMatrix: cm,
    logLoss
  };
}

/**
 * Predicts calibrated probability P(y=1) using trained weights, bias, and optional scaler.
 * Formula:
 * 1. x_norm_j = (x_j - mu_j) / sigma_j
 * 2. z = bias + sum(w_j * x_norm_j)
 * 3. prob = sigma(z)
 */
export function predictProbability(
  weights: number[],
  bias: number,
  x: number[],
  scaler?: FeatureScaler
): { probability: number; linearScore: number } {
  let z = bias;
  const n = weights.length;

  for (let j = 0; j < n; j++) {
    const rawVal = x[j] ?? 0;
    const normalizedVal =
      scaler && scaler.means[j] !== undefined && scaler.stds[j] !== undefined
        ? (rawVal - scaler.means[j]) / scaler.stds[j]
        : rawVal;

    z += normalizedVal * weights[j];
  }

  return {
    probability: sigmoid(z),
    linearScore: Math.round(z * 1000) / 1000
  };
}

/**
 * Binary decision thresholding: prob >= threshold ? 1 : 0.
 */
export function predictClass(prob: number, threshold = 0.5): 0 | 1 {
  return prob >= threshold ? 1 : 0;
}

/**
 * Computes individual feature contributions: C_j = w_j * normalized(x_j).
 * Provides full pedagogical transparency into how each factor drives the forecast.
 */
export function computeFeatureContributions(
  featureNames: string[],
  featureDisplayNames: string[],
  rawValues: number[],
  weights: number[],
  scaler?: FeatureScaler
): FeatureContributionItem[] {
  const items: FeatureContributionItem[] = [];
  const n = Math.min(featureNames.length, rawValues.length, weights.length);

  for (let j = 0; j < n; j++) {
    const raw = rawValues[j];
    const mean = scaler?.means[j] ?? 0;
    const std = scaler?.stds[j] ?? 1;
    const normalized = (raw - mean) / std;
    const weight = weights[j];
    const contribution = Math.round(weight * normalized * 1000) / 1000;

    items.push({
      featureName: featureNames[j],
      displayName: featureDisplayNames[j] || featureNames[j],
      rawValue: Math.round(raw * 100) / 100,
      normalizedValue: Math.round(normalized * 1000) / 1000,
      weight: Math.round(weight * 1000) / 1000,
      contribution
    });
  }

  return items;
}

/**
 * Trains a pure Logistic Regression model using Batch Gradient Descent with L2 Regularization.
 *
 * Cost Function:
 * J(w, b) = -(1/m) * sum[y_i * ln(p_i) + (1-y_i) * ln(1-p_i)] + (lambda / (2*m)) * sum(w_j^2)
 *
 * Gradients:
 * dJ/dw_j = (1/m) * sum[(p_i - y_i) * x_ij] + (lambda / m) * w_j
 * dJ/db   = (1/m) * sum(p_i - y_i)
 *
 * Guarantees 100% deterministic reproducibility:
 * - Weights initialized to 0.0
 * - Bias initialized to 0.0
 * - No pseudo-random seeds or hidden stochastic variations.
 */
export function trainLogisticRegression(
  X: number[][],
  y: (0 | 1 | number)[],
  options: TrainingOptions = {}
): TrainedLRModel {
  const {
    learningRate = 0.15,
    epochs = 300,
    l2Lambda = 0.001,
    tolerance = 1e-6,
    standardize = true,
    featureNames = [],
    featureDisplayNames = []
  } = options;

  const m = X.length;
  const numFeatures = m > 0 ? X[0].length : 0;

  // Fallback for zero sample edge case
  if (m === 0 || numFeatures === 0) {
    return {
      weights: new Array(numFeatures).fill(0),
      bias: 0,
      scaler: { means: new Array(numFeatures).fill(0), stds: new Array(numFeatures).fill(1) },
      logLoss: 0.6931, // ln(2)
      epochsCompleted: 0,
      featureNames,
      featureDisplayNames,
      trainAccuracy: 0,
      lossHistory: [],
      modelType: 'Logistic Regression',
      modelVersion: 'LR-v1'
    };
  }

  // Feature standardization
  let trainingX = X;
  let scaler: FeatureScaler = {
    means: new Array(numFeatures).fill(0),
    stds: new Array(numFeatures).fill(1)
  };

  if (standardize) {
    const stdRes = standardizeFeatures(X);
    trainingX = stdRes.standardizedX;
    scaler = stdRes.scaler;
  }

  // Deterministic Zero-Initialization
  let weights = new Array(numFeatures).fill(0.0);
  let bias = 0.0;

  const lossHistory: number[] = [];
  let prevLoss = Infinity;
  let epochsCompleted = 0;

  for (let ep = 0; ep < epochs; ep++) {
    epochsCompleted = ep + 1;
    const pVec: number[] = new Array(m);
    const errVec: number[] = new Array(m);

    // Forward pass
    for (let i = 0; i < m; i++) {
      let z = bias;
      const xi = trainingX[i];
      for (let j = 0; j < numFeatures; j++) {
        z += xi[j] * weights[j];
      }
      const p = sigmoid(z);
      pVec[i] = p;
      errVec[i] = p - (y[i] >= 0.5 ? 1 : 0);
    }

    // Compute cost with L2 regularization
    let loss = 0;
    const eps = 1e-15;
    for (let i = 0; i < m; i++) {
      const target = y[i] >= 0.5 ? 1 : 0;
      const p = Math.max(eps, Math.min(1 - eps, pVec[i]));
      loss += target * Math.log(p) + (1 - target) * Math.log(1 - p);
    }
    loss = -loss / m;

    let l2Cost = 0;
    for (let j = 0; j < numFeatures; j++) {
      l2Cost += weights[j] * weights[j];
    }
    loss += (l2Lambda / (2 * m)) * l2Cost;

    lossHistory.push(Math.round(loss * 10000) / 10000);

    // Early stopping check
    if (Math.abs(prevLoss - loss) < tolerance && ep > 20) {
      break;
    }
    prevLoss = loss;

    // Backward pass (Gradients)
    const dw = new Array(numFeatures).fill(0.0);
    let db = 0.0;

    for (let i = 0; i < m; i++) {
      const err = errVec[i];
      const xi = trainingX[i];
      for (let j = 0; j < numFeatures; j++) {
        dw[j] += err * xi[j];
      }
      db += err;
    }

    // Gradient descent step
    for (let j = 0; j < numFeatures; j++) {
      const grad = dw[j] / m + (l2Lambda / m) * weights[j];
      weights[j] -= learningRate * grad;
    }
    bias -= (learningRate * db) / m;
  }

  // Compute final train accuracy
  const finalProbs = trainingX.map(xi => {
    let z = bias;
    for (let j = 0; j < numFeatures; j++) {
      z += xi[j] * weights[j];
    }
    return sigmoid(z);
  });

  const finalPreds = finalProbs.map(p => (p >= 0.5 ? 1 : 0));
  const trainAccuracy = calculateAccuracy(y, finalPreds);
  const finalLogLoss = calculateLogLoss(y, finalProbs);

  return {
    weights: weights.map(w => Math.round(w * 10000) / 10000),
    bias: Math.round(bias * 10000) / 10000,
    scaler,
    logLoss: finalLogLoss,
    epochsCompleted,
    featureNames,
    featureDisplayNames,
    trainAccuracy,
    lossHistory,
    modelType: 'Logistic Regression',
    modelVersion: 'LR-v1'
  };
}

