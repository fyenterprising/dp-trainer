# DPTrainer

**Live: https://dptrainer.netlify.app**

A structured session companion for Trainee Dynamic
Positioning Operators completing ship-based simulator
passive days under the Nautical Institute DP
certification scheme.

---

## The Problem

NI DP certification allows up to 30 passive simulator
days, each a minimum of two hours — up to 60 hours of
seat time at a DP desk.

The NI prescribes no tasks for that time. The
expectation is that a supervising DPO structures the
sessions. In practice, not every trainee has a DPO
beside them for two hours, and not every vessel has a
culture of structured simulator training. Without
structure, those hours are spent watching a vessel
hold position. The hours are logged, the box is
ticked, and the trainee arrives at their first
operational posting having never been asked a hard
question about what they observed.

Sixty hours is a serious opportunity. The simulator is
already an excellent tool. The gap is the structure
around it.

## What DPTrainer Does

The trainee enters their vessel profile and training
day, completes a 16-item pre-session checklist, and
the app serves the tasks scheduled for that day.

Each task provides a setup protocol, an execution
instruction, a professional standard to meet, an
observe-and-record form for measured outcomes, and
debrief questions of the kind a good DPO would ask.
Sessions are saved, progress is tracked against NI
logbook sections, and records export as PDF.

No scores. No pass or fail. Structured work,
observation discipline, and a documented record of
what the time was spent on.

## Positioning

DPTrainer is a session structure and record-keeping
tool. It is deliberately not a training provider.

- It does not deliver instruction, assessment, or
  certification
- It does not replace NI-accredited training centres,
  the Induction or Simulator courses, or supervision
  by a certified DPO
- It has no role in sign-off — that remains entirely
  with certified DPOs and the Master
- It is not affiliated with or endorsed by the
  Nautical Institute or IMCA

Its purpose is to make an existing regulatory
requirement productive. Trainees arrive at accredited
courses better prepared, with richer logbook records
and more operational questions. That is intended to
support the work training centres do, not substitute
for it.

## Content

19 domains, 72 tasks, mapped across a 30-day
curriculum. Every task runs with the simulator active,
produces measurable recorded outcomes, works on any
ship-based DP simulator regardless of manufacturer,
and carries references to specific NI logbook task
sections.

Domains: system setup, joystick control, environmental
awareness, sensors and references, mode transitions,
approach and close proximity, alarms, failures,
watchkeeping, operations, review, ASOG/CAM/TAM, DP
drills, DP systems and modes, position reference and
redundancy, emergency response, trials and assurance,
drill conduct and debrief, and thruster and generator
operating strategy.

### Source Material

Task content is original, written against current
industry guidance:

- IMCA M220 Rev 3 — Operational Activity Planning
- IMCA M273 (Jan 2026) — Conducting DP Drills and
  Ensuring Preparedness for DP Failures
- IMCA M249 Rev 1 — DP Practitioner Accreditation
  Scheme Handbook
- IMCA M117 Rev 3.3 — Training and Experience of Key
  DP Personnel
- IMO MSC.1/Circ.1580 — Guidelines for Vessels and
  Units with DP Systems
- The DP Operator's Handbook, 3rd ed (Bray), published
  by the Nautical Institute
- The NI DP Logbook task sections

No source text is reproduced. Each domain file records
the document and section its tasks were written
against.

## Status

Deployed and in use. Beta testing with trainee and
certified DP personnel is in progress.

| Milestone | Status |
|---|---|
| 1 — Foundation | Complete |
| 2 — Application skeleton | Complete |
| 3 — Session flow | Complete |
| 4 — Vessel profiles and progress tracking | Complete |
| 5 — PDF export and DP time log | Complete |
| 6 — Interface and deployment | Complete |
| 7 — Beta testing | In progress |
| 8 — Investor ready | Pending |

## Features

- 30-day curriculum with progressive difficulty
- Multi-vessel profiles across DP1, DP2 and DP3
- 16-item pre-session verification checklist
- Multi-task sessions with a running timer
- Structured data capture and debrief per task
- Progress tracking against all 11 NI logbook sections
- DP time log with active and passive day totals and
  NI certification threshold tracking
- PDF export of session records and time logs
- Day and night interface modes for bridge use
- Works offline after first load; all data stored
  locally on the user's device

## Privacy

All training data is held in browser local storage on
the user's own device. Nothing is uploaded,
transmitted, or accessible to anyone else. There are
no accounts, no analytics on user content, and no
server-side record of any session.

## Technical

React 18, Vite, no backend. Content is version-
controlled JSON, separated from application code, so
curriculum changes require no code changes.

## Project Structure

```
content/
├── domains/          19 task libraries
├── checklists/        session and drill checklists
└── curriculum.json   30-day schedule
app/src/
├── screens/           application screens
└── components/        shared components
docs/                  NI references, founder log,
                       milestone log
```

## Development

Requires Node.js 18 or later.

```
npm install
npm run dev      # local development
npm run build    # production build
```

Deployed continuously from `main` via Netlify.

## Licence and Contact

Proprietary. All rights reserved. See LICENSE.

The application content — tasks, curriculum structure,
debrief questions and documentation — may not be
copied, reproduced, distributed, or used to create
derivative works without written permission.

Enquiries, including from training providers and
operators: dptrainer.app@gmail.com
