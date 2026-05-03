"use client"

import { Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceMicButtonProps {
  listening: boolean
  supported: boolean
  onToggle: () => void
  language: "en" | "es"
}

export function VoiceMicButton({ listening, supported, onToggle, language }: VoiceMicButtonProps) {
  const label = listening
    ? language === "es"
      ? "Te escucho"
      : "Listening"
    : language === "es"
      ? "Toca para hablar"
      : "Tap to talk"

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={!supported}
        aria-pressed={listening}
        aria-label={label}
        className={cn(
          "relative inline-flex h-20 w-20 items-center justify-center rounded-full transition-all",
          "border focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
          listening
            ? "bg-primary text-primary-foreground border-primary shadow-[0_0_0_8px_color-mix(in_oklch,var(--primary)_18%,transparent)]"
            : "bg-card text-primary border-border hover:bg-secondary",
          !supported && "opacity-50 cursor-not-allowed"
        )}
      >
        {listening ? (
          <span className="absolute inset-0 rounded-full border border-primary/40 animate-ping" />
        ) : null}
        {supported ? <Mic className="relative h-7 w-7" /> : <MicOff className="relative h-7 w-7" />}
      </button>
      <span
        className={cn(
          "text-xs font-medium tracking-wide",
          listening ? "text-primary" : "text-muted-foreground"
        )}
      >
        {supported ? label : language === "es" ? "Voz no disponible" : "Voice unavailable"}
      </span>
      {listening ? <Waveform /> : null}
    </div>
  )
}

function Waveform() {
  return (
    <div className="flex h-5 items-end gap-[3px]" aria-hidden="true">
      {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8].map((h, i) => (
        <span
          key={i}
          style={{
            height: `${Math.round(h * 18)}px`,
            animationDelay: `${i * 0.08}s`,
          }}
          className="waveform-bar w-[3px] rounded-full bg-primary"
        />
      ))}
    </div>
  )
}
