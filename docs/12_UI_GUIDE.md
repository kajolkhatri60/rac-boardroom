# 12 · UI guide

Every screen follows this guide. It exists so the product looks like **one professional government system**, not like a generated template. If a screen needs something this guide doesn't cover, extend the guide first, then build.

---

## 1. The brief

| | |
|---|---|
| **Product** | The recruitment and interview system of DRDO's Recruitment and Assessment Centre (RAC) |
| **Users** | RAC staff (daily, long sessions, many records), senior scientists on boards (occasional, need clarity, often older), applicants (anxious, want certainty about status) |
| **Primary job** | Run recruitment and interviews **transparently and fairly**, with every decision traceable |
| **Feel** | An official register: calm, exact, trustworthy. Dense where staff work, spacious where applicants act |

**Where the look comes from:** Indian government portals (identity band, then navigation bar, then content), official files and registers (record titles, reference numbers, audit trails), and scientific evaluation (evidence tables, measured values).

**The one memorable element:** the **Evidence register** on the application review screen (section 7). Everything else stays quiet and disciplined.

---

## 2. Colour

Define these in `frontend/src/index.css` inside `@theme` and use only these names.

| Token | Hex | Use |
|---|---|---|
| `ink` | `#14305A` | Primary buttons, navigation bar, links, headings, the evidence meter |
| `ink-strong` | `#0E2344` | Hover/pressed state of ink |
| `desk` | `#F3F5F8` | App background behind content |
| `paper` | `#FFFFFF` | Panels, tables, forms, modals |
| `rule` | `#D5DBE3` | All borders and dividers |
| `text` | `#1C2430` | Body text |
| `muted` | `#5A6778` | Secondary text, hints, table meta |

**Status colours** (always paired with a text label, never colour alone):

| Token | Text / border | Background | Meaning |
|---|---|---|---|
| `ok` | `#2F7D4F` | `#E8F3EC` | Shortlisted, verified, evidenced, connected |
| `warn` | `#9A5B00` | `#FBF1E1` | Pending, partial, needs attention |
| `bad` | `#B42318` | `#FBEAE8` | Rejected, failed, missing, errors |
| `focus` | `#1F5FA8` | — | Keyboard focus ring (2px, 2px offset) |

**Rules**
- No gradients. No glass/blur effects. No tinted "hero" washes.
- Backgrounds are only `desk` or `paper`.
- Text contrast must meet WCAG AA (all tokens above do on `paper`).

---

## 3. Typography

| Family | Weights | Use |
|---|---|---|
| **Noto Serif** | 600 | **Only** record titles and page titles: advertisement title, applicant name on a dossier, page H1. This gives the "official record" voice |
| **Noto Sans** | 400, 500, 600 | Everything else |
| **Noto Sans Devanagari** | 400, 600 | Fallback for Hindi text (answers in Hindi later) |

Self-host with `@fontsource/noto-sans`, `@fontsource/noto-serif` and `@fontsource/noto-sans-devanagari`. **No Google Fonts CDN**: the system must work on a closed DRDO network.

**Scale**

| Role | Size / line-height | Family |
|---|---|---|
| Record title | 28 / 34 | Serif 600 |
| Page title | 22 / 28 | Serif 600 |
| Section title | 17 / 24 | Sans 600 |
| Body | 15 / 23 | Sans 400 |
| Table text, form labels | 14 / 20 | Sans 400 / 500 |
| Caption, hint, meta | 13 / 18 | Sans 400, `muted` |

- Numbers in tables, scores, dates and counts use `font-variant-numeric: tabular-nums`.
- Sentence case everywhere ("Schedule interview", not "Schedule Interview" or "SCHEDULE INTERVIEW").
- Line length at most ~75 characters for reading text.

---

## 4. Space, shape, depth

- **Spacing scale (px):** 4, 8, 12, 16, 24, 32, 48. Nothing else.
- **Radius:** 4px on buttons, inputs and tags. 6px on panels and modals. Tables have square inner cells.
- **Borders:** 1px `rule`. Panels are separated by borders, **not** shadows.
- **Shadow:** only on things that float (modal, drawer, dropdown, toast): `0 8px 24px rgba(20,48,90,0.12)`.
- **Icons:** `lucide-react` only, 16px in tables and buttons, 18px in navigation, stroke 1.75. Use icons only where they help scanning (navigation, file, status, warning). **Never emoji.**

---

## 5. Layout shells

### 5.1 Staff shell (admin and board)

```
┌───────────────────────────────────────────────────────────────────────┐
│ Recruitment and Assessment Centre           A. Rao   Admin   Sign out │  identity band: paper, 56px, bottom rule
│ Defence Research and Development Organisation                         │
├───────────────────────────────────────────────────────────────────────┤
│ Dashboard   Advertisements   Applications   Interviews   Board members│  nav bar: ink, 44px, white text
├───────────────────────────────────────────────────────────────────────┤
│ desk background                                                       │
│  Advertisements / RAC/2026/07                          [ Edit ] [Publish advertisement] │
│  Scientist 'C' – Radar Signal Processing          (serif record title) │
│  ┌──────────────────────────────────────────────┐ ┌─────────────────┐ │
│  │ paper panel                                  │ │ side panel      │ │
│  └──────────────────────────────────────────────┘ └─────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```
- The user name, role and "Sign out" are separate elements, not joined with dots.
- Content: max-width 1200px, **left-aligned**, padding 32px.
- Page header: breadcrumb (13px, `muted`) → title (serif) → primary action on the right.
- The active nav item has a 3px white bar under it.

### 5.2 Applicant shell

Same identity band. Nav bar items (separate links): **Open advertisements**, **My applications**, **My interviews**. Content max-width 960px. Forms max-width 640px.

### 5.3 Sign-in shell

`desk` background. One `paper` panel, 400px wide, top third of the page, left edge aligned with the identity band text. No illustrations, no split-screen hero.

### 5.4 Official marks

**Do not use the State Emblem of India, the DRDO logo or any official seal.** Their use is legally restricted. The identity is text only: the two organisation lines in the band.

---

## 6. Components (`frontend/src/components/ui/`)

Build these once and use them everywhere. No page styles its own buttons or inputs.

| Component | Rules |
|---|---|
| `Button` | Variants: `primary` (ink fill, white text), `secondary` (paper, ink border and text), `quiet` (text-only ink), `danger` (bad colour). Sizes md (36px) / sm (30px). A `loading` state keeps its width. Label = verb + object: "Publish advertisement", "Submit application". Never "Submit", "OK" or an arrow |
| `Field` | Wraps any input: label above (14/500), optional hint below the label (13, muted), error below the input (13, bad, with an icon). Optional fields say "(optional)" after the label; required fields have no asterisk |
| `TextInput`, `TextArea`, `Select`, `DateInput`, `Checkbox`, `RadioGroup` | 36px high, 1px rule border, 4px radius, focus ring `focus`. Error state = bad border |
| `FileInput` | PDF only. Shows the file name, size and a "Replace" action. Validation messages are specific ("The file is larger than 5 MB") |
| `Table` | Paper background, header row on `desk` with 13/600 muted text, 44px rows, a row hover tint of `desk`, numeric columns right-aligned. Supports an empty state and skeleton rows |
| `StatusTag` | Small square dot (8px) + text, on the status background, 4px radius. Fixed vocabulary (section 9) |
| `Panel` | Paper, 1px rule, 6px radius, optional header with section title and actions |
| `PageHeader` | Breadcrumb, title (serif), optional reference line, actions on the right |
| `KeyValue` | A definition list for record details: label (13, muted) above value (15) in a 2–3 column grid |
| `Tabs` | Underline style, ink active bar |
| `Stepper` | Only for the application form (a real sequence): numbered steps with the current one in ink |
| `Drawer` | Right-side sheet, 480px, for "Schedule interview" and similar tasks. Slides in over 150ms |
| `Modal` | For confirmations only. Title states the action ("Reject this application?"); the confirm button repeats the verb ("Reject application") |
| `Banner` | Full-width inside content: info (ink), warn, bad. Icon + one sentence + optional action |
| `Toast` | Bottom-right, auto-hides after 5s, announced to screen readers. Uses the same verb as the action ("Advertisement published") |
| `EmptyState` | One sentence saying what will appear here + the primary action. No illustration |
| `Timeline` | Vertical list of dated events (application history, audit trail) |
| `EvidenceMeter` | Two small squares: `□□` no evidence, `■□` some, `■■` strong, in ink. Always followed by the word (None / Some / Strong) |

---

## 7. The signature: Evidence register

On the application review screen, the AI's resume screening appears as a **register**, not a score card.

```
Resume screening                                  AI-assisted, for screening only
────────────────────────────────────────────────────────────────────────────────────
Code  Requirement                        Type        Evidence     From the resume
E1    Radar signal processing            Essential   ■■ Strong    "designed CA-CFAR detection for FMCW radar"
E2    Digital filter design              Essential   ■□ Some      "implemented FIR filters in MATLAB"
E3    MATLAB/Python for signal analysis  Essential   ■■ Strong    "Python (NumPy, SciPy) signal pipelines"
D1    FPGA implementation                Desirable   □□ None      —
D2    Team handling                      Desirable   ■□ Some      "led a 3-member test-bench team"
────────────────────────────────────────────────────────────────────────────────────
Essential requirements evidenced   3 of 3
Resume–post match                  66   Medium
```
- Every quote is **checked in code** against the resume text. A quote not found in the resume shows an `Unverified` tag, and its evidence counts as None.
- The match number is calculated in code (see `13_RECRUITMENT_PORTAL.md`), never by the AI.
- Candidates never see this register.

---

## 8. Patterns

**Lists of records** (staff): always a `Table`, never a grid of cards. The first column links to the record. Filters sit above the table as a row of `Select`s + search. Row count is shown under the table.

**Record pages**: `PageHeader` with the reference number (e.g. `RAC/2026/07`) → a main column (panels) → a right column of 320px for status, actions and history.

**Forms**
- One column. Group fields in `Panel`s with section titles.
- Validate on blur and on submit. On submit with errors: a `Banner` at the top listing the problems, each linking to its field.
- The primary action is at the bottom-left of the form, the secondary action ("Cancel") next to it.

**Applicant pages**: open advertisements are a list of rows (title, reference, grade, discipline, vacancies, closing date, "View advertisement"), **not** cards.

**Loading**: skeleton rows in tables, a button `loading` state for actions. No full-page spinners.

**Empty**: `EmptyState` with a direct action ("No advertisements yet." + "Create advertisement").

**Errors**: say what happened and what to do. "The resume could not be read. Upload a PDF that contains text, not a scanned image." No apologies, no vague "Something went wrong".

**Dates and times**: `12 Oct 2026` and `12 Oct 2026, 11:00 IST`. Relative times ("2 hours ago") only in activity feeds.

**Motion**: only drawers, modals, toasts and dropdowns animate (150ms, ease-out). No page-load animations, no hover lift on rows or cards. Respect `prefers-reduced-motion`.

**Responsive**: staff screens are designed for 1280px and must work at 1024px. Applicant screens must work at 375px (mobile).

**Accessibility**: every input has a visible label; everything is reachable by keyboard; focus is always visible; status is never shown by colour alone; toasts use `aria-live`.

---

## 9. Words

Use RAC's own vocabulary.

| Use | Not |
|---|---|
| Advertisement (Advt. No.) | Job posting, opening, listing |
| Post | Role, position |
| Applicant | Candidate (in the portal; "candidate" is fine inside the interview room) |
| Application | Submission |
| Shortlist / Not shortlisted | Approve / Decline |
| Interview board | Panel, interviewers |
| Board member, Chairman | Interviewer |

**Status vocabulary (fixed)**

| Object | Statuses |
|---|---|
| Advertisement | Draft, Published, Closed |
| Application | Submitted, Under review, Shortlisted, Not shortlisted, Interview scheduled, Interview completed |
| Screening | Queued, In progress, Completed, Failed |
| Interview | Scheduled, In progress, Completed |

**Tone**: plain verbs, sentence case, no filler. Buttons say exactly what happens, and the resulting toast uses the same verb.

AI output is labelled plainly as **"AI-assisted"**. Never "AI-powered", sparkle icons or "smart".

---

## 10. Banned (the tells of a generated UI)

- Gradients, glassmorphism, glowing borders, sparkle ✨ or robot icons
- Emoji anywhere in the interface
- ALL-CAPS labels or tracked-out eyebrow text above headings
- Meta strings joined with middle dots or bullets ("Grade C · Radar · 3 vacancies"): use table columns or `KeyValue`
- Arrows appended to button or link text ("View →")
- One word in a heading picked out in a different colour, weight or italic
- Hero sections with big numbers and a gradient accent
- Identical rounded cards with soft grey shadows as the default container
- Stock illustrations or decorative blobs
- Monospace for labels (monospace is allowed only for room codes and reference numbers)
- Fake data dressed as real ("98% accuracy", "10,000+ interviews")

---

## 11. Page inventory

| Area | Page | Route |
|---|---|---|
| Public | Sign in | `/login` |
| Public | Create applicant account | `/register` |
| Admin | Dashboard (counts + recent activity) | `/admin` |
| Admin | Advertisements list | `/admin/advertisements` |
| Admin | New / edit advertisement | `/admin/advertisements/new`, `/admin/advertisements/:id/edit` |
| Admin | Advertisement record (details + its applications) | `/admin/advertisements/:id` |
| Admin | All applications | `/admin/applications` |
| Admin | Application review (dossier + Evidence register + decision + schedule) | `/admin/applications/:id` |
| Admin | Interviews list | `/admin/interviews` |
| Admin | Board members | `/admin/board-members` |
| Board | My interviews | `/board` |
| Board | Pre-interview (profile, requirements, confirm profile) | `/board/interviews/:id` |
| Applicant | Open advertisements | `/applicant/advertisements` |
| Applicant | Advertisement details | `/applicant/advertisements/:id` |
| Applicant | Apply (4-step form) | `/applicant/advertisements/:id/apply` |
| Applicant | My applications (with status history) | `/applicant/applications` |
| Applicant | My interviews | `/applicant/interviews` |
| Interview room | Board room | `/room/:code/board` |
| Interview room | Candidate room | `/room/:code/candidate` |
| Dev only | Component sheet | `/dev/ui` |
| Dev only | Test join (no login) | `/dev/join` |
