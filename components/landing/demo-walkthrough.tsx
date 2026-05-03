import Image from "next/image"

const beats = [
  {
    moment: "On the subway, Tuesday",
    quote: "\"Estoy casada, tengo una hija, y espero otro bebé en agosto.\"",
    note: "Riad runs the life interview hands-free, in Spanish. It reflects what it heard before anything is saved.",
  },
  {
    moment: "Lunch break, Wednesday",
    quote: "\"What if the baby comes in June instead of August?\"",
    note: "The twelve-month timeline re-renders in real time. Premiums, deductibles, and the likely-vs-rough year update for each plan.",
  },
  {
    moment: "Tuesday night, on the couch",
    quote: "\"Let me think. Come back to this tomorrow.\"",
    note: "The companion stays present, ambient. No timeouts. No re-prompts. The session resumes exactly where she left off.",
  },
  {
    moment: "Two months later",
    quote: "\"Your first paycheck deduction was $184. That matches what we projected.\"",
    note: "A scheduled check-in fires. Riad nudges her about the prenatal visit she hasn't booked — already a covered benefit.",
  },
] as const

export function DemoWalkthrough() {
  return (
    <section id="walkthrough" className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid gap-14 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <div className="flex flex-col">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">A day with Riad</p>
            <h2 className="font-serif text-4xl leading-tight tracking-tight text-foreground text-balance md:text-5xl">
              Maya, a new hire in NYC, decides without leaving her commute.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground text-pretty">
              Married, one toddler, expecting in late summer, daily prescription, primarily Spanish at home, prefers
              her phone with headphones in. The companion meets her where she is.
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl border border-border">
              <div className="relative aspect-square">
                <Image
                  src="/images/zellige-detail.jpg"
                  alt="Close-up of a Moroccan zellige eight-point star tile mosaic in cobalt, terracotta, and cream"
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 35vw, 90vw"
                />
              </div>
            </div>
          </div>

          <ol className="relative flex flex-col gap-8 md:gap-10">
            <span
              aria-hidden="true"
              className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-brass via-border to-transparent"
            />
            {beats.map((b, i) => (
              <li key={b.moment} className="relative pl-12">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card font-serif text-sm text-primary"
                >
                  {i + 1}
                </span>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{b.moment}</p>
                <p className="mt-2 font-serif text-2xl leading-snug text-foreground text-balance">{b.quote}</p>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground text-pretty">{b.note}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
