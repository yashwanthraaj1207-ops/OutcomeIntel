# Academic Methodology & Mathematical Formulations

**Project:** AI-Powered Course Outcome Early-Warning, Explainability and Instructional Intervention System  
**Framework:** Outcome-Based Education (OBE), National Board of Accreditation (NBA), ABET Criterion 3 & 4  

---

## 1. Course Outcome (CO) Attainment Calculations

### 1.1 Student-Level CO Attainment Percentage
For a student $s$ and Course Outcome $c$, the attainment percentage aggregates marks across all questions mapped to $c$:

$$\text{Attainment}_{s,c} = \left( \frac{\sum_{q \in Q_c} \text{marks\_obtained}_{s,q}}{\sum_{q \in Q_c} \text{max\_marks}_q} \right) \times 100$$

*Boundary Rules:*
* If $\sum \text{max\_marks}_q = 0$, $\text{Attainment}_{s,c} = \text{null}$ (flagged as `INSUFFICIENT_DATA`).
* Values strictly bounded between $0.0\%$ and $100.0\%$. Missing marks are never silently imputed as $0\%$.

---

### 1.2 Institutional Target Attainment Gap
The attainment gap evaluates the difference between measured student/cohort performance and the departmental threshold benchmark $\tau_c$ (default $70.0\%$):

$$\text{Gap}_{s,c} = \text{Attainment}_{s,c} - \tau_c$$

*Interpretation:*
* $\text{Gap} \ge 0$: Benchmark achieved or exceeded.
* $\text{Gap} < 0$: Negative attainment gap in percentage points ($\text{pp}$).
* If $\tau_c$ is unconfigured: the system displays `"Target reference unavailable"` and $\text{Gap} = \text{null}$.

---

### 1.3 Cohort Threshold Attainment Rate
For accreditation compliance (NBA Criterion 3), the cohort attainment rate measures the percentage of students in course section $C$ who meet or exceed the institutional threshold $\tau_c$:

$$\text{CohortAttainmentRate}_c = \left( \frac{\sum_{s \in S_C} \mathbb{I}(\text{Attainment}_{s,c} \ge \tau_c)}{|S_C|} \right) \times 100$$

Where $\mathbb{I}(\cdot)$ is the binary indicator function.

---

## 2. Deterministic Risk Classification Precedence Rules

Risk classification in Module 4 is strictly deterministic, mutually exclusive, and evaluated in exact priority order:

```
[Student Assessment State]
           │
           ▼
1. INSUFFICIENT DATA? ────► YES ────► Classification: INSUFFICIENT DATA
           │ NO
           ▼
2. HIGH RISK?         ────► YES ────► Classification: HIGH RISK
   • P(Attainment) < 40%
     OR
   • Gap < -10 pp AND Trend = Declining
           │ NO
           ▼
3. LOW RISK?          ────► YES ────► Classification: LOW RISK
   • P(Attainment) >= 70%
     AND
   • Gap >= -5 pp
     AND
   • Trend != Declining
           │ NO
           ▼
4. MEDIUM RISK        ─────────────► Classification: MEDIUM RISK (All remaining eligible cases)
```

### Risk Priority Score Formula:
To rank students requiring urgent faculty attention within the High Risk category:

$$\text{PriorityScore} = \left( (1.0 - P_{\text{attain}}) \times 60 \right) + \left( \min(40, |\text{Gap}|) \times 0.4 \right)$$
Bounded between $0$ and $100$. Higher scores indicate higher pedagogical urgency.

---

## 3. Topic Diagnosis & Feature Attribution

### 3.1 Topic Mastery Score
For a student $s$ and curricular topic $t$, mastery aggregates question scores linked to topic $t$:

$$M_{s,t} = \left( \frac{\sum_{q \in Q_t} \text{marks\_obtained}_{s,q}}{\sum_{q \in Q_t} \text{max\_marks}_q} \right) \times 100$$

*Deficiency Threshold:* Topic is flagged as `CRITICAL DEFICIENT` if $M_{s,t} < 40\%$, and `NEEDS ATTENTION` if $40\% \le M_{s,t} < 60\%$.

### 3.2 Additive Linear Feature Attribution
The directional impact $\phi_j$ of feature $x_j$ on prediction log-odds is calculated as:

$$\phi_j = w_j \cdot (x_j - \bar{X}_j)$$
Positive $\phi_j$ increases attainment probability; negative $\phi_j$ drags attainment probability down.

---

## 4. Reassessment & Learning Gain Formulations

Module 7 evaluates empirical performance changes following an approved intervention.

### 4.1 Absolute Learning Gain (Percentage Points)
$$g_{\text{abs}} = \text{Post Attainment}_{\text{reassessment}} - \text{Pre Attainment}_{\text{baseline}}$$
*Units:* Strictly expressed in **percentage points** ($\text{pp}$), not relative percent.

### 4.2 Relative Improvement Percentage
$$\text{Imp}_{\text{rel}} = \left( \frac{\text{Post Attainment} - \text{Pre Attainment}}{\text{Pre Attainment}} \right) \times 100 \quad (\text{Evaluated ONLY when } \text{Pre} > 0)$$
*Zero-Baseline Rule:* When $\text{Pre Attainment} = 0\%$, the system displays:  
`"Relative improvement unavailable because baseline attainment is 0%."`

### 4.3 Hake's Normalized Learning Gain ($g$)
To measure pedagogical efficacy accounting for ceiling effects:

$$g_{\text{norm}} = \frac{\text{Post} - \text{Pre}}{100 - \text{Pre}} \quad (\text{for } \text{Pre} < 100)$$

*Classification of Efficacy (Richard Hake, 1998):*
* **High Gain:** $g \ge 0.70$
* **Medium Gain:** $0.30 \le g < 0.70$
* **Low Gain:** $g < 0.30$

---

### 4.4 Deterministic Reassessment Effectiveness Tiers

| Classification | Mathematical Condition | Institutional Meaning |
|:---|:---|:---|
| `TARGET ACHIEVED` | $\text{Post Attainment} \ge \text{Target}$ | Remediation successful; outcome certified resolved. |
| `POSITIVE GAIN` | $\text{Pre} < \text{Post} < \text{Target}$ | Student improved, but has not yet met departmental benchmark. |
| `NO MEASURABLE GAIN` | $\text{Post} == \text{Pre}$ | No performance change detected; alternative strategy needed. |
| `NEGATIVE CHANGE` | $\text{Post} < \text{Pre}$ | Performance regressed; triggers faculty alert. |
| `INSUFFICIENT DATA` | $\text{Post} == \text{null}$ or missing baseline | Reassessment pending administration. |

