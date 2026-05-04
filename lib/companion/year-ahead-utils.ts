import type { Plan, ScenarioOverride, YearEvent } from "./types"
import { BASE_EVENTS, PLAN_MONTHS, SCENARIOS } from "./sample-data"

export interface MonthSlice {
  monthIndex: number
  monthLabel: string
  events: YearEvent[]
  premium: number // monthly employee premium share
  costThisMonth: number // event-driven costs for this plan in this month
  cumulative: number // running total including premiums + events
}

export interface PlanProjection {
  plan: Plan
  months: MonthSlice[]
  totalAnnual: number
  totalPremium: number
  totalEventCost: number
  worstMonthIndex: number
  worstMonthAmount: number
  paycheckBiweekly: number
}

export function getActiveEvents(scenarioId: string | null): YearEvent[] {
  if (!scenarioId) return BASE_EVENTS
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)
  if (!scenario) return BASE_EVENTS
  // Override matching ids, then append any new events.
  const overrideIds = new Set(scenario.events.map((e) => e.id))
  const merged: YearEvent[] = [
    ...BASE_EVENTS.filter((e) => !overrideIds.has(e.id)),
    ...scenario.events,
  ]
  return merged
}

export function projectPlan(plan: Plan, events: YearEvent[]): PlanProjection {
  const months: MonthSlice[] = PLAN_MONTHS.map((label, idx) => {
    const monthEvents = events.filter((e) => e.monthIndex === idx)
    const eventCost = monthEvents.reduce((sum, e) => {
      return sum + (e.estCostByPlan?.[plan.id] ?? 0)
    }, 0)
    return {
      monthIndex: idx,
      monthLabel: label,
      events: monthEvents,
      premium: plan.monthlyPremium,
      costThisMonth: eventCost,
      cumulative: 0,
    }
  })

  let running = 0
  let worstIdx = 0
  let worstAmount = 0
  for (const m of months) {
    const monthTotal = m.premium + m.costThisMonth
    running += monthTotal
    m.cumulative = running
    if (monthTotal > worstAmount) {
      worstAmount = monthTotal
      worstIdx = m.monthIndex
    }
  }

  const totalPremium = plan.monthlyPremium * 12
  const totalEventCost = months.reduce((sum, m) => sum + m.costThisMonth, 0)
  const totalAnnual = totalPremium + totalEventCost
  const paycheckBiweekly = Math.round(((totalAnnual / 26) + Number.EPSILON) * 100) / 100

  return {
    plan,
    months,
    totalAnnual,
    totalPremium,
    totalEventCost,
    worstMonthIndex: worstIdx,
    worstMonthAmount: worstAmount,
    paycheckBiweekly,
  }
}

export function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatUSDDecimal(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n)
}
