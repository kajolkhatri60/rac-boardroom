# 08 · Data and messages (DRAFT v0)

> **Draft.** Review it as a team before building. Change it here first, then in the code.

## 1. Database tables

### Users and posts

**User**
- `id`, `role` (admin / chairman / expert / candidate), `email`, `password_hash`, `name`
- `employee_id` (promotion candidates and board members, optional)

**Post**
- `id`, `title`, `advt_no`, `discipline`
- `grade` (B–G), `interview_type` (recruitment / promotion)
- `weights` (JSON: knowledge / managerial / comm_relevance)
- `suggested_mix` (JSON: technical / managerial)
- `status` (draft / published / closed)

**PostRequirement**
- `id`, `post_id`
- `code` (E1, E2…, D1…), `text`, `kind` (essential / desirable)

### Applications and profiles

**Application**
- `id`, `post_id`, `candidate_user_id`
- `form` (JSON: personal, education, experience, projects)
- `declared_expertise` (JSON)
- `resume_file`, `work_done_file` (promotion)
- `status` (submitted / shortlisted / rejected / scheduled / interviewed)

**ExpertiseProfile**
- `id`, `application_id`
- `ai_profile` (JSON), `mismatch_flags` (JSON)
- `confirmed_profile` (JSON), `confirmed_by`, `confirmed_at`

### The interview

**Session** (one interview room)
- `id`, `application_id` (nullable for practice/training), `mode` (live / practice / training)
- `room_code`, `scheduled_at`
- `phase` (lobby / icebreaker / technical / managerial / closing / ended / processing / review / finalised)
- `started_at`, `ended_at`, `published_to_candidate` (bool)
- `model_name` (pinned AI model for this session)

**Participant**
- `id`, `session_id`, `user_id` (nullable for AI)
- `seat_role` (chairman / expert / candidate), `is_ai` (bool)
- `display_name`, `specialisation`
- `persona` (JSON, for the AI candidate in training mode)

**Question**
- `id`, `session_id`, `asked_by` (participant id), `seq`
- `text`, `phase`, `tag` (technical / managerial)
- `follow_up_of` (question id, nullable)
- `clarification_request`, `clarification_text` (nullable)
- `status` (queued / live / answered / passed), `asked_at`

**QuestionScore**
- `question_id`, `status` (pending / done / failed)
- `expertise_fit`, `post_fit`, `level_fit`, `relevance`
- `depth` (basic / intermediate / advanced), `requirements_tested` (list of codes)
- `flagged` (bool), `flag_category`, `reason`
- `similarity`, `confidence` (high / low)

**Answer**
- `id`, `question_id`, `text`, `passed` (bool), `submitted_at`, `duration_s`

**AnswerScore**
- `answer_id`, `status` (pending / done / failed)
- `answer_relevance`, `knowledge` (nullable), `managerial` (nullable), `communication`
- `capped` (bool), `reason`

### After the interview

**BoardMark**
- `id`, `session_id`, `participant_id`, `question_id` (nullable = overall mark), `mark`, `note`

**ProctorEvent**
- `id`, `session_id`
- `type` (face_missing / multi_face / tab_hidden / disconnect / reconnect)
- `at`, `duration_s`

**Result** (one per session)
- `session_id`, `totals` (JSON: every total from `03_SCORING.md`)
- `per_requirement` (JSON), `ai_suitability`, `board_average`
- `final_score`, `band`, `chairman_remark`, `summary` (AI text), `finalised_at`

---

## 2. REST endpoints (not live)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Posts | `POST /posts`, `GET /posts`, `GET /posts/{id}`, `PATCH /posts/{id}`, `POST /posts/{id}/publish` |
| Applications | `POST /posts/{id}/apply`, `GET /posts/{id}/applications`, `GET /applications/{id}`, `POST /applications/{id}/shortlist`, `POST /applications/{id}/reject` |
| Profile | `GET /applications/{id}/profile`, `POST /applications/{id}/profile/confirm` |
| Sessions | `POST /sessions` (schedule / practice / training), `GET /sessions/mine`, `GET /sessions/{id}` |
| Review | `GET /sessions/{id}/results`, `POST /sessions/{id}/finalise`, `POST /sessions/{id}/publish` |
| Reports | `GET /sessions/{id}/report/board`, `GET /sessions/{id}/report/candidate` |
| Post dashboard | `GET /posts/{id}/candidates` |
| Demo | `POST /demo/seed`, `POST /demo/reset` (only when `DEMO_MODE=true`) |

Each endpoint checks the role.

---

## 3. Live messages (WebSocket)

**Connect:** `wss://<host>/ws/sessions/{session_id}?token=<JWT>`

**Every message:** `{ "type": "...", "payload": { ... } }`

### Client → server

| Type | Sent by | Payload |
|---|---|---|
| `lobby_ready` | Candidate | — |
| `admit_candidate` | Chairman | — |
| `set_phase` | Chairman | `phase` |
| `ask_question` | Expert / chairman | `text`, `tag`, `follow_up_of?` |
| `request_clarification` | Candidate | `question_id`, `note` |
| `give_clarification` | Expert | `question_id`, `text` |
| `submit_answer` | Candidate | `question_id`, `text` |
| `pass_question` | Candidate | `question_id` |
| `set_mark` | Expert / chairman | `question_id?`, `mark`, `note?` |
| `proctor_event` | Candidate | `type`, `duration_s` |
| `end_interview` | Chairman | — |
| `rtc_signal` | Anyone | `to`, `data` (WebRTC setup) |
| `ping` | Anyone | — |

### Server → client

| Type | Sent to | Payload |
|---|---|---|
| `snapshot` | The connecting client | Full room state, **filtered by role** |
| `participant_joined` / `participant_left` | All | participant |
| `candidate_ready` | Board | — |
| `phase_changed` | All | `phase` |
| `question_queued` | Board | question |
| `question_live` | All | question (text, asked_by, tag) |
| `clarification_requested` | Board | `question_id`, `note` |
| `clarification_given` | All | `question_id`, `text` |
| `answer_submitted` | Board (candidate gets an ack) | answer |
| `question_scored` | **Training mode only**, to the expert | score + reason + depth + flag |
| `interview_ended` | All | — |
| `results_ready` | Board | — |
| `rtc_signal` | Target | `from`, `data` |
| `error` | Sender | `message` |

### Role filter for `snapshot`
- **Candidate:** phase, board seats, own questions and answers. **Never scores, marks or proctoring.**
- **Expert:** everything except other experts' private marks. Scores only after `ended` (or in training mode).
- **Chairman:** everything. Scores only after `ended`.
