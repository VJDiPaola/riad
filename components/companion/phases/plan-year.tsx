"use client"

import { useCompanion } from "../companion-context"
import { CheckCircle2 } from "lucide-react"

export function PlanYearPhase() {
  const { language } = useCompanion()
  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          {language === "es" ? "Etapa cuatro · Año del plan" : "Stage four · Plan year"}
        </p>
        <h2 className="font-serif text-3xl leading-tight tracking-tight text-foreground text-balance md:text-4xl">
          {language === "es" ? "Coming up next." : "Coming up next."}
        </h2>
      </header>
    </section>
  )
}
