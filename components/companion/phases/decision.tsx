"use client"

import { useEffect, useMemo, useState } from "react"
import { useCompanion } from "../companion-context"
import { ScrollText, CheckCircle2, AlertTriangle, Quote, ShieldCheck, FileSignature } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PLANS } from "@/lib/companion/sample-data"
import { getActiveEvents, projectPlan, formatUSD } from "@/lib/companion/year-ahead-utils"

type RegretFlag = {
  id: string
  severity: "info" | "warn"
  title: string
  body: string
  mitigation: string
}

export function DecisionPhase() {
  const {
    language,
    transcript,
    selectedPlanId,
    setSelectedPlanId,
    activeScenarioId,
    setStatus,
    pushTranscript,
    decisionRationale,
    setDecisionRationale,
  } = useCompanion()
  const [acknowledged, setAcknowledged] = useState(false)

  const recommended = PLANS.find((p) => p.id === selectedPlanId) ?? PLANS[0]
  const alternative = PLANS.find((p) => p.id !== recommended.id) ?? PLANS[1]

  const events = useMemo(() => getActiveEvents(activeScenarioId), [activeScenarioId])
  const recCost = useMemo(() => projectPlan(recommended, events), [recommended, events])
  const altCost = useMemo(() => projectPlan(alternative, events), [alternative, events])

  // Pull the four most recent things the employee said in their own voice.
  const priorityQuotes = useMemo(
    () => transcript.filter((e) => e.role === "you").slice(-4),
    [transcript],
  )

  const journalText = useMemo(
    () => transcript.filter((e) => e.role === "you").map((e) => e.text).join(" \n "),
    [transcript],
  )

  const regretFlags: RegretFlag[] = useMemo(() => {
    const flags: RegretFlag[] = []

    const mentionsTherapy = /therapy|mental|counsel|anxiety|stress/i.test(journalText)
    if (mentionsTherapy && recommended.deductible >= 2500) {
      flags.push({
        id: "therapy-deductible",
        severity: "warn",
        title:
          language === "es"
            ? "Mencionaste terapia, pero el deducible es alto"
            : "You mentioned therapy, but the deductible is high",
        body:
          language === "es"
            ? "Con este plan, las primeras visitas saldrán de tu bolsillo hasta llegar al deducible."
            : "On this plan, your first visits come out of pocket until you hit the deductible.",
        mitigation:
          language === "es"
            ? "Considera EAP (gratis) o cambia al PPO si la terapia será semanal."
            : "Consider the EAP (free) or switch to the PPO if therapy will be weekly.",
      })
    }

    const mentionsBaby = /baby|pregnan|maternity|child/i.test(journalText)
    if (mentionsBaby) {
      flags.push({
        id: "baby-oop-max",
        severity: "info",
        title:
          language === "es"
            ? "Un bebé este año cambia el cálculo"
            : "A baby this year changes the math",
        body:
          language === "es"
            ? "Es probable que llegues al máximo de gastos del plan. Lo que importa es ese tope, no el deducible."
            : "You'll likely hit the plan's out-of-pocket max. What matters is that ceiling, not the deductible.",
        mitigation:
          language === "es"
            ? `El tope de ${recommended.name} es ${formatUSD(recommended.oopMax)}.`
            : `${recommended.name}'s ceiling is ${formatUSD(recommended.oopMax)}.`,
      })
    }

    const diff = recCost.totalAnnual - altCost.totalAnnual
    if (diff > 600) {
      flags.push({
        id: "cost-regret",
        severity: "info",
        title:
          language === "es"
            ? `${alternative.name} salía más económico en este escenario`
            : `${alternative.name} would have been cheaper in this scenario`,
        body:
          language === "es"
            ? `Diferencia anual estimada: ${formatUSD(diff)}.`
            : `Estimated annual difference: ${formatUSD(diff)}.`,
        mitigation:
          language === "es"
            ? "Aún así, dijiste que la previsibilidad importa más que ahorrar al máximo."
            : "Still, you said predictability mattered more than saving every dollar.",
      })
    }

    return flags
  }, [journalText, recommended, alternative, recCost, altCost, language])

  // Companion narrates as they enter the decision phase.
  useEffect(() => {
    const intro =
      language === "es"
        ? "Antes de firmar, repasemos lo que dijiste y comprobemos que esta decisión está alineada."
        : "Before you sign, let's replay what you said and check that this decision lines up."
    const t = setTimeout(() => {
      pushTranscript("riad", intro)
      setStatus("speaking")
      setTimeout(() => setStatus("ambient"), 1800)
    }, 400)
    return () => clearTimeout(t)
  }, [language, pushTranscript, setStatus])

  function handleConfirm() {
    setAcknowledged(true)
    if (!decisionRationale.trim()) {
      setDecisionRationale(
        language === "es"
          ? `Elijo ${recommended.name} porque coincide con lo que dije en voz alta.`
          : `I'm choosing ${recommended.name} because it matches what I said out loud.`,
      )
    }
    pushTranscript(
      "riad",
      language === "es"
        ? "Decisión guardada en tu diario. Te acompañaré durante los próximos doce meses."
        : "Decision saved to your journal. I'll stay with you for the next twelve months.",
    )
    setStatus("speaking")
    setTimeout(() => setStatus("ambient"), 1800)
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <ScrollText className="h-3 w-3" />
          {language === "es" ? "Etapa tres · Decisión" : "Stage three · Decision"}
        </p>
        <h2 className="font-serif text-3xl leading-tight tracking-tight text-balance text-foreground md:text-4xl">
          {language === "es"
            ? "Una pausa antes de firmar."
            : "A pause before you sign."}
        </h2>
        <p className="mt-2 max-w-prose leading-relaxed text-pretty text-muted-foreground">
          {language === "es"
            ? "Te leo en voz alta lo que dijiste, te muestro cómo se traduce en tu elección y te aviso si algo no encaja."
            : "I'll read your own words back to you, show how they map to your choice, and flag anything that feels off."}
        </p>
      </header>

      {/* Decision journal: their voice */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Quote className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="font-serif text-lg text-foreground">
            {language === "es" ? "En tus propias palabras" : "In your own words"}
          </h3>
        </div>
        {priorityQuotes.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {language === "es"
              ? "Aún no has compartido nada en voz alta. Vuelve a la entrevista cuando quieras."
              : "You haven't shared anything out loud yet. Step back into the interview whenever you're ready."}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {priorityQuotes.map((q) => (
              <li
                key={q.id}
                className="rounded-xl border-l-2 border-primary/60 bg-secondary/40 px-4 py-3"
              >
                <p className="font-serif text-base leading-relaxed text-foreground italic">
                  &ldquo;{q.text}&rdquo;
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  {new Date(q.at).toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recommended bundle */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="font-serif text-lg text-foreground">
            {language === "es" ? "Tu paquete recomendado" : "Your recommended bundle"}
          </h3>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1 rounded-xl border border-border/60 bg-background p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {language === "es" ? "Plan médico" : "Medical plan"}
            </p>
            <p className="mt-1 font-serif text-xl text-foreground">{recommended.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {recommended.blurb}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  {language === "es" ? "Costo anual estimado" : "Est. yearly cost"}
                </dt>
                <dd className="font-mono text-base text-foreground">
                  {formatUSD(recCost.totalAnnual)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  {language === "es" ? "Tope de gastos" : "Out-of-pocket ceiling"}
                </dt>
                <dd className="font-mono text-base text-foreground">
                  {formatUSD(recommended.oopMax)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-3 md:w-72">
            <button
              type="button"
              onClick={() => setSelectedPlanId(alternative.id)}
              className="rounded-xl border border-dashed border-border/70 bg-background p-3 text-left text-sm text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
            >
              <p className="text-[11px] uppercase tracking-[0.18em]">
                {language === "es" ? "Cambiar a" : "Switch to"}
              </p>
              <p className="mt-1 font-serif text-base text-foreground">{alternative.name}</p>
              <p className="mt-1 font-mono text-xs">
                {formatUSD(altCost.totalAnnual)} /
                {language === "es" ? " año" : " yr"}
              </p>
            </button>
            <div className="rounded-xl bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
              {language === "es"
                ? "Cualquier cambio se narrará en voz alta y quedará en tu diario."
                : "Any change is narrated aloud and saved to your journal."}
            </div>
          </div>
        </div>
      </div>

      {/* Regret check */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[var(--color-saffron)]" aria-hidden="true" />
          <h3 className="font-serif text-lg text-foreground">
            {language === "es" ? "Verificación de arrepentimiento" : "Regret check"}
          </h3>
        </div>
        {regretFlags.length === 0 ? (
          <div className="flex items-start gap-3 rounded-xl bg-secondary/40 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground">
              {language === "es"
                ? "No veo conflictos entre lo que dijiste y este plan. Vamos bien."
                : "I see no conflicts between what you said and this plan. We're good."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {regretFlags.map((f) => (
              <li
                key={f.id}
                className={
                  f.severity === "warn"
                    ? "rounded-xl border border-[var(--color-saffron)]/50 bg-[var(--color-saffron)]/10 p-4"
                    : "rounded-xl border border-border/60 bg-secondary/40 p-4"
                }
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={
                      f.severity === "warn"
                        ? "mt-0.5 h-4 w-4 text-[var(--color-saffron)]"
                        : "mt-0.5 h-4 w-4 text-muted-foreground"
                    }
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <p className="font-serif text-base text-foreground">{f.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      <span className="font-medium">
                        {language === "es" ? "Sugerencia: " : "Suggestion: "}
                      </span>
                      {f.mitigation}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirm */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="font-serif text-lg text-foreground">
            {language === "es" ? "Confirmar y guardar en tu diario" : "Confirm and save to your journal"}
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {language === "es"
            ? "Esto firma tu elección, guarda el razonamiento en tu diario y me da permiso para acompañarte durante los próximos 12 meses."
            : "This signs your choice, saves the reasoning to your journal, and gives me permission to walk with you for the next 12 months."}
        </p>
        <textarea
          value={decisionRationale}
          onChange={(e) => setDecisionRationale(e.target.value)}
          placeholder={
            language === "es"
              ? `Elijo ${recommended.name} porque…`
              : `I'm choosing ${recommended.name} because…`
          }
          className="mt-3 min-h-[90px] w-full resize-none rounded-xl border border-border/60 bg-background p-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            onClick={handleConfirm}
            disabled={acknowledged}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {acknowledged
              ? language === "es"
                ? "Decisión guardada"
                : "Decision saved"
              : language === "es"
                ? "Confirmar elección"
                : "Confirm choice"}
          </Button>
          {acknowledged && (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
              {language === "es"
                ? "Continúa al año del plan."
                : "Continue to plan year."}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
