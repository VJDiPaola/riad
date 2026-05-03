"use client"

import { Pause, Play, Repeat, Hourglass, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCompanion } from "./companion-context"
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis"
import { toast } from "sonner"

export function PacingControls() {
  const { status, setStatus, transcript, language, pushTranscript } = useCompanion()
  const { speak, slowDown, pause, resume, cancel, speaking } = useSpeechSynthesis()

  const lastRiad = [...transcript].reverse().find((t) => t.role === "riad")

  const onPause = () => {
    if (speaking) {
      pause()
    }
    setStatus("paused")
    toast("I'll wait. No timeouts here.", { description: "Tap resume whenever you're ready." })
  }

  const onResume = () => {
    if (status === "paused") {
      resume()
      setStatus("ambient")
    }
  }

  const onSlowDown = () => {
    if (!lastRiad) return
    cancel()
    setStatus("speaking")
    slowDown(lastRiad.text, { lang: language === "es" ? "es-ES" : "en-US" })
    toast("Slowing down.", { description: "Same words, gentler pace." })
  }

  const onRepeat = () => {
    if (!lastRiad) return
    cancel()
    setStatus("speaking")
    speak(lastRiad.text, { lang: language === "es" ? "es-ES" : "en-US" })
  }

  const onLetMeThink = () => {
    cancel()
    setStatus("paused")
    pushTranscript(
      "system",
      language === "es" ? "Tomándote un momento. Riad espera." : "Taking a moment. Riad is waiting.",
      language
    )
    toast(
      language === "es" ? "Tómate tu tiempo." : "Take your time.",
      {
        description:
          language === "es"
            ? "Riad sigue presente. Sin tiempos límite."
            : "Riad stays present. No timeouts.",
      }
    )
  }

  const isPaused = status === "paused"

  return (
    <div className="flex flex-wrap gap-2">
      {!isPaused ? (
        <PacingButton icon={<Pause className="h-3.5 w-3.5" />} label="Pause" onClick={onPause} />
      ) : (
        <PacingButton icon={<Play className="h-3.5 w-3.5" />} label="Resume" onClick={onResume} />
      )}
      <PacingButton icon={<Hourglass className="h-3.5 w-3.5" />} label="Slow down" onClick={onSlowDown} />
      <PacingButton icon={<Repeat className="h-3.5 w-3.5" />} label="Repeat that" onClick={onRepeat} />
      <PacingButton icon={<Coffee className="h-3.5 w-3.5" />} label="Let me think" onClick={onLetMeThink} />
    </div>
  )
}

function PacingButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="rounded-full bg-card/60 text-xs h-8 gap-1.5"
    >
      {icon}
      {label}
    </Button>
  )
}
