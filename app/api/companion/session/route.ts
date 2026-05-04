import { NextResponse } from "next/server"
import { createSession } from "@/lib/agent/session-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  const state = createSession()
  return NextResponse.json({ sessionId: state.sessionId, currentStep: state.currentStep })
}
