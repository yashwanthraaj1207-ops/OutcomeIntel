import { ConfusionMatrix, PredictionEvaluationMetrics } from '../types/dataTypes';

export interface EvaluationSamplePair {
  actual: 0 | 1;
  predicted: 0 | 1;
  prob: number;
}

/**
 * Calculates True Positives, False Positives, True Negatives, and False Negatives.
 */
export function computeConfusionMatrix(pairs: EvaluationSamplePair[]): ConfusionMatrix {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  pairs.forEach(p => {
    if (p.actual === 1 && p.predicted === 1) tp++;
    else if (p.actual === 0 && p.predicted === 1) fp++;
    else if (p.actual === 0 && p.predicted === 0) tn++;
    else if (p.actual === 1 && p.predicted === 0) fn++;
  });

  return { tp, fp, tn, fn };
}

/**
 * Calculates area under the ROC curve (ROC-AUC) using Mann-Whitney U rank statistic.
 * Deterministic, exact, and library-free.
 */
export function computeRocAuc(pairs: EvaluationSamplePair[]): number | null {
  if (pairs.length === 0) return null;

  const posCount = pairs.filter(p => p.actual === 1).length;
  const negCount = pairs.length - posCount;

  if (posCount === 0 || negCount === 0) {
    return null; // Both positive and negative cases are required for ROC-AUC
  }

  // Sort descending by predicted probability
  const sorted = [...pairs].sort((a, b) => b.prob - a.prob);

  let rankSum = 0;
  sorted.forEach((item, idx) => {
    if (item.actual === 1) {
      // Rank from lowest (1) to highest (N)
      rankSum += sorted.length - idx;
    }
  });

  const uStat = rankSum - (posCount * (posCount + 1)) / 2;
  const auc = uStat / (posCount * negCount);

  return Math.round(auc * 1000) / 1000;
}

/**
 * Calculates academic classification metrics on held-out test evaluation samples.
 */
export function evaluatePredictions(
  testPairs: EvaluationSamplePair[],
  trainCount: number,
  testCount: number,
  trainStudentsCount: number,
  testStudentsCount: number
): PredictionEvaluationMetrics {
  const cm = computeConfusionMatrix(testPairs);
  const total = testPairs.length;

  if (total === 0) {
    return {
      trainCount,
      testCount,
      trainStudentsCount,
      testStudentsCount,
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      rocAuc: null,
      confusionMatrix: cm
    };
  }

  const accuracy = (cm.tp + cm.tn) / total;
  const precision = cm.tp + cm.fp > 0 ? cm.tp / (cm.tp + cm.fp) : 0;
  const recall = cm.tp + cm.fn > 0 ? cm.tp / (cm.tp + cm.fn) : 0;
  const f1Score =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const rocAuc = computeRocAuc(testPairs);

  return {
    trainCount,
    testCount,
    trainStudentsCount,
    testStudentsCount,
    accuracy: Math.round(accuracy * 10000) / 100,
    precision: Math.round(precision * 10000) / 100,
    recall: Math.round(recall * 10000) / 100,
    f1Score: Math.round(f1Score * 10000) / 100,
    rocAuc,
    confusionMatrix: cm
  };
}
