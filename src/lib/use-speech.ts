/**
 * Web Speech API wrapper (Hindi first).
 * Browser-only: every access is inside effects/handlers so SSR stays safe.
 * If the browser has no speech recognition, `supported` is false and the UI
 * falls back to a manual text box.
 */
import { useCallback, useEffect, useRef, useState } from "react";

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

export function useSpeech(lang = "hi-IN") {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Rec | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i]?.[0]?.transcript ?? "";
      setTranscript(text);
    };
    rec.onerror = (e) => {
      setError(e.error === "not-allowed" ? "Microphone ki permission dijiye" : "Awaaz samajh nahi aayi");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    };
  }, [lang]);

  const start = useCallback(() => {
    setError(null);
    setTranscript("");
    try {
      recRef.current?.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  return { supported, listening, transcript, error, start, stop, setTranscript };
}
