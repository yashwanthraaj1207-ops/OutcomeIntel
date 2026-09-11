export interface RawAssessmentRow {
  student_id?: string;
  course_id?: string;
  semester?: string;
  assessment_id?: string;
  assessment_type?: string;
  assessment_date?: string;
  question_id?: string;
  topic?: string;
  co_id?: string;
  marks_obtained?: string;
  max_marks?: string;
  attendance_percentage?: string;
  assignment_score?: string;
  lab_score?: string;
  cohort?: string;
  [key: string]: string | undefined;
}

export interface RawMappingRow {
  course_id?: string;
  question_id?: string;
  topic?: string;
  co_id?: string;
  [key: string]: string | undefined;
}

export interface RawTargetRow {
  course_id?: string;
  co_id?: string;
  target_attainment_percentage?: string;
  [key: string]: string | undefined;
}

export interface StandardizedAssessmentRecord {
  rowNumber: number;
  student_id: string;
  course_id: string;
  semester: number;
  assessment_id: string;
  assessment_type: string;
  assessment_date: string;
  question_id: string;
  topic: string;
  co_id: string;
  marks_obtained: number;
  max_marks: number;
  attendance_percentage?: number;
  assignment_score?: number;
  lab_score?: number;
  cohort?: string;
}

export interface StandardizedMappingRecord {
  rowNumber: number;
  course_id: string;
  question_id: string;
  topic: string;
  co_id: string;
}

export interface StandardizedTargetRecord {
  rowNumber: number;
  course_id: string;
  co_id: string;
  target_attainment_percentage: number;
}

export type ErrorSeverity = 'blocking' | 'warning';

export interface ValidationError {
  id: string;
  file: 'assessment' | 'mapping' | 'target' | 'cross-file';
  rowNumber?: number;
  field?: string;
  severity: ErrorSeverity;
  code: string;
  message: string;
}

export interface ValidationSummaryStats {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  missingRequiredValues: number;
  invalidMarks: number;
  duplicateRecords: number;
  missingTopicMappings: number;
  missingCOMappings: number;
  structuralErrors: number;
  warnings: number;
}

export interface DatasetStats {
  totalRecords: number;
  uniqueStudents: number;
  uniqueCourses: string[];
  uniqueAssessments: string[];
  uniqueQuestions: number;
  uniqueTopics: number;
  uniqueCOs: string[];
  averageMarksRatio: number;
  cohort: string;
}

export interface CourseMetadata {
  courseId: string;
  courseName: string;
  semester: string;
  section: string;
}

export interface UploadedFileState<T> {
  file: File | null;
  fileName: string;
  fileSize: number;
  status: 'empty' | 'loaded' | 'warning' | 'invalid';
  rawRows: T[];
  headers: string[];
  errorCount: number;
  warningCount: number;
}

// ==========================================
// MODULE 2: CO ANALYTICS TYPES
// ==========================================

export interface AnalyticsFilters {
  courseId: string;
  semester: string;
  assessmentId: string;
  coId: string;
}

export type TargetMappingDictionary = Record<string, number>; // key: `${course_id}|${co_id}` -> percentage

export interface COAttainmentItem {
  courseId: string;
  coId: string;
  attainmentPct: number; // Mean score attainment %
  targetPct: number | null;
  targetConfigured: boolean;
  gapPct: number | null;
  status: 'Target Met' | 'Below Target' | 'Target Not Configured';
  questionCount: number;
  observationCount: number;
  totalMarksObtained: number;
  totalMaxMarks: number;
  studentThresholdAttainmentPct: number; // % of students scoring >= target
  studentsMeetingTarget: number;
  totalStudents: number;
}

export interface AssessmentBreakdownCell {
  attainmentPct: number;
  observations: number;
  marksObtained: number;
  maxMarks: number;
}

export interface AssessmentBreakdownRow {
  coId: string;
  courseId: string;
  assessmentScores: Record<string, AssessmentBreakdownCell | null>;
}

export interface AssessmentBreakdownMatrix {
  assessments: string[];
  cos: string[];
  rows: AssessmentBreakdownRow[];
}

export interface TopicPerformanceItem {
  topic: string;
  coId: string;
  courseId: string;
  questionCount: number;
  observationCount: number;
  totalMarksObtained: number;
  totalMaxMarks: number;
  averageMarks: number;
  maxMarks: number;
  attainmentPct: number;
  targetPct: number | null;
  targetConfigured: boolean;
  gapPct: number | null;
  status: 'Target Met' | 'Below Target' | 'Target Not Configured';
}

export interface StudentAttainmentBucket {
  rangeLabel: string;
  studentCount: number;
  percentage: number;
  isTargetMetBucket: boolean;
}

export interface StudentAttainmentDistribution {
  coId: string;
  courseId: string;
  targetPct: number | null;
  targetConfigured: boolean;
  totalStudents: number;
  studentsMeetingTarget: number;
  studentsBelowTarget: number;
  percentMeetingTarget: number;
  percentBelowTarget: number;
  buckets: StudentAttainmentBucket[];
}

export interface QuestionPerformanceItem {
  questionId: string;
  topic: string;
  coId: string;
  courseId: string;
  assessmentId: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  averageMarks: number;
  maxMarks: number;
  attainmentPct: number;
  observationCount: number;
  targetPct: number | null;
  status: 'Target Met' | 'Below Target' | 'Target Not Configured';
}

export interface CourseSummaryMetrics {
  selectedCourse: string;
  totalStudents: number;
  totalAssessments: number;
  totalQuestions: number;
  totalTopics: number;
  totalCOs: number;
  totalObservations: number;
  overallAttainmentPct: number;
}

// ==========================================
// MODULE 3: CONDITIONAL PREDICTION DATA TYPES
// ==========================================

export interface ChronologicalAssessmentInfo {
  assessmentId: string;
  date: string;
  sequenceIndex: number;
}

export interface HistoricalAssessmentScore {
  assessmentId: string;
  marksObtained: number;
  maxMarks: number;
  attainmentPct: number;
}

export interface FeatureContributionItem {
  featureName: string;
  displayName: string;
  rawValue: number;
  normalizedValue: number;
  weight: number;
  contribution: number;
  unit?: string;
}

export interface FeatureScaler {
  means: number[];
  stds: number[];
}

export interface PredictionFeatures {
  studentId: string;
  courseId: string;
  coId: string;
  predictionAssessment: string;
  historicalAssessments: string[];
  historicalAssessmentScores: HistoricalAssessmentScore[];
  rollingCOAttainment: number;
  previousCOAttainment: number;
  performanceTrend: 'Improving' | 'Stable' | 'Declining';
  trendDelta: number;
  priorTargetMet: boolean;
  historicalObservationsCount: number;
  priorAssessmentAttainment?: number;
  latestCOAttainment?: number;
  historicalMeanCOAttainment?: number;
  scoreConsistencyStdDev?: number;
  featureVector?: number[];
  featureContributions?: FeatureContributionItem[];
}

export interface PredictionResult {
  studentId: string;
  courseId: string;
  coId: string;
  predictionAssessment: string;
  targetPct: number | null;
  targetConfigured: boolean;
  probabilityMeetingTarget: number;
  probabilityBelowTarget: number;
  predictedStatus: 'Likely to Meet Target' | 'Likely Below Target';
  features: PredictionFeatures;
  modelType?: string;
  modelVersion?: string;
  linearCombinationScore?: number;
  evaluationMetrics?: PredictionEvaluationMetrics | null;
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface PredictionEvaluationMetrics {
  trainCount: number;
  testCount: number;
  trainStudentsCount: number;
  testStudentsCount: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number | null;
  confusionMatrix: ConfusionMatrix;
  logLoss?: number;
  epochsRun?: number;
  learningRate?: number;
}

export interface PredictionScopeFilters {
  courseId: string;
  semester: string;
  predictionAssessment: string;
  coId: string;
}

export interface TrainedPredictionModel {
  weights: number[];
  bias: number;
  featureNames: string[];
  featureDisplayNames?: string[];
  trainSampleCount: number;
  testMetrics: PredictionEvaluationMetrics | null;
  scaler?: FeatureScaler;
  logLoss?: number;
  epochs?: number;
  learningRate?: number;
  l2Lambda?: number;
  modelType?: string;
  modelVersion?: string;
}

// ==========================================
// MODULE 4: EARLY-WARNING RISK DETECTION TYPES
// ==========================================

export type RiskLevel = 'HIGH RISK' | 'MEDIUM RISK' | 'LOW RISK' | 'INSUFFICIENT DATA';

export interface RiskFeatures {
  studentId: string;
  courseId: string;
  coId: string;
  predictionAssessment: string;
  predictedProbability: number | null;
  configuredTarget: number | null;
  historicalAttainment: number | null;
  attainmentGap: number | null;
  performanceTrend: 'Improving' | 'Stable' | 'Declining' | 'Insufficient History';
  consistencyScore: number | null;
  consistencyLabel: string;
  dataSufficiency: 'SUFFICIENT' | 'INSUFFICIENT';
  insufficientReason: string | null;
}

export interface RiskAssessment {
  studentId: string;
  courseId: string;
  coId: string;
  predictionAssessment: string;
  riskLevel: RiskLevel;
  priorityScore: number | null;
  priorityRank: number;
  features: RiskFeatures;
  contributingSignals: string[];
  reasons: string[];
}

export interface RiskOverviewSummary {
  totalStudents: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  insufficientDataCount: number;
  averagePriorityScore: number;
}

export interface RiskScopeFilters {
  courseId: string;
  semester: string;
  predictionAssessment: string;
  coId: string;
  riskFilter: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
}

// ==========================================
// MODULE 5: EXPLAINABILITY & TOPIC DIAGNOSIS
// ==========================================

export type TopicDiagnosisCategory = 'Critical Weakness' | 'Needs Attention' | 'Adequate' | 'Strong';

export interface TopicProgressionMilestone {
  assessmentId: string;
  marksObtained: number;
  maxMarks: number;
  attainmentPct: number;
}

export interface TopicDiagnosisItem {
  topic: string;
  coId: string;
  courseId: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  attainmentPct: number;
  targetPct: number | null;
  gapPct: number | null;
  questionCount: number;
  observationCount: number;
  diagnosisCategory: TopicDiagnosisCategory;
  progression: TopicProgressionMilestone[];
}

export interface QuestionDiagnosisItem {
  questionId: string;
  topic: string;
  coId: string;
  assessmentId: string;
  marksObtained: number;
  maxMarks: number;
  attainmentPct: number;
  observationCount: number;
  diagnosis: string;
}

export interface COEvidenceData {
  coId: string;
  courseId: string;
  configuredTarget: number | null;
  historicalAttainment: number | null;
  attainmentGap: number | null;
  questionCount: number;
  topicCount: number;
  observationCount: number;
  progression: TopicProgressionMilestone[];
}

export type EvidenceFactorCategory =
  | 'Below Target'
  | 'Large Attainment Gap'
  | 'Declining Trend'
  | 'Weak Topic'
  | 'Weak Question'
  | 'Consistent Underperformance'
  | 'Limited Historical Evidence';

export interface EvidenceFactor {
  category: EvidenceFactorCategory;
  severity: 'critical' | 'warning' | 'info' | 'positive';
  actualValue: string;
  referenceValue: string;
  sourceLevel: 'CO' | 'Topic' | 'Question' | 'Trend' | 'Data';
  description: string;
}

export interface DiagnosisSummary {
  primaryDiagnosis: string;
  supportingEvidence: string[];
  priorityArea: string;
  narrativeSummary: string;
}

export interface StudentExplanationPayload {
  studentId: string;
  courseId: string;
  coId: string;
  predictionAssessment: string;
  riskLevel: RiskLevel;
  priorityScore: number | null;
  predictedProbability: number | null;
  targetThreshold: number | null;
  historicalAttainment: number | null;
  attainmentGap: number | null;
  performanceTrend: 'Improving' | 'Stable' | 'Declining' | 'Insufficient History';
  hasSufficientData: boolean;
  insufficientReason: string | null;
  coEvidence: COEvidenceData;
  topics: TopicDiagnosisItem[];
  questions: QuestionDiagnosisItem[];
  evidenceFactors: EvidenceFactor[];
  diagnosisSummary: DiagnosisSummary;
  historicalAssessmentsUsed: string[];
}

export interface ExplainabilityScopeFilters {
  courseId: string;
  semester: string;
  predictionAssessment: string;
  coId: string;
  riskFilter: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  studentId: string;
}

// ==========================================
// MODULE 6: INSTRUCTIONAL INTERVENTION TYPES
// ==========================================

export type InterventionType =
  | 'Concept Reinforcement'
  | 'Guided Practice'
  | 'Targeted Question Practice'
  | 'Worked Example'
  | 'Small-Group Remediation'
  | 'Peer Learning'
  | 'Short Diagnostic Quiz'
  | 'Concept Recap'
  | 'Additional Practice Set'
  | 'Follow-up Assessment';

export type InterventionPriority = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export type InterventionIntensity = 'HIGH' | 'MEDIUM' | 'LOW';

export type InterventionTiming =
  | 'Before next assessment'
  | 'Within next instructional cycle'
  | 'During next remediation session';

export type InterventionStatus = 'Suggested' | 'Selected' | 'Approved' | 'Rejected' | 'Completed';

export interface InterventionRecommendation {
  id: string;
  type: InterventionType;
  targetTopic: string;
  targetCO: string;
  evidenceText: string;
  reason: string;
  intensity: InterventionIntensity;
  timing: InterventionTiming;
  academicFocus: string;
  priority: InterventionPriority;
  status: InterventionStatus;
  questionIds: string[];
  facultyNotes?: string;
}

export interface InterventionRecord {
  interventionId: string;
  studentId: string;
  courseId: string;
  coId: string;
  topic: string;
  interventionType: InterventionType;
  priority: InterventionPriority;
  reason: string;
  status: InterventionStatus;
  facultyNotes: string;
  createdAt: string;
}

export interface EvidenceTraceNode {
  stage: string;
  label: string;
  value: string;
  severity?: 'critical' | 'warning' | 'info' | 'positive';
}

export interface InterventionScopeFilters {
  courseId: string;
  semester: string;
  predictionAssessment: string;
  coId: string;
  riskFilter: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  priorityFilter: 'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  studentId: string;
}

// ==========================================
// MODULE 7: REASSESSMENT & LEARNING GAIN TYPES
// ==========================================

export type EffectivenessStatus =
  | 'TARGET ACHIEVED'
  | 'POSITIVE GAIN'
  | 'NO MEASURABLE GAIN'
  | 'NEGATIVE CHANGE'
  | 'INSUFFICIENT DATA';

export type DataSufficiencyStatus = 'SUFFICIENT' | 'PARTIAL' | 'INSUFFICIENT';

export interface LearningGainMetrics {
  preAttainment: number | null;
  postAttainment: number | null;
  absoluteGain: number | null; // Post Attainment - Pre Attainment (percentage points)
  relativeImprovement: number | null; // ((Post - Pre) / Pre) * 100, null if Pre <= 0
  preTargetGap: number | null; // Pre Attainment - Target
  postTargetGap: number | null; // Post Attainment - Target
  targetGapClosure: number | null; // Post Gap - Pre Gap
}

export interface COReassessmentComparison {
  coId: string;
  courseId: string;
  targetThreshold: number | null;
  preAttainment: number | null;
  postAttainment: number | null;
  absoluteGain: number | null;
  relativeImprovement: number | null;
  preTargetGap: number | null;
  postTargetGap: number | null;
  targetGapClosure: number | null;
  effectiveness: EffectivenessStatus;
  preObservationCount: number;
  postObservationCount: number;
}

export interface TopicReassessmentComparison {
  topic: string;
  coId: string;
  targetThreshold: number | null;
  preAttainment: number | null;
  postAttainment: number | null;
  absoluteGain: number | null;
  relativeImprovement: number | null;
  status: 'Improved' | 'Unchanged' | 'Declined' | 'Insufficient Data';
  preQuestionCount: number;
  postQuestionCount: number;
}

export interface QuestionReassessmentComparison {
  questionId: string;
  topic: string;
  coId: string;
  preMarks: number | null;
  preMaxMarks: number | null;
  preAttainmentPct: number | null;
  postMarks: number | null;
  postMaxMarks: number | null;
  postAttainmentPct: number | null;
  absoluteGainPct: number | null;
  status: 'Improved' | 'Unchanged' | 'Declined' | 'No Direct Match' | 'Insufficient Data';
}

export interface ReassessmentSelection {
  courseId: string;
  semester: string;
  coId: string;
  studentId: string;
  interventionId: string;
  reassessmentAssessmentId: string;
}

export interface DataSufficiencyReport {
  status: DataSufficiencyStatus;
  hasStudent: boolean;
  hasCourse: boolean;
  hasCO: boolean;
  hasApprovedIntervention: boolean;
  hasTargetMapping: boolean;
  hasPreInterventionEvidence: boolean;
  hasPostReassessmentEvidence: boolean;
  isChronologicallyValid: boolean;
  missingDetails: string[];
}

export interface StudentLearningProfile {
  studentId: string;
  courseId: string;
  coId: string;
  intervention: InterventionRecord;
  targetThreshold: number | null;
  reassessmentAssessmentId: string;
  reassessmentDate: string;
  learningGains: LearningGainMetrics;
  effectiveness: EffectivenessStatus;
  sufficiency: DataSufficiencyReport;
  coComparison: COReassessmentComparison;
  topicComparisons: TopicReassessmentComparison[];
  questionComparisons: QuestionReassessmentComparison[];
  questionsMatchDirectly: boolean;
}

export interface CohortOutcomeSummary {
  totalEvaluated: number;
  totalWithReassessment: number;
  targetAchievedCount: number;
  targetAchievedPct: number;
  positiveGainCount: number;
  positiveGainPct: number;
  noMeasurableGainCount: number;
  noMeasurableGainPct: number;
  negativeChangeCount: number;
  negativeChangePct: number;
  insufficientDataCount: number;
  insufficientDataPct: number;
  meanAbsoluteLearningGain: number | null;
}

export interface Module8HandoverPayload {
  handoverId: string;
  timestamp: string;
  studentId: string;
  courseId: string;
  coId: string;
  reassessmentAssessmentId: string;
  approvedIntervention: InterventionRecord;
  learningGains: LearningGainMetrics;
  targetThreshold: number | null;
  targetAchieved: boolean;
  effectivenessStatus: EffectivenessStatus;
  dataSufficiency: DataSufficiencyStatus;
  topicOutcomes: TopicReassessmentComparison[];
  questionOutcomes: QuestionReassessmentComparison[];
  academicIntegrityDisclaimer: string;
}

// ==========================================
// MODULE 8: CO INTELLIGENCE REPORT TYPES
// ==========================================

export type COTargetStatus =
  | 'TARGET MET'
  | 'BELOW TARGET'
  | 'TARGET NOT CONFIGURED'
  | 'INSUFFICIENT DATA';

export interface ReportScopeFilters {
  courseId: string;
  semester: string;
  section: string;
  coId: string;
  riskFilter: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  priorityFilter: 'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  reassessmentStatus: 'ALL' | 'EVALUATED' | 'PENDING';
}

export interface COExecutiveSummaryItem {
  coId: string;
  courseId: string;
  attainmentPct: number | null;
  targetThreshold: number | null;
  gapPct: number | null; // Attainment - Target (percentage points)
  status: COTargetStatus;
  totalStudents: number;
  totalObservations: number;
  uniqueTopicsCount: number;
  uniqueAssessmentsCount: number;
  topics: string[];
}

export interface COProgressionCycleItem {
  assessmentId: string;
  assessmentDate: string;
  isReassessment: boolean;
  coAttainments: Record<string, number | null>; // coId -> attainmentPct
  overallAttainmentPct: number | null;
  observationCount: number;
}

export interface TopicIntelligenceItem {
  topic: string;
  coId: string;
  courseId: string;
  attainmentPct: number | null;
  targetThreshold: number | null;
  gapPct: number | null; // Attainment - Target
  diagnosisStatus: 'Strong' | 'Satisfactory' | 'Needs Attention' | 'Critical Deficiency';
  historicalTrend: 'Improving' | 'Stable' | 'Declining' | 'Insufficient Data';
  reassessmentGainPp: number | null; // From Module 7 if available
  reassessmentStatus: 'Improved' | 'Unchanged' | 'Declined' | 'Pending Reassessment';
  questionCount: number;
}

export interface StudentRiskReportItem {
  studentId: string; // Anonymized
  courseId: string;
  coId: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  predictedProbability: number | null; // 0-100%
  predictionHorizon: string;
  historicalTrend: 'Improving' | 'Stable' | 'Declining' | 'Insufficient Data';
  primaryWeakness: string;
  hasApprovedIntervention: boolean;
  hasReassessmentOutcome: boolean;
}

export interface InterventionOutcomeReportItem {
  interventionId: string;
  studentId: string; // Anonymized
  courseId: string;
  coId: string;
  topic: string;
  riskLevel: string;
  priority: InterventionPriority;
  interventionType: InterventionType;
  facultyNotes: string;
  preAttainmentPct: number | null;
  postAttainmentPct: number | null;
  absoluteGainPp: number | null;
  targetThreshold: number | null;
  targetAchieved: boolean;
  effectivenessStatus: EffectivenessStatus | 'PENDING REASSESSMENT';
  reassessmentAssessmentId: string | null;
  approvedDate: string;
}

export interface AcademicAttentionItem {
  id: string;
  category: 'CRITICAL' | 'WARNING' | 'OPPORTUNITY' | 'COMPLIANCE';
  title: string;
  description: string;
  relatedEntity: string; // e.g. "CO2", "Arrays", "Cohort S001-S010"
  evidenceBasis: string; // which module/metric generated this
  suggestedAction: string;
}

export interface DataQualityReportSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  structuralErrors: number;
  unmappedTopics: number;
  unmappedCOs: number;
  canProceed: boolean;
  validationStatus: '100% Validated' | 'Warnings Present' | 'Validation Blocked';
}

export interface FullCOIntelligenceReport {
  reportId: string;
  generatedAt: string;
  isSyntheticData: boolean;
  courseMeta: CourseMetadata;
  filters: ReportScopeFilters;
  coExecutiveSummary: COExecutiveSummaryItem[];
  coProgressionTimeline: COProgressionCycleItem[];
  topicIntelligence: TopicIntelligenceItem[];
  studentRiskSummary: {
    totalStudents: number;
    highRiskCount: number;
    highRiskPct: number;
    mediumRiskCount: number;
    mediumRiskPct: number;
    lowRiskCount: number;
    lowRiskPct: number;
    insufficientDataCount: number;
    insufficientDataPct: number;
    students: StudentRiskReportItem[];
  };
  interventionOutcomes: {
    totalInterventions: number;
    approvedCount: number;
    reassessedCount: number;
    pendingCount: number;
    records: InterventionOutcomeReportItem[];
  };
  learningGainSummary: CohortOutcomeSummary | null;
  academicAttentionItems: AcademicAttentionItem[];
  dataQuality: DataQualityReportSummary;
  traceabilityStages: {
    stageNumber: number;
    stageName: string;
    sourceModule: string;
    status: 'COMPLETE' | 'PENDING' | 'NOT_APPLICABLE';
    summaryMetric: string;
  }[];
}

// ==========================================
// AI-ENHANCED RECOMMENDATION TYPES
// ==========================================

export interface AIEvidencePayload {
  studentId: string;
  courseId: string;
  coId: string;
  predictionAssessment: string;
  riskLevel: string;
  priority: string | number;
  predictedProbability: number | null;
  historicalAttainment: number | null;
  target: number | null;
  attainmentGap: number | null;
  performanceTrend: string;
  weakTopics: string[];
  weakQuestions: string[];
  diagnosisCategory: string;
  evidenceFactors: string[];
}

export interface AIRecommendationItem {
  type: string;
  title: string;
  targetTopic: string;
  targetQuestions: string[];
  academicFocus: string;
  reason: string;
  suggestedActivities: string[];
  intensity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AIRecommendationResponse {
  recommendations: AIRecommendationItem[];
  facultyNote: string;
  limitations: string[];
  isAIGenerated: boolean;
  generatedAt?: string;
  modelUsed?: string;
  validationStatus: 'VALID' | 'INVALID' | 'FALLBACK';
  validationMessage?: string;
}

export type AIConnectionStatus = 'CONNECTED' | 'UNAVAILABLE' | 'DETERMINISTIC_MODE';

export interface AIProviderConfig {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
}

// ==========================================
// GOOGLE GEMINI AI RECOMMENDATION TYPES
// ==========================================

export interface GeminiEvidencePayload {
  studentId: string;
  courseId: string;
  coId: string;
  predictionAssessment: string;
  riskLevel: string;
  priority: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  predictedProbability: number | null;
  historicalAttainment: number | null;
  target: number | null;
  attainmentGap: number | null;
  performanceTrend: string;
  consistency?: string;
  topicDiagnoses: {
    topic: string;
    attainmentPct: number;
    category: string;
  }[];
  weakQuestions: string[];
  evidenceFactors: string[];
}

export interface GeminiRecommendationData {
  recommendationTitle: string;
  interventionType: InterventionType;
  targetCO: string;
  targetTopic: string;
  targetQuestionIds: string[];
  priority: InterventionPriority;
  intensity: InterventionIntensity;
  timing: string;
  academicFocus: string;
  evidenceBasedReason: string;
  facultyReviewNote: string;
  instructionalSequence?: string[];
  source: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK';
  // Optional backwards-compatible aliases
  primaryIntervention?: string;
  reason?: string;
  questionsToTarget?: string[];
  disclaimer?: string;
  evidenceReferences?: string[];
  facultyAction?: string;
  alternativeOptions?: string[];
  expectedOutcomeStatement?: string;
}

export type GeminiAIStatus =
  | 'READY'
  | 'GENERATING'
  | 'SUCCESS'
  | 'API_KEY_MISSING'
  | 'API_ERROR'
  | 'INVALID_RESPONSE';

export interface GeminiRecommendationResult {
  data: GeminiRecommendationData | null;
  source: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK';
  status: GeminiAIStatus;
  statusMessage: string;
  isAIGenerated: boolean;
  generatedAt?: string;
  modelUsed?: string;
  error?: string;
}

