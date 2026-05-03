"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface SpeakOptions {
  lang?: string
  rate?: number // 0.1..10 — we keep 0.7..1.1 for natural pacing
  pitch?: number
}

export function useSpeechSynthesis() {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    setSupported(typeof window.speechSynthesis !== "undefined")
  }, [])

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = opts.lang ?? "en-US"
      u.rate = opts.rate ?? 0.95
      u.pitch = opts.pitch ?? 1
      u.onstart = () => setSpeaking(true)
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      utteranceRef.current = u
      window.speechSynthesis.speak(u)
    },
    []
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

  return { supported, speaking, speak, slowDown, pause, resume, cancel }
}
