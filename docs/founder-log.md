# DPTrainer — Founder Log

---

## Day 11
**Date:** 6 September 2026
**Phase:** Polish
**Mood / Energy:** Good. Half way through the month
onboard. Focussed and motivated to make this look
clean and professional, not just functional.

### Top Outcome for Today
DP Time Log PDF restyled to a professional standard,
Phase B and Phase D split correctly implemented, and
the pagination engine documented.

### What I Worked On
- Wrote a full styling specification for the PDF
  export and saved it to the repo as
  docs/pdf-styling-spec.md
- Restyled DPTimeLogPdfExport.jsx against it —
  running header and footer, title block, record
  totals grid, progress panel, entries table,
  trainee declaration, status callout
- Print CSS now removes browser URL and timestamp
  chrome, with per-page padding so nothing prints to
  the sheet edge
- Added the Simulator Course date field, splitting
  Phase B from Phase D with carry-forward and the
  90-day ceiling
- Made the two-hour DP day rule consistent across
  stat cards, record totals, progress bars and the
  PDF
- Fixed day counting to deduplicate by date — one
  date is one DP day regardless of how many entries
  it holds
- Documented the PDF pagination engine so the
  measure-then-pack approach is understandable to
  anyone reading it cold

### Decisions Made
- Decision: No Master or Senior DPO signature block
  on the PDF
- Reasoning: A verification block with vessel,
  company and ship's stamp fields looks like the
  company confirmation letter the NI actually
  requires. A trainee could submit it instead of the
  real thing and stall their application. Trainee
  declaration only.
- Decision: Period dates always print both years
- Reasoning: A record spanning New Year is normal for
  a trainee across two contracts. One unconditional
  format removes a conditional that can fail at the
  boundary.
- Decision: Hide the Phase D bars until the course
  date is saved
- Reasoning: A Phase B trainee has no use for bars
  measuring something they have not started. Keeps
  the panel honest about where the person actually
  is.

### Lessons Learned Today
- The export PDF is not just an output, it is a
  distribution channel. For people in the industry
  who have finished their training, that document
  might be their first introduction to DPTrainer. It
  travels on its own, without the app around it, so
  it has to leave a good impression by itself.
- Getting the Phase B and Phase D ruling right was
  important — it is a genuinely useful feature for
  the log, and it is the kind of thing a trainee
  cannot easily work out by hand.
- Learned a lot about design through the logo
  process.

### Problems / Blockers
- Running out of storage on the laptop. Have had it
  since I was 18 and need a new one badly. It
  hinders building slightly but I make it work.

### Next Actions
1. Finish the outstanding items on the to-do list
2. Show a colleague and get their feedback

---

## Day 10
**Date:** 3 September 2026
**Phase:** Polish
**Mood / Energy:** Purposeful.

### Top Outcome for Today
Brand assets wired into the app. DPTrainer has its
own icon, logo and identity rather than defaults.

### What I Worked On
- Commissioned and received a full brand package —
  icon in three colourways, four logo lockups, single
  colour builds, social and email assets, and a
  manifest
- Created public/ and wired the favicon, Apple touch
  icon and PWA icons
- Configured the web manifest for standalone display,
  so the app opens fullscreen from the iPad home
  screen with no browser chrome
- Added Open Graph and Twitter card tags, so sharing
  the URL produces a branded preview rather than a
  blank link
- Replaced the text wordmark on the home screen with
  the stacked lockup, switching by theme

### Decisions Made
- Decision: Inline the logo SVG rather than loading
  it through an img tag
- Reasoning: An SVG in an img tag renders as an
  isolated document and cannot see the page's
  webfont, so the wordmark would have fallen back to
  Arial on most Windows machines. The whole point of
  having it reset in Inter was to match the app.

### Lessons Learned Today
- The trigger was seeing a generic icon in the tab
  corner on the ship's iPad. The PDF was a working
  feature but it did not look professional yet, and
  the default icon made the whole thing look
  unfinished. Small details decide whether something
  reads as a product or a project.

---

## Day 9
**Date:** 18-20 August 2026
**Phase:** Build
**Mood / Energy:** Determined.

### Top Outcome for Today
DP Time Log made genuinely functional — CSV import
and export, a template for new users, and NI
threshold logic corrected.

### What I Worked On
- Built CSV import with column mapping, fuzzy header
  matching, a preview step and problem-row flagging
- Built CSV export and a downloadable template so a
  new user knows exactly what shape their file needs
- Fixed date format ambiguity — Excel exports
  mm/dd/yyyy and the parser was rejecting anything
  where the day exceeded 12
- Prevented the same source column being mapped to
  two fields, which silently corrupted imports
- Replaced the NI threshold logic entirely after
  discovering it was wrong about the scheme
- Rebuilt the PDF export as a proper paginated
  document for NI submission support
- Moved the toolbar below the table and reordered
  entries oldest-first
- Imported my real 78-entry record

### Decisions Made
- Decision: Rewrite the threshold logic against the
  actual NI New Offshore Scheme requirements
- Reasoning: The original showed "48 of 30" and
  treated the scheme as two simple 30-day gates. The
  real scheme is 60 days for Phase B with a 30-day
  passive cap, 60 for Phase D with a minimum of 30
  after the Simulator Course, 120 total, and the
  certificate type decided by the DP class mix. The
  app was telling trainees they had passed
  thresholds that do not exist.
- Decision: Entries table reads oldest-first
- Reasoning: A physical logbook fills downward and is
  signed at the bottom. Digital-first instinct is not
  always right when the paper version has decades of
  convention behind it.

### Lessons Learned Today
- I could tell something was not right. I knew we had
  a basic log but I wanted a functional one with no
  bugs. Knowing the domain meant the app looked wrong
  the moment my real data went into it.
- Testing with real data found what synthetic tests
  never would — a title block above the headers,
  trailing legend rows, American date formats, and
  mixed cell types in one column.

---

## Day 8
**Date:** 5 August 2026
**Phase:** Positioning
**Mood / Energy:** Steady.

### Top Outcome for Today
README rewritten to reflect what DPTrainer actually
is, plus a Word version for printing and sharing.

### What I Worked On
- Rewrote README.md completely — problem, solution,
  positioning, content, source material, status,
  features, privacy, technical structure
- Documented all six source documents behind the
  curriculum
- Wrote the Positioning section stating plainly that
  DPTrainer does not instruct, assess, certify or
  sign off
- Produced README-DPTrainer.docx for printing and
  sharing outside GitHub

### Decisions Made
- Decision: Lead with positioning rather than
  features
- Reasoning: A training centre reading it needs to
  know immediately whether DPTrainer is a competitor
  or a feeder. It is a feeder — trainees arrive at
  accredited courses better prepared — and saying so
  plainly is both true and the safest ground until
  there is a decision about monetising.

### Lessons Learned Today
- The build had progressed a long way since the last
  README and it needed an update for potential
  investors. The repo is the shop window for anyone
  technical, and it was still describing a project
  with two tasks and eight pending milestones.
- Most of the people who need to read about DPTrainer
  will not want a code repository, which is why the
  Word version matters.

---

## Day 7
**Date:** 4 August 2026
**Phase:** Build → Validation
**Mood / Energy:** Energetic to be live. Want to make
sure the i's are dotted and t's crossed before the
project is viewed by professionals — my coworkers.

### Top Outcome for Today
Literature integration complete. 27 new tasks across
8 new domains, extracted from six industry documents.
19 domains, 72 tasks, all deployed live.

### What I Worked On
- Built a data stack from six sources: IMCA M220
  Rev 3, M273 (Jan 2026), M249 Rev 1, M117 Rev 3.3,
  IMO MSC.1/Circ.1580, DP Operator's Handbook 3rd ed
- Ran extraction across four separate chats due to
  PDF limits, each producing domain JSON plus a
  coverage report
- New domains: asog_cam_tam, dp_drills,
  dp_systems_and_modes,
  position_reference_and_redundancy,
  emergency_response, dp_trials_and_assurance,
  drill_conduct_and_debrief, tagos_power_strategy
- Every task mapped to NI logbook task references
- Curriculum days 3-22 rewired, buffer placeholders
  replaced with real tasks, 120-minute floor held
- Integration, verification, push, live deploy

### Decisions Made
- Decision: Write a full content spec before the
  final extraction rounds
- Reasoning: The first two batches came back with
  missing NI references, order collisions and
  duplicate tasks. The extraction chat couldn't see
  what already existed. A spec listing existing
  domains, task IDs, covered competencies and the
  full NI logbook reference list fixed it — batch 3
  came back clean.
- Decision: Accept null results from extraction
- Reasoning: The 2003 IMCA intro document was
  assessed and nothing extracted because it
  duplicated existing content. Refusing to force
  tasks out of thin source material is a feature,
  not a failure.

### Lessons Learned Today
- A curriculum has more knowledge than I do. I can't
  teach future DPOs — I only know what I want to
  learn and what the NI says you must learn. Building
  it from the literature makes it a tool that can
  HELP everyone who's training, not just me.
- The best extraction output came from the strictest
  instructions. Quality wasn't the constraint —
  context was.

### Next Actions
1. Keep sharing with coworkers and get their feedback
2. Validate task content with a senior DPO
3. Use DPTrainer for my own remaining passive days

---

## Day 6
**Date:** 26 July 2026
**Phase:** Build → Deployment
**Mood / Energy:** Big step.

### Top Outcome for Today
DPTrainer deployed live at dptrainer.netlify.app.
No longer a local project — a URL anyone can open.

### What I Worked On
- Netlify deployment connected to the GitHub repo
- Debugged a blank white page — build command and
  publish directory were never set, so Netlify was
  serving raw source files instead of the built app
- Discovered Milestone 6 had never actually been
  pushed; all the theme work was sitting as unstaged
  local changes
- Added app footer: copyright, privacy note, contact
  email, NI non-affiliation disclaimer
- Created LICENSE file — proprietary, all rights
  reserved
- Set up dptrainer.app@gmail.com

### Decisions Made
- Decision: Deploy before beta testing
- Reasoning: Colleagues can now explore in their own
  time and make private investigation into the
  application. Handing someone a URL is a completely
  different ask than asking them to sit at my laptop.
- Decision: Add legal basics immediately on going
  live
- Reasoning: Deployment created exposure. I don't
  want time pressure to get things checked by
  colleagues before institutions can develop my idea
  without me.

### Lessons Learned Today
- Deployment makes the project real in a way local
  development never does.
- Going public and protecting the work are the same
  task, done on the same day.

---

## Day 5
**Date:** 30 May 2026
**Phase:** Build
**Mood / Energy:** Focused, frustrated in patches —
macOS file permissions fought back all day.

### Top Outcome for Today
Milestone 6 — full UI pass. Day and night themes,
new typography, NI-derived colour palette.

### What I Worked On
- Complete CSS rewrite: dual theme system with
  theme-day and theme-night
- Inter and IBM Plex Mono replacing monospace body
  text
- Colour palette derived from the NI's own navy and
  sky blue
- Theme toggle with localStorage persistence and
  pre-render init so night mode users don't get
  flashed with white on refresh
- Rewrote all four review tasks so the simulator runs
  during reflection
- Fought macOS TCC permissions blocking file writes —
  required deleting and recreating index.css
- Note: this work was completed on 30 May but sat
  uncommitted until 31 July due to macOS file
  permission problems blocking git. The two-month
  gap in this log is that, not a pause in the
  project.

### Decisions Made
- Decision: Move away from the default AI-generated
  look
- Reasoning: I had seen that same look all over the
  internet. I want my build taken seriously, and that
  starts with people's first impressions.
- Decision: Day mode default, night mode remembered
- Reasoning: Day and night modes are common practice
  on vessel navigation screens — ECDIS, radar. Felt
  like a no-brainer. Default to day for first
  impressions, but never flash a night-mode user with
  white on an accidental refresh.
- Decision: No desk-only tasks anywhere in the app
- Reasoning: There can't be a no-simulator day in a
  simulator trainer. The tool is all about work.

### Lessons Learned Today
- Design conventions from the industry beat design
  conventions from the web. Day/night wasn't a
  styling choice, it was maritime practice.
- Every task in the app must have the simulator
  running. That rule became a permanent content
  standard.

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
