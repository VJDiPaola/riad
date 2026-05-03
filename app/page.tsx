import { SiteNav } from "@/components/landing/site-nav"
import { Hero } from "@/components/landing/hero"
import { ThreePillars } from "@/components/landing/three-pillars"
import { DemoWalkthrough } from "@/components/landing/demo-walkthrough"
import { ClosingCta } from "@/components/landing/closing-cta"

export default function HomePage() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <SiteNav />
      <Hero />
      <ThreePillars />
      <DemoWalkthrough />
      <ClosingCta />
    </main>
  )
}
