import { EventEmitter } from "node:events"
import type {
  CheckInPayload,
  EmployeeProfile,
  SessionSSEEvent,
  SessionState,
  ToolCallLog,
  WorkflowStep,
  YearAheadPayload,
} from "@/lib/companion/types"

const sessions = new Map<string, SessionState>()
const buses = new Map<string, EventEmitter>()
const checkinFlags = new Map<string, boolean>()

const EMPTY_PROFILE: EmployeeProfile = {
  language: "en",
  factors: [],
  expectedEvents: [],
  priorities: [],
}

export function createSession(): SessionState {
  const sessionId = `session_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`
  const state: SessionState = {
    sessionId,
    currentStep: "idle",
    profile: { ...EMPTY_PROFILE },
    toolCalls: [],
  }
  sessions.set(sessionId, state)
  buses.set(sessionId, new EventEmitter())
  return state
}

export function getSession(sessionId: string): SessionState | undefined {
  return sessions.get(sessionId)
}

export function listSessions(): string[] {
  return Array.from(sessions.keys())
}

function ensureBus(sessionId: string): EventEmitter {
  let bus = buses.get(sessionId)
  if (!bus) {
    bus = new EventEmitter()
    buses.set(sessionId, bus)
  }
  return bus
}

export function subscribe(
  sessionId: string,
  handler: (event: SessionSSEEvent) => void,
): () => void {
  const bus = ensureBus(sessionId)
  const wrapped = (e: SessionSSEEvent) => handler(e)
  bus.on("event", wrapped)
  return () => bus.off("event", wrapped)
}

export function publish(sessionId: string, event: SessionSSEEvent): void {
  ensureBus(sessionId).emit("event", event)
}

export function setStep(sessionId: string, step: WorkflowStep): void {
  const state = sessions.get(sessionId)
  if (!state) return
  state.currentStep = step
}

export function setProfile(sessionId: string, profile: EmployeeProfile): void {
  const state = sessions.get(sessionId)
  if (!state) return
  state.profile = profile
}

export function setYearAhead(sessionId: string, payload: YearAheadPayload): void {
  const state = sessions.get(sessionId)
  if (!state) return
  state.yearAhead = payload
}

export function setLastCheckIn(sessionId: string, payload: CheckInPayload): void {
  const state = sessions.get(sessionId)
  if (!state) return
  state.lastCheckIn = payload
}

export function appendToolCalls(sessionId: string, logs: ToolCallLog[]): void {
  const state = sessions.get(sessionId)
  if (!state) return
  state.toolCalls.push(...logs)
  for (const log of logs) {
    publish(sessionId, { event: "tool.call.logged", data: log })
  }
}

export function markCheckInScheduled(sessionId: string): boolean {
  if (checkinFlags.get(sessionId)) return false
  checkinFlags.set(sessionId, true)
  return true
}

export function clearCheckInScheduled(sessionId: string): void {
  checkinFlags.delete(sessionId)
}
