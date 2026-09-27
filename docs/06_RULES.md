# 06 · Rules

Every developer and every AI coding tool must follow these. If a task seems to need breaking a rule, **stop and ask**.

## A. Scores and fairness (never break these)

1. **Never send any score to the candidate's connection or browser during a live interview.** Scores go only to board connections, and only after the interview ends.
2. **Never invent a score.** If the AI fails: retry → mark `failed` → show "Not evaluated". No default numbers like 85, no "all tests passed", no generic praise text.
3. **The AI scorer is blind.** Never put the candidate's name, gender, age, photo, date of birth or institution into any scoring prompt.
4. **All totals and averages are calculated in code** (`backend/app/scoring/`). The AI only returns per-question and per-answer scores.
5. **Proctoring never changes any score.**
6. **Ice-breakers are not scored**, but flagged (inappropriate) questions always count as 0.
7. **Prompts must be discipline-neutral.** No software-only examples (LeetCode, React, STAR-method templates). Candidates can come from any scientific field.
8. **Every AI score comes with a one-line reason.**

## B. AI calls

9. Use the **async** Gemini client only. Never make a blocking call inside an `async` function.
10. Every AI call uses **structured output** (a Pydantic schema) and **temperature 0**.
11. One **pinned model** from `.env` for the whole interview. No silent switching to other models.
12. All AI calls go through the **`LLMProvider` interface**. Don't import the Gemini SDK anywhere else.
13. Limit concurrent AI calls with a semaphore.

## C. Security and secrets

14. **Never commit `.env`** or any API key. Only `.env.example`, with placeholder values.
15. **AI coding tools must not read or edit `.env`.**
16. Every REST endpoint and WebSocket message checks the user's **role** (admin / chairman / expert / candidate).
17. Uploaded files are stored on the server (`uploads/`, git-ignored) and served only to allowed roles.

## D. Real-time

18. **The server is the source of truth.** Clients never decide state; they send requests and show what the server sends.
19. On connect/reconnect the server sends a **full snapshot**; after that, small events.
20. Save to the database **before** broadcasting an event.
21. Scoring runs in the background. **The live interview never waits for the AI.**

## E. Code style

22. Backend: Python 3.11+, FastAPI, SQLModel, type hints everywhere.
23. Frontend: React function components + hooks, Tailwind, Zustand for the room state.
24. Scoring maths are **pure functions with unit tests** (use the Priya scenario numbers from `04_EXAMPLE_SCENARIO.md` as test cases).
25. One field name style per layer: `snake_case` in Python and JSON, `camelCase` in JS variables. **Don't accept both styles in the same schema** (the old project did, and it caused confusion).
26. No dead code, no unused dependencies. Don't add libraries not listed in `05_TECH_STACK.md` without asking.

## F. How to work (humans and AI tools)

27. **Read `docs/` before any task.** Follow the flow in `02`, the scoring in `03` and the stack in `05`.
28. **Small tasks only.** One feature or one screen at a time.
29. **Test each piece before moving on.** For live features, test with two browsers (normal + incognito).
30. **Commit after every working piece**, with a clear message.
31. **One branch per feature** (`feature/<name>`). Merge into `main` through a Pull Request. `main` must always work.
32. Use the PS words in the UI: Selector / Applicant, Board, Chairman.

## G. Recruitment portal and UI

33. **Applicants never receive screening results**, match numbers, board notes or audit details, from any endpoint.
34. **The system never shortlists, rejects or schedules on its own.** The admin decides. AI output is labelled "AI-assisted".
35. **Every AI quote is verified in code** against the source text. Unverified evidence counts as none.
36. **Redact identity before any AI call on a resume** (`13_RECRUITMENT_PORTAL.md` section 7.2).
37. After P7, **identity and seat role always come from the JWT + database**, never from the client.
38. **Every state change writes an AuditEvent** (publish, shortlist, schedule, confirm profile, final score…).
39. **Every screen follows `docs/12_UI_GUIDE.md`** and uses only the components in `frontend/src/components/ui/`. The banned list in section 10 of that guide applies everywhere.
40. **No official emblems, seals or logos** (State Emblem, DRDO logo). The identity is text only.
