"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface SpeakOptions {
  lang?: string
  rate?: number // 0.1..10 — we keep 0.7..1.1 for natural pacing
  pitch?: number
}

export function useSpeechSynthesis() {
  const [supported, setSupported] = useState(false)
  const [voicesReady, setVoicesReady] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const pendingRef = useRef<{ text: string; opts: SpeakOptions } | null>(null)

  // Detect support + load voices (voices load async on most browsers).
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") {
      setSupported(false)
      return
    }
    setSupported(true)

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices()
      voicesRef.current = list
      if (list.length > 0) {
        setVoicesReady(true)
        // If a speak() call was queued before voices arrived, fire it now.
        if (pendingRef.current) {
          const { text, opts } = pendingRef.current
          pendingRef.current = null
          speakInternal(text, opts)
        }
      }
    }

    loadVoices()
    window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", loadVoices)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pickVoice = useCallback((lang: string): SpeechSynthesisVoice | null => {
    const list = voicesRef.current
    if (!list || list.length === 0) return null
    // Prefer exact match, then language-only match, then any English/Spanish fallback.
    const exact = list.find((v) => v.lang?.toLowerCase() === lang.toLowerCase())
    if (exact) return exact
    const base = lang.split("-")[0].toLowerCase()
    const partial = list.find((v) => v.lang?.toLowerCase().startsWith(base))
    if (partial) return partial
    return list[0] ?? null
  }, [])

  const speakInternal = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return
      try {
        // Cancel anything in flight to avoid stuck queues (Chrome quirk).
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        const lang = opts.lang ?? "en-US"
        u.lang = lang
        u.rate = opts.rate ?? 0.95
        u.pitch = opts.pitch ?? 1
        const voice = pickVoice(lang)
        if (voice) u.voice = voice
        u.onstart = () => {
          setSpeaking(true)
          setError(null)
        }
        u.onend = () => setSpeaking(false)
        u.onerror = (e) => {
          // "interrupted" / "canceled" are expected when we cancel mid-utterance — don't surface.
          const err = (e as SpeechSynthesisErrorEvent)?.error
          if (err && err !== "interrupted" && err !== "canceled") {
            console.log("[v0] speech-synthesis error:", err)
            setError(err)
          }
          setSpeaking(false)
        }
        utteranceRef.current = u
        window.speechSynthesis.speak(u)
      } catch (err) {
        console.log("[v0] speech-synthesis exception:", err)
        setError("speak-failed")
      }
    },
    [pickVoice]
  )

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return
      // If voices haven't loaded yet, queue the request and fire it when they do.
      if (!voicesReady && voicesRef.current.length === 0) {
        pendingRef.current = { text, opts }
        // Trigger a voices fetch — some browsers populate lazily.
        window.speechSynthesis.getVoices()
        // Best-effort: also try after a short tick in case voiceschanged never fires (Safari).
        setTimeout(() => {
          if (pendingRef.current) {
            const p = pendingRef.current
            pendingRef.current = null
            speakInternal(p.text, p.opts)
          }
        }, 250)
        return
      }
      speakInternal(text, opts)
    },
    [speakInternal, voicesReady]
  )

  const pause = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.pause()
  }, [])

  const resume = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.resume()
  }, [])

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const slowDown = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      speak(text, { ...opts, rate: 0.78 })
    },
    [speak]
  )

  return { supported, voicesReady, speaking, error, speak, slowDown, pause, resume, cancel }
}
