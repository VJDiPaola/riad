# Riad — Hackathon Build Plan

## Context

Riad is a v0-bootstrapped Next.js 16 app — a voice-first benefits companion with a 4-phase UI ([app/companion/page.tsx](app/companion/page.tsx)) currently driven by mock data and local React state. We're entering a Vercel hackathon and need to commit to a track.

**Track decision:** **Vercel Workflow (WDK) primary** + **one custom benefits-knowledge MCP** layered into the agent reasoning step. ChatSDK/Slack track is dropped; Slack handoff stays in-scope as a workflow branch, not a primary surface.

**Why this fit:** The architecture doc at [docs/benefits-platform-rearchitected.md](docs/benefits-platform-rearchitected.md) was already written around durable workflows. The product thesis — *12 months of presence, not a one-shot wizard* — is the textbook WDK use case. Layering one MCP gives the demo "durable workflow + tool-calling agent + cited HR knowledge" without scope-creep into a second track.

## What's Already Built

| Layer | State | File |
|---|---|---|
| Landing page | Built | [app/page.tsx](app/page.tsx), [components/landing/](components/landing/) |
| Companion shell + 4-phase router | Built | [components/companion/companion-app.tsx](components/companion/companion-app.tsx) |
| Phases (interview, year-ahead, decision, plan-year) | UI scaffolded | [components/companion/phases/](components/companion/phases/) |
| Speech I/O | Built (Web Speech API) | [hooks/use-speech-recognition.ts](hooks/use-speech-recognition.ts), [hooks/use-speech-synthesis.ts](hooks/use-speech-synthesis.ts) |
| State container | Local React state only | [components/companion/companion-context.tsx](components/companion/companion-context.tsx) |
| Sample data + types | Built | [lib/companion/sample-data.ts](lib/companion/sample-data.ts), [lib/companion/types.ts](lib/companion/types.ts) |
| API routes | None | — |
| AI / agent / MCP / persistence | None | — |

Reuse, do not rewrite, the existing UI, types, speech hooks, and year-ahead utilities.

## Objectives

1. Stand up a durable Vercel Workflow that owns one employee's companion session across enrollment and the plan year.
2. Build a custom benefits-knowledge MCP server that exposes plan documents and projection logic as cited tools.
3. Wire a Vercel AI SDK agent inside the workflow that calls the MCP for grounded answers.
4. Rewire the existing UI to drive (and read from) the workflow instead of local state.
5. Demonstrate three beats end-to-end: voice life interview → narrated year-ahead with MCP citations and a voice scenario rewind → fast-forwarded quarterly check-in that re-engages the user with context.

## Architecture

```
[ Next.js UI (existing) ]
   ├─ companion-context.tsx ──┐
   └─ phases/* (interview, year-ahead, decision, plan-year)
                              │ fetch / SSE
                              ▼
[ app/api/companion/* ] ── start, resume, advance the workflow
                              │
                              ▼
[ Vercel Workflow (WDK) ]
   step: ingestInterview   → LLM parses transcript into structured profile
   step: projectYearAhead  → calls Benefits MCP tools, returns 12-month rows + narration
   step: scheduledCheckIn  → durable timer (sped up for demo); re-engages UI
   branch: hrEscalation    → pauses on simulated human input (logged only)
                              │
                              ▼
[ Benefits-Knowledge MCP server ]
   tools: get_plan, compare_plans, project_year, find_in_network_provider
   data:  static seed plans (HDHP + PPO) in mcp/benefits-knowledge/data/
```

## Workstreams

These are independent enough to be built in parallel by separate agents once the contracts are locked.

### Stream A — WDK workflow + API surface

- `workflows/companion-session.ts` (new) — workflow with steps `ingestInterview`, `projectYearAhead`, `scheduledCheckIn`, plus an `hrEscalation` branch.
- `app/api/companion/session/route.ts` (new) — `POST` starts a session, returns `sessionId`.
- `app/api/companion/session/[id]/route.ts` (new) — `GET` returns current step + payload; `POST` advances with `{ step, input }`.
- `app/api/companion/session/[id]/events/route.ts` (new) — SSE stream so the UI sees `scheduledCheckIn` fire without polling.

### Stream B — Benefits-knowledge MCP server

- `mcp/benefits-knowledge/server.ts` (new) — minimal MCP server.
- `mcp/benefits-knowledge/data/plans.json` (new) — two seed plans (HDHP + PPO) with premium, deductible, OOP max, copays, preventive list, formulary stub.
- `mcp/benefits-knowledge/README.md` (new) — how to run.

Tools to expose:
- `get_plan(planId)` → plan summary + citation snippet (page/section reference)
- `compare_plans(planIds[], scenario)` → cost projection rows, side-by-side
- `project_year(profile, planId)` → array of 12 monthly cost objects (premium, expected OOP, FSA/HSA flow)
- `find_in_network_provider(specialty, zip)` → small static list

### Stream C — AI SDK agent inside the workflow

- `lib/agent/companion-agent.ts` (new) — Vercel AI SDK agent that takes a profile + scenario, calls the Benefits MCP via the MCP client, returns narrated year-ahead script + structured rows.
- Used by `projectYearAhead` step in Stream A.
- Reads `AI_GATEWAY_API_KEY` and the MCP server URL from env.

### Stream D — UI rewiring

- [components/companion/companion-context.tsx](components/companion/companion-context.tsx) — on mount, `POST /api/companion/session`, store `sessionId`, subscribe to SSE.
- [components/companion/phases/life-interview.tsx](components/companion/phases/life-interview.tsx) — on mic-stop, POST the transcript to `advance` with `step: ingestInterview`; render the structured "what I heard" confirmation from the response.
- [components/companion/phases/year-ahead.tsx](components/companion/phases/year-ahead.tsx) — render rows returned by `projectYearAhead`; wire the scenario input ("what if a baby in March?") to repost with `scenarioInjection`.
- [components/companion/phases/plan-year.tsx](components/companion/phases/plan-year.tsx) — listen for the `scheduledCheckIn` SSE event; surface the contextual prompt banner.

Reuse without modification: [components/companion/companion-app.tsx](components/companion/companion-app.tsx), the speech hooks, [lib/companion/types.ts](lib/companion/types.ts), [lib/companion/year-ahead-utils.ts](lib/companion/year-ahead-utils.ts).

## Contracts to Lock First

These are the seams between streams. Lock them before fan-out.

**MCP tool signatures** (in `mcp/benefits-knowledge/server.ts`):
```ts
get_plan(input: { planId: string }):
  { plan: PlanSummary, citation: { source: string, snippet: string } }

compare_plans(input: { planIds: string[], scenario?: ScenarioInjection }):
  { rows: ComparisonRow[], citations: Citation[] }

project_year(input: { profile: EmployeeProfile, planId: string, scenario?: ScenarioInjection }):
  { months: MonthProjection[], narration: string, citations: Citation[] }

find_in_network_provider(input: { specialty: string, zip: string }):
  { providers: ProviderSummary[] }
```

**API JSON** (request/response shapes for `app/api/companion/session/[id]`):
```ts
POST advance:
  body: { step: "ingestInterview", input: { transcript: string, language: "en" | "es" } }
     | { step: "projectYearAhead", input: { scenario?: ScenarioInjection } }
     | { step: "scheduledCheckIn", input: { simulate: true } }
  response: { step, payload }

GET state:
  response: { sessionId, currentStep, profile, yearAhead?, lastCheckIn? }

SSE events:
  event: "step.completed" | "step.checkin.fired" | "tool.call.logged"
  data:  { step, payload }
```

**Shared types:** extend [lib/companion/types.ts](lib/companion/types.ts) with `ScenarioInjection`, `MonthProjection`, `ComparisonRow`, `Citation`, `ProviderSummary`. One source of truth, imported by streams A, B, C, D.

## Scope Cuts (out of bounds)

Kept out of scope to keep the demo on rails:

- Auth / user accounts.
- Real DB persistence (workflow state is the persistence).
- Real carrier or HRIS APIs.
- Multilingual voice (Spanish demo: stretch goal only; English-only is acceptable).
- Payroll write-back.
- HR escalation UI surface (workflow branch logs only).
- Decision journal export.

## Verification

End-to-end smoke before stage:

1. `pnpm dev` and the MCP server both start cleanly.
2. `POST /api/companion/session` returns a `sessionId`.
3. UI walk-through:
   - Mic → transcript → confirmed profile rendered from `ingestInterview` output.
   - Year-Ahead renders 12 rows from `projectYearAhead`, with at least one citation badge sourced from an MCP tool call.
   - Voice scenario rewind ("baby in March") triggers a re-projection; rows update.
   - Plan-year screen surfaces the check-in banner once the durable timer fires (or once the simulate button is clicked).
4. Server logs show: workflow step transitions, at least one MCP tool call with arguments.

## Demo Narrative

1. Open companion. Tap mic. Describe a real-life situation in ~30 seconds.
2. Companion confirms ("So I'm hearing…"), profile populates.
3. Year-Ahead timeline renders. Agent narrates two plans grounded in MCP-cited plan data.
4. Voice scenario rewind: *"what if a baby in March?"* — timeline re-renders.
5. Pick a plan. Fast-forwarded quarterly check-in fires; banner reads: *"Your first paycheck deduction landed at $X — matches projection."*
6. Closing line: *"Twelve months of presence as a durable workflow, with a benefits-knowledge MCP keeping every number cited."*
