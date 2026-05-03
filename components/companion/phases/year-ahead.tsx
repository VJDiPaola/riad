"use client"

import { useCompanion } from "../companion-context"
import { CalendarRange } from "lucide-react"

export function YearAheadPhase() {
  const { language } = useCompanion()
  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <CalendarRange className="h-3 w-3" />
          {language === "es" ? "Etapa dos · Año por Delante" : "Stage two · Year-Ahead"}
        </p>
        <h2 className="font-serif text-3xl leading-tight tracking-tight text-foreground text-balance md:text-4xl">
          {language === "es" ? "Coming up next." : "Coming up next."}
        </h2>
      </header>
    </section>
  )
}
