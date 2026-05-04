"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseSpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
}

export type MicPermissionState = "unknown" | "prompt" | "granted" | "denied" | "unavailable"

interface UseSpeechRecognitionReturn {
  supported: boolean
  listening: boolean
  interim: string
  finalTranscript: string
  error: string | null
  permission: MicPermissionState
  start: () => Promise<void>
  stop: () => void
  reset: () => void
  requestPermission: () => Promise<MicPermissionState>
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
  onerror: ((this: unknown, ev: SpeechRecognitionErrorLike) => void) | null
  onresult: ((this: unknown, ev: SpeechRecognitionEventLike) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function friendlyError(code: string | undefined): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "mic-blocked"
    case "no-speech":
      return "no-speech"
    case "audio-capture":
      return "no-mic"
    case "network":
      return "network"
    case "aborted":
      return "aborted"
    default:
      return code || "unknown"
  }
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
  const [permission, setPermission] = useState<MicPermissionState>("unknown")
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const Ctor =
      // @ts-expect-error - vendor prefixed Web Speech API
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) {
      setSupported(false)
      setPermission("unavailable")
      return
    }
    setSupported(true)
    const rec: SpeechRecognitionLike = new Ctor()
    rec.lang = lang
    rec.continuous = continuous
    rec.interimResults = interimResults

    rec.onstart = () => {
      setListening(true)
      setError(null)
    }
    rec.onend = () => setListening(false)
    rec.onerror = (ev) => {
      const code = friendlyError(ev?.error)
      console.log("[v0] speech-recognition error:", ev?.error, ev?.message)
      setError(code)
      if (code === "mic-blocked") setPermission("denied")
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

    // Best-effort permission probe — not all browsers support `microphone` here.
    try {
      const perms = (navigator as Navigator & { permissions?: { query: (q: { name: string }) => Promise<{ state: string }> } }).permissions
      perms
        ?.query({ name: "microphone" })
        .then((res) => {
          if (res.state === "granted") setPermission("granted")
          else if (res.state === "denied") setPermission("denied")
          else setPermission("prompt")
        })
        .catch(() => {
          // Some browsers throw — leave as unknown
        })
    } catch {
      // ignore
    }

    return () => {
      try {
        rec.abort()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
  }, [lang, continuous, interimResults])

  const requestPermission = useCallback(async (): Promise<MicPermissionState> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermission("unavailable")
      return "unavailable"
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Immediately stop tracks — we only needed the permission grant.
      stream.getTracks().forEach((t) => t.stop())
      setPermission("granted")
      setError(null)
      return "granted"
    } catch (err) {
      console.log("[v0] getUserMedia error:", err)
      setPermission("denied")
      setError("mic-blocked")
      return "denied"
    }
  }, [])

  const start = useCallback(async () => {
    setError(null)
    setInterim("")
    // If we don't yet know whether we have permission, request it first so the
    // browser surfaces a real prompt instead of failing silently.
    if (permission !== "granted") {
      const next = await requestPermission()
      if (next !== "granted") return
    }
    try {
      recognitionRef.current?.start()
    } catch {
      // already started — ignore
    }
  }, [permission, requestPermission])

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

  return {
    supported,
    listening,
    interim,
    finalTranscript,
    error,
    permission,
    start,
    stop,
    reset,
    requestPermission,
  }
}
