"use client"

import { Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MicPermissionState } from "@/hooks/use-speech-recognition"

interface VoiceMicButtonProps {
  listening: boolean
  supported: boolean
  permission: MicPermissionState
  onToggle: () => void
  language: "en" | "es"
}

export function VoiceMicButton({
  listening,
  supported,
  permission,
  onToggle,
  language,
}: VoiceMicButtonProps) {
  const blocked = permission === "denied" || permission === "unavailable" || !supported

  const label = listening
    ? language === "es"
      ? "Te escucho"
      : "Listening"
    : blocked
      ? language === "es"
        ? "Voz bloqueada"
        : "Voice blocked"
      : language === "es"
        ? "Toca para hablar"
        : "Tap to talk"

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={blocked}
        aria-pressed={listening}
        aria-label={label}
        className={cn(
          "relative inline-flex h-20 w-20 items-center justify-center rounded-full transition-all",
          "border focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
          listening
            ? "bg-primary text-primary-foreground border-primary shadow-[0_0_0_8px_color-mix(in_oklch,var(--primary)_18%,transparent)]"
            : blocked
              ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
              : "bg-card text-primary border-border hover:bg-secondary"
        )}
      >
        {listening ? (
          <span className="absolute inset-0 rounded-full border border-primary/40 animate-ping" />
        ) : null}
        {blocked ? <MicOff className="relative h-7 w-7" /> : <Mic className="relative h-7 w-7" />}
      </button>
      <span
        className={cn(
          "text-xs font-medium tracking-wide",
          listening ? "text-primary" : blocked ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {label}
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
