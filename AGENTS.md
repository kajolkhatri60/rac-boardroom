# Instructions for AI coding tools

You are helping build **RAC Boardroom Simulator**, a solution for hackathon problem statement **PSWB01** (DRDO RAC: Web based Selector-Applicant Simulation Software).

## Before any task
1. Read `docs/00_INDEX.md`, then the files it points to that relate to your task.
2. Always follow `docs/06_RULES.md`. If a task seems to need breaking a rule, **stop and ask**.
3. Use only the stack in `docs/05_TECH_STACK.md`. Ask before adding any library.

## The most important rules
- Never send scores to the candidate's connection during a live interview.
- Never invent a score. On AI failure: retry → `failed` → "Not evaluated".
- The AI scorer never sees name, gender, age, photo, date of birth or institution.
- All totals and averages are calculated in code (`backend/app/scoring/`), never by the AI.
- Async Gemini client only, structured output, temperature 0, model name from `.env`, all calls through `LLMProvider`.
- The server is the source of truth: save to the DB first, then broadcast.
- Never read, edit or commit `.env`.
- Prompts must be discipline-neutral (all scientific fields, not just software).

## How to work
- Small tasks: one feature or one screen at a time.
- Explain what you'll change before changing it.
- Write unit tests for scoring maths using the numbers in `docs/04_EXAMPLE_SCENARIO.md`.
- Keep `main` working. Work on `feature/<name>` branches.

## Where things go
- Backend: `backend/app/` → `models/`, `schemas/`, `routers/`, `realtime/`, `ai/`, `scoring/`, `services/`
- Frontend: `frontend/src/` → `pages/`, `components/`, `realtime/`, `proctoring/`, `lib/`
