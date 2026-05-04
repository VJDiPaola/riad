import http from "node:http"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { z } from "zod"
import {
  toolGetPlan,
  toolComparePlans,
  toolProjectYear,
  toolFindProvider,
  listPlans,
} from "./tools.js"

const PORT = Number(process.env.BENEFITS_MCP_PORT ?? 8787)

function buildServer(): McpServer {
  const server = new McpServer({
    name: "benefits-knowledge",
    version: "0.1.0",
  })

  server.registerTool(
    "get_plan",
    {
      description: "Look up a single plan summary with a citation snippet from its plan documents.",
      inputSchema: { planId: z.string() },
    },
    async ({ planId }) => {
      const result = toolGetPlan({ planId })
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result as unknown as Record<string, unknown>,
      }
    },
  )

  server.registerTool(
    "compare_plans",
    {
      description: "Compare two or more plans across the 12-month horizon, returning per-plan rows and citations.",
      inputSchema: {
        planIds: z.array(z.string()).min(1),
        scenario: z
          .object({
            id: z.string(),
            label: z.string(),
            shifts: z
              .array(z.object({ eventId: z.string(), toMonthIndex: z.number().int().min(0).max(11) }))
              .optional(),
            adds: z
              .array(
                z.object({
                  id: z.string(),
                  monthIndex: z.number().int().min(0).max(11),
                  label: z.string(),
                  category: z.enum(["premium", "expected", "possible", "deadline", "milestone"]),
                  estCostByPlan: z.record(z.string(), z.number()).optional(),
                  note: z.string().optional(),
                }),
              )
              .optional(),
          })
          .optional(),
      },
    },
    async ({ planIds, scenario }) => {
      const result = toolComparePlans({ planIds, scenario })
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result as unknown as Record<string, unknown>,
      }
    },
  )

  server.registerTool(
    "project_year",
    {
      description:
        "Project a 12-month cost timeline for one plan and one employee profile, returning monthly rows, narration, and citations.",
      inputSchema: {
        profile: z
          .object({
            name: z.string().optional(),
            location: z.string().optional(),
            coverageScope: z.enum(["self", "self+spouse", "self+kids", "family"]).optional(),
            hasSpouseCoverageElsewhere: z.boolean().optional(),
            recurringPrescription: z.boolean().optional(),
            expectedEvents: z.array(z.string()).optional(),
            priorities: z.array(z.string()).optional(),
            language: z.enum(["en", "es"]),
            factors: z.array(
              z.object({
                key: z.string(),
                label: z.string(),
                value: z.string(),
                confidence: z.enum(["spoken", "confirmed", "inferred"]),
              }),
            ),
          })
          .passthrough(),
        planId: z.string(),
        scenario: z
          .object({
            id: z.string(),
            label: z.string(),
            shifts: z
              .array(z.object({ eventId: z.string(), toMonthIndex: z.number().int().min(0).max(11) }))
              .optional(),
            adds: z.array(z.unknown()).optional(),
          })
          .optional(),
      },
    },
    async ({ profile, planId, scenario }) => {
      const result = toolProjectYear({
        profile: profile as Parameters<typeof toolProjectYear>[0]["profile"],
        planId,
        scenario: scenario as Parameters<typeof toolProjectYear>[0]["scenario"],
      })
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result as unknown as Record<string, unknown>,
      }
    },
  )

  server.registerTool(
    "find_in_network_provider",
    {
      description: "Look up a small list of in-network providers near the given ZIP for a given specialty.",
      inputSchema: {
        specialty: z.string(),
        zip: z.string(),
      },
    },
    async ({ specialty, zip }) => {
      const result = toolFindProvider({ specialty, zip })
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result as unknown as Record<string, unknown>,
      }
    },
  )

  return server
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const server = buildServer()
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await server.connect(transport)
  res.on("close", () => {
    void transport.close()
    void server.close()
  })

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(chunk as Buffer)
  }
  const body = chunks.length > 0 ? JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}") : undefined
  await transport.handleRequest(req, res, body)
}

const httpServer = http.createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ ok: true, plans: listPlans().map((p) => p.id) }))
    return
  }
  if (!req.url?.startsWith("/mcp")) {
    res.writeHead(404, { "content-type": "text/plain" })
    res.end("not found")
    return
  }
  handleRequest(req, res).catch((err) => {
    console.error("[benefits-mcp] request error:", err)
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "application/json" })
      res.end(JSON.stringify({ error: String(err) }))
    } else {
      res.end()
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`[benefits-mcp] streamable http server listening on http://localhost:${PORT}/mcp`)
  console.log(`[benefits-mcp] plans loaded: ${listPlans().map((p) => p.name).join(", ")}`)
})
