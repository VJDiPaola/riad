import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Mic, Play } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-zellige opacity-40" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pt-16 pb-24 md:grid-cols-[1.1fr_1fr] md:gap-16 md:pt-24 md:pb-32">
        <div className="flex flex-col justify-center">
          <p className="mb-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-px w-8 bg-brass" aria-hidden="true" />
            For employees navigating open enrollment
          </p>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-foreground text-balance md:text-6xl lg:text-7xl">
            Walk through the next{" "}
            <span className="brass-underline italic">twelve months</span> — together.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Riad is a voice-first benefits companion that sits beside you through enrollment and stays for the full
            plan year. Talk through your life. Hear how each plan would land paycheck by paycheck. Decide with someone
            in the room.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="rounded-full px-7 h-12 text-base">
              <Link href="/companion">
                <Mic className="mr-2 h-4 w-4" />
                Begin the conversation
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full px-6 h-12 text-base bg-card/60 border-border"
            >
              <Link href="#walkthrough">
                <Play className="mr-2 h-4 w-4" />
                Hear a 90-second tour
              </Link>
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary presence-pulse" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            Body-double presence — someone in the room with you, not a chatbot
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border shadow-[0_30px_60px_-30px_rgba(80,40,20,0.35)]">
            <Image
              src="/images/riad-courtyard.jpg"
              alt="A sunlit Moroccan riad courtyard seen through a keyhole archway, with carved cedar and zellige tile"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 768px) 40vw, 90vw"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/35 via-transparent to-transparent"
              aria-hidden="true"
            />
            <figcaption className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-card/85 px-4 py-3 backdrop-blur-md">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Mic className="h-4 w-4" />
              </span>
              <p className="text-sm leading-snug text-foreground">
                <span className="font-medium">&quot;So I&apos;m hearing — married, one toddler, daily prescription.</span>{" "}
                <span className="text-muted-foreground">Did I get that right?&quot;</span>
              </p>
            </figcaption>
          </div>

          {/* Floating "I'm here" badge */}
          <div className="absolute -left-4 top-6 hidden rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-lg md:flex md:items-center md:gap-2">
            <span className="h-2 w-2 rounded-full bg-accent presence-pulse" />
            I&apos;m here, take your time
          </div>
        </div>
      </div>
    </section>
  )
}
