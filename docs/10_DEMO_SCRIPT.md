# 10 · Demo script

**Goal:** the judges visibly see every PS clause working. Uses the seeded Priya scenario (`04_EXAMPLE_SCENARIO.md`).

## Setup before going on stage
- 3 devices on a phone hotspot, all using Chrome:
  - Laptop 1: chairman (Dr. Mehta)
  - Laptop 2: expert (Dr. Khan)
  - Phone or laptop 3: candidate (Priya)
- Seed data loaded; **Reset demo** done
- Backup video ready

## Flow (about 8 minutes)

| # | What we show | PS clause it proves |
|---|---|---|
| 1 | Admin: the published post with essential and desirable requirements, grade C, recruitment | Advertised vacancies; suitability against the post |
| 2 | Priya's application → AI profile → chairman fixes "3 → 4 years" and confirms | Area/expertise of the applicant |
| 3 | Lobby: device check, consent, chairman admits | Real boardroom experience |
| 4 | Ice-breaker, including "Are you planning to get married soon?" | Ice-breaking first; unbiased |
| 5 | Q4 CFAR question (on-topic) and Q6 vulcanisation (off-topic) → Priya passes | Question relevance to area/expertise |
| 6 | Q7: Priya gives a fluent but off-topic answer | Responses graded for relevance to the question |
| 7 | Chairman switches to managerial; the mix meter shows ~25% suggested for grade C | Techno-managerial depending on level |
| 8 | Show the candidate's screen: **no scores anywhere** | Fair, objective process |
| 9 | End → board report: Khan 34 (flagged + off-field), panel 68, depth graph | Quantifiable score for experts |
| 10 | Candidate totals; weighting 62 vs 51; Q7 capped at 35 | Unbiased; subject knowledge |
| 11 | Per-requirement table: "D1 FPGA: Never asked" | Suitability against the advertised post |
| 12 | AI 67 vs board 72 → chairman finalises 70 + remark | Assisting in arriving at the score |
| 13 | Candidate report: shows panel relevance 68, no per-expert or proctoring details | Score for the candidate as well |
| 14 | Expert training mode: Dr. Khan asks the vulcanisation question → instant 10; rephrases → 92 | Simulation software for experts |
| 15 | (If built) Candidate practice with the AI board | Simulation for candidates |

## Slides to have ready
1. The PS clause-by-clause table (`01_PROBLEM_STATEMENT.md`)
2. "How we ensure unbiased evaluation": blind scoring, flagging, relevance cap, fairness weighting, accent-fair transcripts
3. Scorer consistency: 20-pair test set, 3 runs each, ±X points
4. Architecture: one room, three modes; runs on-prem with a local model
5. Screenshots of both reports

## Likely judge questions
| Question | Answer |
|---|---|
| "Can the AI be wrong?" | Every score has a reason, a confidence badge, and board marks next to it; the chairman decides |
| "Does data leave DRDO?" | Provider interface → a local model (Ollama); Docker Compose deploys on-prem |
| "What about accents?" | Candidates edit the transcript before submitting; scoring ignores transcription errors |
| "What if the AI API fails?" | Retry, then "Not evaluated". We never show a made-up number |
| "Why not a coding round?" | The PS doesn't ask for one, and most DRDO disciplines aren't software |
