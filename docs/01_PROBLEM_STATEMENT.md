# 01 · Problem statement

## The PS, word for word

> **Category:** Web based
> **ID:** PSWB01
> **Title:** Web based Selector-Applicant Simulation Software
>
> **Background:**
> Recruitment and Assessment Centre (RAC) under DRDO, Ministry of Defence carries out interviews for applications received against advertised vacancies and for promotion to next higher grade for scientific manpower inducted within DRDO.
>
> **Description:**
> The process of interviewing is a challenging task. An unbiased objective interviewing process helps identify the right talent. The basic process of an interview involves posing a set of questions by an interviewer and thereafter evaluating responses from candidates. Thus, the questions asked should be relevant and match the area/expertise of the applicant and the responses should also be of relevance w.r.t. the question asked.
>
> **Expected Solution:**
> The proposed solution should provide experts as well as candidates a real life Board Room experience, starting with initial ice-breaking questions leading to in-depth techno-managerial (depending on the level of candidate) questions. It shall also be able to provide a quantifiable score for experts as well as the candidate for the relevancy of questions w.r.t. the area/expertise of the applicant. Similarly, candidate responses should also be graded for relevancy w.r.t. the question asked, finally assisting in arriving at an overall score for the subject knowledge of the candidate and thus his/her suitability against the advertised post.

---

## What the PS really asks for, in simple words

1. **Two sides are judged, not one.**
   - The **experts' questions** are scored: are they relevant to the candidate's area?
   - The **candidate's answers** are scored: are they relevant to the question asked?
2. **It must feel like a real boardroom**, for **both** experts and candidates.
3. **Fixed order:** ice-breakers first, then deeper technical and managerial questions.
4. **The managerial share depends on the candidate's level** (grade).
5. **Covers both** recruitment (advertised vacancies) and promotion (next higher grade).
6. **It must be unbiased and objective.**
7. **The system assists the board.** It helps the board arrive at the final score; it doesn't replace the board.
8. **The end result:** a subject knowledge score and suitability **against the advertised post**.
9. **The title says "Simulation"**, so both sides must be able to *practise*, not only run real interviews.

---

## Clause-by-clause coverage

Every sentence of the PS, and where our design covers it.

| # | PS clause | How we cover it | Details in |
|---|---|---|---|
| 1 | "Web based" | Browser app for every role, nothing to install. Typing always works when voice isn't supported | 05 |
| 2 | "Selector-Applicant" | Board roles (chairman, experts) and candidate role | 02 |
| 3 | "Simulation Software" | Three modes: Live interview, Candidate practice (AI board), Expert training (AI candidate) | 02 |
| 4 | "advertised vacancies" | Post model + applicant portal: RAC publishes a post, candidates apply | 02 |
| 5 | "promotion to next higher grade" | Promotion type: employee record + "work done in current grade" report | 02 |
| 6 | "scientific manpower" | All AI prompts are discipline-neutral (electronics, mechanical, materials, chemistry, life sciences, etc.) | 06 |
| 7 | "unbiased" | Blind AI scoring, inappropriate-question flag, accent-fair transcripts, weighting that protects candidates from off-field questions | 03 |
| 8 | "objective" | Fixed rubrics, temperature 0, all maths done in code, a reason for every score, confidence check | 03 |
| 9 | "posing questions… evaluating responses" | Live question → answer loop | 02 |
| 10 | questions "relevant and match the area/expertise" | Question relevance scored against the chairman-confirmed expertise profile | 03 |
| 11 | responses "of relevance w.r.t. the question" | Answer relevance score, kept separate from correctness | 03 |
| 12 | "real life Board Room experience" for experts **and** candidates | Chairman + experts, named seats, phases, candidate video to the board, formal UI, simulation modes | 02 |
| 13 | "starting with ice-breaking… leading to in-depth" | Phases controlled by the chairman; every question gets a depth level; the report shows the depth graph | 02, 03 |
| 14 | "techno-managerial (depending on the level)" | The **grade** sets the technical/managerial mix; questions are tagged technical or managerial | 03 |
| 15 | "quantifiable score for experts" for question relevancy | Question relevance per question, per expert, per phase and for the whole panel | 03 |
| 16 | "…as well as the candidate" | The candidate report shows the panel's overall question relevance score | 02 |
| 17 | responses "graded for relevancy" | Numeric score + grade band (Excellent / Good / Satisfactory / Inadequate) | 03 |
| 18 | "assisting in arriving at an overall score" | AI score + board members' own marks → **chairman finalises** | 02, 03 |
| 19 | "subject knowledge of the candidate" | Subject knowledge score | 03 |
| 20 | "suitability against the advertised post" | Suitability score + per-requirement results ("requirement → questions → result") | 03 |

---

## Things we add that the PS doesn't ask for

These are useful, but the PS items above always come first if time runs short.

- **Proctoring** (face presence, tab switching). Kept light and never mixed into scores.
- **PDF / print export** of reports.
- **Device check in the lobby.**
- **Post dashboard** comparing all candidates for one post.

## Things we deliberately dropped

- **Coding round.** The PS doesn't ask for it, most DRDO disciplines aren't software, and the old version faked its results.
- **AI-generated follow-ups in live mode.** In live mode, the human experts ask their own follow-ups.
