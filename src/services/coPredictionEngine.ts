import {
  StandardizedAssessmentRecord,
  TargetMappingDictionary,
  PredictionFeatures,
  PredictionResult,
  TrainedPredictionModel
} from '../types/dataTypes';
import {
  getChronologicalAssessments,
  constructStudentFeatures,
  getStudentScoreInAssessment
} from './predictionFeatureEngine';
import {
  trainLogisticRegression,
  predictProbability,
  calculateMetrics,
  computeFeatureContributions
} from './ml/logisticRegression';

export const PREDICTION_FEATURE_NAMES = [
  'rollingCOAttainment',
  'previousCOAttainment',
  'trendDelta',
  'priorTargetMet',
  'historicalDepth',
  'scoreConsistency'
];

export const PREDICTION_FEATURE_DISPLAY_NAMES = [
  'Historical Mean CO Attainment (%)',
  'Latest Prior Assessment CO Attainment (%)',
  'Historical Attainment Trend / Delta (%)',
  'Prior Target Met Status (Binary)',
  'Historical Assessment Depth (Count)',
  'Performance Consistency StdDev (%)'
];

/**
 * Extracts raw numerical feature vector from PredictionFeatures.
 * Scaler will subsequently standardize each feature during training & inference.
 */
export function extractFeatureVector(feat: PredictionFeatures): number[] {
  return [
    feat.rollingCOAttainment,
    feat.previousCOAttainment,
    feat.trendDelta,
    feat.priorTargetMet ? 1.0 : 0.0,
    feat.historicalAssessments.length,
    feat.scoreConsistencyStdDev ?? 0
  ];
}

/**
 * Trains a transparent Logistic Regression classifier using chronological historical transitions.
 * Implements strict student-level train/test separation (70% Train / 30% Test) to prevent data leakage.
 */
export function trainPredictionModel(
  records: StandardizedAssessmentRecord[],
  courseId: string,
  targetMap: TargetMappingDictionary
): TrainedPredictionModel {
  const chronological = getChronologicalAssessments(records, courseId);

  // Distinct students and COs in course
  const studentSet = new Set<string>();
  const coSet = new Set<string>();

  records.forEach(r => {
    if (courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase()) {
      studentSet.add(r.student_id);
      coSet.add(r.co_id);
    }
  });

  const students = Array.from(studentSet).sort();
  const cos = Array.from(coSet).sort();

  // Student-level split: 70% train, 30% test
  const splitIndex = Math.max(1, Math.floor(students.length * 0.7));
  const trainStudents = new Set(students.slice(0, splitIndex));
  const testStudents = new Set(students.slice(splitIndex));

  const trainX: number[][] = [];
  const trainY: (0 | 1)[] = [];

  const testX: number[][] = [];
  const testY: (0 | 1)[] = [];

  // Generate temporal transitions (e.g. A1 -> A2, A1+A2 -> A3)
  for (let t = 1; t < chronological.length; t++) {
    const targetAssessment = chronological[t].assessmentId;

    students.forEach(sId => {
      cos.forEach(coId => {
        const targetKey = `${courseId.toUpperCase()}|${coId.toUpperCase()}`;
        const targetThreshold = targetMap[targetKey];
        if (targetThreshold === undefined || targetThreshold === null || isNaN(targetThreshold)) {
          return;
        }

        // Actual outcome at target assessment
        const outcomeScore = getStudentScoreInAssessment(
          records,
          sId,
          courseId,
          targetAssessment,
          coId
        );
        if (!outcomeScore) return;

        // Factual historical features strictly prior to target assessment
        const feat = constructStudentFeatures(
          records,
          sId,
          courseId,
          coId,
          targetAssessment,
          chronological,
          targetMap
        );
        if (!feat) return;

        const x = extractFeatureVector(feat);
        const y: 0 | 1 = outcomeScore.attainmentPct >= targetThreshold ? 1 : 0;

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

  // Fallback if insufficient historical transitions
  if (trainX.length === 0) {
    return {
      weights: [0.8, 0.6, 0.2, 1.2, 0.1, -0.1],
      bias: -0.5,
      featureNames: PREDICTION_FEATURE_NAMES,
      featureDisplayNames: PREDICTION_FEATURE_DISPLAY_NAMES,
      trainSampleCount: 0,
      testMetrics: null,
      scaler: {
        means: [65, 65, 0, 0.5, 2, 5],
        stds: [15, 15, 5, 0.5, 1, 3]
      },
      logLoss: 0.6931,
      epochs: 0,
      learningRate: 0.15,
      l2Lambda: 0.001,
      modelType: 'Logistic Regression',
      modelVersion: 'LR-v1'
    };
  }

  // Train Logistic Regression ML Model
  const lrModel = trainLogisticRegression(trainX, trainY, {
    learningRate: 0.15,
    epochs: 300,
    l2Lambda: 0.001,
    standardize: true,
    featureNames: PREDICTION_FEATURE_NAMES,
    featureDisplayNames: PREDICTION_FEATURE_DISPLAY_NAMES
  });

  // Evaluate strictly on held-out test student partition
  let testMetrics = null;
  if (testX.length > 0) {
    const testProbs = testX.map(xi => {
      const { probability } = predictProbability(
        lrModel.weights,
        lrModel.bias,
        xi,
        lrModel.scaler
      );
      return probability;
    });

    testMetrics = calculateMetrics(
      testY,
      testProbs,
      0.5,
      trainX.length,
      trainStudents.size,
      testStudents.size
    );
  }

  return {
    weights: lrModel.weights,
    bias: lrModel.bias,
    featureNames: PREDICTION_FEATURE_NAMES,
    featureDisplayNames: PREDICTION_FEATURE_DISPLAY_NAMES,
    trainSampleCount: trainX.length,
    testMetrics,
    scaler: lrModel.scaler,
    logLoss: lrModel.logLoss,
    epochs: lrModel.epochsCompleted,
    learningRate: 0.15,
    l2Lambda: 0.001,
    modelType: 'Logistic Regression',
    modelVersion: 'LR-v1'
  };
}

/**
 * Predicts the probability of a student meeting target for a single Course Outcome
 * using the trained Logistic Regression model.
 */
export function predictStudentCOAttainment(
  features: PredictionFeatures,
  model: TrainedPredictionModel,
  targetPct: number | null
): PredictionResult {
  const targetConfigured = targetPct !== null && !isNaN(targetPct);

  if (!targetConfigured) {
    return {
      studentId: features.studentId,
      courseId: features.courseId,
      coId: features.coId,
      predictionAssessment: features.predictionAssessment,
      targetPct: null,
      targetConfigured: false,
      probabilityMeetingTarget: 0,
      probabilityBelowTarget: 0,
      predictedStatus: 'Likely Below Target',
      features,
      modelType: 'Logistic Regression',
      modelVersion: 'LR-v1',
      linearCombinationScore: 0,
      evaluationMetrics: model.testMetrics
    };
  }

  const rawX = extractFeatureVector(features);
  const { probability, linearScore } = predictProbability(
    model.weights,
    model.bias,
    rawX,
    model.scaler
  );

  const probMeeting = probability;
  const probBelow = 1.0 - probMeeting;

  const pctMeeting = Math.round(probMeeting * 10000) / 100;
  const pctBelow = Math.round(probBelow * 10000) / 100;

  const predictedStatus: 'Likely to Meet Target' | 'Likely Below Target' =
    probMeeting >= 0.5 ? 'Likely to Meet Target' : 'Likely Below Target';

  // Compute individual feature contributions for faculty explainability
  const contributions = computeFeatureContributions(
    model.featureNames,
    model.featureDisplayNames || PREDICTION_FEATURE_DISPLAY_NAMES,
    rawX,
    model.weights,
    model.scaler
  );

  const enrichedFeatures: PredictionFeatures = {
    ...features,
    featureVector: rawX,
    featureContributions: contributions
  };

  return {
    studentId: features.studentId,
    courseId: features.courseId,
    coId: features.coId,
    predictionAssessment: features.predictionAssessment,
    targetPct,
    targetConfigured: true,
    probabilityMeetingTarget: pctMeeting,
    probabilityBelowTarget: pctBelow,
    predictedStatus,
    features: enrichedFeatures,
    modelType: 'Logistic Regression',
    modelVersion: 'LR-v1',
    linearCombinationScore: linearScore,
    evaluationMetrics: model.testMetrics
  };
}

/**
 * Generates predictions and cohort overview metrics for all students in scope.
 */
export function generateCohortPredictions(
  records: StandardizedAssessmentRecord[],
  courseId: string,
  coId: string,
  predictionAssessment: string,
  targetMap: TargetMappingDictionary,
  model: TrainedPredictionModel
): {
  predictions: PredictionResult[];
  summary: {
    totalEvaluated: number;
    predictedMet: number;
    predictedBelow: number;
    avgProbability: number;
  };
  hasHistoricalData: boolean;
} {
  const chronological = getChronologicalAssessments(records, courseId);
  const targetIndex = chronological.findIndex(
    a => a.assessmentId.toUpperCase() === predictionAssessment.toUpperCase()
  );

  // If predicting earliest assessment, there is no historical data
  if (targetIndex <= 0) {
    return {
      predictions: [],
      summary: {
        totalEvaluated: 0,
        predictedMet: 0,
        predictedBelow: 0,
        avgProbability: 0
      },
      hasHistoricalData: false
    };
  }

  const targetKey = `${courseId.toUpperCase()}|${coId.toUpperCase()}`;
  const targetPct = targetMap[targetKey] !== undefined ? targetMap[targetKey] : null;

  // Distinct students in course
  const studentSet = new Set<string>();
  records.forEach(r => {
    if (courseId === 'ALL' || r.course_id.toUpperCase() === courseId.toUpperCase()) {
      studentSet.add(r.student_id);
    }
  });

  const students = Array.from(studentSet).sort();
  const predictions: PredictionResult[] = [];

  let totalProb = 0;
  let predictedMet = 0;
  let predictedBelow = 0;

  students.forEach(sId => {
    const feat = constructStudentFeatures(
      records,
      sId,
      courseId,
      coId,
      predictionAssessment,
      chronological,
      targetMap
    );

    if (feat) {
      const pred = predictStudentCOAttainment(feat, model, targetPct);
      predictions.push(pred);

      totalProb += pred.probabilityMeetingTarget;
      if (pred.predictedStatus === 'Likely to Meet Target') {
        predictedMet++;
      } else {
        predictedBelow++;
      }
    }
  });

  const totalEvaluated = predictions.length;
  const avgProbability =
    totalEvaluated > 0 ? Math.round((totalProb / totalEvaluated) * 100) / 100 : 0;

  return {
    predictions,
    summary: {
      totalEvaluated,
      predictedMet,
      predictedBelow,
      avgProbability
    },
    hasHistoricalData: true
  };
}
