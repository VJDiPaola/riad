export type Phase = "interview" | "year-ahead" | "decision" | "plan-year"

export type Language = "en" | "es"

export type CompanionStatus =
  | "ambient" // here but quiet
  | "listening" // mic open
  | "thinking" // processing
  | "speaking" // narrating
  | "paused" // employee asked to pause

export type TranscriptRole = "you" | "riad" | "system"

export interface TranscriptEntry {
  id: string
  role: TranscriptRole
  text: string
  at: number // unix ms
  language?: Language
}

export interface LifeFactor {
  key: string
  label: string
  value: string
  confidence: "spoken" | "confirmed" | "inferred"
}

export interface EmployeeProfile {
  name?: string
  location?: string
  coverageScope?: "self" | "self+spouse" | "self+kids" | "family"
  hasSpouseCoverageElsewhere?: boolean
  recurringPrescription?: boolean
  expectedEvents?: string[]
  priorities?: string[]
  language: Language
  factors: LifeFactor[]
}

export interface Plan {
  id: string
  name: string
  kind: "PPO" | "HDHP+HSA"
  monthlyPremium: number // employee share, monthly
  deductible: number
  oopMax: number
  prescriptionCopay: number
  hsaContribution?: number
  blurb: string
  badge: string
}

export interface YearEvent {
  id: string
  monthIndex: number // 0..11 from plan start
  label: string
  category: "premium" | "expected" | "possible" | "deadline" | "milestone"
  estCostByPlan?: Record<string, number>
  note?: string
}

export interface ScenarioOverride {
  id: string
  label: string
  events: YearEvent[]
}
