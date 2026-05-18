# NI DP Logbook — Task Sections Reference

## Purpose

Internal reference for DPTrainer content development.
Every task in the app maps to one or more NI logbook
items so TDPOs can track which requirements their
simulator sessions address.

Key: ✅ = passive-eligible | 🔵 = active/engines required

---

## SECTION 1 — DP Class Requirements
Passive: ✅ All tasks
Tasks: 1.1 Annual trials | 1.2 System operator manuals |
1.3.1 DP section of vessel management system |
1.3.2 Vessel DP operations manuals | 1.3.3 DP logbooks |
1.3.4 Company SMS checklists | 1.3.5 Incident reporting |
1.4.1 Charter-specific instructions |
1.1.4 Class-required DP checklists |
1.1.5 General understanding of DP manual

---

## SECTION 2 — Bridge Team Roles
Passive: ✅ All tasks
Tasks: 2.1 Role of DP operator | 2.2 Role of senior DPO |
2.3 Role of second person | 2.4 Role of Master |
2.5 Handing over the watch | 2.6 Taking over the watch |
2.7 Safe navigational watch during DP operations

---

## SECTION 3 — DP System Elements
Passive: ✅ All tasks
Tasks: 3.1 Operator stations | 3.2 DP controllers |
3.3 Independent joystick system |
3.4 UPS systems and breakers |
3.5 Means of propulsion | 3.6 Reference systems |
3.7 Environmental sensors |
3.8 Draw DP layout diagram

---

## SECTION 4 — In-Depth System Knowledge
Passive: ✅ All tasks
Tasks: 4.1 System layout | 4.2 DP controllers in use |
4.3 Resetting controllers | 4.4 Power generation |
4.5 Propulsion and thruster systems |
4.6 Thruster and generator operating plan |
4.7 Power supplies | 4.8 UPS systems |
4.9 Position reference systems | 4.10 Wind sensors |
4.11 Motion reference units |
4.12 Starting up and shutting down

---

## SECTION 5 — Position Reference Systems
Passive: ✅ All tasks. Minimum two types required.
Tasks: 5.1 GNSS | 5.2 Relative GPS | 5.3 Laser |
5.4 Artemis | 5.5 FMCW radar | 5.6 Acoustic |
5.7 Taut wire | 5.8 Other systems

---

## SECTION 6 — Sensors
Passive: ✅ All tasks
Tasks: 6.1 Gyros | 6.2 Motion reference units |
6.3 Wind sensors | 6.4 Other sensors

---

## SECTION 7 — DP Operations
Passive: ✅ Most tasks
Active required: 7.1–7.7, 7.14, 7.18 (drift test)
Tasks: 7.1 Planning | 7.2 Stopping safely |
7.3 Manual controls test | 7.4 Changeover to DP |
7.5 Joystick competence | 7.5.1 Manual control |
7.6 Reduced power/thruster competence |
7.7 Verify propulsion control |
7.8 Sensor selection | 7.9 Reference selection |
7.10 Reference availability |
7.11 Centre of rotation | 7.12 Heading selection |
7.13 Working position and escape route |
7.14 Vessel stabilisation | 7.15 Gain control |
7.16 Model-building limitations |
7.17 System performance assessment |
7.18 Drift test — mandatory where applicable |
7.19 Return to manual procedure |
7.20 DP checklist | 7.21 Capability plot |
7.22 Installation communication |
7.23 Heading determination |
7.24 Risk assessment | 7.25 Toolbox talk

---

## SECTION 8 — Moving the Vessel / Close Proximity
Passive: 🔵 Most tasks
Passive OK: 8.5, 8.6, 8.9, 8.10
Tasks: 8.1 Minimum safe distance |
8.2 Assess final working position — Drift On or Off |
8.3 Controlling movement step size |
8.4 Controlling approach speed |
8.5 Gain level assessment ✅ |
8.6 Safe escape route planning ✅ |
8.7 Methods of inputting commands |
8.8 Manoeuvring in Auto DP mode |
8.9 Other reference system selection ✅ |
8.10 Final checklist completion ✅

---

## SECTION 9 — Watchkeeping During DP Operations
Passive: 🔵 Active only — all 15 tasks
Tasks: 9.1 Position excursion monitoring |
9.2 Percentage power monitoring |
9.3 Wind speed and direction monitoring |
9.4 Sea and swell monitoring |
9.5 DP current monitoring |
9.6 Actual current, tides, swell and external forces |
9.7 Monitor change from Drift Off to Drift On |
9.8 Reference system performance monitoring |
9.9 External influences on references |
9.10 Thruster effect from mobile units |
9.11 Continuous risk assessment for position changes |
9.12 Worst case failure awareness |
9.13 Continuous risk assessment |
9.14 Main operational task awareness |
9.15 Vessel performance assessment

---

## SECTION 10 — Departure from Working Position
Passive: 🔵 Active only — all 3 tasks
Tasks: 10.1 Move vessel to safe position |
10.2 Controlled changeover to manual |
10.3 Return DP to standby

---

## SECTION 11 — DP Alarms, Warnings and Degraded Status
Passive: ✅ All tasks — passive or active
Tasks: 11.1 Heading alarms |
11.2 Position alarms |
11.3 Degraded status — reduced capability |
11.4 Failure status — action to take |
11.5 Consequence analysis |
11.6 Drift off — loss of position references |
11.7 Drive off — catastrophic failure |
11.8 Drive off alarms and meanings |
11.9 Reference system failure |
11.10 DP system failure — independent joystick/manual |
11.11 Partial blackout procedure |
11.12 Degraded status recognition and response |
11.13 Vessel operations during DP failure

---

## Summary

| Section | Passive Eligible |
|---------|-----------------|
| 1–6 | ✅ All tasks |
| 7 | ✅ Most — 7.1–7.7, 7.14, 7.18 need active |
| 8 | 🔵 Most — 8.5, 8.6, 8.9, 8.10 passive OK |
| 9 | 🔵 Active only |
| 10 | 🔵 Active only |
| 11 | ✅ All tasks |

---

## DPTrainer Mapping Note

Each task number is referenced in curriculum.json under
the ni_task_ref field. Session tasks completed in
DPTrainer record which NI logbook items were addressed.

Section 11 is fully passive-eligible — the entire alarms
and degraded status section maps directly to DPTrainer
alarm and failure scenario content.

Section 9 is active only — DPTrainer builds the
observational habits but sign-off requires the real vessel.

Source: NI DP Operator Logbook — New Offshore Scheme.
Internal reference only. Not for distribution.
DPO credentials omitted.
