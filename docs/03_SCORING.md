# 03 · Scoring

All scores are 0–100. **The AI gives the per-question and per-answer scores. All totals and averages are calculated in code, never by the AI.**

---

## 1. Grade settings

The **grade** decides the technical/managerial mix and the suitability weights. The admin can change them per post.

| Grade | Technical share | Managerial share | Suitability weights (knowledge / managerial / communication & relevance) |
|---|---|---|---|
| B | ~100% | ~0% | 70 / 0 / 30 |
| C–D | ~75% | ~25% | 60 / 20 / 20 |
| E | ~60% | ~40% | 50 / 30 / 20 |
| F–G | ~50% | ~50% | 45 / 35 / 20 |

The mix is a **suggestion** shown to the chairman (suggested vs actual). It is not enforced.

---

## 2. Scores for each question (judging the board)

| Part | Weight | Question it answers |
|---|---|---|
| Expertise fit | 60% | Does it match the candidate's confirmed expertise profile? |
| Post fit | 25% | Does it test the post's requirements? |
| Level fit | 15% | Is it right for the grade? |

**Question relevance = 0.60 × expertise + 0.25 × post + 0.15 × level**

For managerial questions, "expertise fit" means fit to the candidate's own work context, and "level fit" means fit to the responsibilities of the target grade.

**The AI also returns, for each question:**
- **Depth:** Basic / Intermediate / Advanced
- **Requirements tested:** list of post requirement IDs (may be empty)
- **Inappropriate flag:** yes/no + category (religion, caste, marital status, family plans, age, gender, other personal)
- **Reason:** one line

### Question rules
- **Ice-breakers** are left out of all relevance averages.
- **Flagged (inappropriate) questions always count as 0** in that expert's and the panel's relevance, **even during the ice-breaker**. Otherwise improper questions would be "free".
- **Follow-ups** are judged together with the question they follow.
- **Clarifications** (rephrasing after "Ask to clarify") are merged with the original and scored as one question.

### Board-side totals
- **Per expert** = average relevance of that expert's counted questions
- **Per phase** = average relevance of the counted questions in that phase
- **Panel** = average relevance of all counted questions

---

## 3. Scores for each answer (judging the candidate)

| Score | Question it answers | Used for |
|---|---|---|
| **Answer relevance** | Did the answer address *this* question? | Communication & relevance part; relevance cap |
| **Subject knowledge** | Correct and deep enough for the grade? (technical answers) | Subject knowledge score |
| **Managerial** | Good judgement, practical, clear? (managerial answers) | Managerial score |
| **Communication** | Clear and structured? Ignores speech-to-text errors, spelling and grammar | Communication & relevance part |
| **Reason** | One line explaining the scores | Reports |

### Answer rules
- **Relevance cap:** if answer relevance is below 40, the knowledge (or managerial) score is **capped at the answer relevance value**. A fluent answer about the wrong thing can't earn high marks.
- **Pass:** knowledge = 0. It is **left out** of answer relevance and communication averages.
- **Ice-breaker answers:** not scored.
- **Not evaluated** (AI failed after retries): left out of every average and shown as "Not evaluated" in the report. **Never replaced with a made-up number.**

---

## 4. Candidate totals

| Total | How |
|---|---|
| **Answer relevance** | Average answer relevance of answered technical + managerial questions |
| **Communication** | Average communication of answered technical + managerial questions |
| **Communication & relevance** | (Answer relevance + Communication) / 2 |
| **Subject knowledge** | **Weighted average** of knowledge over technical questions, where each question's weight = its question relevance |
| **Managerial** | Weighted average of managerial scores, weighted by question relevance |
| **Suitability** | Grade weights × (Subject knowledge, Managerial, Communication & relevance) |

### Why subject knowledge is weighted by question relevance (fairness)
If an expert asks something far outside the candidate's field, a weak answer should barely count.

Example (from the scenario): a chemistry question (relevance 12) to a radar engineer.
- Without weighting, knowledge = 51.
- With weighting, knowledge = 62.

### Missing categories
If a category has no questions (e.g. no managerial questions for a grade C candidate), its weight is **shared among the other categories** in proportion to their weights, so the candidate isn't penalised for a question type that was never asked. The old project already has this logic; reuse it.

---

## 5. Per-requirement suitability (against the advertised post)

For each post requirement:
- List the questions that tested it (from "requirements tested").
- Result = average knowledge / managerial score of those answers.
- If no question tested it → **"Never asked"**.

This table appears in the board report. It makes "suitability against the post" concrete.

---

## 6. Grade bands

| Score | Band |
|---|---|
| 80–100 | Excellent |
| 65–79 | Good |
| 50–64 | Satisfactory |
| 0–49 | Inadequate |

Shown next to every candidate total and the final score.

---

## 7. Confidence check (why the scores can be trusted)

Two independent signals for **question relevance**:
1. **AI judgement:** the score + reason from the AI.
2. **Maths similarity:** turn the question and the expertise profile into vectors (local embedding model), measure how close they are, and map that to 0–100.

- Difference ≤ 30 → **High confidence**
- Difference > 30 → **Low confidence – board should review** (badge in the report)

---

## 8. Board marks and final score

- Each expert enters their own mark (0–100) for the candidate, and optionally per question.
- **Board average** = average of the experts' overall marks.
- The report shows **AI suitability vs board average vs final score**.
- The **chairman enters the final score**.
- Chairman remark is **required** if |final − AI suitability| > 15.

---

## 9. Consistency settings for the AI

- Temperature 0.
- Structured output (fixed JSON schema) for every call.
- One pinned model for the whole interview. No switching models mid-interview.
- Blind input: no name, gender, age, photo or institution.
- Discipline-neutral rubric with example scores ("anchors") in the prompt.
- Test set: 20 question/answer pairs with expected score ranges, each run 3 times to check the scores stay steady.
