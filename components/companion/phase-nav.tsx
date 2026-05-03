"use client"

import { useCompanion } from "./companion-context"
import { cn } from "@/lib/utils"
import type { Phase } from "@/lib/companion/types"
import { Mic, CalendarRange, ScrollText, CheckCircle2 } from "lucide-react"

const STEPS: { id: Phase; label: string; sub: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "interview", label: "Life interview", sub: "Speak in your own words", icon: Mic },
  { id: "year-ahead", label: "Year-Ahead", sub: "Rehearse twelve months", icon: CalendarRange },
  { id: "decision", label: "Decision", sub: "Regret check & journal", icon: ScrollText },
  { id: "plan-year", label: "Plan year", sub: "Living check-ins", icon: CheckCircle2 },
]

export function PhaseNav() {
  const { phase, setPhase } = useCompanion()
  return (
    <nav aria-label="Companion stages">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const active = s.id === phase
          const passed = STEPS.findIndex((x) => x.id === phase) > i
          return (
            <li key={s.id} className="flex-1 min-w-[150px]">
              <button
                type="button"
                onClick={() => setPhase(s.id)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : passed
                      ? "border-border bg-card hover:bg-secondary/50"
                      : "border-dashed border-border bg-card/40 hover:bg-secondary/40"
                )}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                    active && "bg-primary text-primary-foreground",
                    !active && passed && "bg-brass/25 text-foreground",
                    !active && !passed && "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex flex-col">
                  <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Stage {i + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground leading-tight">{s.label}</span>
                  <span className="text-[11px] text-muted-foreground">{s.sub}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
