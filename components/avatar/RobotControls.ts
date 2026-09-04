"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { AvatarRobotState } from "./RobotAnimations";

interface AvatarRobotControls {
  state: AvatarRobotState;
  setState: (s: AvatarRobotState) => void;
  onCallStarted: () => void;
  onCallEnding: () => void;
  onUserSentMessage: () => void;
  onAiResponseReceived: () => void;
}

export function useAvatarRobotControls(
  isSpeaking: boolean,
): AvatarRobotControls {
  const [state, setState] = useState<AvatarRobotState>("idle");
  const stateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasSpeaking = useRef(false);
  const userJustSent = useRef(false);

  const clearTimer = useCallback(() => {
    if (stateTimer.current) {
      clearTimeout(stateTimer.current);
      stateTimer.current = null;
    }
  }, []);

  const scheduleReturnToIdle = useCallback(
    (delayMs: number) => {
      clearTimer();
      stateTimer.current = setTimeout(() => {
        setState("idle");
        stateTimer.current = null;
      }, delayMs);
    },
    [clearTimer],
  );

  useEffect(() => {
    if (isSpeaking && !wasSpeaking.current) {
      clearTimer();
      setState("speaking");
    } else if (!isSpeaking && wasSpeaking.current) {
      if (state === "speaking") {
        scheduleReturnToIdle(300);
      }
    }
    wasSpeaking.current = isSpeaking;
  }, [isSpeaking, state, clearTimer, scheduleReturnToIdle]);

  const onCallStarted = useCallback(() => {
    clearTimer();
    setState("greeting");
    scheduleReturnToIdle(2500);
  }, [clearTimer, scheduleReturnToIdle]);

  const onCallEnding = useCallback(() => {
    clearTimer();
    setState("goodbye");
    scheduleReturnToIdle(2000);
  }, [clearTimer, scheduleReturnToIdle]);

  const onUserSentMessage = useCallback(() => {
    if (isSpeaking) return;
    userJustSent.current = true;
    clearTimer();
    setState("listening");
  }, [isSpeaking, clearTimer]);

  const onAiResponseReceived = useCallback(() => {
    if (isSpeaking) return;
    if (userJustSent.current) {
      userJustSent.current = false;
      clearTimer();
      setState("thinking");
    }
  }, [isSpeaking, clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    state,
    setState,
    onCallStarted,
    onCallEnding,
    onUserSentMessage,
    onAiResponseReceived,
  };
}
