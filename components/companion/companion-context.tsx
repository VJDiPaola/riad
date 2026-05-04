"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type {
  CheckInPayload,
  CompanionStatus,
  EmployeeProfile,
  Language,
  Phase,
  ToolCallLog,
  TranscriptEntry,
  TranscriptRole,
  YearAheadPayload,
} from "@/lib/companion/types"
import { SAMPLE_PROFILE } from "@/lib/companion/sample-data"
import {
  advance as advanceCall,
  startSession,
  subscribeToSession,
} from "@/lib/companion/session-client"

interface CompanionState {
  phase: Phase
  setPhase: (p: Phase) => void
  language: Language
  setLanguage: (l: Language) => void
  status: CompanionStatus
  setStatus: (s: CompanionStatus) => void
  profile: EmployeeProfile
  updateProfile: (p: Partial<EmployeeProfile>) => void
  transcript: TranscriptEntry[]
  pushTranscript: (role: TranscriptRole, text: string, language?: Language) => void
  clearTranscript: () => void
  selectedPlanId: string | null
  setSelectedPlanId: (id: string | null) => void
  activeScenarioId: string | null
  setActiveScenarioId: (id: string | null) => void
  decisionRationale: string
  setDecisionRationale: (s: string) => void
  // Workflow-driven additions
  sessionId: string | null
  yearAhead: YearAheadPayload | null
  toolCalls: ToolCallLog[]
  checkIn: CheckInPayload | null
  advance: typeof advanceCall
}

const CompanionContext = createContext<CompanionState | null>(null)

const SEED_TRANSCRIPT: TranscriptEntry[] = [
  {
    id: "seed-1",
    role: "riad",
    text: "I'm here whenever you're ready. Tap the mic and tell me about your life — in your own words.",
    at: Date.now(),
    language: "en",
  },
]

export function CompanionProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("interview")
  const [language, setLanguage] = useState<Language>("en")
  const [status, setStatus] = useState<CompanionStatus>("ambient")
  const [profile, setProfile] = useState<EmployeeProfile>({
    ...SAMPLE_PROFILE,
    factors: [],
    expectedEvents: [],
    priorities: [],
  })
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(SEED_TRANSCRIPT)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null)
  const [decisionRationale, setDecisionRationale] = useState<string>("")

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [yearAhead, setYearAhead] = useState<YearAheadPayload | null>(null)
  const [toolCalls, setToolCalls] = useState<ToolCallLog[]>([])
  const [checkIn, setCheckIn] = useState<CheckInPayload | null>(null)
  const subscriptionRef = useRef<{ close: () => void } | null>(null)

  const pushTranscript = useCallback(
    (role: TranscriptRole, text: string, lang?: Language) => {
      const entry: TranscriptEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        text,
        at: Date.now(),
        language: lang ?? language,
      }
      setTranscript((prev) => [...prev, entry])
    },
    [language],
  )

  const updateProfile = useCallback((next: Partial<EmployeeProfile>) => {
    setProfile((prev) => {
      const merged: EmployeeProfile = {
        ...prev,
        ...next,
        factors: next.factors ? mergeFactorsByKey(prev.factors, next.factors) : prev.factors,
        expectedEvents: next.expectedEvents
          ? Array.from(new Set([...(prev.expectedEvents ?? []), ...(next.expectedEvents ?? [])]))
          : prev.expectedEvents,
        priorities: next.priorities
          ? Array.from(new Set([...(prev.priorities ?? []), ...(next.priorities ?? [])]))
          : prev.priorities,
      }
      return merged
    })
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript(SEED_TRANSCRIPT)
  }, [])

  // Bootstrap workflow session on mount.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { sessionId: sid } = await startSession()
        if (cancelled) return
        setSessionId(sid)
        const sub = subscribeToSession(sid, (evt) => {
          if (evt.event === "step.completed") {
            const data = evt.data as { step: string; payload: unknown }
            if (data.step === "projectYearAhead") {
              setYearAhead(data.payload as YearAheadPayload)
            } else if (data.step === "ingestInterview") {
              const payload = data.payload as { profile: EmployeeProfile; summary: string }
              if (payload?.profile) {
                setProfile(payload.profile)
              }
            }
          } else if (evt.event === "step.checkin.fired") {
            setCheckIn(evt.data)
          } else if (evt.event === "tool.call.logged") {
            setToolCalls((prev) => [...prev, evt.data])
          }
        })
        subscriptionRef.current = sub
      } catch (err) {
        console.warn("[companion-context] failed to start session:", err)
      }
    })()
    return () => {
      cancelled = true
      subscriptionRef.current?.close()
      subscriptionRef.current = null
    }
  }, [])

  const value = useMemo<CompanionState>(
    () => ({
      phase,
      setPhase,
      language,
      setLanguage,
      status,
      setStatus,
      profile,
      updateProfile,
      transcript,
      pushTranscript,
      clearTranscript,
      selectedPlanId,
      setSelectedPlanId,
      activeScenarioId,
      setActiveScenarioId,
      decisionRationale,
      setDecisionRationale,
      sessionId,
      yearAhead,
      toolCalls,
      checkIn,
      advance: advanceCall,
    }),
    [
      phase,
      language,
      status,
      profile,
      transcript,
      selectedPlanId,
      activeScenarioId,
      decisionRationale,
      sessionId,
      yearAhead,
      toolCalls,
      checkIn,
      updateProfile,
      pushTranscript,
      clearTranscript,
    ],
  )

  return <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>
}

function mergeFactorsByKey(
  prev: EmployeeProfile["factors"],
  next: EmployeeProfile["factors"],
): EmployeeProfile["factors"] {
  const map = new Map(prev.map((f) => [f.key, f]))
  for (const f of next) map.set(f.key, f)
  return Array.from(map.values())
}

export function useCompanion(): CompanionState {
  const ctx = useContext(CompanionContext)
  if (!ctx) throw new Error("useCompanion must be used inside CompanionProvider")
  return ctx
}
