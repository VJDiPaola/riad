"use client"

import { Calendar } from "lucide-react"
import type { PlanProjection } from "@/lib/companion/year-ahead-utils"
import { formatUSD } from "@/lib/companion/year-ahead-utils"

interface Props {
  monthIndex: number
  ppo: PlanProjection
  hdhp: PlanProjection
}

export function MonthDetail({ monthIndex, ppo, hdhp }: Props) {
  const ppoMonth = ppo.months[monthIndex]
  const hdhpMonth = hdhp.months[monthIndex]
  const events = ppoMonth.events.length >= hdhpMonth.events.length ? ppoMonth.events : hdhpMonth.events

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">Month detail</span>
      </div>
      <h4 className="mt-2 font-serif text-2xl text-foreground">{ppoMonth.monthLabel}</h4>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs uppercase tracking-wide" style={{ color: "var(--primary)" }}>
            Argan PPO
          </p>
          <p className="mt-1 font-serif text-lg text-foreground">
            {formatUSD(ppoMonth.premium + ppoMonth.costThisMonth)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {formatUSD(ppoMonth.premium)} premium + {formatUSD(ppoMonth.costThisMonth)} care
          </p>
        </div>
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
          <p className="text-xs uppercase tracking-wide" style={{ color: "var(--accent)" }}>
            Atlas HDHP
          </p>
          <p className="mt-1 font-serif text-lg text-foreground">
            {formatUSD(hdhpMonth.premium + hdhpMonth.costThisMonth)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {formatUSD(hdhpMonth.premium)} premium + {formatUSD(hdhpMonth.costThisMonth)} care
          </p>
        </div>
      </div>

      {events.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {events.map((e) => (
            <li key={e.id} className="rounded-md border bg-secondary/30 p-3">
              <p className="text-sm text-foreground">{e.label}</p>
              {e.note ? (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{e.note}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No expected events this month — just the steady premium deduction.
        </p>
      )}
    </div>
  )
}
