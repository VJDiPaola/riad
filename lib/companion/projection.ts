import type {
  ComparisonRow,
  EmployeeProfile,
  MonthProjection,
  Plan,
  PlanSummary,
  ScenarioInjection,
  YearEvent,
} from "./types"

export const PLAN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

export type AnyPlan = Plan | PlanSummary

export interface ProjectionInput {
  plan: AnyPlan
  baseEvents: YearEvent[]
  scenario?: ScenarioInjection
  profile?: EmployeeProfile
}

export function applyScenario(baseEvents: YearEvent[], scenario?: ScenarioInjection): YearEvent[] {
  if (!scenario) return baseEvents
  const shiftMap = new Map((scenario.shifts ?? []).map((s) => [s.eventId, s.toMonthIndex]))
  const shifted = baseEvents.map((ev) => {
    const newIndex = shiftMap.get(ev.id)
    return newIndex === undefined ? ev : { ...ev, monthIndex: newIndex }
  })
  return [...shifted, ...(scenario.adds ?? [])]
}

export function projectMonths(input: ProjectionInput): MonthProjection[] {
  const events = applyScenario(input.baseEvents, input.scenario)
  const monthly = PLAN_MONTHS.map((label, idx) => {
    const monthEvents = events.filter((e) => e.monthIndex === idx)
    const expectedOOP = monthEvents.reduce(
      (sum, e) => sum + (e.estCostByPlan?.[input.plan.id] ?? 0),
      0,
    )
    const hsaFsaFlow =
      "hsaContribution" in input.plan && input.plan.hsaContribution
        ? Math.round(input.plan.hsaContribution / 12)
        : 0
    return {
      monthIndex: idx,
      monthLabel: label,
      premium: input.plan.monthlyPremium,
      expectedOOP,
      hsaFsaFlow,
      events: monthEvents,
      cumulative: 0,
    }
  })

  let running = 0
  for (const m of monthly) {
    running += m.premium + m.expectedOOP
    m.cumulative = running
  }
  return monthly
}

export function summarizeRow(plan: Plan | PlanSummary, months: MonthProjection[]): ComparisonRow {
  const totalAnnual = months.reduce((sum, m) => sum + m.premium + m.expectedOOP, 0)
  let worstMonthIndex = 0
  let worstMonthAmount = 0
  for (const m of months) {
    const t = m.premium + m.expectedOOP
    if (t > worstMonthAmount) {
      worstMonthAmount = t
      worstMonthIndex = m.monthIndex
    }
  }
  const paycheckBiweekly = Math.round(((totalAnnual / 26) + Number.EPSILON) * 100) / 100
  const highlights: string[] = []
  if (plan.kind === "PPO") {
    highlights.push("Predictable copays for routine care.")
  } else {
    highlights.push("Lower premiums; HSA-eligible tax shelter.")
  }
  if (worstMonthAmount > plan.deductible) {
    highlights.push(`Heaviest month: ${PLAN_MONTHS[worstMonthIndex]} at about $${Math.round(worstMonthAmount)}.`)
  }
  return {
    planId: plan.id,
    planName: plan.name,
    totalAnnual: Math.round(totalAnnual),
    worstMonth: { monthIndex: worstMonthIndex, amount: Math.round(worstMonthAmount) },
    paycheckBiweekly,
    highlights,
  }
}

export function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}
