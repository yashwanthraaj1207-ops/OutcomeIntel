import {
  StudentExplanationPayload,
  InterventionPriority,
  GeminiEvidencePayload,
  GeminiRecommendationData,
  GeminiRecommendationResult,
  InterventionRecommendation
} from '../types/dataTypes';
import { generateInterventionOptions } from './interventionEngine';
import { DEFAULT_GEMINI_MODEL } from '../server/geminiBackend';

export type GeminiUIStatus =
  | 'Gemini AI Connected'
  | 'Gemini API Key Missing'
  | 'Gemini Request Failed — Using Deterministic Fallback';

/**
 * Safely resolves the Gemini API key in Node test runners only.
 * The browser environment never reads, stores, or exposes the API key.
 */
export function getGeminiApiKey(): string | undefined {
  try {
    const globalProc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
    if (globalProc && globalProc.env) {
      const v = globalProc.env.GEMINI_API_KEY;
      if (v && typeof v === 'string' && v.trim() !== '' && v !== 'your_gemini_api_key_here') {
        return v.trim();
      }
    }
  } catch {
    // ignore
  }

  return undefined;
}

/**
 * Returns current model configuration.
 */
export function getGeminiModel(): string {
  try {
    const globalProc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
    if (globalProc && globalProc.env) {
      const m = globalProc.env.GEMINI_MODEL;
      if (m && typeof m === 'string' && m.trim() !== '') return m.trim();
    }
  } catch {
    // ignore
  }
  return DEFAULT_GEMINI_MODEL;
}

/**
 * Derives UI status indicator matching user requirements:
 * - "Gemini AI Connected"
 * - "Gemini API Key Missing"
 * - "Gemini Request Failed — Using Deterministic Fallback"
 */
export function getGeminiUIStatus(
  apiKeyPresent: boolean,
  lastResult?: GeminiRecommendationResult | null
): { status: GeminiUIStatus; badgeClass: string } {
  if (lastResult?.source === 'DETERMINISTIC_FALLBACK' && lastResult.status === 'API_ERROR') {
    return {
      status: 'Gemini Request Failed — Using Deterministic Fallback',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
    };
  }

  if (!apiKeyPresent) {
    return {
      status: 'Gemini API Key Missing',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }

  return {
    status: 'Gemini AI Connected',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  };
}

/**
 * Extracts strictly factual academic evidence from Module 5 & Module 4.
 * Guarantees zero PII, zero future data leakage, and preserves deterministic priority.
 */
export function buildGeminiEvidencePayload(
  explanation: StudentExplanationPayload,
  priority: InterventionPriority
): GeminiEvidencePayload {
  const weakQuestions = (explanation.questions || [])
    .filter(q => q.attainmentPct < 50.0)
    .map(q => q.questionId);

  const topicDiagnoses = (explanation.topics || []).map(t => ({
    topic: t.topic,
    attainmentPct: t.attainmentPct,
    category: t.diagnosisCategory
  }));

  const evidenceFactors = (explanation.evidenceFactors || []).map(
    f => `${f.category} (${f.severity}): ${f.description} [Observed: ${f.actualValue}, Reference: ${f.referenceValue}]`
  );

  return {
    studentId: explanation.studentId, // Strictly anonymized (e.g. S001)
    courseId: explanation.courseId,
    coId: explanation.coId,
    predictionAssessment: explanation.predictionAssessment,
    riskLevel: explanation.riskLevel,
    priority, // Authoritative deterministic priority classification
    predictedProbability: explanation.predictedProbability,
    historicalAttainment: explanation.historicalAttainment,
    target: explanation.targetThreshold,
    attainmentGap: explanation.attainmentGap,
    performanceTrend: explanation.performanceTrend,
    consistency: explanation.performanceTrend === 'Stable' ? 'High Consistency' : 'Variable',
    topicDiagnoses,
    weakQuestions,
    evidenceFactors
  };
}

/**
 * Converts a deterministic recommendation into a structured GeminiRecommendationData object
 * for transparent deterministic fallback.
 */
export function buildDeterministicFallbackData(
  explanation?: StudentExplanationPayload,
  evidence?: GeminiEvidencePayload
): GeminiRecommendationData {
  let topOpt: InterventionRecommendation | undefined;
  if (explanation) {
    const options = generateInterventionOptions(explanation);
    topOpt = options[0];
  }

  const coId = explanation?.coId || evidence?.coId || 'CO1';
  const topic = topOpt?.targetTopic || (evidence?.topicDiagnoses?.[0]?.topic) || 'Course Topic';
  const type = topOpt?.type || 'Concept Reinforcement';
  const priority = topOpt?.priority || evidence?.priority || 'MODERATE';
  const intensity = topOpt?.intensity || 'MEDIUM';
  const timing = topOpt?.timing || 'Before next assessment';
  const academicFocus = topOpt?.academicFocus || 'Targeted conceptual reinforcement and worked examples on core course topics.';
  const reason = topOpt?.reason || 'Deterministic recommendation generated from verified Module 5 attainment metrics and topic deficiency analysis.';

  return {
    recommendationTitle: `Evidence-Based Intervention: ${type}`,
    interventionType: type,
    targetCO: coId,
    targetTopic: topic,
    targetQuestionIds: topOpt?.questionIds || evidence?.weakQuestions || [],
    priority,
    intensity,
    timing,
    academicFocus,
    instructionalSequence: [
      `Diagnostic Review: Analyze student responses on ${topic} items to diagnose specific misconceptions.`,
      `Worked Example: Review 2 exemplar problems demonstrating step-by-step resolution.`,
      `Guided Practice: Complete targeted formative questions with immediate instructor feedback.`
    ],
    evidenceBasedReason: reason,
    facultyReviewNote: 'Deterministic fallback recommendation generated from verified academic evidence. Faculty review and approval required.',
    source: 'DETERMINISTIC_FALLBACK',
    primaryIntervention: type,
    reason,
    questionsToTarget: topOpt?.questionIds || evidence?.weakQuestions || [],
    disclaimer: 'AI-generated recommendation based on verified academic evidence. Faculty review and approval required.'
  };
}

/**
 * Main function to generate AI intervention recommendation.
 * 1. Checks evidence validity.
 * 2. Issues POST request to serverless endpoint /api/gemini/recommendation.
 * 3. Never contacts Gemini directly from browser; API key is held strictly server-side.
 * 4. Gracefully falls back to deterministic evidence-based recommendation on any API or network issue.
 */
export async function generateAIInterventionRecommendation(
  evidence: GeminiEvidencePayload,
  explanation?: StudentExplanationPayload
): Promise<GeminiRecommendationResult> {
  const fallbackData = buildDeterministicFallbackData(explanation, evidence);

  // 1. Validate evidence input
  if (!evidence.studentId || !evidence.coId || !evidence.topicDiagnoses || evidence.topicDiagnoses.length === 0) {
    return {
      data: fallbackData,
      source: 'DETERMINISTIC_FALLBACK',
      status: 'API_ERROR',
      statusMessage: 'Gemini recommendation unavailable. Showing deterministic evidence-based recommendation.',
      isAIGenerated: false,
      error: 'Incomplete evidence payload. Using deterministic fallback.'
    };
  }

  // 2. Query serverless backend endpoint /api/gemini/recommendation
  let backendError: string | null = null;

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => {
          try {
            controller.abort(new Error('Gemini API request timed out after 35 seconds.'));
          } catch {
            controller.abort();
          }
        }, 35000)
      : null;

    const res = await fetch('/api/gemini/recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(evidence),
      signal: controller ? controller.signal : undefined
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.source === 'GEMINI_AI' && json.data) {
        return {
          data: json.data,
          source: 'GEMINI_AI',
          status: 'SUCCESS',
          statusMessage: 'AI recommendation generated using Google Gemini.',
          isAIGenerated: true,
          generatedAt: new Date().toISOString(),
          modelUsed: json.modelUsed || getGeminiModel()
        };
      }
      backendError = json.error || `Gemini recommendation unavailable (${json.source || 'FALLBACK'})`;
    } else {
      let detailedErr = `Backend returned HTTP ${res.status}`;
      try {
        const errText = await res.text();
        try {
          const errJson = JSON.parse(errText);
          if (errJson && errJson.error) {
            detailedErr = `${errJson.error} (HTTP ${res.status})`;
          } else if (errJson && errJson.details) {
            detailedErr = `${errJson.details} (HTTP ${res.status})`;
          }
        } catch {
          if (errText && errText.trim().length > 0 && errText.length < 300) {
            detailedErr = `${errText.trim()} (HTTP ${res.status})`;
          }
        }
      } catch {
        if (res.status === 404) {
          detailedErr = 'API route /api/gemini/recommendation returned HTTP 404.';
        } else if (res.status === 401 || res.status === 403) {
          detailedErr = 'API authorization failed (HTTP 401/403). Check GEMINI_API_KEY in Vercel settings.';
        } else if (res.status === 429) {
          detailedErr = 'Google Gemini rate limit / quota exceeded (HTTP 429).';
        } else if (res.status >= 500) {
          detailedErr = `Server error from /api/gemini/recommendation (HTTP ${res.status}).`;
        }
      }
      backendError = detailedErr;
    }
  } catch (err: any) {
    const isTimeout =
      err?.name === 'AbortError' ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('timed out')) ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('aborted'));

    backendError = isTimeout
      ? 'Backend request timed out after 35 seconds.'
      : (err?.message || 'Backend connection failed.');
  }

  // 3. Transparent deterministic fallback with accurate error diagnostics
  return {
    data: fallbackData,
    source: 'DETERMINISTIC_FALLBACK',
    status: 'API_ERROR',
    statusMessage: 'Gemini recommendation unavailable. Showing deterministic evidence-based recommendation.',
    isAIGenerated: false,
    error: backendError || 'Gemini service unavailable.'
  };
}
