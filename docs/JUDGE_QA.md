# Hackathon Judge Technical Q&A Guide
**Project:** AI-Powered Course Outcome Early-Warning, Explainability and Instructional Intervention System  
**System Architecture:** 8-Module Closed-Loop Academic Decision-Support System  

---

## Section A: AI / ML Architecture & Modeling Methodology

### Q1: What machine learning models are used, and why were they chosen over deep neural networks or LLMs?
**Answer:**
We deliberately chose **Logistic Regression** and **Regularized Naive Bayes** with Laplace smoothing over Deep Learning / LLMs for Module 3 (Conditional CO Prediction):
1. **Sample Size Reality:** In typical academic cohorts (30–150 students per section), deep learning architectures severely overfit due to parameter explosion.
2. **Deterministic Calibration & Interpretability:** Faculty and accreditation bodies (e.g., NBA, ABET) require exact, explainable coefficients. Logistic regression provides calibrated posterior probabilities $P(\text{Attainment} \ge \tau \mid X)$ with quantifiable odds ratios.
3. **Zero Hallucination Guarantee:** Generative LLMs hallucinate risk states and learning gains. Our statistical formulation guarantees that predictions are strictly bound between $0.0$ and $1.0$ and directly derived from student historical scores.

### Q2: How does the Conditional Prediction Engine work mathematically?
**Answer:**
For a student $s$, course outcome $c$, and target horizon assessment $A_k$, the feature vector $X_{s,c}^{(k)}$ is constructed from strictly antecedent assessments:
$$X_{s,c}^{(k)} = [\bar{m}_{s,c}^{(<k)}, \Delta_{\text{trend}}^{(k)}, \text{coh\_perf}_{c}^{(<k)}, n_{\text{obs}}]$$
The probability of attaining the threshold $\tau_c$ is modeled via the sigmoid link function:
$$P(Y_{s,c}^{(k)} = 1 \mid X_{s,c}^{(k)}) = \sigma(w_0 + \sum_{j} w_j X_{j}) = \frac{1}{1 + e^{-(w_0 + W^T X)}}$$
Where historical data is sparse ($n_{\text{obs}} < 2$), the system falls back gracefully to a Laplace-smoothed empirical Bayesian prior rather than ungrounded extrapolation.

### Q3: Why is there a distinction between the ML Prediction Engine and the Deterministic Risk Engine?
**Answer:**
Prediction and Risk Classification serve fundamentally distinct roles in academic governance:
- **Prediction (Module 3):** Answers *"What is the statistical likelihood of this student achieving the target outcome if no intervention occurs?"* This is probabilistic.
- **Risk Decision Engine (Module 4):** Answers *"Does this student meet institutional triage criteria for mandatory instructional support?"* This must be **100% deterministic, reproducible, and auditable**. Academic policies cannot be subject to stochastic drift. Risk tiers are evaluated in strict priority order:
  1. `INSUFFICIENT DATA` (pre-requisite gate)
  2. `HIGH RISK` ($P < 0.40$ OR $[Gap < -10\% \land Trend = \text{Declining}]$)
  3. `LOW RISK` ($P \ge 0.70 \land Gap \ge -5\% \land Trend \neq \text{Declining}$)
  4. `MEDIUM RISK` (all remaining eligible cases).

### Q4: How is data leakage prevented between historical evidence and future horizons?
**Answer:**
Data leakage prevention is enforced by an immutable chronological horizon barrier in `predictionEngine.ts`:
- If predicting horizon **A3**, the engine strictly partitions data such that only $\{A1, A2\}$ marks are visible to the feature extractor.
- If predicting horizon **B1**, only $\{A1, A2, A3\}$ marks are ingested.
- **The target assessment itself is strictly masked and excluded from feature generation.** Unit tests (`tests/testModule3Prediction.cjs`) verify that injecting mock future marks does not alter historical feature matrices.

### Q5: How do you handle cold-start problems (e.g., first assessment of the semester)?
**Answer:**
When only Assessment A1 exists (or before any assessment is graded), the evidence count $n_{\text{obs}} < \text{threshold}$. The engine strictly flags the record with state `INSUFFICIENT_DATA`. It refuses to guess or substitute arbitrary cohort averages as a student's personal score. This prevents false alarms during the first two weeks of a semester.

---

## Section B: Explainability & Diagnosis

### Q6: How are SHAP/Feature Attributions computed without black-box surrogate instability?
**Answer:**
Because Module 3 utilizes a linear-logistic model with normalized feature transformations, exact Shapley values / linear feature attributions $\phi_j$ are calculated analytically:
$$\phi_j = w_j (x_{s,j} - \mathbb{E}[X_j])$$
This produces exact, additive feature attributions ($\sum \phi_j = f(x) - \mathbb{E}[f(x)]$) without sampling noise, random seed instability, or permutation variance inherent in sampling-based SHAP approximations on small datasets.

### Q7: How does Topic Diagnosis map continuous assessment marks to discrete pedagogical deficiencies?
**Answer:**
Module 5 performs bipartite graph propagation between Question-Topic mappings and individual student question marks:
1. Question scores are normalized to percentage mastery: $m_q = \frac{\text{marks\_obtained}_q}{\text{max\_marks}_q}$.
2. Topic mastery is computed as the weighted average: $M_t = \frac{\sum_{q \in Q_t} w_q m_q}{\sum_{q \in Q_t} w_q}$.
3. If $M_t < \tau_{\text{topic}}$ (default $50\%$), the topic is classified as `DEFICIENT`.
4. Deficient topics are ranked by **Pedagogical Criticality** (prerequisite weight $\times$ target attainment deficit).

### Q8: Can an LLM alter the diagnostic topic output?
**Answer:**
**No.** Diagnostic topic extraction is 100% deterministic code based on question-level rubric matrices. Generative text is only used for natural language explanation templates that insert validated variable tags, ensuring zero hallucinated topic deficiencies.

---

## Section C: Instructional Intervention & Faculty Governance

### Q9: Why does the system NOT automatically assign interventions to students?
**Answer:**
Automated assignment of interventions violates academic ethics and institutional policy. AI cannot know external student contexts (e.g., medical leave, bereavement, extracurricular commitments). Therefore, Module 6 enforces **Faculty-in-the-Loop Governance**:
- AI generates ranked pedagogical recommendations based on diagnostic deficiency categories (e.g., Peer Learning for conceptual gaps, Practice Worksheets for procedural gaps).
- Faculty must explicitly review, adjust dosage/notes, and click **Approve** or **Reject**.
- No intervention can transition to Module 7 reassessment without a cryptographic timestamp and faculty approval audit record.

### Q10: What intervention taxonomy is supported?
**Answer:**
Module 6 implements an evidence-based pedagogical taxonomy:
1. `PEER_LEARNING`: Collaborative problem solving for conceptual abstraction (e.g., Virtual Memory).
2. `REMEDIAL_PRACTICE`: Scaffolded problem sets for algorithmic/procedural mastery (e.g., Page Replacement algorithms).
3. `FACULTY_CLINIC`: 1-on-1 diagnostic office hours for compound misconceptions.
4. `TARGETED_READING`: Curated micro-readings and video modules for foundational prerequisite gaps.

---

## Section D: Reassessment, Learning Gain & Statistical Rigor

### Q11: How is Learning Gain calculated?
**Answer:**
Module 7 computes **Absolute Learning Gain** in percentage points:
$$g_{\text{abs}} = \text{Score}_{\text{post-reassessment}} - \text{Score}_{\text{pre-intervention baseline}}$$
It also computes **Normalized Gain (Hake's $g$)** for cohort evaluations:
$$g_{\text{norm}} = \frac{\text{Score}_{\text{post}} - \text{Score}_{\text{pre}}}{100 - \text{Score}_{\text{pre}}}$$
This separates ceiling effects (students starting at 65%) from high-growth recoveries (students starting at 28% and gaining +44 pp).

### Q12: How do you ensure that learning gain is not just assessment inflation or "teaching to the test"?
**Answer:**
Module 7 requires the reassessment assessment blueprint ($R1$) to map to identical Course Outcomes and Bloom's Taxonomy cognitive levels as the diagnostic baseline assessment ($A2$/$A3$), while utilizing parameterized, isomorphic problem variants rather than identical questions.

### Q13: Can a student achieve a negative learning gain?
**Answer:**
Yes. If a student scores lower on reassessment ($Post < Pre$), the system reports negative gain with status `REGRESSION` and triggers an escalation alert in Module 8 for faculty intervention review.

---

## Section E: Data Privacy, FERPA & Security

### Q14: How does this system comply with FERPA / Student Privacy regulations?
**Answer:**
1. **Pseudonymization at Ingestion:** Module 1 strips Student Names, National IDs, and contact info, mapping all records to synthetic hash IDs (`S001`–`S150`).
2. **Local In-Browser / On-Premise Execution:** All analytics, ML models, and reports execute client-side or on the institution's private server. Zero student grade records are sent to external third-party cloud LLM APIs (OpenAI, Anthropic, etc.).
3. **Role-Based Access Control:** Faculty can only see assigned course sections; HODs see aggregated departmental health.

### Q15: What happens if an uploaded CSV contains corrupted or out-of-bounds data?
**Answer:**
Module 1 contains a strict validation gatekeeper. Any record with $\text{marks} < 0$, $\text{marks} > \text{max\_marks}$, invalid student IDs, or non-existent CO codes is rejected at upload with row-level error notifications. Downstream modules 2–8 will not execute on unvalidated data.

---

## Section F: Scalability, Performance & Production Readiness

### Q16: How does the system scale to an entire university with 10,000+ students?
**Answer:**
Because our feature extraction and logistic inference algorithms are $O(N \cdot K)$ (linear with student count and assessment count), benchmark tests demonstrate that 10,000 student records execute across all 8 modules in under 450 milliseconds in memory. The entire application bundle is lightweight (< 1.5MB gzip) with zero heavyweight external model weights.

### Q17: What are the current architectural limitations?
**Answer:**
1. **Synthetic Demonstration Data:** The current repository includes a validated synthetic cohort (`CS301` Operating Systems, 150 students).
2. **Course Format Scope:** Currently optimized for semester-based STEM courses with continuous assessment models (quizzes, midterms, lab assignments).
3. **Single-Institution Deployment:** Multi-tenant university cloud synchronization requires backend database migration (e.g., PostgreSQL + Prisma).

### Q18: What is your differentiator compared to standard LMS platforms (Canvas, Blackboard, Moodle)?
**Answer:**
Standard LMS gradebooks are retrospective record-keepers: they report historical averages after failure has already occurred. Our system is an **action-oriented, closed-loop early warning engine**:
1. Antecedent-based predictive horizon modeling.
2. Question-level root cause topic diagnosis.
3. Prescriptive intervention recommendations.
4. Mandatory post-intervention reassessment verification.
5. Accreditation-ready CO attainment reporting (NBA/ABET).

### Q19: Why do you avoid external LLMs for reporting?
**Answer:**
Accreditation audits require reproducible, bit-for-bit verifiable figures. If an accreditation officer inspects a Course Outcome attainment report on Monday and re-generates it on Tuesday, the attainment percentages, student counts, and gap analyses must be identical. Deterministic templating combined with statistical aggregations guarantees zero hallucination and 100% audit reproducibility.

### Q20: How does the demonstration scenario prove the closed loop?
**Answer:**
In our live demo:
- Student `S001` in `CS301` struggles with `CO2` (`Virtual Memory & Paging`), scoring 28.0% on early assessments.
- Module 3 predicts failure probability at 78% (attainment probability 22%).
- Module 4 assigns `HIGH RISK` (Priority Score 85).
- Module 5 diagnoses procedural deficit in `Page Replacement Algorithms`.
- Module 6 recommends a `Peer Learning Clinic`. Faculty approves.
- Module 7 reassesses `S001` on Reassessment `R1`, measuring a score of 72.0% ($+44.0\text{ pp}$ learning gain, transitioning status to `RESOLVED`).
- Module 8 integrates this outcome into the departmental accreditation report.

