import { getSession, subscribe } from "@/lib/agent/session-store"
import type { SessionSSEEvent } from "@/lib/companion/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function toSSE(evt: SessionSSEEvent): string {
  return `event: ${evt.event}\ndata: ${JSON.stringify(evt.data)}\n\n`
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const state = getSession(id)
  if (!state) {
    return new Response("session not found", { status: 404 })
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()
      const send = (evt: SessionSSEEvent) => {
        try {
          controller.enqueue(encoder.encode(toSSE(evt)))
        } catch {
          /* stream closed */
        }
      }
      send({ event: "ready", data: { sessionId: id } })

      // Replay last-known state so a fresh subscriber catches up.
      if (state.profile.factors.length > 0) {
        send({
          event: "step.completed",
          data: {
            step: "ingestInterview",
            payload: { profile: state.profile, summary: "(replay)" },
          },
        })
      }
      if (state.yearAhead) {
        send({
          event: "step.completed",
          data: { step: "projectYearAhead", payload: state.yearAhead },
        })
      }
      for (const tc of state.toolCalls) {
        send({ event: "tool.call.logged", data: tc })
      }
      if (state.lastCheckIn) {
        send({ event: "step.checkin.fired", data: state.lastCheckIn })
      }

      const unsubscribe = subscribe(id, send)
      const ping = setInterval(() => send({ event: "ping", data: { at: Date.now() } }), 15000)
      const close = () => {
        clearInterval(ping)
        unsubscribe()
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }
      // The Request signal isn't readily available in this scope; piggy-back on cancel().
      ;(controller as ReadableStreamDefaultController & { _close?: () => void })._close = close
    },
    cancel() {
      const close = (this as unknown as { _close?: () => void })._close
      if (close) close()
    },
  })

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "connection": "keep-alive",
      "x-accel-buffering": "no",
    },
  })
}
