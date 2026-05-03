import { Mic, Users, CalendarRange } from "lucide-react"

const pillars = [
  {
    icon: Mic,
    eyebrow: "Pillar one",
    title: "Speak, don't fill out forms",
    body: "Tap once and tell Riad about your life in your own words — in English, Spanish, or another first language. Riad reflects what it heard before anything is saved.",
    detail: ["Push-to-talk life interview", "Hands-free mode for caregivers and commuters", "Multilingual voice in and out"],
  },
  {
    icon: Users,
    eyebrow: "Pillar two",
    title: "Someone in the room with you",
    body: "Riad doesn't disappear when the wizard ends. A persistent companion stays beside you — through enrollment, through your first paycheck, through the year.",
    detail: ["Pause, slow down, let me think", "Soft \"I'm here\" presence cue", "Warm handoff to a real HR person, in the same session"],
  },
  {
    icon: CalendarRange,
    eyebrow: "Pillar three",
    title: "Rehearse the next twelve months",
    body: "See every paycheck deduction, every known deadline, every likely event laid out for each plan you're considering. Live with the year before you commit to it.",
    detail: ["Paycheck-by-paycheck projection", "Scenario rewind: \"what if a baby comes in March?\"", "A regret check before you submit"],
  },
] as const

export function ThreePillars() {
  return (
    <section id="pillars" className="relative border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">How Riad is different</p>
          <h2 className="font-serif text-4xl leading-tight tracking-tight text-foreground text-balance md:text-5xl">
            Three shifts that put the employee back in the room.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((p) => {
            const Icon = p.icon
            return (
              <article
                key={p.title}
                className="group relative flex flex-col rounded-2xl border border-border bg-card p-7 transition-shadow hover:shadow-[0_20px_40px_-24px_rgba(80,40,20,0.35)]"
              >
                <div className="mb-6 flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{p.eyebrow}</span>
                </div>
                <h3 className="font-serif text-2xl leading-snug tracking-tight text-foreground text-balance">
                  {p.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground text-pretty">{p.body}</p>
                <ul className="mt-6 space-y-2.5 border-t border-border pt-5">
                  {p.detail.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-sm text-foreground">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brass" />
                      <span className="leading-relaxed">{d}</span>
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
