# DPTrainer

## Overview

DPTrainer is a structured session companion for Trainee Dynamic Positioning Operators (TDPOs) undertaking ship-based simulator passive days as part of their Nautical Institute (NI) DP certification. It is not a teaching tool and does not replace qualified DPOs or the NI certification framework. It exists to solve a single, specific problem: TDPOs sit idle during simulator sessions because no one gives them structured work to do.

## Problem

NI DP certification requires TDPOs to complete up to 30 passive simulator days, each a minimum of 2 hours, totalling up to 60 hours of seat time. The quality of that time is entirely dependent on whether a supervising DPO gives the trainee structured tasks to perform. In practice, most TDPOs receive little to no guidance and spend those hours watching rather than practicing. The hours are logged, the certification box is ticked, and the trainee arrives at their first operational DP posting having never been asked a hard question about what they observed.

## Solution

DPTrainer acts as a virtual session structure companion. Before each simulator session the TDPO selects their training day and vessel type. The app provides a task from the appropriate domain and difficulty band, a structured execution protocol with professional standards, an observe-and-record data capture form, and a set of debrief questions designed to build genuine operational understanding. No scores. No pass/fail. Structured work, observation discipline, and the questions a good DPO would ask.

## Tech Stack

- **Frontend**: React web app (PWA — installable on tablet or phone)
- **Content**: JSON files per domain, version-controlled in this repository
- **Build tool**: Vite
- **Development**: Claude Code assisted, GitHub milestone workflow
- **Deployment**: Static hosting (no backend required in v1)

## Current Status

**Milestone 1 — Foundation** (In Progress)

## Milestone Progress

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Foundation | In Progress |
| 2 | Skeleton App | Pending |
| 3 | Session Flow | Pending |
| 4 | Vessel Profiles and Progress Tracking | Pending |
| 5 | PDF Export and Session Record | Pending |
| 6 | Polish and Beta | Pending |
| 7 | Beta Testing | Pending |
| 8 | Investor Ready | Pending |

## Content Structure

```
content/
├── domains/          # Task libraries grouped by operational domain
├── checklists/       # Pre-session and post-session checklists
└── scenarios/        # Structured scenario challenge cards
```

Each domain file is a self-contained JSON document containing tasks ordered by recommended training day. Tasks include setup instructions, execution protocols, professional standards, observe-and-record fields, debrief questions, and task variants for repeat sessions.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Requires Node.js 18+.
