"use client"

import { useMemo, useState } from "react"
import { Calendar, AlertTriangle, Sparkles, Bell, Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PlanProjection } from "@/lib/companion/year-ahead-utils"
import { formatUSD } from "@/lib/companion/year-ahead-utils"
import type { YearEvent } from "@/lib/companion/types"

interface Props {
  ppoProjection: PlanProjection
  hdhpProjection: PlanProjection
}

const CATEGORY_META: Record<
  YearEvent["category"],
  { icon: typeof Calendar; tone: string; label: string }
> = {
  premium: { icon: Calendar, tone: "text-muted-foreground", label: "Premium" },
  expected: { icon: Stethoscope, tone: "text-foreground", label: "Expected" },
  possible: { icon: AlertTriangle, tone: "text-primary", label: "Possible" },
  deadline: { icon: Bell, tone: "text-accent", label: "Deadline" },
  milestone: { icon: Sparkles, tone: "text-primary", label: "Milestone" },
}

export function TimelineGrid({ ppoProjection, hdhpProjection }: Props) {
  const [hoverMonth, setHoverMonth] = useState<number | null>(null)

  const maxMonthly = useMemo(() => {
    let max = 0
    for (const m of ppoProjection.months) max = Math.max(max, m.premium + m.costThisMonth)
    for (const m of hdhpProjection.months) max = Math.max(max, m.premium + m.costThisMonth)
    return Math.max(max, 1)
  }, [ppoProjection, hdhpProjection])

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b px-5 py-4">
        <div>
          <h4 className="font-serif text-lg text-foreground">Your year ahead, month by month</h4>
          <p className="text-xs text-muted-foreground">
            Hover or focus a month to compare both plans side by side.
          </p>
        </div>
        <Legend />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px] px-5 py-5">
          {/* Month headers */}
          <div className="grid grid-cols-[120px_repeat(12,minmax(0,1fr))] items-end gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Month</span>
            {ppoProjection.months.map((m) => (
              <button
                key={m.monthIndex}
                type="button"
                onMouseEnter={() => setHoverMonth(m.monthIndex)}
                onMouseLeave={() => setHoverMonth(null)}
                onFocus={() => setHoverMonth(m.monthIndex)}
                onBlur={() => setHoverMonth(null)}
                className={cn(
                  "rounded-md px-1 py-1 text-center text-xs transition-colors",
                  hoverMonth === m.monthIndex
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m.monthLabel}
              </button>
            ))}
          </div>

          <PlanLane
            label="Argan PPO"
            sublabel="terracotta lane"
            color="var(--primary)"
            projection={ppoProjection}
            maxMonthly={maxMonthly}
            hoverMonth={hoverMonth}
            setHoverMonth={setHoverMonth}
          />

          <PlanLane
            label="Atlas HDHP + HSA"
            sublabel="indigo lane"
            color="var(--accent)"
            projection={hdhpProjection}
            maxMonthly={maxMonthly}
            hoverMonth={hoverMonth}
            setHoverMonth={setHoverMonth}
          />

          {/* Cumulative ribbon */}
          <div className="mt-6 grid grid-cols-[120px_repeat(12,minmax(0,1fr))] items-center gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Running total
            </span>
            {ppoProjection.months.map((m, i) => {
              const ppo = m.cumulative
              const hdhp = hdhpProjection.months[i].cumulative
              const cheaper = ppo < hdhp ? "primary" : ppo > hdhp ? "accent" : null
              const diff = Math.abs(ppo - hdhp)
              return (
                <div
                  key={m.monthIndex}
                  className={cn(
                    "flex flex-col items-center rounded-md border px-1 py-1.5 text-[10px] leading-tight",
                    hoverMonth === m.monthIndex ? "bg-secondary" : "bg-card",
                  )}
                  title={`PPO ${formatUSD(ppo)} • HDHP ${formatUSD(hdhp)}`}
                >
                  <span style={{ color: "var(--primary)" }}>{formatUSD(ppo)}</span>
                  <span style={{ color: "var(--accent)" }}>{formatUSD(hdhp)}</span>
                  {cheaper ? (
                    <span
                      className="mt-0.5 rounded-full px-1.5 py-px text-[9px]"
                      style={{
                        background:
                          cheaper === "primary"
                            ? "color-mix(in oklch, var(--primary) 15%, transparent)"
                            : "color-mix(in oklch, var(--accent) 15%, transparent)",
                        color: cheaper === "primary" ? "var(--primary)" : "var(--accent)",
                      }}
                    >
                      {cheaper === "primary" ? "PPO" : "HDHP"} −{formatUSD(diff)}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

interface PlanLaneProps {
  label: string
  sublabel: string
  color: string
  projection: PlanProjection
  maxMonthly: number
  hoverMonth: number | null
  setHoverMonth: (n: number | null) => void
}

function PlanLane({ label, color, projection, maxMonthly, hoverMonth, setHoverMonth }: PlanLaneProps) {
  return (
    <div className="mt-5 grid grid-cols-[120px_repeat(12,minmax(0,1fr))] items-stretch gap-1">
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="mt-0.5 text-[11px] text-muted-foreground">monthly all-in</span>
      </div>
      {projection.months.map((m) => {
        const monthTotal = m.premium + m.costThisMonth
        const heightPct = Math.max(8, Math.round((monthTotal / maxMonthly) * 100))
        const focused = hoverMonth === m.monthIndex
        return (
          <button
            key={m.monthIndex}
            type="button"
            onMouseEnter={() => setHoverMonth(m.monthIndex)}
            onMouseLeave={() => setHoverMonth(null)}
            onFocus={() => setHoverMonth(m.monthIndex)}
            onBlur={() => setHoverMonth(null)}
            className={cn(
              "relative flex h-28 flex-col items-stretch justify-end rounded-md border px-1 pb-1 pt-1 text-left transition-colors",
              focused ? "border-foreground/30 bg-secondary" : "border-border bg-card",
            )}
            aria-label={`${m.monthLabel}: ${formatUSD(monthTotal)} for ${label}. ${m.events.length} events.`}
          >
            <div className="flex flex-1 items-end">
              <div
                className="w-full rounded-sm transition-[height]"
                style={{
                  height: `${heightPct}%`,
                  background: `linear-gradient(to top, ${color}, color-mix(in oklch, ${color} 60%, transparent))`,
                  opacity: focused ? 1 : 0.85,
                }}
                aria-hidden
              />
            </div>

            <div className="mt-1 flex flex-wrap gap-0.5">
              {m.events.slice(0, 2).map((e) => {
                const Meta = CATEGORY_META[e.category]
                const Icon = Meta.icon
                return (
                  <span
                    key={e.id}
                    title={e.label}
                    className={cn("inline-flex items-center", Meta.tone)}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                )
              })}
              {m.events.length > 2 ? (
                <span className="text-[9px] text-muted-foreground">+{m.events.length - 2}</span>
              ) : null}
            </div>

            <span className="mt-0.5 text-[10px] font-medium text-foreground">
              {formatUSD(monthTotal)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
      {(Object.keys(CATEGORY_META) as YearEvent["category"][])
        .filter((k) => k !== "premium")
        .map((k) => {
          const M = CATEGORY_META[k]
          const Icon = M.icon
          return (
            <span key={k} className="inline-flex items-center gap-1">
              <Icon className={cn("h-3 w-3", M.tone)} />
              {M.label}
            </span>
          )
        })}
    </div>
  )
}
