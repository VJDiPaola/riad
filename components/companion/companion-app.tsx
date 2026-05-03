"use client"

import Link from "next/link"
import { CompanionProvider, useCompanion } from "./companion-context"
import { CompanionPanel } from "./companion-panel"
import { PhaseNav } from "./phase-nav"
import { LifeInterviewPhase } from "./phases/life-interview"
import { YearAheadPhase } from "./phases/year-ahead"
import { DecisionPhase } from "./phases/decision"
import { PlanYearPhase } from "./phases/plan-year"
import { ArrowLeft } from "lucide-react"

export function CompanionApp() {
  return (
    <CompanionProvider>
      <CompanionLayout />
    </CompanionProvider>
  )
}

function CompanionLayout() {
  return (
    <main className="min-h-svh bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Riad</span>
          </Link>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Companion session · Demo
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 lg:py-10">
        {/* Stage */}
        <div className="flex flex-col gap-8">
          <PhaseNav />
          <ActivePhase />
        </div>

        {/* Persistent companion */}
        <CompanionPanel />
      </div>
    </main>
  )
}

function ActivePhase() {
  const { phase } = useCompanion()
  switch (phase) {
    case "interview":
      return <LifeInterviewPhase />
    case "year-ahead":
      return <YearAheadPhase />
    case "decision":
      return <DecisionPhase />
    case "plan-year":
      return <PlanYearPhase />
    default:
      return null
  }
}
