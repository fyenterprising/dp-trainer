# DPTrainer — Founder Log

---

## Day 4
**Date:** 29 May 2026
**Phase:** Build
**Mood / Energy:** Impressed by the progress, motivated 
by the vision. Tired and run down from day to day work 
on the vessel — building a product between watches is 
harder than it sounds.

### Top Outcome for Today
Milestones 2 through 5 complete and pushed to GitHub. 
Full 30-day curriculum live. PDF export and DP time log 
working. Five milestones in 19 days.

### What I Worked On
- Milestone 2 — Skeleton React app, three screens, 
  task flow end to end
- Milestone 3 — Full session flow, vessel profiles, 
  pre-session checklist, curriculum map, NI task 
  references
- Milestone 4 — Vessel profiles, progress tracking, 
  NI section coverage bars
- Milestone 5 — PDF export, DP time log, NI 
  certification threshold tracking
- Full 30-day curriculum — 45 tasks across 9 domains, 
  every day from 1 to 30 populated with real content
- NI logbook read and mapped — all 11 sections 
  documented, passive vs active requirements identified
- Bug fixes — domain loading, environment display, 
  task selection logic

### Decisions Made
- Decision: Build the full curriculum before beta 
  testing
- Reasoning: A product with two tasks is not testable 
  by anyone other than the founder. Needed 30 days of 
  real content before anyone else could use it
- Alternatives considered: Beta with partial content — 
  rejected, too thin to be meaningful

- Decision: Add DP time log to Milestone 5
- Reasoning: Trainees already keep this in Excel. 
  Bringing it into DPTrainer makes the app the single 
  source of truth for the entire NI certification 
  journey, not just the simulator sessions

### Lessons Learned Today
- The curriculum commit was the turning point. Before 
  it, DPTrainer was a DIY sim guide. After it, it became 
  a guided pathway — something that feels like a product 
  rather than a tool.
- Finding time to build while working as a Second Officer 
  is the real constraint. The passion is there. The hours 
  in the day are not always.
- The vision has gotten bigger. Day 1 was about making 
  the most of sim time. Day 2 is about tracking and 
  making the most of the entire TDPO journey.

### People & Conversations
- No colleagues spoken to yet. Still deciding whether 
  to lead with the theory or show the working product. 
  Will get there.

### The Vision — Sharpened
A TDPO's entire journey from day one in the classroom 
to counting up their DP days, exporting a PDF and 
sending it to the NI to apply for their ticket. 
DPTrainer is that journey documented and structured 
from start to finish.

### Next Actions
1. Use DPTrainer during the next 5 passive simulator 
   days — be the user, not just the builder
2. Stress test every day and every task during real 
   sessions — find what breaks in real use
3. Document every defect and friction point found 
   during real sessions — these become Milestone 6 
   fixes

---

## Day 3
**Date:** 19 May 2026
**Phase:** Build
**Mood / Energy:** Not recorded.

### Top Outcome for Today
Milestones 3 and 4 complete — full session flow, 
vessel profiles, checklist, curriculum map, NI task 
references, progress tracking.

### What I Worked On
- Two-step home screen with vessel profile and 
  pre-session checklist
- 16-item pre-session checklist — all items must 
  be confirmed before session starts
- Multi-task session flow with between-task screen
- Session history with localStorage persistence
- curriculum.json — 30-day map created
- NI-TASK-SECTIONS.md — full NI logbook read and 
  documented from physical logbook
- NI task references mapped to curriculum slots
- Vessel profile management screen
- Progress screen with NI section coverage bars

### Decisions Made
- Decision: Read the actual NI logbook rather than 
  estimating task structure
- Reasoning: Real content requires real references — 
  the actual logbook confirmed which sections are 
  passive-eligible and which require active time
- Decision: Separate curriculum.json from domain files
- Reasoning: Content and schedule should be 
  independently editable

---

## Day 2
**Date:** 11 May 2026
**Phase:** Build
**Mood / Energy:** Not recorded.

### Top Outcome for Today
Milestone 2 complete — skeleton React app with three 
screens and task flow working end to end.

### What I Worked On
- Built HomeScreen, TaskScreen, SummaryScreen
- State-based routing in App.jsx
- Dark theme CSS
- Task renders correctly from joystick-control.json
- Timer running, observe and record fields functional
- Debrief questions stepping through one at a time

### Decisions Made
- Decision: JSON import over fetch for content loading
- Reasoning: Vite handles it natively, no network 
  round-trip, simpler for now
- Decision: No TypeScript yet
- Reasoning: Move fast, add types later if needed

---

## Day 1
**Date:** 10 May 2026
**Phase:** Idea → Validation
**Mood / Energy:** Focused, energised, I can see the vision.

### Top Outcome for Today
GitHub repo created, Milestone 1 prompt run, first two 
tasks written in JSON.

### What I Worked On
- Full passive sim session on Mermaid Vision
- Discussed product idea with Claude
- Defined milestone structure, content schema, and tech 
  approach
- Ran Milestone 1 Claude Code prompt
- Wrote STORY.md and README.md
- Created docs/milestone-log.md

### Decisions Made
- Decision: Web app first, Swift/Kotlin later
- Reasoning: Faster to validate, works on all tablets, 
  investors can use it immediately
- Alternatives considered: Native iOS first — rejected, 
  too slow and expensive before validation

### Lessons Learned Today
- The idea came from being bored in a simulator. The best 
  products solve problems the founder is living through.
- The product wasn't designed. It was discovered — by doing 
  the thing it eventually solves.
- Same question asked twice across two swings at sea, 
  heard differently the second time. That's when it 
  became a product.
- Document everything from day one.

### People & Conversations
- Senior captain demonstrated Monitor mode technique after 
  large JSMH transit — directly became Task jc_001 debrief 
  question 5. Real operational knowledge observed in the 
  field, turned into content the same day.

### Next Actions
1. Push Milestone 1 to GitHub
2. Add founder-log.md to repository
3. Talk to one colleague about the idea before Day 2

---

## Day 0
**Date:** 21 March 2026
**Phase:** Pre-idea
**Mood / Energy:** Confused but eager to learn, bored but 
hopeful. Didn't quite know what I was doing but wanted to 
learn efficiently. Looking forward for my 2 hours to be over.

### Top Outcome for Today
Complete 2 hours in the sim and log it. Continue to chip 
away at DP hours.

### What I Worked On
- Setting up the sim and knowing what info is on what page
- Came up with questions to ask DPO

### Decisions Made
- Decision: There has to be a better way to challenge 
  myself during those 2 hours
- Reasoning: Two hours with no structure is two hours 
  wasted

### Lessons Learned Today
- Learnt how to fill out the DP checklist without needing 
  assistance to find the pages. To me that was a massive win.
- Did not know at the time that this frustration would 
  become a product. That's usually how it works.
