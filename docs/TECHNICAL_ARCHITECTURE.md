# Technical Architecture & Pipeline Specification

**Project:** AI-Powered Course Outcome Early-Warning, Explainability and Instructional Intervention System  
**System Type:** 8-Module Closed-Loop Academic Decision-Support System  
**Architecture Pattern:** Component-Driven Client-Side Pipeline with Strongly-Typed Data Contracts  

---

## 1. System Architecture Overview

The system is designed as a client-side, zero-external-dependency web application built on React 18 and TypeScript. State flows unidirectionally through 8 distinct processing layers, where each layer guarantees data hygiene, anti-leakage protection, and deterministic auditability.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                             │
│  React 18 + Tailwind CSS + Lucide Icons + Demo Journey Bar & Transp.   │
├─────────────────────────────────────────────────────────────────────────┤
│                          APPLICATION STATE                              │
│  React Hooks (useState/useMemo) + LocalStorage Persistence Adapters     │
├─────────────────────────────────────────────────────────────────────────┤
│                          SERVICE ENGINES                                │
│  M1: ValidationGatekeeper    M2: COAnalyticsEngine    M3: PredictionEng │
│  M4: RiskTriageEngine        M5: ExplainabilityEng    M6: InterventionS │
│  M7: ReassessmentService     M8: ReportSynthesisEngine                 │
├─────────────────────────────────────────────────────────────────────────┤
│                          DATA LAYER                                     │
│  Raw CSV Ingestion + Synthetic Demonstration Cohort + Zero PII Mapping │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture & State Management

* **Component Hierarchy:**
  * Root container: `src/App.tsx` coordinates top-level tab switching, demo scenario triggers, and global dataset distribution.
  * Common UI layer: `DemoJourneyBar`, `ModuleTransitionHeader`, `AIMLTransparencyModal`, `First30SecondsHero`, `EvidenceChainBanner`.
  * Module Dashboard containers: `Module1Dashboard` through `Module8Dashboard`.
* **State Management Strategy:**
  * **Global Ephemeral State:** Validated dataset, course outcome analytics, predictions, risk assessments, and diagnostic maps are managed via top-level React hooks (`useState`, `useCallback`) and memoized calculations (`useMemo`).
  * **Intervention & Reassessment State:** Faculty approval logs, modified dosages, and post-intervention evaluations persist in browser `localStorage` under keys `ai_co_interventions` and `ai_co_audit_trail`.
  * **Reactivity:** Updates to an intervention plan in Module 6 trigger instantaneous re-evaluation of data sufficiency in Module 7 without requiring manual page reloads.

---

## 3. Detailed Module Engine Specifications (INPUT → PROCESS → OUTPUT)

### Module 1: Data Ingestion & Validation Gatekeeper
* **Source Service:** `src/services/dataValidation.ts`
* **INPUT:** Raw CSV strings or uploaded tabular data files: `student_marks.csv`, `question_mappings.csv`, `co_targets.csv`.
* **PROCESS:**
  1. Referential integrity audit: verifies all question IDs map to valid CO codes and course IDs.
  2. Mark boundary verification: enforces $0 \le \text{marks\_obtained} \le \text{max\_marks}$.
  3. De-duplication and schema harmonization.
  4. Pseudonymization: strips real student names, emails, and national IDs; maps all records to synthetic hash IDs `S001`–`S150`.
* **OUTPUT:** `ValidatedDataset` containing strictly conforming `AssessmentRecord[]`, `QuestionMapping[]`, and `COTarget[]`.

---

### Module 2: Course Outcome Analytics & Compliance
* **Source Service:** `src/services/courseOutcomeAnalytics.ts`
* **INPUT:** `ValidatedDataset` from Module 1.
* **PROCESS:**
  1. Computes student CO attainment: $\text{Attainment}_{s,c} = \frac{\sum \text{marks\_obtained}_{s,c}}{\sum \text{max\_marks}_{s,c}} \times 100$.
  2. Evaluates student threshold attainment: counts proportion of cohort achieving $\ge \text{Target}_c$ (default 70%).
  3. Calculates institutional attainment gap: $\text{Gap}_c = \text{CohortAttainment}_c - \text{Target}_c$.
  4. Evaluates performance trajectory: linear slope across chronological assessment dates (`Improving`, `Stable`, `Declining`).
* **OUTPUT:** `COAnalyticsResult` (student attainment scores, cohort threshold percentages, attainment gaps, trajectory slopes).

---

### Module 3: Conditional Course Outcome Prediction Engine
* **Source Service:** `src/services/predictionEngine.ts`
* **INPUT:** `ValidatedDataset` from Module 1, target `PredictionHorizon` ($A3$, $B1$, or $B2$), institutional target threshold.
* **PROCESS:**
  1. **Chronological Horizon Masking:** Strictly isolates historical assessments ($< \text{Horizon}$). Target assessment marks are masked and excluded from feature extraction.
  2. Feature vector construction: antecedent average mark $\bar{m}_{s,c}^{(<k)}$, historical trajectory $\Delta$, and cohort baseline.
  3. Calibrated Logistic Inference: models posterior attainment probability via sigmoid link function:
     $$P(Y_{s,c}^{(k)} = 1 \mid X) = \frac{1}{1 + e^{-(w_0 + W^T X)}}$$
  4. Fallback: Laplace-smoothed empirical Bayesian prior for sparse history ($n_{\text{obs}} < 2$).
* **OUTPUT:** `PredictionResult[]` containing calibrated probabilities, odds ratios, and horizon labels.

---

### Module 4: Deterministic Early-Warning Risk Triage
* **Source Service:** `src/services/riskEngine.ts`
* **INPUT:** `PredictionResult[]` from Module 3, `COAnalyticsResult` from Module 2.
* **PROCESS:**
  * Evaluates institutional triage rules in strict, mutually exclusive priority order:
    1. `INSUFFICIENT DATA`: if required historical evidence or target is unavailable.
    2. `HIGH RISK`: if $P < 40\%$ OR ($\text{Gap} < -10\text{ pp}$ AND $\text{Trend} = \text{Declining}$).
    3. `LOW RISK`: if $P \ge 70\%$ AND $\text{Gap} \ge -5\text{ pp}$ AND $\text{Trend} \neq \text{Declining}$.
    4. `MEDIUM RISK`: all remaining eligible students.
  * Calculates Risk Priority Score: $S = (1 - P) \times 60 + |\text{Gap}| \times 0.4$.
* **OUTPUT:** `RiskAssessment[]` with mutually exclusive risk tiers, priority ranks, and deterministic decision flags.

---

### Module 5: Explainability & Topic Diagnosis
* **Source Service:** `src/services/explainabilityService.ts`
* **INPUT:** `ValidatedDataset`, `RiskAssessment[]`, `PredictionResult[]`.
* **PROCESS:**
  1. Exact Linear Feature Attribution: computes additive feature contributions $\phi_j = w_j(x_j - \mathbb{E}[X_j])$.
  2. Bipartite Question-to-Topic Propagation: maps student marks on individual exam questions ($Q_1, Q_2, \dots$) to curricular topics ($T_1, T_2, \dots$).
  3. Topic Mastery Evaluation: $M_t = \frac{\sum_{q \in Q_t} \text{marks}_q}{\sum_{q \in Q_t} \text{max}_q} \times 100$.
  4. Identifies Deficient Topics ($M_t < 50\%$) and classifies deficiency archetype (`Conceptual`, `Procedural`, `Application`).
* **OUTPUT:** `StudentDiagnosis` containing feature attribution waterfall, weak topic list, failed question IDs, and diagnostic narrative.

---

### Module 6: Instructional Intervention Recommendation & Faculty Governance
* **Source Service:** `src/services/interventionService.ts`
* **INPUT:** `RiskAssessment[]` from Module 4, `StudentDiagnosis[]` from Module 5.
* **PROCESS:**
  1. Pedagogical Taxonomy Mapping: maps diagnostic archetype to instructional strategy (`PEER_LEARNING`, `REMEDIAL_PRACTICE`, `FACULTY_CLINIC`, `TARGETED_READING`).
  2. Formulates intervention plan with recommended duration, intensity, and practice problem IDs.
  3. **Faculty-in-the-Loop Gatekeeper:** Renders plan in `DRAFT` status. Awaits human faculty action (`APPROVED`, `REJECTED`, `MODIFIED`).
  4. Records immutable audit record with ISO timestamp, instructor ID, and clinical notes.
* **OUTPUT:** `InterventionPlan[]` with governance audit status. Only `APPROVED` plans can transition to Module 7.

---

### Module 7: Post-Intervention Reassessment & Learning Gain
* **Source Service:** `src/services/reassessmentService.ts`
* **INPUT:** Approved `InterventionPlan[]`, reassessment assessment records ($R1$ cycle).
* **PROCESS:**
  1. Data Sufficiency Gate: verifies approved intervention exists and reassessment marks are present.
  2. Pre/Post Evidence Isolation: extracts pre-intervention baseline score and post-intervention reassessment score.
  3. Absolute Learning Gain: $g_{\text{abs}} = \text{Post Attainment} - \text{Pre Attainment}$ (expressed in $\text{pp}$).
  4. Hake's Normalized Gain: $g_{\text{norm}} = \frac{\text{Post} - \text{Pre}}{100 - \text{Pre}}$ (computed when $\text{Pre} < 100$).
  5. Deterministic Verdict: assigns `TARGET ACHIEVED` ($\text{Post} \ge \text{Target}$), `POSITIVE GAIN`, `NO MEASURABLE GAIN`, or `NEGATIVE CHANGE`.
* **OUTPUT:** `ReassessmentResult[]` with empirical gains, topic delta comparisons, and resolution status.

---

### Module 8: Consolidated Course Outcome Intelligence Report
* **Source Service:** `src/services/reportService.ts`
* **INPUT:** Aggregated outputs of Modules 1 through 7.
* **PROCESS:**
  1. Executive Health Synthesis: generates 7-metric institutional health overview for HODs and Deans.
  2. Continuous Improvement Portfolio: formats pre/post cohort distributions for NBA Criterion 3 and ABET Criterion 4.
  3. Unbroken Audit Assembly: links raw question marks $\to$ CO gaps $\to$ predictions $\to$ risk priority $\to$ diagnosis $\to$ approval $\to$ reassessment gain.
* **OUTPUT:** `COReportData` for interactive executive review and print/PDF accreditation export.

---

## 4. Storage Architecture & LocalStorage Schema

The prototype utilizes structured in-browser storage for zero-backend operation:

```json
// Key: ai_co_approved_interventions
[
  {
    "id": "INT-S001-CO2-001",
    "studentId": "S001",
    "courseId": "CS301",
    "coId": "CO2",
    "strategy": "PEER_LEARNING",
    "status": "APPROVED",
    "dosageHours": 4,
    "facultyNotes": "Approved for 1-on-1 peer clinic on page replacement algorithms.",
    "approvalTimestamp": "2026-09-10T14:30:00.000Z",
    "instructorId": "FAC-OS-01"
  }
]
```

---

## 5. Automated Testing Architecture

* **Framework:** Custom CommonJS regression test harness running in Node.js.
* **Test Suites:** 8 dedicated suites located in `tests/`:
  1. `testValidation.cjs` (12 tests)
  2. `testModule2Analytics.cjs` (31 tests)
  3. `testModule3Prediction.cjs` (38 tests)
  4. `testModule4Risk.cjs` (33 tests)
  5. `testModule5Explainability.cjs` (44 tests)
  6. `testModule6Intervention.cjs` (38 tests)
  7. `testModule7Reassessment.cjs` (49 tests)
  8. `testModule8Report.cjs` (37 tests)
* **Total Automated Assertions:** **282 tests passing (100%)**.

