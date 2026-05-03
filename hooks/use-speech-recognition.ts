"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseSpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
}

interface UseSpeechRecognitionReturn {
  supported: boolean
  listening: boolean
  interim: string
  finalTranscript: string
  error: string | null
  start: () => void
  stop: () => void
  reset: () => void
}

// Minimal typing for the Web Speech API since TS doesn't include it by default.
type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string }
  }>
}

type SpeechRecognitionErrorLike = { error?: string; message?: string }

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: ((this: unknown, ev: Event) => void) | null
  onend: ((this: unknown, ev: Event) => void) | null
  onerror:
    | ((this: unknown, ev: SpeechRecognitionErrorLike) => void)
    | null
  onresult:
    | ((this: unknown, ev: SpeechRecognitionEventLike) => void)
    | null
  start: () => void
  stop: () => void
  abort: () => void
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang = "en-US", continuous = false, interimResults = true } = options

  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState("")
  const [finalTranscript, setFinalTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const Ctor =
      // @ts-expect-error - vendor prefixed Web Speech API
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) {
      setSupported(false)
      return
    }
    setSupported(true)
    const rec: SpeechRecognitionLike = new Ctor()
    rec.lang = lang
    rec.continuous = continuous
    rec.interimResults = interimResults

    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = (ev) => {
      setError(ev?.error || ev?.message || "speech-error")
      setListening(false)
    }
    rec.onresult = (ev) => {
      let interimText = ""
      let finalText = ""
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const result = ev.results[i]
        const t = result[0].transcript
        if (result.isFinal) finalText += t
        else interimText += t
      }
      if (interimText) setInterim(interimText)
      if (finalText) {
        setFinalTranscript((prev) => (prev ? `${prev} ${finalText}`.trim() : finalText.trim()))
        setInterim("")
      }
    }
    recognitionRef.current = rec
    return () => {
      try {
        rec.abort()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
  }, [lang, continuous, interimResults])

  const start = useCallback(() => {
    setError(null)
    setInterim("")
    try {
      recognitionRef.current?.start()
    } catch {
      // already started — ignore
    }
  }, [])

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // ignore
    }
  }, [])

  const reset = useCallback(() => {
    setInterim("")
    setFinalTranscript("")
    setError(null)
  }, [])

  return { supported, listening, interim, finalTranscript, error, start, stop, reset }
}
