# 07 · Notes on the old project

The old project ("AI Interview Simulator") was a **single-user mock interview app**: the candidate uploads a resume, the AI asks 22 questions, the AI scores the answers. We tested it. This is what we learned.

## Decision

**New project structure; copy in only the parts that work.** The old app's core is the opposite of ours:

| | Old app | Our app |
|---|---|---|
| Who asks | AI | Human experts (or AI in simulation modes) |
| Who drives | Browser calls a stateless backend | Server is the source of truth |
| State | None, lost on refresh | Stored in a database |
| Users | 1 | 2 or more, on different devices, live |
| Scores | Shown immediately | Hidden until the end |

Rough size of the old code (~4,450 lines):
- ~14% reusable as-is
- ~29% reusable with changes
- ~28% needs rewriting
- ~29% gets deleted

---

## What to copy in

| Old file | Change needed |
|---|---|
| `frontend/src/hooks/useSpeechToText.js` | Language `en-IN`; use on the candidate side and for expert dictation |
| `frontend/src/components/interview/VoiceRecorder.jsx` | **Make the textarea editable** (it was `readOnly`) |
| `frontend/src/components/resume/ResumeUpload.jsx`, `components/ui/file-upload.jsx` | Upload to the backend instead of parsing in the browser |
| `frontend/src/components/ui/index.jsx`, `tailwind.config.js`, `index.css`, `lib/utils.js` | Restyle to a formal, government look |
| `frontend/src/components/dashboard/ReportSummary.jsx` (A4 page frame only) | New content; add print CSS; show "N/A" not 0 |
| `frontend/public/mediapipe/*` | Starting point for proctoring (or use `@mediapipe/tasks-vision`) |
| `backend/app/services/gemini_service.py` | Rewrite as `GeminiProvider`: async, structured output, pinned model, temperature 0 |
| `backend/app/services/evaluation_service.py` | Keep the safe-parsing helpers and the **weight re-normalisation** logic; new categories; remove fake fallbacks |
| `backend/app/services/pdf_service.py` | Reuse as-is |
| `backend/app/prompts/answer_evaluation.py` | Reference only. Rewrite discipline-neutral, add answer relevance, remove the resume from the input |

## What to leave behind

- Coding round: `routers/coding.py`, `services/code_execution_service.py`, `services/code_review_service.py`, `components/coding/*`, Monaco
- AI follow-ups: `FollowUpPrompt.jsx`, follow-up endpoint
- The 22-question software-interview generator (it gets rewritten later for practice mode)
- Landing page 3D robot (three.js, react-three-fiber, gsap, framer-motion)
- `VoiceInterviewPanel.jsx` and `interview/index.js` (dead code, broken imports)
- "Hire Recommended" badge and "Senior / Mid / Junior" labels

---

## Bugs we found (don't repeat them)

| # | Bug | Proof | Lesson |
|---|---|---|---|
| 1 | **Every AI call froze the whole server.** The async function used the sync Gemini call | A request sent at 0.2 s waited until 3.2 s behind a 3 s AI call | Use the async client (Rule 9) |
| 2 | **Fake scores on failure.** With no AI, garbage code got "1/1 tests passed" and a review score of 85; the final report got generic praise | Tested with no API key | Never invent scores (Rule 2) |
| 3 | **Typed answers impossible.** The answer box was `readOnly` | `VoiceRecorder.jsx` | Always allow typing |
| 4 | **Follow-up answers scored against the wrong question** and saved twice | `InterviewPage.jsx` flow | Link follow-ups explicitly |
| 5 | **No PDF export existed**, even though the libraries were installed | No jsPDF/html2canvas calls anywhere, not even in the built bundle | Print CSS |
| 6 | **Scores sent to the browser** | Frontend called `/evaluate-answer` directly | Server-side scoring only (Rule 1) |
| 7 | **API key committed** in `backend/.env` inside the zip | Found in the archive | `.gitignore`; key rotated (Rule 14) |
| 8 | Silent model fallback to old/retired models | Hard-coded list starting with `gemini-2.0-flash` | Pinned model from `.env` (Rule 11) |
| 9 | "Not assessed" shown as 0% | `None` → `0.0` before sending | Show "N/A" |
| 10 | Candidate name always "Candidate" | `candidateName` never set | — |
| 11 | pdf.js worker and Monaco loaded from CDNs | `pdfExtract.js` | Serve everything ourselves (offline story) |
| 12 | Every field accepted in both camelCase and snake_case | `schemas.py` | One style per layer (Rule 25) |
