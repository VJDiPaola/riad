"use client"

import { useEffect, useMemo, useState } from "react"
import { useCompanion } from "../companion-context"
import {
  CheckCircle2,
  CalendarClock,
  Bell,
  HeartHandshake,
  TrendingUp,
  Sparkles,
  Radio,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PLANS, PLAN_MONTHS } from "@/lib/companion/sample-data"
import { getActiveEvents, projectPlan, formatUSD } from "@/lib/companion/year-ahead-utils"

type CheckIn = {
  id: string
  whenLabel: string
  title: string
  prompt: string
  modeHint: "ambient" | "co-pilot"
}

export function PlanYearPhase() {
  const {
    language,
    selectedPlanId,
    activeScenarioId,
    pushTranscript,
    setStatus,
    sessionId,
    advance,
    checkIn,
  } = useCompanion()
  const plan = PLANS.find((p) => p.id === selectedPlanId) ?? PLANS[0]
  const events = useMemo(() => getActiveEvents(activeScenarioId), [activeScenarioId])
  const cost = useMemo(() => projectPlan(plan, events), [plan, events])
  const [simulating, setSimulating] = useState(false)

  async function simulateCheckIn() {
    if (!sessionId) return
    setSimulating(true)
    try {
      await advance(sessionId, { step: "scheduledCheckIn", input: { simulate: true } })
    } catch (err) {
      console.warn("[plan-year] simulate check-in failed:", err)
    } finally {
      setSimulating(false)
    }
  }

  const checkIns: CheckIn[] = useMemo(
    () => [
      {
        id: "q1",
        whenLabel: language === "es" ? "Marzo · 90 días dentro" : "March · 90 days in",
        title:
          language === "es"
            ? "¿Las recetas se sienten razonables?"
            : "Are prescriptions feeling reasonable?",
        prompt:
          language === "es"
            ? "Te leeré los gastos hasta ahora y compararé con lo que predijimos en noviembre."
            : "I'll read your spend so far and compare it to what we predicted in November.",
        modeHint: "ambient",
      },
      {
        id: "q2",
        whenLabel: language === "es" ? "Junio · mitad de año" : "June · mid-year",
        title:
          language === "es"
            ? "Revisión a mitad de año"
            : "Mid-year reset",
        prompt:
          language === "es"
            ? "Si la vida cambió (mudanza, nuevo bebé, terapia), buscamos juntos un evento de vida calificado."
            : "If life changed (move, new baby, therapy), we look for a qualifying life event together.",
        modeHint: "co-pilot",
      },
      {
        id: "q3",
        whenLabel: language === "es" ? "Octubre · alerta de FSA" : "October · FSA alert",
        title:
          language === "es"
            ? "Te quedan saldos por gastar"
            : "You have balances to spend",
        prompt:
          language === "es"
            ? "Te aviso con voz suave una semana antes para que no pierdas dinero al final del año."
            : "I'll nudge you with a soft voice one week ahead so you don't lose money at year-end.",
        modeHint: "ambient",
      },
      {
        id: "q4",
        whenLabel: language === "es" ? "Noviembre · próxima inscripción" : "November · next enrollment",
        title:
          language === "es"
            ? "Lo que aprendimos juntos"
            : "What we learned together",
        prompt:
          language === "es"
            ? "Comparo predicción vs. uso real. Tu próxima decisión empieza con datos tuyos, no con un PDF."
            : "I compare predicted vs. actual usage. Your next decision starts with your data, not a PDF.",
        modeHint: "co-pilot",
      },
    ],
    [language],
  )

  // Highlight FSA / HSA deadlines that fall in the year.
  const deadlines = useMemo(() => {
    const list: { month: string; label: string }[] = []
    if (plan.kind === "HDHP+HSA") {
      list.push({
        month: PLAN_MONTHS[3],
        label:
          language === "es"
            ? "Último día para contribuir al HSA del año anterior"
            : "Last day to contribute to last year's HSA",
      })
    }
    list.push({
      month: PLAN_MONTHS[2],
      label:
        language === "es"
          ? "Periodo de gracia FSA termina"
          : "FSA grace period ends",
    })
    list.push({
      month: PLAN_MONTHS[10],
      label:
        language === "es"
          ? "Próxima inscripción abierta"
          : "Next open enrollment opens",
    })
    return list
  }, [plan, language])

  useEffect(() => {
    const t = setTimeout(() => {
      pushTranscript(
        "riad",
        language === "es"
          ? "Cambio a modo ambiente. Estaré aquí, en silencio, hasta que algo importante se acerque."
          : "Switching to ambient mode. I'll stay here, quietly, until something important is near.",
      )
      setStatus("ambient")
    }, 400)
    return () => clearTimeout(t)
  }, [language, pushTranscript, setStatus])

  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          {language === "es" ? "Etapa cuatro · Año del plan" : "Stage four · Plan year"}
        </p>
        <h2 className="font-serif text-3xl leading-tight tracking-tight text-balance text-foreground md:text-4xl">
          {language === "es"
            ? "Doce meses, no un único momento."
            : "Twelve months, not a single moment."}
        </h2>
        <p className="mt-2 max-w-prose leading-relaxed text-pretty text-muted-foreground">
          {language === "es"
            ? "El día que firmas no es el final. Aquí está cómo seguiré contigo durante el año del plan."
            : "The day you sign isn't the end. Here's how I'll stay with you across the plan year."}
        </p>
      </header>

      {/* Durable check-in banner */}
      <div
        className={
          checkIn
            ? "rounded-2xl border border-primary/50 bg-primary/5 p-5 shadow-sm"
            : "rounded-2xl border border-dashed border-border/70 bg-card p-5"
        }
      >
        <div className="flex flex-wrap items-start gap-3">
          <Radio className={checkIn ? "mt-1 h-5 w-5 text-primary" : "mt-1 h-5 w-5 text-muted-foreground"} aria-hidden="true" />
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {language === "es" ? "Visita programada (workflow durable)" : "Durable workflow check-in"}
            </p>
            {checkIn ? (
              <>
                <p className="mt-1 font-serif text-lg text-foreground">{checkIn.banner}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{checkIn.detail}</p>
                {checkIn.metricLabel ? (
                  <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 font-mono text-xs text-foreground">
                    <span className="text-muted-foreground">{checkIn.metricLabel}</span>
                    <span>{checkIn.metricValue}</span>
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {language === "es"
                  ? "El temporizador durable está corriendo. Cuando llegue el primer cheque, te lo digo aquí. Para acelerar la demo, simula la visita."
                  : "The durable timer is running. When the first paycheck lands, you'll see it here. To fast-forward the demo, simulate the check-in."}
              </p>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant={checkIn ? "outline" : "default"}
            onClick={simulateCheckIn}
            disabled={simulating || !sessionId}
            className="rounded-full"
          >
            {simulating
              ? language === "es"
                ? "Simulando…"
                : "Simulating…"
              : language === "es"
                ? "Simular visita"
                : "Simulate check-in"}
          </Button>
        </div>
      </div>

      {/* Snapshot */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="font-serif text-lg text-foreground">
            {language === "es" ? "Tu plan en una línea" : "Your plan in one line"}
          </h3>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p className="font-serif text-2xl text-foreground">{plan.name}</p>
          <p className="font-mono text-sm text-muted-foreground">
            {formatUSD(cost.totalAnnual)}{" "}
            <span className="ml-1 text-xs uppercase tracking-[0.15em]">
              {language === "es" ? "estimado anual" : "est. annual"}
            </span>
          </p>
          <p className="font-mono text-sm text-muted-foreground">
            {formatUSD(plan.oopMax)}{" "}
            <span className="ml-1 text-xs uppercase tracking-[0.15em]">
              {language === "es" ? "tope de gastos" : "out-of-pocket ceiling"}
            </span>
          </p>
        </div>
      </div>

      {/* Quarterly check-ins */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="font-serif text-lg text-foreground">
            {language === "es" ? "Visitas trimestrales" : "Quarterly check-ins"}
          </h3>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {checkIns.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-border/60 bg-background p-4 transition hover:border-primary/40"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {c.whenLabel}
              </p>
              <p className="mt-1 font-serif text-base text-foreground">{c.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.prompt}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-primary">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                {c.modeHint === "ambient"
                  ? language === "es"
                    ? "Modo ambiente"
                    : "Ambient mode"
                  : language === "es"
                    ? "Modo co-piloto"
                    : "Co-pilot mode"}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Deadlines */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-[var(--color-saffron)]" aria-hidden="true" />
          <h3 className="font-serif text-lg text-foreground">
            {language === "es" ? "Fechas límite que vigilo por ti" : "Deadlines I watch for you"}
          </h3>
        </div>
        <ul className="flex flex-col divide-y divide-border/60">
          {deadlines.map((d, i) => (
            <li key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary/60 font-mono text-xs uppercase tracking-[0.12em] text-foreground">
                {d.month}
              </span>
              <p className="text-sm leading-relaxed text-foreground">{d.label}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Predicted vs actual placeholder + handoff */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="font-serif text-lg text-foreground">
              {language === "es" ? "Predicción vs. uso real" : "Predicted vs. actual"}
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {language === "es"
              ? "Cada trimestre verás una línea de tu predicción y otra de tu uso real, lado a lado. Sin sorpresas, sin culpa."
              : "Each quarter you'll see one line for your prediction and one for your real usage, side by side. No surprises, no shame."}
          </p>
          <div
            className="mt-4 grid h-24 grid-cols-12 items-end gap-1 rounded-xl bg-secondary/40 p-3"
            aria-hidden="true"
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const predicted = 30 + ((i * 7) % 50)
              const actual = i < 4 ? 20 + ((i * 11) % 45) : null
              return (
                <div key={i} className="flex h-full flex-col justify-end gap-[2px]">
                  <span
                    className="w-full rounded-sm bg-primary/30"
                    style={{ height: `${predicted}%` }}
                  />
                  {actual !== null && (
                    <span
                      className="w-full rounded-sm bg-primary"
                      style={{ height: `${actual}%` }}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-3 rounded-sm bg-primary/30" aria-hidden="true" />
              {language === "es" ? "Predicho" : "Predicted"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-3 rounded-sm bg-primary" aria-hidden="true" />
              {language === "es" ? "Real" : "Actual"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="font-serif text-lg text-foreground">
              {language === "es" ? "Transferencia cálida a RR. HH." : "Warm handoff to HR"}
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {language === "es"
              ? "Si algo se complica, le paso a tu equipo de RR. HH. el contexto que ya compartiste. No vuelves a contarlo todo desde cero."
              : "If something gets complicated, I pass your HR team the context you already shared. You don't have to tell the whole story again."}
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm leading-relaxed text-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
              {language === "es"
                ? "Tu identidad permanece privada hasta que tú la compartas."
                : "Your identity stays private until you choose to share it."}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
              {language === "es"
                ? "RR. HH. recibe un resumen claro, no una transcripción cruda."
                : "HR receives a clear summary, not a raw transcript."}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
              {language === "es"
                ? "Puedes unirte a la misma sesión por voz para resolver en vivo."
                : "You can join the same live session by voice to resolve it together."}
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
