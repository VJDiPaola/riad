import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mic } from "lucide-react"

export function ClosingCta() {
  return (
    <section id="for-hr" className="relative border-t border-border">
      <div className="bg-zellige-dense">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            The next election is twelve months away
          </p>
          <h2 className="font-serif text-4xl leading-tight tracking-tight text-foreground text-balance md:text-6xl">
            Don&apos;t decide alone.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Riad gives every employee a calm, voice-first companion that body-doubles them through enrollment and
            stays present for the full plan year — with HR one warm handoff away.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
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
              className="rounded-full px-6 h-12 text-base bg-card/60"
            >
              <Link href="/companion?role=hr">For HR teams</Link>
            </Button>
          </div>
        </div>
      </div>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-7 text-xs text-muted-foreground">
          <span>Riad — a benefits companion concept.</span>
          <span>Voice-first. Body-doubling. Twelve months at a time.</span>
        </div>
      </footer>
    </section>
  )
}
