"use client"

import { useCallback, useEffect } from "react"
import { useCompanion } from "./companion-context"
import { CompanionAvatar } from "./companion-avatar"
import { PacingControls } from "./pacing-controls"
import { TranscriptLog } from "./transcript-log"
import { VoiceMicButton } from "./voice-mic-button"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis"
import { Button } from "@/components/ui/button"
import { Languages, Headphones, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_COPY: Record<string, { en: string; es: string }> = {
  ambient: { en: "I'm here", es: "Estoy aquí" },
  listening: { en: "Listening", es: "Te escucho" },
  thinking: { en: "Thinking with you", es: "Pensando contigo" },
  speaking: { en: "Reading aloud", es: "Leyendo en voz alta" },
  paused: { en: "Waiting for you", es: "Esperándote" },
}

export function CompanionPanel() {
  const {
    status,
    setStatus,
    language,
    setLanguage,
    pushTranscript,
    profile,
  } = useCompanion()

  const speechLang = language === "es" ? "es-ES" : "en-US"
  const { supported, listening, interim, finalTranscript, start, stop, reset } = useSpeechRecognition({
    lang: speechLang,
    continuous: false,
    interimResults: true,
  })
  const { speak } = useSpeechSynthesis()

  // Mirror SR state into companion status
  useEffect(() => {
    if (listening) setStatus("listening")
    else if (status === "listening") setStatus("ambient")
  }, [listening, setStatus, status])

  // Commit a finalized utterance to the transcript and respond
  useEffect(() => {
    if (!finalTranscript) return
    const utter = finalTranscript.trim()
    if (!utter) return
    pushTranscript("you", utter, language)
    setStatus("thinking")
    const reply = composeReply(utter, language)
    const replyDelay = 700
    const timeout = setTimeout(() => {
      pushTranscript("riad", reply, language)
      setStatus("speaking")
      speak(reply, { lang: speechLang })
      // Drift back to ambient shortly after
      setTimeout(() => setStatus("ambient"), Math.max(1800, reply.length * 35))
    }, replyDelay)
    reset()
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalTranscript])

  const onToggleMic = useCallback(() => {
    if (listening) {
      stop()
    } else {
      start()
    }
  }, [listening, start, stop])

  return (
    <aside
      aria-label="Riad companion"
      className="flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24"
    >
      {/* Header: avatar + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <CompanionAvatar status={status} size="md" />
          <div className="flex flex-col">
            <span className="font-serif text-xl tracking-tight text-foreground">Riad</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs",
                status === "listening" && "text-primary",
                status === "thinking" && "text-accent",
                status === "speaking" && "text-brass-foreground",
                (status === "ambient" || status === "paused") && "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  status === "listening" && "bg-primary",
                  status === "thinking" && "bg-accent",
                  status === "speaking" && "bg-brass",
                  status === "ambient" && "bg-primary/70 presence-pulse",
                  status === "paused" && "bg-muted-foreground"
                )}
              />
              {STATUS_COPY[status][language]}
            </span>
          </div>
        </div>

        {/* Language toggle */}
        <div className="inline-flex rounded-full border border-border bg-background p-0.5">
          {(["en", "es"] as const).map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => setLanguage(lng)}
              aria-pressed={language === lng}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                language === lng
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {lng === "en" ? "EN" : "ES"}
            </button>
          ))}
        </div>
      </div>

      {/* "I'm here" assurance line */}
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        {language === "es" ? (
          <>
            Estoy contigo durante todo el proceso. Sin prisas. Sin tiempos límite. Tú marcas el ritmo.
          </>
        ) : (
          <>I&apos;m with you the whole way. No rushing. No timeouts. You set the pace.</>
        )}
      </p>

      {/* Pacing controls */}
      <PacingControls />

      {/* Transcript */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <span>Conversation</span>
          <span className="inline-flex items-center gap-1">
            <Headphones className="h-3 w-3" />
            {language === "es" ? "Solo en sesión" : "Session only"}
          </span>
        </div>
        <TranscriptLog interim={interim} />
      </div>

      {/* Mic */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-background/40 p-4">
        <VoiceMicButton
          listening={listening}
          supported={supported}
          onToggle={onToggleMic}
          language={language}
        />
        {!supported ? (
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            {language === "es"
              ? "Tu navegador no soporta voz. Puedes escribir abajo en su lugar."
              : "Your browser doesn't support voice. You can type below instead."}
          </p>
        ) : null}
      </div>

      {/* Privacy assurance */}
      <div className="mt-auto flex items-start gap-2 rounded-lg bg-secondary/50 px-3 py-2.5 text-[11px] leading-relaxed text-secondary-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
        <span>
          {language === "es"
            ? "La voz se procesa en sesión. Lo que se guarda son hechos estructurados, no la grabación. Puedes borrarlo todo en un toque."
            : "Voice is processed in session. What gets saved are structured facts, not the recording. One-tap delete anytime."}
        </span>
      </div>

      {/* Profile facts (subtle) */}
      {profile.factors.length > 0 ? (
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {language === "es" ? "Lo que escuché" : "What I heard"}
            </span>
            <Languages className="h-3 w-3 text-muted-foreground" />
          </div>
          <ul className="space-y-1.5">
            {profile.factors.slice(0, 6).map((f) => (
              <li key={f.key} className="flex items-baseline justify-between gap-3 text-xs">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="text-right font-medium text-foreground">{f.value}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  )
}

// Lightweight scripted reply composer — keeps demo self-contained.
function composeReply(utter: string, lang: "en" | "es"): string {
  const u = utter.toLowerCase()
  if (lang === "es") {
    if (u.includes("bebé") || u.includes("bebe")) {
      return "Entiendo. Voy a marcar agosto como un mes de cambio. ¿Quieres que reviva los próximos 12 meses con eso en cuenta?"
    }
    if (u.includes("urgenc") || u.includes("hospital")) {
      return "Vale. Vamos a comparar los dos planes con una visita a urgencias. La diferencia podría ser grande."
    }
    if (u.includes("medic") || u.includes("recet")) {
      return "Lo anoto: medicación diaria. Eso favorece copagos predecibles. Lo veremos en el plan año a año."
    }
    return "Te escucho. Lo guardo como contexto. ¿Quieres pasar al recorrido de los próximos 12 meses?"
  }
  if (u.includes("baby") || u.includes("pregnan")) {
    return "Got it — I'll pin August as a milestone. Want me to walk the next twelve months with that in mind?"
  }
  if (u.includes("er ") || u.includes("emergency") || u.includes("hospital")) {
    return "Okay. Let's compare both plans with one ER visit in the mix. The gap can be meaningful."
  }
  if (u.includes("prescription") || u.includes("medic")) {
    return "Noting daily prescription. That nudges toward predictable copays. We'll see it in the year-ahead view."
  }
  if (u.includes("price") || u.includes("cost") || u.includes("paycheck")) {
    return "I'll show paycheck-by-paycheck side by side so you can feel it before you commit."
  }
  return "I'm listening. Let me hold that as context. Ready to walk through the next twelve months together?"
}
