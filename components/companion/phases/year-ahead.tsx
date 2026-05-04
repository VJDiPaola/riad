"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, BookOpen, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCompanion } from "@/components/companion/companion-context"
import { PLANS, SCENARIOS } from "@/lib/companion/sample-data"
import { getActiveEvents, projectPlan, formatUSD } from "@/lib/companion/year-ahead-utils"
import { ScenarioControls } from "@/components/companion/year-ahead/scenario-controls"
import { TimelineGrid } from "@/components/companion/year-ahead/timeline-grid"
import { MonthDetail } from "@/components/companion/year-ahead/month-detail"
import { PlanSummaryCard } from "@/components/companion/year-ahead/plan-summary-card"
import type { ScenarioInjection } from "@/lib/companion/types"

function scenarioToInjection(scenarioId: string | null): ScenarioInjection | undefined {
  if (!scenarioId) return undefined
  const sc = SCENARIOS.find((s) => s.id === scenarioId)
  if (!sc) return undefined
  return {
    id: sc.id,
    label: sc.label,
    adds: sc.events,
  }
}

export function YearAheadPhase() {
  const {
    profile,
    activeScenarioId,
    setActiveScenarioId,
    selectedPlanId,
    setSelectedPlanId,
    pushTranscript,
    setStatus,
    setPhase,
    sessionId,
    advance,
    yearAhead,
  } = useCompanion()
  const lastRequestedScenarioRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (!sessionId) return
    if (lastRequestedScenarioRef.current === activeScenarioId) return
    lastRequestedScenarioRef.current = activeScenarioId
    advance(sessionId, {
      step: "projectYearAhead",
      input: { scenario: scenarioToInjection(activeScenarioId) },
    }).catch((err) => console.warn("[year-ahead] projectYearAhead failed:", err))
  }, [sessionId, activeScenarioId, advance])

  const [focusedMonth, setFocusedMonth] = useState<number>(7)
  const events = useMemo(() => getActiveEvents(activeScenarioId), [activeScenarioId])
  const ppo = useMemo(() => projectPlan(PLANS[0], events), [events])
  const hdhp = useMemo(() => projectPlan(PLANS[1], events), [events])

  function handleScenarioChange(id: string | null) {
    setActiveScenarioId(id)
    if (!id) {
      pushTranscript("riad", "Back to your base year. Nothing was lost — your priorities are still pinned.")
      return
    }
    const newPpo = projectPlan(PLANS[0], getActiveEvents(id))
    const newHdhp = projectPlan(PLANS[1], getActiveEvents(id))
    const diff = newHdhp.totalAnnual - newPpo.totalAnnual
    const cheaperName = diff > 0 ? "Argan PPO" : diff < 0 ? "Atlas HDHP" : "neither plan in particular"
    pushTranscript(
      "riad",
      `In this version of the year, ${cheaperName} comes out ahead by ${formatUSD(Math.abs(diff))} across the twelve months.`,
    )
    setStatus("speaking")
    setTimeout(() => setStatus("ambient"), 1400)
  }

  function handleSelect(planId: string) {
    setSelectedPlanId(planId)
    const plan = PLANS.find((p) => p.id === planId)
    if (!plan) return
    pushTranscript("you", `I'm leaning toward ${plan.name}.`)
    pushTranscript(
      "riad",
      `Noted — ${plan.name}. I'll carry that into the decision step. You can change your mind any time.`,
    )
  }

  function handleNarrate(planId: string) {
    const plan = PLANS.find((p) => p.id === planId)
    if (!plan) return
    const proj = planId === ppo.plan.id ? ppo : hdhp
    pushTranscript(
      "riad",
      `Here's how ${plan.name} plays out for you. Each paycheck, ${formatUSD(proj.paycheckBiweekly)} comes out for premiums and expected care. Across the year, you're looking at about ${formatUSD(proj.totalAnnual)} all-in. The heaviest month is ${proj.months[proj.worstMonthIndex].monthLabel} at ${formatUSD(proj.worstMonthAmount)}.`,
    )
    setStatus("speaking")
    setTimeout(() => setStatus("ambient"), 2400)
  }

  const annualDelta = hdhp.totalAnnual - ppo.totalAnnual
  const cheaperLabel = annualDelta > 0 ? "Argan PPO" : annualDelta < 0 ? "Atlas HDHP" : "It's a tie"

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Phase 02</p>
          <h2 className="font-serif text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
            Your year ahead
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Two plans, twelve months, your real life. Hover any month to see what happens in both. Use scenario rewind to ask <em>what if</em> — your priorities and decision journal stay intact.
          </p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Across the full year</p>
          <p className="mt-1 font-serif text-lg text-foreground">
            {cheaperLabel} {annualDelta !== 0 ? `is ${formatUSD(Math.abs(annualDelta))} less` : ""}
          </p>
          <p className="text-[11px] text-muted-foreground">premiums + expected care, before any rewards</p>
        </div>
      </header>

      <ScenarioControls activeScenarioId={activeScenarioId} onChange={handleScenarioChange} />

      {yearAhead ? (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
            <div className="flex-1">
              <h4 className="font-serif text-base text-foreground">From the agent + benefits MCP</h4>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{yearAhead.narration}</p>
              {yearAhead.citations?.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {yearAhead.citations.slice(0, 4).map((c, idx) => (
                    <li
                      key={`${c.source}-${idx}`}
                      className="rounded-full border border-accent/40 bg-accent/5 px-3 py-1 text-[11px] text-foreground"
                      title={c.snippet}
                    >
                      <span className="font-medium">{c.source}</span>
                      <span className="ml-1 text-muted-foreground">— {c.snippet.slice(0, 80)}{c.snippet.length > 80 ? "…" : ""}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <TimelineGrid ppoProjection={ppo} hdhpProjection={hdhp} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <MonthDetail monthIndex={focusedMonth} ppo={ppo} hdhp={hdhp} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ppo.months.map((m) => (
              <button
                key={m.monthIndex}
                type="button"
                onClick={() => setFocusedMonth(m.monthIndex)}
                className={
                  m.monthIndex === focusedMonth
                    ? "rounded-md border border-primary bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                    : "rounded-md border bg-card px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                }
              >
                {m.monthLabel}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:col-span-2 lg:grid-cols-2">
          <PlanSummaryCard
            projection={ppo}
            selected={selectedPlanId === ppo.plan.id}
            onSelect={() => handleSelect(ppo.plan.id)}
            onNarrate={() => handleNarrate(ppo.plan.id)}
            accent="primary"
          />
          <PlanSummaryCard
            projection={hdhp}
            selected={selectedPlanId === hdhp.plan.id}
            onSelect={() => handleSelect(hdhp.plan.id)}
            onNarrate={() => handleNarrate(hdhp.plan.id)}
            accent="accent"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 text-accent" aria-hidden />
          <div className="flex-1">
            <h4 className="font-serif text-base text-foreground">Your priorities, still in view</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Idris is keeping these next to every comparison so you don&apos;t drift.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {(profile.priorities ?? []).length === 0 ? (
                <li className="text-xs text-muted-foreground">
                  No priorities yet — head back to the Life Interview to capture them in your own voice.
                </li>
              ) : (
                profile.priorities!.map((p) => (
                  <li
                    key={p}
                    className="rounded-full border border-accent/40 bg-accent/5 px-3 py-1 text-xs text-foreground"
                  >
                    {p}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => setPhase("decision")}
          className="gap-2 bg-foreground text-background hover:bg-foreground/90"
        >
          Continue to the decision step
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
