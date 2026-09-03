"use client";

import { useState, useRef, useCallback, useEffect } from "react";

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/---+/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    utteranceRef.current = null;
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;
      cancel();
      const cleaned = stripMarkdown(text);
      if (!cleaned) return;
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => {
        setSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setSpeaking(false);
        utteranceRef.current = null;
      };
      utteranceRef.current = utterance;
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [supported, cancel],
  );

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { supported, speaking, speak, cancel };
}
