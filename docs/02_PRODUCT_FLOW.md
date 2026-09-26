# 02 · Product flow

## 1. Roles

| Role | Who | What they do |
|---|---|---|
| **RAC admin** | RAC staff | Publishes posts, reviews applications, shortlists, schedules interviews, sets up boards |
| **Chairman** | Senior board member | Confirms the candidate profile, admits the candidate, controls phases, ends the interview, finalises the score, publishes the candidate report |
| **Expert** | Board member (1 to 4 per board) | Asks questions, gives private marks |
| **Candidate** | Applicant or employee | Applies, joins, answers questions |

For the demo, the admin and chairman can be one login. The data model still keeps them as separate roles.

---

## 2. Three modes (same room, same scoring, same reports)

| Mode | Board | Candidate | When scores are shown |
|---|---|---|---|
| **Live interview** | Real people | Real person | Only after the chairman ends the interview |
| **Candidate practice** | AI (chairman + 2 experts) | Real person | At the end of practice |
| **Expert training** | Real expert | AI candidate (sample profile) | **Right after every question** |

**Key idea:** the AI is just "another participant" in the room. It sends questions or answers through the same channel as a human would. So all three modes share one engine.

---

## 3. Big picture

```
Admin publishes post
      ↓
Candidate applies (form + resume)
      ↓
AI builds expertise profile → mismatch flags
      ↓
Admin shortlists → schedules interview → assigns board
      ↓
Chairman confirms profile
      ↓
Lobby: candidate device check + consent; board joins; chairman admits
      ↓
Ice-breaker  →  Technical  →  Managerial (by grade)  →  Closing
      │  (silent scoring of every question and every answer)
      │  (silent proctoring log)
      ↓
Server finishes all scoring → calculates results
      ↓
Chairman review: AI score vs board marks → final score → finalise
      ↓
Board/RAC report     +     Candidate report (after chairman publishes)
```

---

## 4. Step by step

### Step 1: Admin publishes a post

**Admin fills in:**
- Post name, e.g. "Scientist 'C' – Radar Signal Processing"
- Advertisement number
- Discipline
- Grade: B / C / D / E / F / G
- Interview type: Recruitment / Promotion
- Essential requirements (a list)
- Desirable requirements (a list)
- Score weights (pre-filled from the grade, can be changed)

**System does:**
- Saves the post. One post is used for many candidates.
- Sets the suggested technical/managerial mix from the grade (see `03_SCORING.md`).
- **Publish** makes the post visible on the portal's "Open posts" page.

> Grade and interview type are **separate fields**. RAC also recruits directly at grades above B, so a new recruit can be grade C, D, E and so on.
> - **Grade** decides the technical/managerial mix and the expected depth.
> - **Type** decides what the questions are based on: resume + post for recruitment, work done in current grade for promotion.

---

### Step 2: Candidate applies (applicant portal)

**Recruitment candidate (e.g. Priya):**
1. Registers (email + password).
2. Opens "Open posts" and clicks **Apply**.
3. Fills in the form:
   - Personal: name, date of birth, contact
   - Education: degree, branch, university, year
   - Experience: organisation, role, years
   - **Declared area of expertise:** main field + specialisations
   - Key projects (short)
4. Uploads resume PDF.
5. Clicks **Submit**. Dashboard shows "Application submitted".

**Promotion candidate (e.g. Arjun):**
1. Logs in with **employee ID**.
2. Details come pre-filled from the employee record: name, current grade, lab, date of joining. For the prototype, this record is sample data.
3. Adds **work done in current grade** (projects, role, outcomes) and uploads the report.
4. Submits.

**Backup option (real rollout):** the admin imports shortlisted candidates from RAC's existing system as CSV/Excel. Each candidate gets an invite to log in and upload their resume.

---

### Step 3: System prepares the profile (silent)

- Reads the resume PDF (and the work-done report for promotions).
- AI builds the **expertise profile**:
  - Main field
  - Specialisations
  - Key projects
  - Years of experience
  - Keywords
- Compares the profile with what the candidate **declared** in the form.
- Flags mismatches. Example: declares "FPGA", but nothing in the resume supports it → "not supported by resume".

---

### Step 4: Admin reviews and shortlists

- Opens the post and sees the list of applicants.
- Opens an application: form + resume + AI profile + flags.
- Clicks **Shortlist** (or Reject).

---

### Step 5: Admin schedules the interview

- Picks date and time.
- Assigns the board: chairman + experts (name + specialisation).
- Picks the mode: Live.
- System creates the room (6-character code, e.g. `K7P2QX`).
- The candidate's dashboard shows: "Interview on <date>, <time>", with a **Join** button that becomes active 10 minutes before.
- Board members see the interview in their dashboard.

---

### Step 6: Chairman confirms the profile

- Opens the candidate's AI profile + mismatch flags.
- Edits anything wrong (e.g. "3 years" → "4 years").
- Clicks **Confirm**.
- **The confirmed profile is the yardstick** for every question-relevance score.

---

### Step 7: Candidate lobby

In this order:
1. Clicks **Join** (already logged in, so no code needed; the code also works as a backup).
2. **Camera check:** sees own face.
3. **Mic check:** speaks and a sound bar moves.
4. Reads the rules + proctoring notice and clicks **I agree**.
5. System takes a **reference face photo**.
6. Waiting screen: "The board will admit you shortly."

---

### Step 8: Board lobby

- Each board member opens the interview from their dashboard.
- Sees: candidate profile, post requirements, who else has joined.
- The chairman sees "Candidate is ready" → clicks **Admit** → the boardroom opens.

---

### Step 9: The boardroom screens

**Board screen shows:**
- Candidate's live video (one-way, candidate → board)
- Current phase + timer
- Suggested technical/managerial mix vs actual mix so far
- Question box (type or dictate with the mic)
  - Option: "Follow-up to question #__"
  - Tag: Technical / Managerial (set automatically from the phase, editable)
- Queue of questions waiting from other experts
- Live transcript of all questions and answers
- Requirement checklist: ticks when a requirement has been asked about (**no scores**)
- **My marks** panel (private to each expert)
- **Chairman only:** phase buttons, whose turn it is, End interview

**Candidate screen shows:**
- Board seats with names; the person asking is highlighted
- Current question in large text
- Answer area:
  - Voice, with a live transcript the candidate **can edit** before submitting
  - Or typing
- Buttons: **Submit**, **Ask to clarify**, **Pass**
- Small self-camera preview
- Current phase
- **Never any scores** in live mode

---

### Step 10: Ice-breaker phase

- Chairman clicks **Start ice-breaker**.
- Experts ask 2–3 easy warm-up questions (suggested 3–5 minutes).
- Saved in the transcript.
- **Not scored**, except that the **inappropriate-question check always runs**. A flagged ice-breaker counts as 0 for that expert.

---

### Step 11: Technical phase (the main loop)

Chairman clicks **Start technical**. For every question:

1. Expert types or dictates a question → **Send**.
2. If another question is live, it waits in the queue.
3. **Server saves:** text, who asked, phase, tag, follow-up link, time.
4. **Server sends** the question to the candidate and the other experts.
5. **AI checks the question** (silent, in the background):
   - Relevance to the candidate's expertise (60%)
   - Relevance to the post requirements (25%)
   - Right level for the grade (15%)
   - Depth: Basic / Intermediate / Advanced
   - Inappropriate flag (religion, caste, marriage, family plans, etc.)
   - Which post requirements it tests
   - One-line reason
6. Candidate answers → **Submit**.
7. **Server saves** the answer + time taken, and sends the transcript to the board.
8. **AI checks the answer** (silent):
   - Answer relevance: did it answer *this* question?
   - Subject knowledge: correct and deep enough for this grade?
   - Communication: clear? (Transcription, spelling and grammar errors are ignored.)
   - One-line reason
9. Scores are saved and **hidden**.
10. Experts may add their own mark in **My marks**.
11. Next question.

**Special buttons:**

| Button | Who | What happens |
|---|---|---|
| **Follow-up to #N** | Expert | The question is judged together with question N, so "Can you explain more?" is not marked irrelevant |
| **Ask to clarify** | Candidate | Board sees "Candidate asks to clarify". The expert rephrases. Both versions are scored together as one question |
| **Pass** | Candidate | Subject knowledge = 0. Not counted as an off-topic answer. Left out of answer relevance and communication |

---

### Step 12: Managerial questions

- Driven by the **grade**, not by the interview type.
- Chairman clicks **Start managerial**, or experts tag individual questions as Managerial.
- Topics: leadership, team handling, project decisions, planning, vendor/resource problems.
- The question is judged against the responsibilities of the target grade.
- The answer is judged on judgement, practical sense, clarity and relevance.
- For grade B, this phase is hidden unless the chairman adds it.

---

### Step 13: Closing

- Chairman: "Do you have any questions for the board?" (not scored)
- Chairman clicks **End interview** → confirm.
- Candidate sees: "Interview concluded. Thank you." The camera turns off.

---

### Step 14: Processing (server)

1. Wait for all AI checks still running.
2. Retry failed ones.
3. Still failing → mark **"Not evaluated"**. **Never invent a score.**
4. Calculate all results (`03_SCORING.md`).
5. AI writes a short summary: strengths, gaps.

---

### Step 15: Chairman review

**Chairman sees:**
- AI scores
- Each board member's marks and the board average
- The gap between the AI score and the board average

**Chairman does:**
- Enters the **final score**.
- Must write a remark if the final score differs from the AI suitability score by **more than 15 points**.
- **Finalise** → later, **Publish to candidate**.

---

### Step 16: Reports

**Board / RAC report:**
- Panel question relevance: overall, per expert, per phase
- Every question with relevance, depth, reason, flags, confidence badge
- Depth graph over the interview
- Candidate scores: answer relevance, subject knowledge, managerial, communication, suitability, bands
- Per-requirement results, including "Never asked"
- AI score vs board marks vs final score, with the chairman's remark
- Proctoring timeline (**separate, never mixed into scores**)
- Print / Save as PDF

**Candidate report (only after the chairman publishes):**
- Own scores + bands
- Feedback per answer
- Strengths and areas to improve
- Panel's **overall** question relevance score (not per expert)
- **Not shown:** per-expert scores, board marks, proctoring log

---

### Step 17: Post dashboard (admin)

- All candidates for one post in one list.
- Suitability, final score, status, date.
- Sortable, to help comparison.

---

## 5. Simulation modes in detail

### Candidate practice
- Candidate logs in, picks a post (or enters one), uploads a resume, and checks the AI profile.
- **AI board:** chairman + 2 experts shown in the same boardroom screen.
- The AI asks questions following the same phases and the grade-based mix.
- The candidate answers exactly as in live mode.
- Scores and feedback are shown at the end.
- No proctoring.

### Expert training
- Expert logs in and picks a **sample candidate**, e.g.:
  - "RF engineer, grade B, recruitment"
  - "Materials scientist, grade E, promotion"
- The **AI candidate** answers in character (sometimes strong, sometimes weak, sometimes off-topic, to test the expert).
- **After every question**, the expert sees at once:
  - Relevance score + reason
  - Depth level
  - Inappropriate flag, if any
- The training report shows: average relevance, requirements covered, depth progression, flagged questions.

---

## 6. Proctoring (live mode only)

**Tracked (in the candidate's browser):**
- Face not visible for more than 3 seconds
- More than one face
- Tab switch / window lost focus
- Disconnect / rejoin

**Rules:**
- Logged silently. No live alerts to anyone.
- Only small event messages go to the server, **never video for proctoring**.
- Shown only in the board report as a timeline.
- **Never affects any score.**

---

## 7. Who sees what

| Information | Admin | Board | Candidate | AI scorer |
|---|---|---|---|---|
| Name, date of birth, contact, photo | Yes | Yes | Own | **No** |
| Education, experience | Yes | Yes | Own | Yes (no college name) |
| Declared expertise + AI profile + flags | Yes | Yes | Own profile | Yes |
| Resume PDF | Yes | Yes | Own | No (profile only) |
| Live scores during interview | No | **No** | **No** | — |
| Per-question scores and reasons (after end) | Yes | Yes | Own answers only | — |
| Per-expert relevance scores | Yes | Yes | **No** | — |
| Panel overall relevance score | Yes | Yes | Yes (after publish) | — |
| Board marks | Yes | Yes | **No** | — |
| Proctoring log | Yes | Yes | **No** | — |

---

## 8. If something goes wrong

| Problem | What happens |
|---|---|
| Candidate disconnects | Board sees "Disconnected". Candidate rejoins (same login / code) and continues. Logged |
| Expert disconnects | Rejoins the same way |
| Page refresh | Everything reloads from the server |
| AI slow | Interview continues; scoring catches up in the background |
| AI fails | Retry → "Not evaluated". Never a fake score |
| Server restarts | Pending scoring jobs resume on start (status is stored in the database) |
