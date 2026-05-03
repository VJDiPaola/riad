"use client"

import { useEffect, useRef } from "react"
import { useCompanion } from "./companion-context"
import { cn } from "@/lib/utils"

export function TranscriptLog({ interim }: { interim?: string }) {
  const { transcript } = useCompanion()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.scrollTop = ref.current.scrollHeight
  }, [transcript, interim])

  return (
    <div
      ref={ref}
      className="flex h-56 flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-card/60 p-4"
      role="log"
      aria-live="polite"
      aria-label="Live conversation transcript"
    >
      {transcript.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex flex-col gap-0.5",
            t.role === "you" && "items-end",
            t.role === "riad" && "items-start",
            t.role === "system" && "items-center"
          )}
        >
          <span
            className={cn(
              "text-[10px] uppercase tracking-[0.16em]",
              t.role === "you" && "text-primary",
              t.role === "riad" && "text-accent",
              t.role === "system" && "text-muted-foreground"
            )}
          >
            {t.role === "you" ? "You" : t.role === "riad" ? "Riad" : "•"}
          </span>
          <p
            className={cn(
              "max-w-[88%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
              t.role === "you" && "bg-primary text-primary-foreground rounded-tr-sm",
              t.role === "riad" && "bg-secondary text-secondary-foreground rounded-tl-sm",
              t.role === "system" && "bg-transparent text-muted-foreground italic text-xs"
            )}
          >
            {t.text}
          </p>
        </div>
      ))}
      {interim ? (
        <div className="flex items-end justify-end">
          <p className="max-w-[88%] rounded-2xl rounded-tr-sm border border-dashed border-primary/50 bg-primary/5 px-3.5 py-2 text-sm italic text-foreground/80">
            {interim}
            <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-primary align-middle" />
          </p>
        </div>
      ) : null}
    </div>
  )
}
