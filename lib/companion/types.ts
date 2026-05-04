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

export interface ScenarioInjection {
  id: string
  label: string
  shifts?: { eventId: string; toMonthIndex: number }[]
  adds?: YearEvent[]
}

export interface Citation {
  source: string
  snippet: string
  toolCall?: string
}

export interface MonthProjection {
  monthIndex: number
  monthLabel: string
  premium: number
  expectedOOP: number
  hsaFsaFlow: number
  events: YearEvent[]
  cumulative: number
}

export interface ComparisonRow {
  planId: string
  planName: string
  totalAnnual: number
  worstMonth: { monthIndex: number; amount: number }
  paycheckBiweekly: number
  highlights: string[]
}

export interface ProviderSummary {
  name: string
  specialty: string
  zip: string
  inNetwork: boolean
  distanceMiles: number
}

export interface PlanSummary {
  id: string
  name: string
  kind: "PPO" | "HDHP+HSA"
  monthlyPremium: number
  deductible: number
  oopMax: number
  prescriptionCopay: number
  hsaContribution?: number
  preventiveCovered: string[]
  formularyTier: Record<string, "tier1" | "tier2" | "tier3">
}

export interface YearAheadPayload {
  rows: ComparisonRow[]
  months: Record<string, MonthProjection[]>
  narration: string
  citations: Citation[]
}

export interface CheckInPayload {
  firedAt: number
  banner: string
  detail: string
  metricLabel?: string
  metricValue?: string
}

export type WorkflowStep =
  | "idle"
  | "ingestInterview"
  | "projectYearAhead"
  | "scheduledCheckIn"
  | "hrEscalation"

export interface SessionState {
  sessionId: string
  currentStep: WorkflowStep
  profile: EmployeeProfile
  yearAhead?: YearAheadPayload
  lastCheckIn?: CheckInPayload
  toolCalls: ToolCallLog[]
}

export interface ToolCallLog {
  id: string
  at: number
  tool: string
  args: unknown
  citation?: Citation
}

export type AdvanceBody =
  | { step: "ingestInterview"; input: { transcript: string; language: Language } }
  | { step: "projectYearAhead"; input: { scenario?: ScenarioInjection; planIds?: string[] } }
  | { step: "scheduledCheckIn"; input: { simulate: true } }

export interface AdvanceResponse {
  step: WorkflowStep
  payload: unknown
}

export type SessionSSEEvent =
  | { event: "step.completed"; data: { step: WorkflowStep; payload: unknown } }
  | { event: "step.checkin.fired"; data: CheckInPayload }
  | { event: "tool.call.logged"; data: ToolCallLog }
  | { event: "ready"; data: { sessionId: string } }
  | { event: "ping"; data: { at: number } }
