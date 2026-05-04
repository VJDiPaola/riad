import { generateObject, generateText, gateway } from "ai"
import { createMCPClient } from "@ai-sdk/mcp"
import { z } from "zod"
import type {
  Citation,
  ComparisonRow,
  EmployeeProfile,
  Language,
  MonthProjection,
  ScenarioInjection,
  ToolCallLog,
  YearAheadPayload,
} from "@/lib/companion/types"
import { SAMPLE_PROFILE } from "@/lib/companion/sample-data"
import {
  toolComparePlans,
  toolProjectYear,
} from "@/mcp/benefits-knowledge/tools"

const MCP_URL = process.env.BENEFITS_MCP_URL ?? "http://localhost:8787/mcp"
const HAS_GATEWAY = Boolean(process.env.AI_GATEWAY_API_KEY)
const MODEL_ID = (process.env.COMPANION_MODEL ?? "openai/gpt-4o-mini") as Parameters<typeof gateway>[0]

export interface IngestInterviewInput {
  transcript: string
  language: Language
}

export interface IngestInterviewOutput {
  profile: EmployeeProfile
  summary: string
}

export interface NarrateYearAheadInput {
  profile: EmployeeProfile
  planIds?: string[]
  scenario?: ScenarioInjection
}

export interface NarrateYearAheadOutput extends YearAheadPayload {
  toolCalls: ToolCallLog[]
}

const profileSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  coverageScope: z.enum(["self", "self+spouse", "self+kids", "family"]).optional(),
  hasSpouseCoverageElsewhere: z.boolean().optional(),
  recurringPrescription: z.boolean().optional(),
  expectedEvents: z.array(z.string()).default([]),
  priorities: z.array(z.string()).default([]),
  factors: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        value: z.string(),
        confidence: z.enum(["spoken", "confirmed", "inferred"]),
      }),
    )
    .default([]),
  summary: z.string(),
})

export async function ingestInterview(
  input: IngestInterviewInput,
): Promise<IngestInterviewOutput> {
  if (!HAS_GATEWAY || input.transcript.trim().length === 0) {
    return deterministicIngest(input)
  }
  try {
    const sys =
      input.language === "es"
        ? "Eres un asistente que extrae información estructurada de una entrevista de vida sobre beneficios. Devuelve JSON con campos en inglés. Sé breve."
        : "You extract structured profile facts from a benefits life-interview transcript. Be conservative — only include facts the user actually said. Use 'inferred' confidence only when reasonable."
    const { object } = await generateObject({
      model: gateway(MODEL_ID),
      schema: profileSchema,
      system: sys,
      prompt: `Transcript:\n${input.transcript}`,
    })
    const profile: EmployeeProfile = {
      name: object.name,
      location: object.location,
      coverageScope: object.coverageScope,
      hasSpouseCoverageElsewhere: object.hasSpouseCoverageElsewhere,
      recurringPrescription: object.recurringPrescription,
      expectedEvents: object.expectedEvents,
      priorities: object.priorities,
      language: input.language,
      factors: object.factors,
    }
    return { profile, summary: object.summary }
  } catch (err) {
    console.warn("[companion-agent] ingestInterview gateway error, falling back:", err)
    return deterministicIngest(input)
  }
}

function deterministicIngest(input: IngestInterviewInput): IngestInterviewOutput {
  const u = input.transcript.toLowerCase()
  const factors: EmployeeProfile["factors"] = []
  const expectedEvents: string[] = []
  const priorities: string[] = []
  if (/married|wife|husband|spouse|esposa|esposo/i.test(u)) {
    factors.push({ key: "marital", label: "Marital status", value: "Married", confidence: "spoken" })
  }
  if (/baby|pregnan|maternity|bebé|bebe|embarazada/i.test(u)) {
    factors.push({ key: "deps", label: "Dependents", value: "Expecting baby", confidence: "spoken" })
    expectedEvents.push("Baby due this year")
  }
  if (/kid|child|toddler|hija|hijo/i.test(u)) {
    factors.push({ key: "kids", label: "Children", value: "1+ child", confidence: "spoken" })
  }
  if (/prescription|medic|recet|pastil/i.test(u)) {
    factors.push({ key: "rx", label: "Prescriptions", value: "Daily medication", confidence: "spoken" })
    expectedEvents.push("Daily prescription refills")
  }
  if (/surprise|hate bills|predict|previsib|sin sorpresas/i.test(u)) {
    priorities.push("No surprise bills")
    factors.push({ key: "priority", label: "Top priority", value: "No surprise bills", confidence: "spoken" })
  }
  if (/keep .* doctor|same ob|mismo doctor/i.test(u)) {
    priorities.push("Keep current providers")
  }
  if (factors.length === 0) {
    return {
      profile: { ...SAMPLE_PROFILE, language: input.language },
      summary:
        input.language === "es"
          ? "Cargué un perfil de demostración para que podamos seguir."
          : "I loaded a demo profile so we can keep moving.",
    }
  }
  const summary =
    input.language === "es"
      ? `Te escuché. Esto es lo que tengo: ${factors.map((f) => f.value.toLowerCase()).join(", ")}.`
      : `Here's what I heard: ${factors.map((f) => f.value.toLowerCase()).join(", ")}.`
  return {
    profile: {
      language: input.language,
      factors,
      expectedEvents,
      priorities,
    },
    summary,
  }
}

export async function narrateYearAhead(
  input: NarrateYearAheadInput,
): Promise<NarrateYearAheadOutput> {
  const planIds = input.planIds ?? ["argan-ppo", "atlas-hdhp"]
  const toolCalls: ToolCallLog[] = []

  const { compareResult, projectionsByPlan, baseCitations } = await callMcpTools({
    profile: input.profile,
    planIds,
    scenario: input.scenario,
    onLog: (log) => toolCalls.push(log),
  })

  let narration = ""
  if (HAS_GATEWAY) {
    try {
      const summary = await generateText({
        model: gateway(MODEL_ID),
        system:
          "You are Riad, a calm voice-first benefits companion. Narrate the next 12 months in plain language, 3-5 sentences, grounded ONLY in the comparison rows and citations provided. Never invent numbers. Use the user's priorities verbatim. Speak directly to the employee.",
        prompt: buildNarrationPrompt({
          profile: input.profile,
          rows: compareResult.rows,
          scenario: input.scenario,
          citations: baseCitations,
        }),
      })
      narration = summary.text.trim()
    } catch (err) {
      console.warn("[companion-agent] narrateYearAhead gateway error, falling back:", err)
    }
  }
  if (!narration) {
    narration = composeFallbackNarration(compareResult.rows, input.scenario)
  }

  const months: Record<string, MonthProjection[]> = {}
  for (const planId of planIds) {
    months[planId] = projectionsByPlan[planId] ?? []
  }

  return {
    rows: compareResult.rows,
    months,
    narration,
    citations: baseCitations,
    toolCalls,
  }
}

interface CallMcpResult {
  compareResult: { rows: ComparisonRow[]; citations: Citation[] }
  projectionsByPlan: Record<string, MonthProjection[]>
  baseCitations: Citation[]
}

async function callMcpTools(args: {
  profile: EmployeeProfile
  planIds: string[]
  scenario?: ScenarioInjection
  onLog: (log: ToolCallLog) => void
}): Promise<CallMcpResult> {
  // Try the MCP HTTP transport first; if it fails (e.g. server not running), fall back
  // to calling the in-process tool implementations directly so the demo never breaks.
  try {
    const client = await createMCPClient({
      transport: { type: "http", url: MCP_URL },
    })
    try {
      const compare = await client.toolsFromDefinitions(await client.listTools())
      const compareTool = compare.compare_plans
      const projectTool = compare.project_year
      if (!compareTool?.execute || !projectTool?.execute) {
        throw new Error("required MCP tools missing")
      }
      const compareArgs = { planIds: args.planIds, scenario: args.scenario }
      const compareRaw = await compareTool.execute(compareArgs, {
        toolCallId: cryptoRandom(),
        messages: [],
      })
      const compareResult = unwrapToolResult(compareRaw) as {
        rows: ComparisonRow[]
        citations: Citation[]
      }
      args.onLog({
        id: cryptoRandom(),
        at: Date.now(),
        tool: "compare_plans",
        args: compareArgs,
        citation: compareResult.citations?.[0],
      })

      const projectionsByPlan: Record<string, MonthProjection[]> = {}
      const allCitations: Citation[] = [...(compareResult.citations ?? [])]
      for (const planId of args.planIds) {
        const projectArgs = { profile: args.profile, planId, scenario: args.scenario }
        const projectRaw = await projectTool.execute(projectArgs, {
          toolCallId: cryptoRandom(),
          messages: [],
        })
        const projectResult = unwrapToolResult(projectRaw) as {
          months: MonthProjection[]
          narration: string
          citations: Citation[]
        }
        projectionsByPlan[planId] = projectResult.months
        for (const c of projectResult.citations ?? []) allCitations.push(c)
        args.onLog({
          id: cryptoRandom(),
          at: Date.now(),
          tool: "project_year",
          args: { planId, scenario: args.scenario?.id },
          citation: projectResult.citations?.[0],
        })
      }
      return {
        compareResult,
        projectionsByPlan,
        baseCitations: dedupeCitations(allCitations),
      }
    } finally {
      await client.close()
    }
  } catch (err) {
    console.warn("[companion-agent] MCP HTTP call failed, using in-process tools:", err)
    const compareResult = toolComparePlans({ planIds: args.planIds, scenario: args.scenario })
    args.onLog({
      id: cryptoRandom(),
      at: Date.now(),
      tool: "compare_plans",
      args: { planIds: args.planIds, scenario: args.scenario },
      citation: compareResult.citations?.[0],
    })
    const projectionsByPlan: Record<string, MonthProjection[]> = {}
    const allCitations: Citation[] = [...compareResult.citations]
    for (const planId of args.planIds) {
      const projectResult = toolProjectYear({
        profile: args.profile,
        planId,
        scenario: args.scenario,
      })
      projectionsByPlan[planId] = projectResult.months
      for (const c of projectResult.citations) allCitations.push(c)
      args.onLog({
        id: cryptoRandom(),
        at: Date.now(),
        tool: "project_year",
        args: { planId, scenario: args.scenario?.id },
        citation: projectResult.citations[0],
      })
    }
    return {
      compareResult,
      projectionsByPlan,
      baseCitations: dedupeCitations(allCitations),
    }
  }
}

function unwrapToolResult(raw: unknown): unknown {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>
    if (obj.structuredContent) return obj.structuredContent
    if (Array.isArray(obj.content)) {
      const text = (obj.content as Array<{ type?: string; text?: string }>).find(
        (c) => c.type === "text" && typeof c.text === "string",
      )
      if (text?.text) {
        try {
          return JSON.parse(text.text)
        } catch {
          return text.text
        }
      }
    }
  }
  return raw
}

function dedupeCitations(list: Citation[]): Citation[] {
  const seen = new Set<string>()
  const out: Citation[] = []
  for (const c of list) {
    const key = `${c.source}|${c.snippet}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}

function buildNarrationPrompt(args: {
  profile: EmployeeProfile
  rows: ComparisonRow[]
  scenario?: ScenarioInjection
  citations: Citation[]
}): string {
  const priorityLine = (args.profile.priorities ?? []).join("; ") || "(no stated priorities yet)"
  const rowLines = args.rows
    .map(
      (r) =>
        `- ${r.planName}: ~$${r.totalAnnual} annual, ~$${r.paycheckBiweekly}/biweekly, worst month ${r.worstMonth.monthIndex} (~$${r.worstMonth.amount}). Highlights: ${r.highlights.join(" / ")}`,
    )
    .join("\n")
  const citationLines = args.citations
    .slice(0, 4)
    .map((c) => `- ${c.source}: "${c.snippet}"`)
    .join("\n")
  return `Employee priorities: ${priorityLine}
Scenario: ${args.scenario?.label ?? "default year"}

Plan rows:
${rowLines}

Citations available:
${citationLines}

Narrate this in 3-5 sentences. Speak directly to the employee. Reference their priorities. Do not invent numbers.`
}

function composeFallbackNarration(rows: ComparisonRow[], scenario?: ScenarioInjection): string {
  if (rows.length === 0) return "No plan data available."
  const sorted = [...rows].sort((a, b) => a.totalAnnual - b.totalAnnual)
  const cheaper = sorted[0]
  const expensive = sorted[sorted.length - 1]
  const delta = expensive.totalAnnual - cheaper.totalAnnual
  const scenarioPhrase = scenario ? `Under "${scenario.label}", ` : ""
  return `${scenarioPhrase}${cheaper.planName} comes out about $${delta.toLocaleString()} cheaper across the year (~$${cheaper.totalAnnual.toLocaleString()} all-in vs ~$${expensive.totalAnnual.toLocaleString()}). Heaviest single month is around $${cheaper.worstMonth.amount}. Predictability vs upside is the real call here.`
}

function cryptoRandom(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

export function composeCheckInBanner(args: {
  profile: EmployeeProfile
  rows: ComparisonRow[] | undefined
  selectedPlanId?: string
}): { banner: string; detail: string; metricLabel: string; metricValue: string } {
  const row =
    args.rows?.find((r) => r.planId === args.selectedPlanId) ?? args.rows?.[0]
  if (!row) {
    return {
      banner: "Welcome back — your first paycheck deduction landed today.",
      detail: "I'll keep an eye on real spend vs. our projection from here.",
      metricLabel: "Plan",
      metricValue: "Active",
    }
  }
  const paycheck = `$${row.paycheckBiweekly.toFixed(2)}`
  return {
    banner: `Your first paycheck deduction landed at ${paycheck} — matches projection.`,
    detail: `${row.planName}: about $${row.totalAnnual.toLocaleString()} all-in across the year, with the heaviest month around $${row.worstMonth.amount}. I'll nudge you if anything drifts.`,
    metricLabel: "Per paycheck",
    metricValue: paycheck,
  }
}
