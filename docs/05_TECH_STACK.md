# 05 · Tech stack

## How we chose

1. **Use what the team already knows** (React + FastAPI + Gemini from the old project).
2. **Few moving parts.** Every extra service can break on stage.
3. **Spend effort where judges look:** the live boardroom, the two scores, the reasons, the simulation modes.
4. **Always a plan B for the demo.**
5. **DRDO-friendly:** it must be able to run inside DRDO's own network, with no data leaving.

---

## The stack

| Layer | Pick | Why | Rejected |
|---|---|---|---|
| Frontend | **React + Vite** | Team knows it | Next.js (server rendering not needed) |
| Styling | **Tailwind** + **shadcn/ui** (forms, tables, dialogs) | Fast; admin screens are forms and tables | Animation libraries |
| Pages / links | **React Router** | Join links, per-role pages, survives refresh | Old page-switching with state |
| Frontend state | **Zustand** | Small, simple; holds live room state | Redux |
| Forms | **react-hook-form** | Long application form | Hand-written form state |
| Charts | **Recharts** | Depth graph, per-requirement bars | — |
| Backend | **FastAPI** (Python) | Team knows it; built-in WebSockets; AI code is Python | Node + Python together |
| Live sync | **FastAPI WebSockets** | No extra service | Firebase / Supabase realtime (data leaves our server) |
| Database | **SQLite + SQLModel** | One file, zero setup, same validation style as FastAPI. Postgres later for production | MongoDB (data is relational), Firebase |
| Background work | **Async tasks + status column in the DB** | Enough for scoring | Celery + Redis |
| AI | **Gemini** through the `google-genai` **async** client | Cheap, fast, structured JSON output | LangChain (extra layer) |
| Local AI (on-prem story) | **Ollama** behind the same interface | "Runs inside DRDO with no data leaving" | — |
| Similarity check | **fastembed** (small local embedding model) | Maths-based second opinion on relevance | Vector databases |
| Proctoring | **MediaPipe Tasks Vision** (`@mediapipe/tasks-vision`) in the browser + Page Visibility / focus events | Runs on the candidate's device, offline-capable | Server-side video analysis |
| Video | **Browser WebRTC**, one-way candidate → board, set up over our WebSocket | Free, no third party | Zoom / Jitsi embeds |
| Speech | **Web Speech API** (`en-IN`), editable transcript, typing fallback | Already works in the old project | Whisper (more setup) |
| PDF text | **pypdf** on the server | Files are stored on the server anyway | pdf.js from a CDN |
| Report PDF | **HTML + print stylesheet** → "Save as PDF" | Nearly free | jsPDF + html2canvas |
| Login | **JWT** with roles (PyJWT + bcrypt) | Simple, in our control | Auth0 / Clerk |
| Packaging | **Docker Compose** | One command; on-prem story | Kubernetes |
| Hosting (demo) | **Render or Railway** (HTTPS + WebSockets) + laptop with **Cloudflare Tunnel** as backup | Real HTTPS | Static-only hosts |

---

## Key design choices, in detail

### 1. Live sync: the server is the boss
- The server keeps the true state of every room.
- When any screen connects or reconnects → the server sends a **full snapshot** (phase, questions, answers, who's online).
- After that, only small events: `question_asked`, `answer_submitted`, `phase_changed`, etc. (see `08_DATA_AND_MESSAGES.md`).
- So refresh, disconnect and rejoin all "just work".
- **The candidate's connection never receives any score**, so nothing can be found in the browser's developer tools.

### 2. AI done properly
- **Async client** (`client.aio.models.generate_content`). The old code used the sync call and froze the whole server.
- **Structured output:** a Pydantic schema for every call. No regex cleaning of text.
- **Temperature 0.**
- **One pinned model per interview**, set in config. No silent fallback to other models.
- **Model name lives in `.env`.** Check Google's official models page on build day. Old names like `gemini-2.0-flash` and `gemini-1.5-flash` no longer work, and the 2.5 family is being retired. Use the current stable Flash model.
- **Provider interface:** `LLMProvider` → `GeminiProvider`, `OllamaProvider`. Nothing else in the code calls Gemini directly.
- **Never a fake result:** on failure → retry → status `failed` → shown as "Not evaluated".

### 3. Relevance: AI + maths
- AI relevance score + fastembed similarity between question and profile.
- If they disagree by more than 30 → "Low confidence" badge (see `03_SCORING.md`).

### 4. Background scoring
- Save first → start the scoring task → the interview never waits.
- A semaphore limits concurrent AI calls (avoids rate limits).
- Status in the DB: `pending` / `done` / `failed`. Pending jobs resume on server restart.
- End of interview: wait for all jobs → then calculate.

### 5. Proctoring
- Face detection runs a few times per second in the candidate's browser.
- Model files are served from our own server (`/public/mediapipe/`), not a CDN.
- Only event messages go to the server.

### 6. Video
- One sender (candidate), up to 4 viewers (board). Simple mesh.
- STUN: public STUN server. Test on the venue network early.
- **Plan B:** a low-quality JPEG snapshot every second over the WebSocket.

---

## Folder layout (planned)

```
rac-boardroom-sim/
├── AGENTS.md                ← instructions for AI coding tools
├── README.md
├── docs/                    ← this design
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── models/          ← SQLModel tables
│   │   ├── schemas/         ← request/response + AI output schemas
│   │   ├── routers/         ← REST: auth, posts, applications, sessions, reports
│   │   ├── realtime/        ← WebSocket room manager + message handlers
│   │   ├── ai/              ← provider interface, prompts, scoring calls, AI participants
│   │   ├── scoring/         ← all maths (pure functions, unit-tested)
│   │   └── services/        ← pdf, embeddings, files
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           ← admin/, board/, candidate/, reports/
│   │   ├── components/
│   │   ├── realtime/        ← WebSocket client + room store
│   │   ├── proctoring/
│   │   ├── lib/
│   │   └── main.jsx
│   └── public/mediapipe/
└── docker-compose.yml
```

---

## Demo-day risks and fixes

| Risk | Fix |
|---|---|
| **Camera/mic blocked on plain `http://`** on other devices (browsers only allow them on HTTPS or localhost) | Deploy with HTTPS, or Cloudflare Tunnel from a laptop |
| Venue Wi-Fi blocks video/WebSockets | Phone hotspot; snapshot fallback |
| AI rate limit / outage | Check the quota beforehand; retries; "Not evaluated" instead of fake scores |
| Voice only works in Chrome/Edge (and needs internet) | Chrome on all demo devices; typing always works |
| Messy demo data | Seed script for the Priya scenario + **Reset demo** button |
| Total failure | Pre-recorded 2-minute video of the full flow |

---

## AI coding tools we use to build

- Main tool: Google Antigravity (rules in .agents/rules/project.md, set to Always On)
- Backup: Freebuff (never use models that retain prompts)
- Autocomplete: GitHub Copilot (Free, or an existing Student plan)
- Note: Gemini CLI is no longer free for personal accounts
- Every teammate uses their own accounts; the app's Gemini API key comes from a separate Google account
