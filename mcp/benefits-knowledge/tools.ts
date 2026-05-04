import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import {
  applyScenario,
  projectMonths,
  summarizeRow,
} from "../../lib/companion/projection"
import type {
  Citation,
  ComparisonRow,
  EmployeeProfile,
  MonthProjection,
  PlanSummary,
  ProviderSummary,
  ScenarioInjection,
  YearEvent,
} from "../../lib/companion/types"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const plansPath = path.join(__dirname, "data", "plans.json")
const citationsPath = path.join(__dirname, "data", "citations.json")

interface PlansFile {
  plans: PlanSummary[]
  baseEvents: YearEvent[]
}

interface CitationsFile {
  [planId: string]: { [section: string]: Citation }
}

const plansData: PlansFile = JSON.parse(readFileSync(plansPath, "utf-8"))
const citationsData: CitationsFile = JSON.parse(readFileSync(citationsPath, "utf-8"))

export function listPlans(): PlanSummary[] {
  return plansData.plans
}

export function getPlanById(planId: string): PlanSummary | undefined {
  return plansData.plans.find((p) => p.id === planId)
}

export function getBaseEvents(): YearEvent[] {
  return plansData.baseEvents
}

export function getPlanCitation(planId: string, section: "summary" | "preventive" | "ob" = "summary"): Citation {
  const c = citationsData[planId]?.[section]
  if (!c) {
    return {
      source: `${planId} plan summary`,
      snippet: "Plan summary information.",
      toolCall: "get_plan",
    }
  }
  return { ...c, toolCall: "get_plan" }
}

export function getScenarioCitation(scenarioId: string): Citation | undefined {
  const c = citationsData.scenario?.[scenarioId]
  if (!c) return undefined
  return { ...c, toolCall: "compare_plans" }
}

const STATIC_PROVIDERS: ProviderSummary[] = [
  { name: "Sycamore Family Health", specialty: "primary-care", zip: "10003", inNetwork: true, distanceMiles: 0.8 },
  { name: "Hudson OB-GYN Associates", specialty: "ob-gyn", zip: "10003", inNetwork: true, distanceMiles: 1.2 },
  { name: "Riverside Pediatrics", specialty: "pediatrics", zip: "10025", inNetwork: true, distanceMiles: 2.1 },
  { name: "Manhattan Mind Clinic", specialty: "mental-health", zip: "10010", inNetwork: false, distanceMiles: 3.4 },
  { name: "Bright Smile Dental", specialty: "dental", zip: "10003", inNetwork: true, distanceMiles: 0.4 },
]

export function findProviders(specialty: string, zip: string): ProviderSummary[] {
  const normalized = specialty.toLowerCase().replace(/[\s_]+/g, "-")
  return STATIC_PROVIDERS.filter(
    (p) => p.specialty === normalized || p.specialty.includes(normalized) || normalized.includes(p.specialty),
  ).slice(0, 4).map((p) => ({ ...p, zip }))
}

export interface GetPlanResult {
  plan: PlanSummary
  citation: Citation
}

export function toolGetPlan(input: { planId: string }): GetPlanResult {
  const plan = getPlanById(input.planId)
  if (!plan) throw new Error(`Plan not found: ${input.planId}`)
  return { plan, citation: getPlanCitation(plan.id, "summary") }
}

export interface ComparePlansResult {
  rows: ComparisonRow[]
  citations: Citation[]
}

export function toolComparePlans(input: { planIds: string[]; scenario?: ScenarioInjection }): ComparePlansResult {
  const events = applyScenario(getBaseEvents(), input.scenario)
  const rows: ComparisonRow[] = []
  const citations: Citation[] = []
  for (const planId of input.planIds) {
    const plan = getPlanById(planId)
    if (!plan) continue
    const months = projectMonths({ plan, baseEvents: events })
    rows.push(summarizeRow(plan, months))
    citations.push(getPlanCitation(plan.id, "summary"))
  }
  if (input.scenario) {
    const sc = getScenarioCitation(input.scenario.id)
    if (sc) citations.push(sc)
  }
  return { rows, citations }
}

export interface ProjectYearResult {
  months: MonthProjection[]
  narration: string
  citations: Citation[]
}

export function toolProjectYear(input: {
  profile: EmployeeProfile
  planId: string
  scenario?: ScenarioInjection
}): ProjectYearResult {
  const plan = getPlanById(input.planId)
  if (!plan) throw new Error(`Plan not found: ${input.planId}`)
  const months = projectMonths({
    plan,
    baseEvents: getBaseEvents(),
    scenario: input.scenario,
    profile: input.profile,
  })
  const row = summarizeRow(plan, months)
  const citations: Citation[] = [getPlanCitation(plan.id, "summary")]
  if (input.scenario) {
    const sc = getScenarioCitation(input.scenario.id)
    if (sc) citations.push(sc)
  }
  if (input.profile.expectedEvents?.some((e) => /baby|prenat|pregnan/i.test(e))) {
    citations.push(getPlanCitation(plan.id, "ob"))
  }
  const narration = composeNarration(plan, row, months, input.scenario)
  return { months, narration, citations }
}

function composeNarration(
  plan: PlanSummary,
  row: ComparisonRow,
  months: MonthProjection[],
  scenario?: ScenarioInjection,
): string {
  const worst = months[row.worstMonth.monthIndex]
  const lead =
    plan.kind === "PPO"
      ? `${plan.name} keeps your monthly cost predictable.`
      : `${plan.name} starts cheaper but has a higher deductible — the HSA softens the swing.`
  const mid = `Across the year you'd see about $${row.totalAnnual.toLocaleString()} all-in, or ~$${row.paycheckBiweekly.toFixed(2)} per paycheck.`
  const peak = `The heaviest month is ${worst.monthLabel}, around $${(worst.premium + worst.expectedOOP).toLocaleString()}.`
  const tail = scenario
    ? `Under the "${scenario.label}" scenario, this is what your year looks like.`
    : `This is your default year, before any scenarios.`
  return `${lead} ${mid} ${peak} ${tail}`
}

export interface FindProviderResult {
  providers: ProviderSummary[]
}

export function toolFindProvider(input: { specialty: string; zip: string }): FindProviderResult {
  return { providers: findProviders(input.specialty, input.zip) }
}
