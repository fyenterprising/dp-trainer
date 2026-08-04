# DPTrainer Content Extraction — Batch 3 Coverage Report

**Sources:** IMCA M249 Rev. 1 (DP Practitioner Accreditation Scheme Handbook), IMCA M273 (DP Drills and Preparedness), IMCA M220 Rev. 3 (Operational Activity Planning)

**New domains:** 17 `dp_trials_and_assurance` (3 tasks), 18 `drill_conduct_and_debrief` (3 tasks), 19 `tagos_power_strategy` (3 tasks). Task ID prefixes `ta_`, `dc_`, `tg_` — no collisions with existing IDs.

---

## 1. NI logbook sections addressed by the new tasks

| NI ref | Section | Task IDs |
|---|---|---|
| 1.1 | Annual trials | ta_001, ta_003 |
| 1.1.4 | Class-required DP checklists | ta_001, ta_003 |
| 1.2 | System operator manuals | ta_002 |
| 1.3.3 | DP logbooks | ta_003, dc_003 |
| 1.3.4 | Company SMS DP checklists, JSA and toolbox | dc_001, dc_003 |
| 1.3.5 | DP incident reporting and IMCA reporting system | dc_003 |
| 2.2 | Role of senior DPO | dc_002 |
| 2.3 | Role of second person | dc_001, dc_002 |
| 4.4 | Power generation | tg_001 |
| 4.5 | Propulsion and thruster systems | tg_002 |
| 4.6 | Thruster and generator operating plan | ta_002, tg_001, tg_002 |
| 6.1 | Gyros | ta_001 (variant ta_001a: 6.3 wind sensors; variant ta_001b: 7.9) |
| 7.6 | Reduced power/thruster after worst case failure | ta_002, tg_001, tg_002 |
| 7.17 | DP performance and power assessment | tg_001, tg_003 |
| 7.20 | Using the DP checklist | ta_003 |
| 7.21 | Capability plot assessment | tg_003 |
| 7.24 | Risk assessment | dc_003 |
| 7.25 | Toolbox talk | dc_001 |
| 9.2 / 9.12 | Percentage power / WCF awareness — **active sea time only** | tg_003 (habit-building only; sign-off requires active time, noted in the task setup) |
| 11.3 | Degraded status | dc_002, tg_002 |
| 11.4 | Failure status | ta_002 |
| 11.9 | Reference system failure | ta_001, dc_001 |
| 11.12 | Degraded status recognition | dc_002 |

---

## 2. Material warranting a task but not written, and why

**M273 Appendix A remaining drills — A2 Consequence Analysis, A4 Drive Off, A5 Full Blackout, A6 Thruster Full Thrust.** Checked against existing coverage as instructed; all four overlap tasks already in the library. A2 duplicates the consequence-alarm competency (alarm_005). A4 duplicates the drive-off competency (alarm_004). A6 duplicates the thruster-failure competency (fail_001/fail_00x family). A5's simulator-executable portion (power failure response, backup station changeover, blackout recovery sequencing) is spread across the existing power-failure and emergency-response tasks; the remainder of A5 is explicitly a desktop workshop (M273 says the test "does not have to be a live test") and fails hard rule 1. **Distinction preserved elsewhere:** what the existing tasks do *not* cover from these drills is the briefing/observation/debrief wrapper M273 puts around them — that wrapper is exactly what domain 18 extracts, and dc_001–dc_003 can be layered onto any existing drill task.

**M273 Section 2.1 — operator interventions the redundancy concept relies on** (manual fuel changeover, seawater supply changeover, thruster e-stop to convert drive-off to drift-off). These are touch drills, and the touch-drill competency is already covered in the existing library. Flagged rather than rewritten. Worth noting for a future content pass: a vessel-specific version of this (built from the trainee's own vessel FMEA) would be high-value but violates hard rule 3 as generic content.

**M249 codes of conduct, examination structure, revalidation points scheme.** Administrative content with no simulator-executable, measurable outcome — fails hard rules 1 and 2 as standalone tasks. Instead, the *values* the codes encode (objectivity, independence of the witness, integrity of records) are woven into the debrief questions of ta_001–ta_003, which is where a TDPO can actually engage with them at a DP desk.

**M249 Attachment 8 — DP incident investigation and reporting.** Overlaps the existing event-classification-and-reporting competency (er_ family). Flagged, not rewritten.

**M220 ASOG traffic lights, CAM/TAM configuration.** Already extracted in batch covering domain 12 (act_001–004). The TAGOS material (Section 3.4, Appendix 3) was the untouched remainder and is now domain 19. The M220 Section 4.3.5 logging recommendation overlaps the existing routine-log-entries competency and is additionally reinforced by dc_003's record-keeping standard.

**M220 SIMOPS section of the ASOG example.** Multi-vessel coordination cannot be executed by a single trainee on a ship-based simulator with a measurable individual outcome — fails hard rules 1–2. The communications-discipline fraction is partly served by existing watchkeeping tasks.

**M220 definitions of drift off / drive off (2.2.8–2.2.9).** Both competencies already exist. Force off (2.2.10) did not — extracted as tg_003.

---

## 3. NI sections these documents touch that the new tasks do not reach

- **3.8 (draw DP layout diagram):** M249's evidence requirements and M220's TAGOS both presuppose layout knowledge, but a drawing exercise is desk-only — hard rule 1. Candidate for a future non-simulator companion module if the product ever adds one.
- **5.3–5.7 (laser, Artemis, FMCW, acoustic, taut wire specifics):** the M220 ASOG example names Fanbeam, RADius, SpotTrack, HiPAP and taut wire, but tasks naming specific equipment fail hard rule 3. Principle-level PRS coverage exists in the prs_/sen_ families.
- **2.4 (role of Master):** M220's sign-off and management-of-change content implies it; no simulator-executable task emerged that wasn't a paper exercise.
- **2.5/2.6 (watch handover):** M273's briefing discipline is adjacent but handover is already covered (watch_ family).
- **4.12 (starting up and shutting down the DP system):** referenced implicitly in M220 checklist content; not reached by these documents in enough depth to ground a task. Likely better sourced from the vessel operations manual in a future batch.
- **Section 10 (departure):** active-sea-time only; M220's "safely terminate" content overlaps the existing planned-departure task.

---

## Notes for the milestone log

- Domain orders now run 0–19 with 17–19 added this batch.
- dc_001–dc_003 are deliberately composable: each can wrap any existing drill task, which multiplies effective content without new task IDs.
- ta_002 and tg_001 both involve removing a redundancy group but serve different competencies — verification-against-documentation vs. limit-calculation-and-validation. The distinction is stated in each task's competency field and setup text.
