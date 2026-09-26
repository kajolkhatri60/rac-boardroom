# 04 · Example scenario

One full live interview, start to finish. All names and numbers are made up. The numbers follow the rules in `03_SCORING.md` exactly, so this file doubles as **test data** and **demo script data**.

---

## The people

| Role | Person | Background |
|---|---|---|
| RAC admin | Mr. Rao | Sets everything up |
| Chairman | Dr. Mehta | Runs the board |
| Expert 1 | Dr. Iyer | Radar systems |
| Expert 2 | Dr. Khan | Signal processing |
| Candidate | Priya Sharma | Radar engineer, 4 years' experience |

---

## Step 1: Mr. Rao publishes the post

- **Post:** Scientist 'C' – Radar Signal Processing
- **Advt. no:** RAC/2026/07
- **Grade:** C · **Type:** Recruitment (Priya is joining from outside DRDO)
- **Essential requirements:**
  - E1 Radar signal processing
  - E2 Digital filter design
  - E3 MATLAB/Python for signal analysis
- **Desirable requirements:**
  - D1 FPGA implementation
  - D2 Team handling
- **Automatic settings for grade C:**
  - Mix: ~75% technical / ~25% managerial
  - Suitability weights: 60 knowledge / 20 managerial / 20 communication & relevance

## Step 2: Priya applies

- Registers on the portal and clicks **Apply** on the post.
- Declares expertise: Electronics & Communication; radar signal processing, CFAR detection, adaptive filters.
- Uploads her resume and clicks **Submit**.

## Step 3: System prepares her profile

- **AI profile:**
  - Main field: Electronics & Communication
  - Specialisations: radar signal processing, CFAR, adaptive filters
  - Projects: FMCW radar for drone detection; led a 3-person radar test-bench team
  - Experience: 3 years ← **mistake**
- **Mismatch flags:** none.

## Step 4–5: Shortlist and schedule

- Mr. Rao shortlists Priya and schedules: live mode, 11:00 AM.
- Board: Dr. Mehta (chairman), Dr. Iyer, Dr. Khan.
- Room `K7P2QX` is created. Priya's dashboard shows the interview with a **Join** button.

## Step 6: Chairman confirms

- Dr. Mehta fixes "3 years" → **4 years** and clicks **Confirm**.
- The AI scorer will never see Priya's name, gender, photo or college.

## Step 7–8: Lobby (10:55)

- Priya: camera ✓, mic ✓, **I agree** ✓, reference photo ✓ → waiting room.
- The board joins and sees her profile and the requirements.
- 11:00: Dr. Mehta clicks **Admit**.

---

## Step 9: Ice-breaker (not scored)

| Q | Asked by | Question | Silent result |
|---|---|---|---|
| Q1 | Dr. Mehta | "Tell us about yourself and how you got into radar." | Saved, not scored |
| Q2 | Dr. Iyer | "How was your journey to Delhi today?" | Saved, not scored |
| Q3 | Dr. Khan | "Are you planning to get married soon?" | **Flagged: inappropriate (marital status). Counts as 0 for Dr. Khan** |

---

## Step 10: Technical phase

| Q | Asked by | Question | Question relevance | Depth | Tests |
|---|---|---|---|---|---|
| Q4 | Dr. Iyer | "Explain how CFAR detection works and why radar needs it." | **94** | Intermediate | E1 |
| Q5 | Dr. Iyer (follow-up to Q4) | "What happens to CA-CFAR when two targets are very close?" | **92** | **Advanced** | E1 |
| Q6 | Dr. Khan | "Explain the process of polymer vulcanisation." | **12** | Basic | — |
| Q7 | Dr. Khan | "How would you design an FIR low-pass filter for a radar receiver, and when would you choose IIR?" | **91** | Intermediate | E2 |
| Q8 | Dr. Mehta | "How do you process radar data in Python? Which libraries, what steps?" | **86** | Intermediate | E3 |

**Example breakdown for Q4:** expertise 95, post 95, level 85 → 0.60×95 + 0.25×95 + 0.15×85 = **93.5 ≈ 94**
**Reason for Q6:** "Chemistry topic, unrelated to the candidate's field and the post."

**What happened with each answer:**
- **Q4:** clear, correct answer.
- **Q5:** Priya clicks **Ask to clarify** ("Close in range or in Doppler?"). Dr. Iyer: "In range." Scored as one question. Her answer is partly right: she explains masking but misses the standard fix.
- **Q6:** Priya clicks **Pass**.
- **Q7:** she talks fluently for two minutes about her project's hardware and never explains FIR vs IIR. **Off-topic.**
- **Q8:** good answer.

| Q | Answer relevance | Subject knowledge | Communication | Note |
|---|---|---|---|---|
| Q4 | 92 | 82 | 85 | |
| Q5 | 85 | 60 | 78 | Clarification merged |
| Q6 | — | 0 | — | **Pass**: left out of relevance and communication |
| Q7 | **35** | **35** (would be 70) | 80 | **Relevance cap applied** (relevance < 40) |
| Q8 | 90 | 80 | 82 | |

**Proctoring (silent):**
- 11:24 tab switch (6 s)
- 11:31 face not visible (5 s)

---

## Step 11: Managerial (grade C → about 25%)

| Q | Asked by | Question | Question relevance | Tests |
|---|---|---|---|---|
| Q9 | Dr. Mehta | "Your 3-person team misses a deadline because a vendor delayed hardware. What do you do?" | **83** | D2 |
| Q10 | Dr. Iyer | "How would you divide work among juniors to move your CFAR code to a new processor?" | **85** | D2 |

| Q | Answer relevance | Managerial | Communication |
|---|---|---|---|
| Q9 | 88 | 75 | 84 |
| Q10 | 80 | 65 | 76 |

**Proctoring:** 11:36 disconnected (20 s), rejoined, carried on.

---

## Step 12: Closing

- Priya asks: "What projects would this post work on?" (not scored)
- Dr. Mehta clicks **End interview**. Priya sees "Interview concluded. Thank you."
- Priya saw **no scores** at any point.

---

## Step 13: Results

### Board side: question relevance
Counted: Q3 (flagged = 0) and Q4–Q10. Q1 and Q2 are skipped.

| Expert | Questions | Score |
|---|---|---|
| Dr. Mehta | Q8 86, Q9 83 | **84.5** |
| Dr. Iyer | Q4 94, Q5 92, Q10 85 | **90** |
| Dr. Khan | Q3 0 (flagged), Q6 12, Q7 91 | **34** |
| **Panel** | (0+94+92+12+91+86+83+85) / 8 | **68** |

| Phase | Score |
|---|---|
| Ice-breaker | 1 flagged question |
| Technical (Q4–Q8) | 75 |
| Managerial (Q9–Q10) | 84 |

**Depth graph:** Intermediate → Advanced → Basic → Intermediate → Intermediate → Intermediate → Intermediate

### Candidate side

| Total | Calculation | Result |
|---|---|---|
| Answer relevance | (92+85+35+90+88+80) / 6 | **78** |
| Communication | (85+78+80+82+84+76) / 6 | **81** |
| Communication & relevance | (80.8 + 78.3) / 2 | **79.6** |
| Subject knowledge (weighted) | (82×94 + 60×92 + 0×12 + 35×91 + 80×86) / (94+92+12+91+86) = 23293 / 375 | **62** |
| Subject knowledge (without weighting, for comparison) | (82+60+0+35+80) / 5 | 51 |
| Managerial (weighted) | (75×83 + 65×85) / (83+85) | **70** |
| **Suitability** | 0.60×62.1 + 0.20×69.9 + 0.20×79.6 | **67 → Good** |

### Per requirement

| Requirement | Tested by | Result |
|---|---|---|
| E1 Radar signal processing | Q4, Q5 | 71 |
| E2 Digital filter design | Q7 | **35: weak** (off-topic answer) |
| E3 Python/MATLAB | Q8 | 80 |
| D1 FPGA | — | **Never asked** |
| D2 Team handling | Q9, Q10 | 70 |

---

## Step 14: Chairman review

| Item | Value |
|---|---|
| AI suitability | 67 |
| Board marks | Mehta 72, Iyer 70, Khan 74 → average **72** |
| Gap | 5 points |
| **Final score** | **70 (Good)** |
| Remark | "Strong radar basics, needs depth in filter design." (optional, since the gap is ≤ 15) |

Dr. Mehta clicks **Finalise**, then later **Publish to candidate**.

---

## Step 15: Reports

**Board / RAC report:**
- Panel 68; Dr. Khan 34 with Q3 highlighted as flagged; Q6 shown as off-field
- All 10 questions with scores, depth, reasons, confidence badges
- All candidate totals + the per-requirement table ("D1 FPGA: Never asked")
- AI 67 · Board 72 · Final 70 + remark
- Proctoring timeline (separate): 11:24 tab switch · 11:31 face missing · 11:36 disconnect

**Priya's report:**
- Final 70 (Good); her totals and bands
- Q7 feedback: "You described your project hardware but didn't explain FIR vs IIR filter design."
- Strengths: CFAR fundamentals, Python workflow
- Improve: filter design, advanced CFAR variants
- Panel overall question relevance: 68
- **Not shown:** per-expert scores, board marks, proctoring

---

## Promotion example: Arjun (short)

- Scientist 'D', employee, going for 'E' (Promotion). Grade E → ~60% technical / ~40% managerial; weights 50/30/20.
- Logs in with employee ID; details pre-filled. Adds a "work done in grade D" report: a satellite antenna array project, leading 6 people.
- Questions focus on **his work done**, e.g. "Walk us through the design trade-offs in your antenna array." More managerial questions, e.g. "How did you handle a team member who kept missing test deadlines?"
- Same scoring and reports.

---

## Candidate practice example

- A week before the interview, Priya picks "Scientist C – Radar" and uploads her resume.
- An AI chairman + 2 AI experts appear in the boardroom. Same phases.
- At the end she sees her scores and learns that **filter design** is her weak spot.

## Expert training example

- Dr. Khan picks the sample candidate "RF engineer, grade B".
- He asks "Explain polymer vulcanisation."
  - He instantly sees: **relevance 10**, "Chemistry topic, unrelated to RF."
- He asks "Explain impedance matching in RF circuits."
  - He sees: **relevance 92**, Intermediate.
- Training report: his average relevance, requirements covered, depth pattern.

---

## Which PS clause each part of this scenario proves

| Moment | PS clause |
|---|---|
| Q1–Q3 easy, Q5 Advanced | Ice-breaking → in-depth |
| Grade C got ~25% managerial | Techno-managerial by level |
| Q6 = 12, Q4 = 94 | Question relevance to area/expertise |
| Mehta 84.5, Iyer 90, Khan 34, panel 68 | Score for experts |
| Priya sees 68 | …as well as the candidate |
| Q7 answer relevance 35 despite fluency | Responses graded for relevance to the question |
| AI 67, board 72, chairman 70 | Assisting in arriving at the score |
| Per-requirement table | Suitability against the advertised post |
| Blind scoring, Q3 flag, weighting (62 vs 51) | Unbiased, objective |
| Practice + training modes | Simulation for experts and candidates |
