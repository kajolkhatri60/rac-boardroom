# Docs index: RAC Boardroom Simulator (PSWB01)

This folder holds the complete design of the project. Read it in this order.

| # | File | What it tells you |
|---|---|---|
| 01 | `01_PROBLEM_STATEMENT.md` | The PS word for word, what it really asks, and how we cover every clause |
| 02 | `02_PRODUCT_FLOW.md` | Roles, modes and every step of the product, screen by screen |
| 03 | `03_SCORING.md` | Every score, every formula and every scoring rule |
| 04 | `04_EXAMPLE_SCENARIO.md` | One full interview (Priya) from start to finish, with real numbers |
| 05 | `05_TECH_STACK.md` | What we build with, and why |
| 06 | `06_RULES.md` | Rules every developer and every AI coding tool must follow |
| 07 | `07_OLD_PROJECT_NOTES.md` | What we reuse from the old project and which bugs to avoid |
| 08 | `08_DATA_AND_MESSAGES.md` | Draft database tables and live (WebSocket) messages |
| 09 | `09_BUILD_PLAN.md` | Build order, team split, open decisions |
| 10 | `10_DEMO_SCRIPT.md` | What we show the judges, and which PS clause each moment proves |

## One-line summary

A web platform where a DRDO interview board (chairman + experts) interviews a candidate live, in a real boardroom-style room. The system silently scores:

- **each question**, for how relevant it is to the candidate's area and the post, and
- **each answer**, for how relevant and correct it is.

At the end, it helps the board arrive at the candidate's subject knowledge score and suitability for the advertised post. The same room also works as a **simulation**: a candidate can practise with an AI board, and an expert can practise with an AI candidate.

## Words we use

| Word | Meaning |
|---|---|
| Post | The advertised vacancy, e.g. "Scientist 'C' – Radar Signal Processing" |
| Grade | DRDO scientist grade: B, C, D, E, F, G |
| Interview type | Recruitment (new applicant) or Promotion (existing scientist) |
| Board | Chairman + experts |
| Expertise profile | The candidate's area/expertise, built by AI from the resume and confirmed by the chairman |
| Question relevance | How well a question fits the candidate's expertise, the post and the grade |
| Answer relevance | How well an answer actually addresses the question asked |
| Suitability | Final score of the candidate against the advertised post |
| Selector / Applicant | The PS's words for board member / candidate. Use them in the UI too |
