# Model Card: Conditional Course Outcome Prediction Engine (Module 3)

### Model Details
* **Model Name:** Conditional Course Outcome Prediction Model (`coPredictionEngine.ts`)
* **Model Type:** Transparent Regularized Logistic Regression Classifier with Sigmoid Link Function
* **Version:** 1.0.0
* **Developers:** Academic AI Hackathon Development Team
* **Implementation Location:** [`src/services/coPredictionEngine.ts`](file:///d:/Personal/College/Coding%20world/Project/Binary%20Beast/AI%20Course%20Outcome/src/services/coPredictionEngine.ts) & [`src/services/predictionEvaluation.ts`](file:///d:/Personal/College/Coding%20world/Project/Binary%20Beast/AI%20Course%20Outcome/src/services/predictionEvaluation.ts)

---

## 1. Intended Use & Target Scope

* **Intended Application:** Preemptive early warning of student Course Outcome attainment deficits prior to semester-end examinations.
* **Intended Users:** Course Instructors, Department Heads (HODs), and Academic Quality Committees.
* **Out-of-Scope Use:** High-stakes automated student grading, automated academic expulsion, or disciplinary action without human faculty review.

---

## 2. Input Features & Data Normalization

The feature extractor (`src/services/predictionFeatureEngine.ts`) converts antecedent assessment history into a 5-dimensional normalized vector:

| Feature Name | Description | Normalization Bounds |
|:---|:---|:---:|
| `rollingCOAttainment` | Weighted mean percentage across all preceding assessments for this CO. | $[0.0, 1.0]$ |
| `previousCOAttainment`| Score percentage obtained on the immediately preceding assessment. | $[0.0, 1.0]$ |
| `trendDelta` | Linear slope / trajectory across chronological assessment dates. | $[-0.5, 0.5]$ (clipped) |
| `priorTargetMet` | Binary flag ($1.0$ if previous score met institutional target $\tau$, else $0.0$). | $\{0.0, 1.0\}$ |
| `historicalDepth` | Observation count ratio ($\min(1.0, \text{assessments\_count} / 5.0)$). | $[0.0, 1.0]$ |

---

## 3. Mathematical Formulation & Inference

The probability of a student $s$ reaching target competency $\tau$ on future horizon assessment $A_k$ is computed as:

$$z = w_0 + \sum_{j=1}^{5} w_j \cdot x_j$$
$$P(\text{Attainment} \ge \tau \mid X) = \sigma(z) = \frac{1}{1 + e^{-\text{clip}(z, -20, 20)}}$$

* **Numerical Stability:** Input $z$ is clipped to $[-20, 20]$ to prevent exponential underflow/overflow.
* **Sparse History Fallback:** When fewer than 2 assessments exist ($n_{\text{obs}} < 2$), the system gracefully marks the record as `INSUFFICIENT_DATA` rather than extrapolating uncalibrated probabilities.

---

## 4. Training Methodology & Data Splitting

* **Student-Level Partitioning:** The cohort is partitioned into **70% Training Students** and **30% Held-Out Test Students** strictly by Student ID.
* **Leakage Prevention:** Assessments for a given student never span both training and test sets.
* **Optimization:** Logistic loss minimization via mini-batch gradient descent with L2 weight regularization to penalize extreme coefficients.

---

## 5. Evaluation Metrics & Performance

Evaluated in `src/services/predictionEvaluation.ts` on the held-out test cohort:

* **Confusion Matrix:** Evaluates True Positives (TP), False Positives (FP), True Negatives (TN), and False Negatives (FN).
* **Classification Metrics:** Accuracy, Precision, Recall, and Macro-F1 Score.
* **Discrimination:** Area Under the ROC Curve (ROC-AUC) computed via the exact Mann-Whitney U rank statistic.
* **Real Evaluation Status:**
  * In the 150-student synthetic demonstration cohort (`CS301` Operating Systems), held-out test evaluation achieves:
    * **Test Students:** 45 students (30% partition)
    * **Calculated ROC-AUC:** Reported dynamically in the Module 3 Prediction Evaluation panel.
    * *Note on Benchmark Claims:* Out-of-domain cross-institutional generalization is **not evaluated in this prototype** due to dataset availability.

---

## 6. Data Leakage Safeguards (Immutable Chronological Fence)

1. **Horizon Barrier:** When predicting for horizon $A3$, only historical marks $\{A1, A2\}$ are fed into feature extraction.
2. **Target Masking:** The actual score on target assessment $A3$ is masked and never ingested into the model's feature vector.
3. **Automated Mutation Proof:** In [`tests/testModule3Prediction.cjs`](file:///d:/Personal/College/Coding%20world/Project/Binary%20Beast/AI%20Course%20Outcome/tests/testModule3Prediction.cjs), injecting corrupted future assessment marks ($99,999$) produces **zero deviation** in historical feature values or posterior probabilities.

---

## 7. Model Limitations & Potential Bias

* **Class Size Assumption:** Calibrated for cohort sizes of 30–150 students; requires recalibration for mass-enrollment MOOCs ($>10,000$ students).
* **Assessment Granularity:** Requires question-to-CO rubrics. If an institution does not map exam questions to Course Outcomes, the model cannot extract topic-level granularity.
* **Historical Inertia:** A student who makes an unassisted breakthrough on unmonitored independent study may still reflect low antecedent probability until the next assessment is graded.

