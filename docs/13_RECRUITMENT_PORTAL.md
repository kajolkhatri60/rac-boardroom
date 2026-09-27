# 13 · Recruitment portal

The part of the system **before** the interview room: the admin publishes an advertisement → applicants see it and apply → the AI screens each resume against the post → the admin shortlists and schedules the interview with a board → everyone joins the room from their dashboard.

This file **replaces the draft in `08_DATA_AND_MESSAGES.md`** for users, posts, applications and scheduling. The interview room messages in `08` are unchanged.

---

## 1. The flow

```
ADMIN                          APPLICANT                         SYSTEM
─────                          ─────────                         ──────
Create advertisement (draft)
Add requirements E1…, D1…
Publish ─────────────────────► Sees it in "Open advertisements"
                               Opens it, reads requirements
                               Applies (4 steps + resume PDF) ──► Checks PDF has text (at upload)
                               Sees "Submitted"                   Screening queued
                                                                  Reads resume → redacts identity →
                                                                  AI builds profile + evidence per
                                                                  requirement → quotes verified in code →
                                                                  match calculated in code
Sees "Screening completed" ◄──────────────────────────────────── 
and the Evidence register
Shortlists (or Not shortlisted,
with a note) ────────────────► Status: Shortlisted
Schedule interview:
 date, time, chairman, experts
 board–field match check
 clash check ─────────────────► "Interview scheduled" with date   Room + seats created
                                                                  Board members see it in "My interviews"
Chairman: confirms profile
Everyone: "Join interview" from their dashboard → interview room (already built)
```

---

## 2. Accounts and roles

| Role | How the account exists | Can do |
|---|---|---|
| `admin` | Seeded (demo) | Everything in the portal |
| `board` | Created by admin on the "Board members" page (seeded for the demo) | See only interviews they're assigned to; the chairman seat is chosen **per interview**, not per account |
| `applicant` | Self-registration on `/register` | See published advertisements, apply, see own applications and interviews |

- Login returns a JWT (12-hour expiry). The frontend keeps it in **`sessionStorage`**, so each browser tab can be a different person. That's how we test and demo three roles on one laptop.
- Passwords are hashed with bcrypt.

**Demo seed** (only when `DEMO_MODE=true`, via `python -m app.seed`):

| Email | Role | Discipline | Specialisation |
|---|---|---|---|
| `admin@rac.demo` | admin | — | — |
| `mehta@rac.demo` | board | Electronics & Communication | Radar systems |
| `iyer@rac.demo` | board | Electronics & Communication | Signal processing |
| `khan@rac.demo` | board | Chemistry | Polymer chemistry |

Password for all seeded accounts: set in `.env` as `DEMO_PASSWORD` (never hard-coded). Priya registers **live** during the demo.

---

## 3. Disciplines (fixed list)

Used by posts, applicants' declared field and board members. A fixed list is what makes the board–field match check exact.

- Electronics & Communication
- Electrical
- Mechanical
- Aeronautical
- Computer Science
- Chemical
- Civil
- Metallurgy & Materials
- Physics
- Chemistry
- Mathematics
- Life Sciences
- Psychology

(Stored as an enum in code, shown as a `Select`.)

---

## 4. Data model

### User
`id`, `email` (unique), `password_hash`, `full_name`, `role` (admin / board / applicant), `discipline` (nullable), `specialisation` (nullable), `employee_id` (nullable), `is_active`, `created_at`

### Post (an advertised post)
`id`, `advt_no` (e.g. `RAC/2026/07`), `title`, `discipline`, `grade` (B–G), `interview_type` (recruitment / promotion), `vacancies`, `closing_date`, `summary` (short text), `status` (draft / published / closed), `weights` (JSON, pre-filled from the grade table in `03_SCORING.md`), `created_by` → user, `created_at`, `published_at`

### PostRequirement
`id`, `post_id`, `code` (E1, E2… for essential; D1, D2… for desirable, assigned automatically), `text`, `kind` (essential / desirable), `position`

### Application
`id`, `post_id`, `applicant_id` → user (**one application per applicant per post**), `status` (submitted / under_review / shortlisted / not_shortlisted / interview_scheduled / interview_completed), `form` (JSON: see section 6), `declared_discipline`, `declared_specialisations` (list), `resume_path`, `resume_filename`, `resume_text` (extracted once, kept for screening and quote checks), `work_done_path` (promotion only, nullable), `submitted_at`, `decided_by`, `decided_at`, `decision_note`

### Screening (one per application)
`id`, `application_id` (unique), `status` (queued / in_progress / completed / failed), `attempts`, `error` (plain message), `model_name`, `profile` (JSON), `requirement_evidence` (JSON list), `mismatch_flags` (JSON list), `missing_info` (JSON list), `match_score` (int, calculated in code), `essential_evidenced` (int), `essential_total` (int), `started_at`, `completed_at`, `confirmed_profile` (JSON, nullable), `confirmed_by`, `confirmed_at`

### Interview (reuses the existing tables)
- `InterviewSession.application_id` now points to the application; `scheduled_at` and `duration_min` (default 45) are set.
- `Participant.user_id` now points to the user. Seats are created **at scheduling time**: 1 chairman, 1–4 experts, 1 candidate.

### AuditEvent
`id`, `actor_id` → user, `action` (e.g. `post.published`, `application.shortlisted`, `interview.scheduled`, `profile.confirmed`), `entity`, `entity_id`, `detail` (JSON), `at`

Written for every state change. Shown as a `Timeline` on record pages.

---

## 5. Advertisements

**Admin**
- List: Advt. No., Post, Discipline, Grade, Vacancies, Closing date, Applications (count), Status.
- Create/edit form panels:
  1. **Post details:** advt no, title, discipline, grade, interview type, vacancies, closing date, summary.
  2. **Requirements:** add/remove/reorder rows, each with a text and a kind (Essential / Desirable). At least 1 essential.
  3. **Evaluation weights:** read-only by default, showing the grade's weights with an "Edit weights" option. Must total 100.
- Publish: only drafts with ≥1 essential requirement and a future closing date. After publishing, requirements are **locked** (applicants applied against them). Close: stops new applications.

**Applicant**
- "Open advertisements": published posts with a closing date today or later, as table-like rows.
- Details page: all post details + the requirements list + "Apply for this post" (or "You applied on 12 Oct 2026" + link, if already applied).

---

## 6. Applying (applicant, 4 steps)

The steps are a real sequence, so a numbered `Stepper` is appropriate.

| Step | Fields |
|---|---|
| 1. Personal details | Full name (pre-filled), date of birth, phone, correspondence address. For promotion posts: employee ID, current grade, lab |
| 2. Education and experience | Education rows (degree, branch, institution, year, score). Experience rows (organisation, role, from, to). |
| 3. Area of expertise | Declared discipline (fixed list), specialisations (up to 5 short entries), key projects (up to 3, each ≤ 300 characters). For promotion: work done in current grade (text + optional PDF) |
| 4. Resume and declaration | Resume PDF (≤ 5 MB), a review summary of steps 1–3, and a declaration checkbox ("The information I have given is true and complete.") → **Submit application** |

**Checks at upload (instant, before submit):**
- Must be a real PDF (starts with `%PDF`), ≤ 5 MB.
- Extract its text with `pypdf`. If there are fewer than 300 characters → reject: "This PDF has no readable text. Upload a PDF created from a document, not a scanned image."
- The draft is kept in the browser until submitted (no server drafts needed).

After submitting: status **Submitted**, screening **Queued**, confirmation page with the application reference (e.g. `APP-000123`).

**My applications:** one row per application with post, reference, date, and a `StatusTag`. Opening it shows a `Timeline` (Submitted → Under review → Shortlisted → Interview scheduled…). **The applicant never sees screening results or the match number.**

---

## 7. AI resume screening

### 7.1 When it runs
- Automatically after submission, as a background job (never blocks the request).
- At most 2 screenings run at the same time (semaphore).
- Status in the database. Jobs still `queued` or `in_progress` at server start are picked up again.
- Up to 3 attempts with backoff (5s, 20s). Then `failed` with a plain error. The admin sees **"Screening failed"** + a **"Retry screening"** button. **Never a made-up result.**

### 7.2 What the AI receives (blind)
1. **Resume text after redaction.** Before sending, code replaces:
   - the applicant's full name (and each name part longer than 2 letters) → `[APPLICANT]`
   - email addresses → `[EMAIL]`; phone numbers → `[PHONE]`
   - whole lines starting with Date of birth, DOB, Gender, Sex, Marital status, Religion, Caste, Category, Nationality, Father's/Mother's name → removed
   Redaction is best-effort; the prompt also tells the model to ignore any personal details and institution prestige.
2. Declared discipline and specialisations (from step 3).
3. The post: title, discipline, grade, interview type, and requirements with their codes.

**Never sent:** name, photo, date of birth, gender, contact details, address, college names from the form.

### 7.3 What the AI returns (structured output, temperature 0)
```json
{
  "profile": {
    "main_field": "Electronics & Communication",
    "specialisations": ["radar signal processing", "CFAR detection", "adaptive filtering"],
    "key_projects": ["FMCW radar for drone detection", "radar test-bench (team lead, 3 members)"],
    "years_experience": 4,
    "keywords": ["CFAR", "FMCW", "MATLAB", "Python", "FIR"]
  },
  "requirement_evidence": [
    {"code": "E1", "level": "strong", "quote": "designed CA-CFAR detection for FMCW radar", "note": "Direct, recent project work"}
  ],
  "mismatch_flags": [
    {"declared": "FPGA", "finding": "No FPGA work found in the resume"}
  ],
  "missing_info": ["Graduation year not found"]
}
```
- `level`: `strong` / `some` / `none`
- `quote`: an exact phrase copied from the resume, **at most 20 words**, or empty when `none`
- One `requirement_evidence` entry for **every** requirement code, no more, no less (code checks this)

### 7.4 What the code does after the AI answers
1. **Checks the shape:** every requirement code is present exactly once; otherwise treat it as a failed attempt.
2. **Verifies every quote:** after normalising spaces and case, the quote must appear in the resume text. If not → `verified: false`, shown as `Unverified`, and the level **counts as none** in the maths.
3. **Calculates the match** (a pure function with unit tests):
   - strong = 1.0, some = 0.5, none = 0
   - `essential_avg` = average over essential requirements; `desirable_avg` = average over desirable
   - `match_score = round(70 × essential_avg + 30 × desirable_avg)`; if there are no desirable requirements: `round(100 × essential_avg)`
   - `essential_evidenced` = number of essential requirements at some or strong (verified)
   - Band: ≥ 75 High, 50–74 Medium, < 50 Low
4. Saves everything and sets status `completed`.

**Worked example (Priya):** E1 strong, E2 some, E3 strong, D1 none, D2 some →
essential_avg = (1 + 0.5 + 1) / 3 = 0.833, desirable_avg = (0 + 0.5) / 2 = 0.25 →
match = round(70 × 0.833 + 30 × 0.25) = round(58.3 + 7.5) = **66 (Medium)**, essential evidenced **3 of 3**.

### 7.5 Rules
- The match is **for screening only**. The system never shortlists or rejects on its own; the admin decides.
- The applicant never sees any screening output.
- The screening profile becomes the **draft expertise profile** that the chairman later confirms (see `02_PRODUCT_FLOW.md`, step 6).

---

## 8. Admin review and decision

**Applications list** (per post and overall): Reference, Applicant, Post, Submitted, Screening (`StatusTag`; when completed, it also shows the match number), Status. Filters: post, status, screening band. Sort by submitted date or match. While any screening is queued or in progress, the list refreshes every 5 seconds.

**Application review page** (the dossier):
- Header: applicant name (serif record title), reference, post.
- Main column:
  1. **Declared expertise** vs **AI profile** side by side (`KeyValue`)
  2. **Evidence register** (see `12_UI_GUIDE.md` section 7)
  3. **Mismatch flags** and **missing information** as `Banner`s (warn)
  4. Education and experience (from the form)
- Right column (320px):
  - Status + actions: **Shortlist** / **Not shortlisted** (a note is required for Not shortlisted) → confirmation `Modal`
  - **Schedule interview** (only when Shortlisted) → `Drawer`
  - **Download resume**
  - History (`Timeline` from AuditEvents)
- Opening an application for the first time moves it from Submitted to **Under review** (audited).

---

## 9. Scheduling an interview

**Drawer fields:** date, start time (IST), duration (default 45 min), chairman (one board member), experts (1–4 board members, not the chairman).

**Checks:**
| Check | Result |
|---|---|
| Date/time in the past | Blocked: "Choose a time in the future." |
| Any selected board member or the applicant already has an interview overlapping this time | Blocked, naming the clash: "Dr. Iyer has an interview from 11:00 to 11:45." |
| **No board member's discipline matches the post's discipline** | **Warning banner:** "No board member is from Electronics & Communication. Questions may fall outside the applicant's field." The admin can still continue by ticking "Schedule anyway"; that choice is audited |

**On "Schedule interview":**
- Create the `InterviewSession` (phase lobby, room code, `application_id`, `scheduled_at`, `duration_min`).
- Create the seats (`Participant` rows with `user_id`): chairman, experts, candidate (display names from user accounts).
- Application status → **Interview scheduled**. AuditEvent written.
- Toast: "Interview scheduled".

**Dashboards after scheduling:**
- **Applicant → My interviews:** post, date and time, board size (not names, until the day), and a **Join interview** button that is active from 10 minutes before the start. In `DEMO_MODE` it's always active, with a small note "Demo mode: joining is open".
- **Board → My interviews:** date, time, post, applicant, seat (Chairman / Expert). Opening one shows the pre-interview page: the post requirements, the Evidence register, and the draft expertise profile. **Chairman only:** edit the profile, then **Confirm profile** (audited). Then **Enter boardroom**.

---

## 10. Joining the room with login (replaces the temporary pid)

- The WebSocket URL becomes `/ws/sessions/{room_code}?token=<JWT>`. The server finds the seat from the token's user id + the session. **Seat role comes from the database, never from the client.**
- No seat for this user in this room → closed with 4403.
- Rooms move to `/room/:code/board` and `/room/:code/candidate`.
- The old join-by-form page stays **only** as `/dev/join` when `DEMO_MODE=true`, for quick testing.
- Interviews can't be joined before scheduling or after they end.

---

## 11. API

| Area | Endpoint | Who |
|---|---|---|
| Auth | `POST /api/auth/register` (applicant only), `POST /api/auth/login`, `GET /api/auth/me` | Public / any |
| Board members | `GET /api/board-members`, `POST /api/board-members`, `PATCH /api/board-members/{id}` | Admin |
| Posts | `GET /api/posts`, `POST /api/posts`, `GET /api/posts/{id}`, `PATCH /api/posts/{id}`, `POST /api/posts/{id}/publish`, `POST /api/posts/{id}/close` | Admin |
| Open posts | `GET /api/open-posts`, `GET /api/open-posts/{id}` | Applicant |
| Resume check | `POST /api/applications/resume-check` (upload → returns ok/error + a temporary upload id) | Applicant |
| Applications | `POST /api/open-posts/{id}/apply`, `GET /api/my/applications`, `GET /api/my/applications/{id}` | Applicant |
| Review | `GET /api/applications`, `GET /api/applications/{id}`, `POST /api/applications/{id}/shortlist`, `POST /api/applications/{id}/not-shortlist`, `GET /api/applications/{id}/resume` | Admin |
| Screening | `GET /api/applications/{id}/screening`, `POST /api/applications/{id}/screening/retry` | Admin (and assigned board members: read) |
| Scheduling | `POST /api/applications/{id}/schedule`, `POST /api/schedule/check` (clash + board match check without saving) | Admin |
| Interviews | `GET /api/interviews` (admin), `GET /api/my/interviews` (applicant, board), `GET /api/interviews/{id}` | By role |
| Profile | `POST /api/interviews/{id}/confirm-profile` | Chairman of that interview |
| Dashboard | `GET /api/admin/summary` (counts), `GET /api/audit?entity=&id=` | Admin |

Every endpoint checks the role. Applicant endpoints only ever return the applicant's own records and **never** screening data.

---

## 12. Build order

Each part is one Antigravity task: build → test → commit → push.

| Part | What | Main files |
|---|---|---|
| **P1** | UI foundation: tokens, fonts, component kit, shells, routes, `/dev/ui`; move rooms to `/room/...` and the test join to `/dev/join` | frontend only |
| **P2** | Accounts: User, register, login, me, roles, seed, sign-in pages, route guards | backend + frontend |
| **P3** | Advertisements: Post, requirements, publish/close, admin pages, applicant open list + details, AuditEvent helper | backend + frontend |
| **P4** | Applying: resume check, 4-step form, Application, My applications, admin applications list | backend + frontend |
| **P5** | AI screening: LLM provider (async, structured), redaction, quote verification, match maths + tests, job runner, Evidence register, retry | backend + frontend |
| **P6** | Decisions and scheduling: shortlist / not shortlisted, schedule drawer with checks, seats, dashboards, chairman profile confirmation | backend + frontend |
| **P7** | Join with login: token WebSocket, Join buttons, rooms restyled to the UI guide | backend + frontend |

After P7: voice (1.5), video + proctoring (1.6), interview scoring (Stage 2).

**Before P5:** get a Gemini API key from Google AI Studio (a separate Google account from the one you code with) and put it in `backend/.env` yourself as `GEMINI_API_KEY`. Also set `GEMINI_MODEL` to the current stable Flash model name.
