import Link from "next/link"
import { Button } from "@/components/ui/button"

export function SiteNav() {
  return (
    <header className="w-full border-b border-border/60 bg-background/70 backdrop-blur-sm sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Riad home">
          <RiadMark />
          <span className="font-serif text-xl tracking-tight text-foreground">Riad</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link href="#pillars" className="hover:text-foreground transition-colors">
            How it works
          </Link>
          <Link href="#walkthrough" className="hover:text-foreground transition-colors">
            A day with Riad
          </Link>
          <Link href="#for-hr" className="hover:text-foreground transition-colors">
            For HR
          </Link>
        </nav>
        <Button asChild className="rounded-full px-5">
          <Link href="/companion">Begin the conversation</Link>
        </Button>
      </div>
    </header>
  )
}

function RiadMark() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        {/* Eight-point star, a nod to zellige */}
        <path d="M12 2 L14 8 L20 6 L18 12 L22 14 L16 16 L14 22 L12 18 L10 22 L8 16 L2 14 L6 12 L4 6 L10 8 Z" />
      </svg>
    </span>
  )
}
