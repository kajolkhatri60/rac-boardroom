# 09 · Build plan

## Priority levels

- **Must:** without it we don't meet the PS.
- **Should:** makes us stand out.
- **Could:** only if time is left.

| Feature | Priority |
|---|---|
| Login + roles | Must |
| Post + requirements | Must |
| Candidate application + resume → expertise profile + chairman confirm | Must |
| Room + lobby + live question/answer loop (WebSocket) | Must |
| Phases (ice-breaker → technical → managerial) | Must |
| Question relevance scoring (+ depth, flag, reason) | Must |
| Answer scoring (relevance, knowledge/managerial, communication) | Must |
| Hidden scores + end + processing | Must |
| Board marks + chairman final score | Must |
| Board report + candidate report | Must |
| Per-requirement suitability | Must |
| Blind scoring + inappropriate-question flag | Must |
| **Expert training mode** (AI candidate) | Must (covers "Simulation") |
| Candidate practice mode (AI board) | Should |
| Candidate video → board | Should |
| Proctoring (face, tab) | Should (hackathon requirement) |
| Confidence check (embeddings) | Should |
| Scorer consistency test set | Should |
| Print / PDF | Should |
| Post dashboard | Could |
| CSV import | Could |
| Ollama provider (on-prem demo) | Could |

---

## Build order

### Stage 0: Setup (day 1, first hours)
- Repo, docs, `.gitignore` ✓
- Backend skeleton: FastAPI + SQLModel + SQLite + `/health`
- Frontend skeleton: Vite + React + Tailwind + React Router
- `.env.example`; new Gemini key in local `.env` only

### Stage 1: The live loop (highest risk, do it first)
- Session + Participant tables, a simple join (no auth yet)
- WebSocket room manager: snapshot on connect, `ask_question` → `question_live`, `submit_answer` → `answer_submitted`
- Two browsers: the expert's question appears on the candidate's screen and the answer comes back
- **Milestone:** a working question-and-answer loop on two devices

### Stage 2: Scoring engine
- `LLMProvider` + `GeminiProvider` (async, structured, temperature 0)
- Question-relevance prompt + answer-scoring prompt (discipline-neutral, blind)
- Background jobs with status; all maths in `scoring/` with unit tests using the Priya numbers
- **Milestone:** after End, the board sees every score with its reason

### Stage 3: Real product around it
- Auth + roles
- Post, requirements, applicant portal, resume → profile, confirm
- Scheduling, lobby, phases, clarify/pass/follow-up, board marks
- Chairman review → finalise → publish
- Reports (board + candidate), per-requirement table, bands

### Stage 4: Simulation
- AI participant: AI candidate (training mode, with instant scores) → then AI board (practice mode)

### Stage 5: Extras
- Proctoring, video, confidence check, print CSS, post dashboard

### Stage 6: Demo polish
- Seed script (Priya scenario) + Reset demo
- Deploy with HTTPS; test on 3 devices on a phone hotspot
- Record a backup demo video
- Slides: PS clause table, "How we ensure unbiased evaluation", scorer consistency result

---

## Team split (4 people)

| Person | Owns |
|---|---|
| 1. Backend | DB tables, auth/roles, REST, WebSocket room manager, background jobs |
| 2. AI | Provider, prompts, schemas, scoring maths + tests, embeddings, AI participants, test set |
| 3. Frontend A | Admin + applicant portal, chairman review, reports, post dashboard |
| 4. Frontend B | Lobby, boardroom screens (board + candidate), speech, proctoring, video |

---

## Decisions already made

- Up to 4 experts per board
- Question relevance: 60% expertise / 25% post / 15% level
- The **grade** drives the managerial mix and weights; the interview type drives the question basis
- Ice-breakers not scored; flagged questions count as 0
- Relevance cap below 40; subject knowledge weighted by question relevance
- Chairman remark required when |final − AI| > 15
- The candidate sees only the panel's overall relevance score
- Candidate report released when the chairman publishes it
- Proctoring silent, separate, never in scores
- Coding round dropped

## Still open

- Team size and how long we have → decides whether practice mode and video make the cut
- Exact grade bands and weights: confirm with the team
- Hosting choice: Render or Railway
