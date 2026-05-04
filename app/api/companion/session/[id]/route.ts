import { NextResponse } from "next/server"
import { start } from "workflow/api"
import { ingestInterview, narrateYearAhead, composeCheckInBanner } from "@/lib/agent/companion-agent"
import {
  appendToolCalls,
  getSession,
  markCheckInScheduled,
  publish,
  setLastCheckIn,
  setProfile,
  setStep,
  setYearAhead,
} from "@/lib/agent/session-store"
import type { AdvanceBody, CheckInPayload } from "@/lib/companion/types"
import { checkInTimerWorkflow } from "@/workflows/companion-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const state = getSession(id)
  if (!state) {
    return NextResponse.json({ error: "session not found" }, { status: 404 })
  }
  return NextResponse.json(state)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const state = getSession(id)
  if (!state) {
    return NextResponse.json({ error: "session not found" }, { status: 404 })
  }
  const body = (await req.json()) as AdvanceBody
  if (!body || typeof body !== "object" || !("step" in body)) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 })
  }

  if (body.step === "ingestInterview") {
    setStep(id, "ingestInterview")
    const result = await ingestInterview(body.input)
    setProfile(id, result.profile)
    publish(id, {
      event: "step.completed",
      data: { step: "ingestInterview", payload: result },
    })
    return NextResponse.json({ step: "ingestInterview", payload: result })
  }

  if (body.step === "projectYearAhead") {
    setStep(id, "projectYearAhead")
    const result = await narrateYearAhead({
      profile: state.profile,
      planIds: body.input.planIds,
      scenario: body.input.scenario,
    })
    const { toolCalls, ...payload } = result
    setYearAhead(id, payload)
    appendToolCalls(id, toolCalls)
    publish(id, {
      event: "step.completed",
      data: { step: "projectYearAhead", payload },
    })

    if (markCheckInScheduled(id)) {
      const delayMs = Number(process.env.COMPANION_CHECKIN_DELAY_MS ?? 30000)
      try {
        await start(checkInTimerWorkflow, [id, delayMs])
      } catch (err) {
        console.warn("[companion api] failed to start check-in timer workflow:", err)
      }
    }
    return NextResponse.json({ step: "projectYearAhead", payload })
  }

  if (body.step === "scheduledCheckIn") {
    setStep(id, "scheduledCheckIn")
    const refreshed = getSession(id)!
    const banner = composeCheckInBanner({
      profile: refreshed.profile,
      rows: refreshed.yearAhead?.rows,
    })
    const checkInPayload: CheckInPayload = {
      firedAt: Date.now(),
      banner: banner.banner,
      detail: banner.detail,
      metricLabel: banner.metricLabel,
      metricValue: banner.metricValue,
    }
    setLastCheckIn(id, checkInPayload)
    publish(id, { event: "step.checkin.fired", data: checkInPayload })
    appendToolCalls(id, [
      {
        id: `tool_${Date.now().toString(36)}`,
        at: Date.now(),
        tool: "scheduled_checkin",
        args: { sessionId: id, source: "simulate" },
      },
    ])
    return NextResponse.json({ step: "scheduledCheckIn", payload: checkInPayload })
  }

  return NextResponse.json({ error: "unknown step" }, { status: 400 })
}
