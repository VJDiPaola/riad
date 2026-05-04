"use client"

import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SCENARIOS } from "@/lib/companion/sample-data"
import { cn } from "@/lib/utils"

interface Props {
  activeScenarioId: string | null
  onChange: (id: string | null) => void
}

export function ScenarioControls({ activeScenarioId, onChange }: Props) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-serif text-base text-foreground">Scenario rewind</h4>
          <p className="text-xs text-muted-foreground">
            Try a different version of the year. The timeline updates without losing your place.
          </p>
        </div>
        {activeScenarioId ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => onChange(null)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Back to base year
          </Button>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {SCENARIOS.map((s) => {
          const active = activeScenarioId === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(active ? null : s.id)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/40 text-foreground hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
