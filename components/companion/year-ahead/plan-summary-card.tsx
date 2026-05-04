"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PlanProjection } from "@/lib/companion/year-ahead-utils"
import { formatUSD, formatUSDDecimal } from "@/lib/companion/year-ahead-utils"

interface Props {
  projection: PlanProjection
  selected: boolean
  onSelect: () => void
  onNarrate: () => void
  accent: "primary" | "accent" // primary = terracotta PPO; accent = blue HDHP
}

export function PlanSummaryCard({ projection, selected, onSelect, onNarrate, accent }: Props) {
  const { plan, totalAnnual, totalPremium, totalEventCost, paycheckBiweekly, worstMonthIndex, worstMonthAmount, months } = projection
  const accentColor = accent === "primary" ? "var(--primary)" : "var(--accent)"
  const worstLabel = months[worstMonthIndex]?.monthLabel

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 transition-shadow",
        selected ? "shadow-md ring-2" : "hover:shadow-sm",
      )}
      style={selected ? { boxShadow: `0 0 0 2px ${accentColor}` } : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: accentColor }}
              aria-hidden
            />
            <h3 className="font-serif text-xl tracking-tight text-foreground">{plan.name}</h3>
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{plan.kind}</p>
        </div>
        <span
          className="rounded-full border px-2.5 py-0.5 text-xs"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          {plan.badge}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.blurb}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border bg-secondary/40 p-3">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Per paycheck</dt>
          <dd className="mt-1 font-serif text-lg text-foreground">{formatUSDDecimal(paycheckBiweekly)}</dd>
          <p className="mt-1 text-[11px] text-muted-foreground">biweekly, all-in</p>
        </div>
        <div className="rounded-lg border bg-secondary/40 p-3">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Year total</dt>
          <dd className="mt-1 font-serif text-lg text-foreground">{formatUSD(totalAnnual)}</dd>
          <p className="mt-1 text-[11px] text-muted-foreground">premiums + expected care</p>
        </div>
        <div className="rounded-lg border bg-secondary/40 p-3">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Annual premium</dt>
          <dd className="mt-1 text-base text-foreground">{formatUSD(totalPremium)}</dd>
        </div>
        <div className="rounded-lg border bg-secondary/40 p-3">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Care costs</dt>
          <dd className="mt-1 text-base text-foreground">{formatUSD(totalEventCost)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <span>Deductible: <span className="text-foreground">{formatUSD(plan.deductible)}</span></span>
        <span>Out-of-pocket max: <span className="text-foreground">{formatUSD(plan.oopMax)}</span></span>
        {plan.hsaContribution ? (
          <span>HSA from employer: <span className="text-foreground">{formatUSD(plan.hsaContribution)}</span></span>
        ) : null}
      </div>

      <p className="mt-4 rounded-md border-l-2 bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground" style={{ borderColor: accentColor }}>
        Worst single month under this scenario lands in <span className="text-foreground">{worstLabel}</span>{" "}
        at <span className="text-foreground">{formatUSD(worstMonthAmount)}</span>.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          onClick={onSelect}
          className={cn("gap-2", selected ? "" : "bg-foreground text-background hover:bg-foreground/90")}
          style={selected ? { background: accentColor, color: "white" } : undefined}
        >
          {selected ? (
            <>
              <Check className="h-4 w-4" /> Leaning toward this
            </>
          ) : (
            <>Lean toward this plan</>
          )}
        </Button>
        <Button variant="ghost" onClick={onNarrate} className="text-foreground">
          Have Idris narrate this plan
        </Button>
      </div>
    </div>
  )
}
