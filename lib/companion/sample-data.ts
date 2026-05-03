import type { Plan, YearEvent, ScenarioOverride, EmployeeProfile } from "./types"

export const PLAN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

export const PLANS: Plan[] = [
  {
    id: "argan-ppo",
    name: "Argan PPO",
    kind: "PPO",
    monthlyPremium: 312,
    deductible: 750,
    oopMax: 4000,
    prescriptionCopay: 15,
    blurb: "Higher monthly cost, lower surprise. Predictable copays for prescriptions and visits.",
    badge: "Steady, predictable",
  },
  {
    id: "atlas-hdhp",
    name: "Atlas HDHP + HSA",
    kind: "HDHP+HSA",
    monthlyPremium: 168,
    deductible: 3200,
    oopMax: 6500,
    prescriptionCopay: 0, // subject to deductible
    hsaContribution: 1200,
    blurb: "Lower monthly cost, bigger swing if a year goes sideways. Tax-advantaged HSA included.",
    badge: "Flexible, tax-smart",
  },
]

export const BASE_EVENTS: YearEvent[] = [
  // Premium markers happen every month — rendered separately as a continuous bar.
  {
    id: "physical",
    monthIndex: 1,
    label: "Annual physical",
    category: "expected",
    estCostByPlan: { "argan-ppo": 0, "atlas-hdhp": 0 },
    note: "Preventive care — covered at 100% under both plans.",
  },
  {
    id: "prescription-refills",
    monthIndex: 0,
    label: "Daily prescription, monthly refill",
    category: "expected",
    estCostByPlan: { "argan-ppo": 15 * 12, "atlas-hdhp": 38 * 12 },
    note: "Argan PPO: $15 copay × 12. Atlas HDHP: ~$38/month until deductible is met.",
  },
  {
    id: "dental-spring",
    monthIndex: 3,
    label: "Dental cleaning",
    category: "expected",
    estCostByPlan: { "argan-ppo": 0, "atlas-hdhp": 0 },
    note: "Both plans cover two cleanings a year.",
  },
  {
    id: "ob-visit",
    monthIndex: 6,
    label: "Prenatal visit window",
    category: "expected",
    estCostByPlan: { "argan-ppo": 40, "atlas-hdhp": 380 },
    note: "Argan PPO: copay only. Atlas HDHP: counts toward deductible.",
  },
  {
    id: "baby",
    monthIndex: 7,
    label: "Baby due",
    category: "milestone",
    estCostByPlan: { "argan-ppo": 1500, "atlas-hdhp": 3200 },
    note: "Estimated employee responsibility after coverage. Atlas HDHP hits deductible here.",
  },
  {
    id: "fsa-deadline",
    monthIndex: 11,
    label: "FSA spend-down deadline",
    category: "deadline",
    note: "Use FSA balance by Dec 31 or forfeit it.",
  },
  {
    id: "open-enrollment",
    monthIndex: 10,
    label: "Next open enrollment",
    category: "deadline",
    note: "Window to re-elect or change plans.",
  },
  {
    id: "er-possible",
    monthIndex: 4,
    label: "Possible ER visit",
    category: "possible",
    estCostByPlan: { "argan-ppo": 250, "atlas-hdhp": 2400 },
    note: "Rough-year scenario. PPO: copay. HDHP: full cost until deductible.",
  },
]

export const SCENARIOS: ScenarioOverride[] = [
  {
    id: "baby-earlier",
    label: "What if the baby comes in June instead of August?",
    events: [
      {
        id: "baby",
        monthIndex: 5,
        label: "Baby due — earlier",
        category: "milestone",
        estCostByPlan: { "argan-ppo": 1500, "atlas-hdhp": 3200 },
        note: "Same costs, two months earlier. Both plans front-load the spend.",
      },
      {
        id: "ob-visit",
        monthIndex: 4,
        label: "Prenatal visit window — earlier",
        category: "expected",
        estCostByPlan: { "argan-ppo": 40, "atlas-hdhp": 380 },
      },
    ],
  },
  {
    id: "rough-year",
    label: "What if it's a rough year — one ER visit and weekly therapy?",
    events: [
      {
        id: "er-possible",
        monthIndex: 4,
        label: "ER visit",
        category: "expected",
        estCostByPlan: { "argan-ppo": 250, "atlas-hdhp": 2400 },
      },
      {
        id: "therapy",
        monthIndex: 2,
        label: "Weekly therapy starts",
        category: "expected",
        estCostByPlan: { "argan-ppo": 30 * 40, "atlas-hdhp": 110 * 40 },
        note: "Until deductible is met, Atlas HDHP charges full session fee.",
      },
    ],
  },
  {
    id: "quiet-year",
    label: "What if I barely use my benefits?",
    events: [
      {
        id: "baby",
        monthIndex: 7,
        label: "Baby due (still happens)",
        category: "milestone",
        estCostByPlan: { "argan-ppo": 1500, "atlas-hdhp": 3200 },
      },
      {
        id: "er-possible",
        monthIndex: 4,
        label: "No ER visit",
        category: "possible",
        estCostByPlan: { "argan-ppo": 0, "atlas-hdhp": 0 },
        note: "Removed from projection.",
      },
    ],
  },
]

export const SAMPLE_PROFILE: EmployeeProfile = {
  name: "Maya",
  location: "New York, NY",
  coverageScope: "family",
  hasSpouseCoverageElsewhere: false,
  recurringPrescription: true,
  expectedEvents: ["Baby due in August", "Daily prescription", "Routine prenatal visits"],
  priorities: ["No surprise bills", "Keep current OB", "Predictable monthly cost"],
  language: "en",
  factors: [
    { key: "marital", label: "Marital status", value: "Married", confidence: "spoken" },
    { key: "deps", label: "Dependents", value: "1 toddler, expecting baby Aug", confidence: "spoken" },
    { key: "spouse", label: "Spouse coverage", value: "Not covered elsewhere", confidence: "confirmed" },
    { key: "rx", label: "Prescriptions", value: "Daily medication", confidence: "spoken" },
    { key: "priority", label: "Top priority", value: "No surprise bills", confidence: "spoken" },
  ],
}

export const SUGGESTED_PROMPTS_EN = [
  "Walk me through the next 12 months under each plan.",
  "What if the baby comes in June instead of August?",
  "What happens if it's a rough year with one ER visit?",
  "Compare what I'd actually pay each paycheck.",
] as const

export const SUGGESTED_PROMPTS_ES = [
  "Cuéntame cómo se verían los próximos 12 meses con cada plan.",
  "¿Y si el bebé llega en junio en vez de agosto?",
  "¿Qué pasaría si es un año difícil con una visita a urgencias?",
  "Compara lo que pagaría en cada cheque.",
] as const

export function totalAnnualPremium(monthlyPremium: number) {
  return monthlyPremium * 12
}

export function biweeklyDeduction(monthlyPremium: number) {
  // Roughly: monthly * 12 / 26 paychecks
  return Math.round(((monthlyPremium * 12) / 26) * 100) / 100
}
