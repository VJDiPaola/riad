import { sleep } from "workflow"
import {
  composeCheckInBanner,
} from "@/lib/agent/companion-agent"
import {
  appendToolCalls,
  clearCheckInScheduled,
  getSession,
  publish,
  setLastCheckIn,
  setStep,
} from "@/lib/agent/session-store"
import type { CheckInPayload } from "@/lib/companion/types"

export async function checkInTimerWorkflow(sessionId: string, delayMs: number) {
  "use workflow"
  await sleep(delayMs)
  await fireCheckInStep(sessionId)
}

async function fireCheckInStep(sessionId: string): Promise<CheckInPayload> {
  "use step"
  const state = getSession(sessionId)
  if (!state) {
    return {
      firedAt: Date.now(),
      banner: "Session ended.",
      detail: "",
    }
  }
  const payload = composeCheckInBanner({
    profile: state.profile,
    rows: state.yearAhead?.rows,
  })
  const checkInPayload: CheckInPayload = {
    firedAt: Date.now(),
    banner: payload.banner,
    detail: payload.detail,
    metricLabel: payload.metricLabel,
    metricValue: payload.metricValue,
  }
  setLastCheckIn(sessionId, checkInPayload)
  setStep(sessionId, "scheduledCheckIn")
  publish(sessionId, { event: "step.checkin.fired", data: checkInPayload })
  appendToolCalls(sessionId, [
    {
      id: `tool_${Date.now().toString(36)}`,
      at: Date.now(),
      tool: "scheduled_checkin",
      args: { sessionId, source: "durable-timer" },
    },
  ])
  clearCheckInScheduled(sessionId)
  return checkInPayload
}
