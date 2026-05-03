"use client"

import { cn } from "@/lib/utils"
import type { CompanionStatus } from "@/lib/companion/types"

interface CompanionAvatarProps {
  status: CompanionStatus
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: "h-12 w-12",
  md: "h-20 w-20",
  lg: "h-28 w-28",
} as const

export function CompanionAvatar({ status, size = "md" }: CompanionAvatarProps) {
  return (
    <div className={cn("relative inline-flex items-center justify-center", sizeMap[size])} aria-hidden="true">
      {/* Outer ring — listening pulse / thinking shimmer */}
      <span
        className={cn(
          "absolute inset-0 rounded-full border",
          status === "listening" && "border-primary/60 animate-ping",
          status === "thinking" && "border-accent/40 animate-spin [animation-duration:6s]",
          status === "speaking" && "border-brass/60 breathe",
          (status === "ambient" || status === "paused") && "border-border breathe"
        )}
      />
      {/* Mid ring — soft glow */}
      <span
        className={cn(
          "absolute inset-1.5 rounded-full",
          status === "listening" && "bg-primary/15",
          status === "thinking" && "bg-accent/10",
          status === "speaking" && "bg-brass/15",
          status === "ambient" && "bg-secondary/60",
          status === "paused" && "bg-muted"
        )}
      />
      {/* Core — eight-point star nod to zellige */}
      <span
        className={cn(
          "relative inline-flex items-center justify-center rounded-full",
          size === "sm" ? "h-8 w-8" : size === "md" ? "h-12 w-12" : "h-16 w-16",
          "bg-card text-primary border border-border shadow-inner"
        )}
      >
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="currentColor" aria-hidden="true">
          <path d="M12 2 L13.6 8 L20 6.4 L18.4 12 L22 14.4 L16 16 L14.4 22 L12 18.4 L9.6 22 L8 16 L2 14.4 L5.6 12 L4 6.4 L10.4 8 Z" />
        </svg>
      </span>
    </div>
  )
}
