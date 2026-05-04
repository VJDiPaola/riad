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
import { Languages, Headphones, ShieldCheck, Volume2, AlertTriangle, ExternalLink } from "lucide-react"
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
  const {
    supported,
    listening,
    interim,
    finalTranscript,
    error: srError,
    permission,
    start,
    stop,
    reset,
  } = useSpeechRecognition({
    lang: speechLang,
    continuous: false,
    interimResults: true,
  })
  const { supported: ttsSupported, speak, error: ttsError } = useSpeechSynthesis()

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
      // start() will request mic permission first if needed
      void start()
    }
  }, [listening, start, stop])

  const onTestSound = useCallback(() => {
    const phrase =
      language === "es"
        ? "Hola, soy Riad. Si me escuchas, el sonido funciona."
        : "Hi, I'm Riad. If you can hear me, sound is working."
    setStatus("speaking")
    speak(phrase, { lang: speechLang })
    setTimeout(() => setStatus("ambient"), Math.max(1800, phrase.length * 40))
  }, [language, speak, setStatus, speechLang])

  // Friendly error banner copy
  const banner = buildBanner({
    srSupported: supported,
    ttsSupported,
    permission,
    srError,
    ttsError,
    language,
  })

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

      {/* Voice status / error banner */}
      {banner ? (
        <div
          role="status"
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[12px] leading-relaxed",
            banner.tone === "warning"
              ? "border-brass/50 bg-brass/15 text-foreground"
              : "border-border bg-secondary/40 text-secondary-foreground"
          )}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-foreground" />
          <div className="flex flex-col gap-1.5">
            <span>{banner.message}</span>
            {banner.action ? (
              <button
                type="button"
                onClick={banner.action.onClick}
                className="inline-flex items-center gap-1 self-start text-[11px] font-medium uppercase tracking-[0.16em] text-primary hover:underline"
              >
                {banner.action.label}
                {banner.action.icon}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

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

      {/* Mic + sound test */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-background/40 p-4">
        <VoiceMicButton
          listening={listening}
          supported={supported}
          permission={permission}
          onToggle={onToggleMic}
          language={language}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onTestSound}
          disabled={!ttsSupported}
          className="h-7 gap-1.5 rounded-full text-[11px]"
        >
          <Volume2 className="h-3.5 w-3.5" />
          {language === "es" ? "Probar sonido" : "Test sound"}
        </Button>
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

interface BannerInfo {
  tone: "info" | "warning"
  message: string
  action?: { label: string; onClick: () => void; icon?: React.ReactNode }
}

function buildBanner({
  srSupported,
  ttsSupported,
  permission,
  srError,
  ttsError,
  language,
}: {
  srSupported: boolean
  ttsSupported: boolean
  permission: "unknown" | "prompt" | "granted" | "denied" | "unavailable"
  srError: string | null
  ttsError: string | null
  language: "en" | "es"
}): BannerInfo | null {
  const openInNewTab = () => {
    if (typeof window !== "undefined") window.open(window.location.href, "_blank", "noopener")
  }

  // Speech recognition unsupported (e.g. Firefox).
  if (!srSupported) {
    return {
      tone: "info",
      message:
        language === "es"
          ? "Tu navegador no soporta reconocimiento de voz. Puedes usar las sugerencias o escribir abajo — la narración sigue funcionando."
          : "Your browser doesn't support voice input. You can use the suggested prompts or type — narration still works.",
    }
  }

  // Mic blocked / denied — most likely cause inside the v0 preview iframe.
  if (permission === "denied" || srError === "mic-blocked") {
    return {
      tone: "warning",
      message:
        language === "es"
          ? "El micrófono está bloqueado en esta vista previa. Abre la app en una pestaña nueva para usar la voz, o toca una sugerencia / escribe a continuación."
          : "The microphone is blocked in this preview. Open the app in a new tab to use voice, or tap a suggested prompt / type below.",
      action: {
        label: language === "es" ? "Abrir en pestaña nueva" : "Open in new tab",
        onClick: openInNewTab,
        icon: <ExternalLink className="h-3 w-3" />,
      },
    }
  }

  if (srError === "no-mic") {
    return {
      tone: "warning",
      message:
        language === "es"
          ? "No detecto micrófono. Revisa tu dispositivo o usa las sugerencias / texto."
          : "No microphone detected. Check your device or use the suggested prompts / typing.",
    }
  }

  if (srError === "no-speech") {
    return {
      tone: "info",
      message:
        language === "es"
          ? "No escuché nada esta vez. Toca el micrófono y vuelve a intentarlo."
          : "I didn't catch anything that time. Tap the mic and try again.",
    }
  }

  if (!ttsSupported) {
    return {
      tone: "info",
      message:
        language === "es"
          ? "Tu navegador no puede leer en voz alta. Puedes leer las respuestas en la conversación."
          : "Your browser can't read aloud. You can still read replies in the conversation.",
    }
  }

  if (ttsError) {
    return {
      tone: "info",
      message:
        language === "es"
          ? "Hubo un problema con el sonido. Intenta de nuevo o asegúrate de que tu navegador no esté silenciado."
          : "Sound hit a snag. Try again, or make sure your browser tab isn't muted.",
    }
  }

  return null
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
