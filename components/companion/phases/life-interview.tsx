"use client"

import { useState } from "react"
import { useCompanion } from "../companion-context"
import {
  SAMPLE_PROFILE,
  SUGGESTED_PROMPTS_EN,
  SUGGESTED_PROMPTS_ES,
} from "@/lib/companion/sample-data"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, ArrowRight, Mic, Send } from "lucide-react"
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis"
import { toast } from "sonner"

export function LifeInterviewPhase() {
  const {
    language,
    pushTranscript,
    setStatus,
    updateProfile,
    profile,
    setPhase,
  } = useCompanion()
  const { speak } = useSpeechSynthesis()
  const [typed, setTyped] = useState("")

  const prompts = language === "es" ? SUGGESTED_PROMPTS_ES : SUGGESTED_PROMPTS_EN

  function tellRiad(text: string) {
    pushTranscript("you", text, language)
    setStatus("thinking")
    const reply = composeNarrativeReply(text, language)
    setTimeout(() => {
      pushTranscript("riad", reply, language)
      setStatus("speaking")
      speak(reply, { lang: language === "es" ? "es-ES" : "en-US" })
      setTimeout(() => setStatus("ambient"), Math.max(1800, reply.length * 35))
    }, 500)
  }

  function applySampleProfile() {
    updateProfile(SAMPLE_PROFILE)
    pushTranscript(
      "system",
      language === "es"
        ? "Perfil de demostración cargado: Maya, NYC, casada, esperando bebé."
        : "Demo profile loaded: Maya, NYC, married, expecting.",
      language
    )
    pushTranscript(
      "riad",
      language === "es"
        ? "Listo. Veo cinco hechos clave a la derecha. ¿Pasamos al recorrido de los próximos 12 meses?"
        : "Got it. I see five key facts on the right. Want to walk the next twelve months together?",
      language
    )
    toast(language === "es" ? "Perfil cargado" : "Profile loaded", {
      description:
        language === "es"
          ? "Riad ahora tiene contexto suficiente para el recorrido."
          : "Riad now has enough context for the walkthrough.",
    })
  }

  function submitTyped() {
    if (!typed.trim()) return
    tellRiad(typed.trim())
    setTyped("")
  }

  const hasContext = (profile.factors?.length ?? 0) >= 3

  return (
    <section className="flex flex-col gap-8" aria-labelledby="phase-interview-title">
      {/* Phase header */}
      <header>
        <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <Mic className="h-3 w-3" />
          {language === "es" ? "Etapa uno · Entrevista de vida" : "Stage one · Life interview"}
        </p>
        <h2
          id="phase-interview-title"
          className="font-serif text-3xl leading-tight tracking-tight text-foreground text-balance md:text-4xl"
        >
          {language === "es"
            ? "Cuéntame de tu vida — en tus propias palabras."
            : "Tell me about your life — in your own words."}
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground text-pretty">
          {language === "es"
            ? "Toca el micrófono a la derecha y habla. Reflejaré lo que escuche antes de guardar nada. Si prefieres escribir, también puedes."
            : "Tap the mic on the right and speak. I'll reflect what I hear before anything is saved. You can also type if you prefer."}
        </p>
      </header>

      {/* Suggested spoken prompts */}
      <div>
        <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {language === "es" ? "Cosas que la gente suele decir" : "Things people say out loud"}
        </h3>
        <div className="flex flex-wrap gap-2">
          {prompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => tellRiad(p)}
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/60 hover:bg-primary/5"
            >
              <Mic className="h-3.5 w-3.5 text-primary" />
              <span className="text-pretty">{p}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Type fallback */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {language === "es" ? "O escribe lo que tengas en la cabeza" : "Or type what's on your mind"}
          </h3>
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {language === "es" ? "Igual de válido" : "Equally welcome"}
          </span>
        </div>
        <Textarea
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          rows={3}
          placeholder={
            language === "es"
              ? "Por ejemplo: estoy casada, tengo una hija, tomo medicación a diario y odio las facturas sorpresa…"
              : "For example: I'm married, one toddler, I take a daily med, and I hate surprise bills…"
          }
          className="resize-none border-border bg-background"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              submitTyped()
            }
          }}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {language === "es" ? "Cmd/Ctrl + Enter para enviar" : "Cmd/Ctrl + Enter to send"}
          </p>
          <Button
            type="button"
            onClick={submitTyped}
            disabled={!typed.trim()}
            size="sm"
            className="rounded-full"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {language === "es" ? "Enviar a Riad" : "Send to Riad"}
          </Button>
        </div>
      </div>

      {/* Demo helper + continue */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-border bg-secondary/40 p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brass/25 text-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              {language === "es" ? "¿Tienes prisa? Carga el perfil de demostración." : "Short on time? Load the demo profile."}
            </p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
              {language === "es"
                ? "Maya: casada, con una hija pequeña, esperando bebé en agosto, medicación diaria, prefiere primas predecibles."
                : "Maya: married, one toddler, expecting in August, daily prescription, prefers predictable premiums."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={applySampleProfile} className="rounded-full">
            {language === "es" ? "Cargar perfil" : "Load profile"}
          </Button>
          <Button
            type="button"
            onClick={() => setPhase("year-ahead")}
            disabled={!hasContext}
            className="rounded-full"
          >
            {language === "es" ? "Pasar al Año por Delante" : "Continue to Year-Ahead"}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}

function composeNarrativeReply(utter: string, lang: "en" | "es"): string {
  const u = utter.toLowerCase()
  if (lang === "es") {
    if (u.includes("12 meses") || u.includes("paycheck") || u.includes("cheque")) {
      return "Perfecto. En la siguiente etapa verás los próximos 12 meses lado a lado para los dos planes. ¿Cargamos algo de contexto primero o saltamos directo?"
    }
    if (u.includes("bebé") || u.includes("bebe") || u.includes("junio") || u.includes("agosto")) {
      return "Anotado. Voy a marcar ese mes como un hito. Cuando pasemos al recorrido lo vas a ver claramente."
    }
    if (u.includes("urgenc") || u.includes("rough")) {
      return "Vale. Voy a guardar esa preocupación: 'un año difícil'. Cuando comparemos planes, te mostraré el peor escenario realista."
    }
    return "Te escucho. Lo guardo como contexto. Cuando quieras, pasamos al recorrido de 12 meses."
  }
  if (u.includes("twelve") || u.includes("12 month") || u.includes("paycheck")) {
    return "Good. In the next stage you'll see the full year side by side for both plans. Want me to load some context first, or jump in?"
  }
  if (u.includes("baby") || u.includes("june") || u.includes("august")) {
    return "Noted. I'll pin that month as a milestone. When we move to the walkthrough you'll see exactly how it lands."
  }
  if (u.includes("rough") || u.includes("er")) {
    return "Okay. I'll hold that worry — \"a rough year.\" When we compare plans I'll show the realistic worst case alongside the likely one."
  }
  return "I hear you. I'll keep that as context. Whenever you're ready, we can walk through the twelve months together."
}
