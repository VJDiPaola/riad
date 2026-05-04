"use client"

import type {
  AdvanceBody,
  AdvanceResponse,
  SessionSSEEvent,
  SessionState,
} from "@/lib/companion/types"

export async function startSession(): Promise<{ sessionId: string }> {
  const res = await fetch("/api/companion/session", { method: "POST" })
  if (!res.ok) throw new Error(`startSession failed: ${res.status}`)
  return (await res.json()) as { sessionId: string }
}

export async function advance(
  sessionId: string,
  body: AdvanceBody,
): Promise<AdvanceResponse> {
  const res = await fetch(`/api/companion/session/${sessionId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`advance failed: ${res.status}`)
  return (await res.json()) as AdvanceResponse
}

export async function getState(sessionId: string): Promise<SessionState> {
  const res = await fetch(`/api/companion/session/${sessionId}`)
  if (!res.ok) throw new Error(`getState failed: ${res.status}`)
  return (await res.json()) as SessionState
}

export interface EventSubscription {
  close: () => void
}

export function subscribeToSession(
  sessionId: string,
  handler: (event: SessionSSEEvent) => void,
): EventSubscription {
  const url = `/api/companion/session/${sessionId}/events`
  const source = new EventSource(url)
  const dispatch = (eventName: SessionSSEEvent["event"]) => (raw: MessageEvent) => {
    try {
      const data = JSON.parse(raw.data)
      handler({ event: eventName, data } as SessionSSEEvent)
    } catch {
      /* ignore */
    }
  }
  source.addEventListener("ready", dispatch("ready"))
  source.addEventListener("step.completed", dispatch("step.completed"))
  source.addEventListener("step.checkin.fired", dispatch("step.checkin.fired"))
  source.addEventListener("tool.call.logged", dispatch("tool.call.logged"))
  source.addEventListener("ping", dispatch("ping"))
  return {
    close: () => source.close(),
  }
}
