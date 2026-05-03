# AI Benefits Companion Platform — Rearchitected

> A voice-first, body-doubling benefits companion that walks alongside employees for the full 12 months between elections — not just a one-shot wizard during open enrollment.

## What Changed and Why

The original concept treated benefits enrollment as a single guided session. In practice, an employee's benefits decisions ripple through every paycheck, every doctor visit, and every life event for the next 12 months. They also rarely happen at a desk with full focus — they happen between meetings, while caring for kids, or in bed at 11pm.

This rearchitecture is built around three shifts:

1. **Voice-first interaction** so employees can think out loud, not fill out forms.
2. **Persistent body doubling** so the companion stays present *with* them — through enrollment, throughout the plan year, and during life events — instead of disappearing after a wizard finishes.
3. **A 12-month life horizon** so employees can feel, before they click "submit," how this decision will actually land month by month until the next election.

---

## Core UX Pillars (Rearchitected)

### Pillar 1: Speech-First Life Interview

The single biggest barrier to good benefits decisions is cognitive load. Reading a 60-page SPD and typing answers into a form is the opposite of how people actually process life decisions. People talk through them — usually with a spouse, friend, or HR rep.

The companion replaces that conversation partner.

#### Voice Modalities

- **Push-to-talk life interview.** Employee taps once and tells the companion their situation in their own words. The agent transcribes, structures, and reflects it back: *"So I'm hearing: married, one toddler, your spouse has coverage through their job, you take a daily prescription, and you're worried about the deductible. Did I get that right?"*
- **Conversational scenario queries.** *"What if I have another kid in March?"* — spoken naturally, answered conversationally.
- **Read-aloud explanations.** Plan documents and tradeoffs are narrated, not just displayed. Employees can listen during a commute or while making dinner.
- **Hands-free mode.** Designed for parents, shift workers, and caregivers. The full life interview can be completed without touching the screen.
- **Multilingual voice I/O.** Spanish, Mandarin, Tagalog, Vietnamese, and others — because benefits literacy gaps are largest where the materials don't match the employee's first language.
- **Voice journaling.** During the year, employees can leave a voice note (*"I just got a $400 ER bill, is that right?"*) and the companion responds with context against their plan.

#### Why This Beats Forms

- Speech captures hesitation, uncertainty, and priority weight that radio buttons can't.
- Employees explain edge cases (custody schedules, chronic conditions, planned procedures) they would never volunteer in a form.
- It lowers the literacy barrier — both reading literacy and benefits literacy.

#### Privacy Guardrails

- Voice processed on-device or in ephemeral session memory by default.
- Health-adjacent details are stored as structured *factors* (e.g. `recurring_prescription: true`), never raw transcripts, unless the employee opts in.
- Clear "what I heard" confirmation before anything is saved.
- One-tap delete of voice history.

---

### Pillar 2: Persistent Body Doubling

Body doubling in the original concept was a flow — a wizard that walked you through enrollment. The rearchitected version makes it a **presence**.

A body double is most useful when it stays.

#### The Companion Lives in Three Modes

**1. Co-Pilot Mode (active enrollment)**

A persistent side panel that sits next to whatever the employee is doing — the company's enrollment portal, a plan PDF, or the comparison view.

- Narrates what's on screen: *"This page is asking you to pick a medical plan. There are three. Want me to walk through them?"*
- Pacing controls front and center: **Pause**, **Slow down**, **Let me think**, **Repeat that**.
- Visible "I'm here" indicator — soft pulse, ambient sound option, or a quiet status line — so the employee feels accompanied, not alone.
- Tracks where the employee is in the enrollment flow so they can leave and resume without re-explaining themselves.

**2. Ambient Mode (between sessions)**

The companion is present but quiet. Like a study buddy reading their own book in the same room.

- Shows up as a small persistent dock element across the platform.
- No nudges unless the employee opens it or a real deadline is approaching.
- A "tap to talk" affordance is always one click away.

**3. Check-In Mode (across the 12-month plan year)**

The companion proactively re-engages on a cadence the employee chooses:

- After the first paycheck (*"How did the deduction land vs. what we expected?"*)
- Before known events (flu season, tax season, FSA spend-down deadline)
- After detected life events (employee mentions a baby, a move, a new prescription in voice notes)
- Quarterly retrospective (*"Here's what you've used so far. Still feel right?"*)

#### Co-Presence Design Details

- **Soft-cued thinking.** When the agent is processing, it shows a calm "thinking" state, not a spinner — body doubles don't disappear when they pause.
- **Permission to be slow.** Explicit UI affordances for *"I need a minute"* and *"come back to this later."* No timeouts. No re-prompts.
- **Decision journaling.** Every choice the employee makes is captured with their *reasoning in their own words* (voice or text). Months later, they can ask *"why did I pick this plan?"* and hear themselves explain it.
- **Optional human handoff.** A real HR rep or licensed advisor can be pulled into the same session, seeing the same context — the body double becomes a warm intro, not a cold escalation.

---

### Pillar 3: The 12-Month Life Lens

A benefits choice is not a one-time decision. It is 26 paychecks, every prescription refill, every specialist visit, every dental cleaning, every FSA receipt, every deadline. Employees rarely get to feel that timeline before they commit.

The rearchitected platform makes the next 12 months *visible and rehearsable* before enrollment closes.

#### The Year Ahead View

A timeline visualization, also fully narratable by voice, that shows:

- **Paycheck-by-paycheck premium deductions** under each plan being considered.
- **Expected out-of-pocket events** layered on the timeline (e.g. "March: dental cleaning," "August: annual physical," "October: prescription refills continue").
- **Known deadlines** (FSA use-it-or-lose-it, dependent verification, qualifying-event windows).
- **Worst-case and likely-case bands** — so employees see both *"a normal year"* and *"a rough year"* under each plan, side by side.

#### Rehearse Before You Choose

- **Scenario rewind.** Employees can scrub through the year under Plan A, then Plan B, hearing the companion narrate what changes: *"In May, under the HDHP, this ER visit would cost you ~$2,400 before insurance kicks in. Under the PPO, it's a $250 copay."*
- **Life-event injection.** *"What if I have a baby in July?"* re-renders the entire 12-month projection in real time.
- **Regret check.** Before the employee submits, the companion asks one targeted question grounded in their own stated priorities: *"You told me earlier you didn't want surprise bills. Under this plan, the worst-case month is about $X. Still feel okay?"*

#### After Enrollment: The Living Plan Year

Once enrolled, the timeline becomes a living dashboard:

- Tracks predicted vs. actual costs.
- Surfaces FSA/HSA balances against upcoming known events.
- Reminds employees about benefits they're paying for but haven't used (mental health visits, vision exam, preventive care).
- Captures lessons for next election: *"You overestimated prescription costs by ~30% — want to revisit that for next year?"*

---

## Rearchitected Information Architecture

```txt
┌─────────────────────────────────────────────────────────────┐
│                  Employee Companion (always-on)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Voice Layer  │  │ Body Double  │  │ 12-Month Lens    │   │
│  │ (STT/TTS,    │  │ Presence     │  │ Timeline +       │   │
│  │  multilingual)│  │ (co-pilot,  │  │ Scenario Rewind  │   │
│  │              │  │  ambient,    │  │                  │   │
│  │              │  │  check-in)   │  │                  │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│         Durable Workflow Orchestration (Vercel Workflow)    │
│   Life Interview │ Scenario Sim │ Year-Ahead │ Check-Ins    │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Managed Agent (reasoning) + Approved Benefits Knowledge    │
│         (employer-specific, source-cited, HR-approved)      │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
                  HR Console + Escalation
```

---

## Rearchitected Workflows

### Workflow A: Voice Life Interview (replaces the form-based interview)

1. Employee opens the companion and taps the mic.
2. Free-form speech is transcribed and parsed into structured life factors.
3. Companion reflects back what it heard, in plain language, and asks for confirmation.
4. Gaps trigger gentle voice follow-ups (*"You didn't mention dependents — is that on purpose?"*).
5. Output: a structured employee profile + a saved voice summary the employee can replay.

### Workflow B: Year-Ahead Rehearsal

1. Profile + approved plan data feed a 12-month projection engine.
2. Engine renders timeline visualization and a narratable script.
3. Employee can ask scenario questions by voice; timeline re-renders.
4. Companion logs assumptions used, with citations to source plan documents.
5. Output: a rehearsable year, a regret-check, and a saved decision rationale.

### Workflow C: Persistent Companion Sessions

1. Companion maintains long-lived session state across enrollment, post-enrollment, and life events.
2. Each interaction appends to the employee's decision journal.
3. Scheduled check-ins are durable workflow steps — they survive across weeks/months.
4. Detected life-event signals (voice notes, calendar events the user opts to share) can re-open enrollment guidance for qualifying events.

### Workflow D: HR Escalation with Warm Handoff

1. When the agent escalates, the HR rep receives the employee's *consented* context summary.
2. HR can join the live companion session — same voice channel, same timeline, same journal.
3. After resolution, the answer feeds back into approved knowledge (with HR sign-off).

---

## Rearchitected MVP Scope

The MVP should make speech, presence, and the 12-month lens feel *real*, even if narrow.

### Demo Must-Haves

1. **Voice life interview** — a single push-to-talk flow that produces a confirmed structured profile.
2. **Persistent companion panel** — visible across at least two screens (interview + comparison) so presence is felt.
3. **Year-Ahead timeline** — month-by-month projection for two plans, with one voice-driven scenario rewind (*"what if I have a baby?"*).
4. **Decision journal** — employee's own voice summary saved and replayable.
5. **Quarterly check-in stub** — a scheduled durable workflow step that fires (sped up for demo) and reopens the companion with a contextual prompt.
6. **HR escalation with warm context** — single click from companion to HR queue with consented summary.

### Explicitly Out of Scope for MVP

- Real carrier APIs
- Payroll write-back
- Licensed advisory recommendations
- Full multilingual voice (pick one second language for demo)
- Real calendar integration (mock the life-event signals)

---

## Updated Demo Flow

**Persona:** New hire in NYC, married, expecting a child mid-year, takes a daily prescription, primarily Spanish-speaking at home, commutes by subway and prefers to handle admin on her phone.

1. Employee opens the companion on her phone during her commute. Headphones in.
2. She taps the mic and describes her situation in Spanish, hands-free.
3. Companion confirms understanding in Spanish, then offers to continue in English for the plan documents (which are English-only) — her choice.
4. Year-Ahead timeline renders for two plans. She listens to the narrated walk-through.
5. She asks aloud: *"What if the baby comes in June instead of August?"* Timeline re-renders.
6. She pauses ("let me think"). Companion stays present, ambient.
7. That evening, she resumes on her laptop. Companion picks up exactly where she left off, including her voice notes.
8. She runs the regret check, makes her selection, and saves a 90-second voice summary explaining her reasoning to her future self.
9. Two simulated months later, a check-in fires: *"Your first paycheck deduction was $X. Matches what we projected. One thing — you haven't booked your prenatal visit yet, and it's a covered benefit."*
10. A qualifying-event-style question is escalated to HR. HR joins the same session with full context. Resolution feeds back into the knowledge base.

---

## Why This Is a Greater Benefit to the Employee

| Old Concept | Rearchitected |
|---|---|
| Form-based intake | Voice-first life interview |
| Wizard you complete and leave | Companion that stays for 12 months |
| Static plan comparison | Rehearsable year-ahead timeline |
| One-time enrollment help | Check-ins, life-event re-engagement, retrospectives |
| English-first, literacy-heavy | Multilingual voice, low-literacy friendly |
| Decision is a click | Decision is a rehearsed, journaled commitment |
| HR escalation = ticket | HR escalation = warm, in-session handoff |

The employee no longer has to *become* a benefits expert for one stressful week. They get a companion that helps them think, lets them feel the year before they commit to it, and stays beside them until the next election rolls around.

---

## Open Questions Specific to the Rearchitecture

- **Voice data residency.** Where does STT happen — on-device, Vercel edge, or a managed provider? What's the retention default?
- **Companion presence model.** Persistent panel vs. floating dock vs. OS-level? Trade-offs around enrollment-portal embedding.
- **Check-in cadence ownership.** Employee-controlled, employer-controlled, or hybrid?
- **Life-event detection.** Opt-in only, or also inferred from voice notes with clear consent UI?
- **Decision journal portability.** Does the employee own and export it (recommended), or is it employer-scoped?
- **Accessibility parity.** Every voice affordance must have a keyboard/screen-reader equivalent, and vice versa — how do we test this from day one?

---

## One-Sentence Pitch (Updated)

A voice-first benefits companion that body-doubles employees through enrollment and stays present for the full 12 months — so they can hear, rehearse, and live with their decisions before the next election, not just click through them.
