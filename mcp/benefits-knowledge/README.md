# benefits-knowledge MCP server

Custom Model Context Protocol server that exposes Riad's benefits-knowledge as cited tools.

## Tools

- `get_plan({ planId })` — plan summary + citation snippet.
- `compare_plans({ planIds[], scenario? })` — side-by-side comparison rows + citations.
- `project_year({ profile, planId, scenario? })` — 12-month projection, narration, citations.
- `find_in_network_provider({ specialty, zip })` — small static provider list.

## Run

```bash
pnpm mcp           # default: http://localhost:8787/mcp
```

Or run with the Next dev server in parallel:

```bash
pnpm dev:all
```

## Data

Seed plans live in `data/plans.json`; citation snippets live in `data/citations.json`.
Both files are reused by the projection math in `lib/companion/projection.ts` so the MCP and the UI agree on every number.
