"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type {
  CompanionStatus,
  EmployeeProfile,
  Language,
  Phase,
  TranscriptEntry,
  TranscriptRole,
} from "@/lib/companion/types"
import { SAMPLE_PROFILE } from "@/lib/companion/sample-data"

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
    [language]
  )

  const updateProfile = useCallback((next: Partial<EmployeeProfile>) => {
    setProfile((prev) => {
      const merged: EmployeeProfile = {
        ...prev,
        ...next,
        factors: next.factors
          ? mergeFactorsByKey(prev.factors, next.factors)
          : prev.factors,
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
      updateProfile,
      pushTranscript,
      clearTranscript,
    ]
  )

  return <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>
}

function mergeFactorsByKey(
  prev: EmployeeProfile["factors"],
  next: EmployeeProfile["factors"]
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
