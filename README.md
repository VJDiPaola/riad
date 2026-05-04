# Riad

Voice-first benefits companion that walks an employee through 12 months of decisions, not a one-shot enrollment wizard. Built for the Vercel hackathon on the **Workflow Development Kit (WDK)** track, layered with a custom **Benefits-Knowledge MCP** server.

> **Live demo:** https://v0-riad.vercel.app/

## What it does

1. **Life interview.** Tap the mic, talk for 30 seconds about your life. The agent extracts a structured profile.
2. **Year-Ahead.** A WDK step calls the Benefits MCP to compare two seed plans (PPO + HDHP), returning month-by-month projections and cited narration.
3. **Voice scenario rewind.** "What if a baby in March?" re-projects the year on the fly.
4. **Durable check-in.** A workflow timer (sped up for the demo) fires later and surfaces a contextual banner: *"Your first paycheck deduction landed at $X — matches projection."*

## Architecture

```
[ Next.js UI ]
   ├─ companion-context.tsx
   └─ phases/* (interview, year-ahead, decision, plan-year)
                    │ fetch / SSE
                    ▼
[ app/api/companion/* ] ── start, advance, stream session
                    │
                    ▼
[ Vercel Workflow (WDK) ]
   step: ingestInterview   → AI SDK extracts profile from transcript
   step: projectYearAhead  → calls Benefits MCP, returns rows + narration
   step: scheduledCheckIn  → durable timer; re-engages UI via SSE
                    │
                    ▼
[ Benefits-Knowledge MCP ]
   tools: get_plan, compare_plans, project_year, find_in_network_provider
   data:  seed plans (Argan PPO + Atlas HDHP) in mcp/benefits-knowledge/data/
```

The companion agent ([lib/agent/companion-agent.ts](lib/agent/companion-agent.ts)) prefers the HTTP MCP transport but falls back to in-process tool calls when the MCP server is unreachable, so the production deployment runs without a separate MCP process.

## Local development

```bash
pnpm install
pnpm dev:all   # runs Next.js + the local MCP server in parallel
```

Open <http://localhost:3000/companion>.

To run without the MCP HTTP server (mirrors the prod fallback path):

```bash
pnpm dev
```

## Environment variables

Copy [.env.local.example](.env.local.example) to `.env.local` and fill in as needed.

| Variable | Required | Notes |
|---|---|---|
| `AI_GATEWAY_API_KEY` | Recommended | Without it, narration uses deterministic stubs. Set in Vercel project settings for a real demo. |
| `COMPANION_MODEL` | Optional | Defaults to `openai/gpt-4o-mini`. |
| `BENEFITS_MCP_URL` | Local only | Defaults to `http://localhost:8787/mcp`. Leave unset in production — the in-process fallback handles tool calls. |
| `BENEFITS_MCP_PORT` | Local only | Defaults to `8787`. |
| `COMPANION_CHECKIN_DELAY_MS` | Optional | Durable check-in timer in ms. Default `30000`. |

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import it as a new project in Vercel — framework auto-detects Next.js.
3. In project settings → Environment Variables, set `AI_GATEWAY_API_KEY` (recommended). Leave `BENEFITS_MCP_URL` unset.
4. Deploy. The WDK runtime is enabled automatically by `withWorkflow(nextConfig)` in [next.config.mjs](next.config.mjs).

## Known prototype limitations

- **In-memory session store.** [lib/agent/session-store.ts](lib/agent/session-store.ts) holds session state in a `Map`. This is fine for a solo demo (Vercel keeps the lambda warm), but a multi-user deployment needs Vercel KV / Redis. The durable check-in workflow may resume on a different lambda and surface a generic banner — the simulate button on the plan-year screen is the reliable trigger.
- **No auth, no DB, no carrier APIs.** Seed plan data lives in [mcp/benefits-knowledge/data/plans.json](mcp/benefits-knowledge/data/plans.json).
- **English-first.** Spanish prompts are wired but only lightly tested.

## Stack

Next.js 16 · React 19 · Tailwind 4 · Vercel WDK (`workflow`) · Vercel AI SDK (`ai`) · Model Context Protocol (`@modelcontextprotocol/sdk`, `@ai-sdk/mcp`) · Web Speech API.
