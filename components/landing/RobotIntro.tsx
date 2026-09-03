"use client";

import { Component, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { WhiteRobot } from "@/components/robot/WhiteRobot";
import { SpeechBubble } from "./SpeechBubble";

const SESSION_KEY = "mentormind-intro-seen";
const TOTAL_DURATION = 4500;

type Step = 1 | 2 | 3 | 4;

class IntroErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.props.children;
  }
}

function IntroOverlay({ onDone, skip }: { onDone: () => void; skip: boolean }) {
  const [step, setStep] = useState<Step>(1);
  const prefersReduced = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  }, []);

  useEffect(() => {
    if (skip || prefersReduced) {
      onDone();
      return;
    }

    const schedule = (fn: () => void, ms: number) => {
      timerRef.current.push(setTimeout(fn, ms));
    };

    schedule(() => setStep(2), 700);
    schedule(() => setStep(3), 1800);
    schedule(() => {
      setStep(4);
      onDone();
    }, TOTAL_DURATION);

    return clearTimers;
  }, [skip, prefersReduced, onDone, clearTimers]);

  if (skip) return null;

  const robotVariants = {
    hidden: { y: "110vh", opacity: 0 },
    emerge: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 120, damping: 14 } },
  };

  const overlayVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0, transition: { duration: 0.6 } },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      variants={overlayVariants}
      initial="visible"
      animate={step >= 4 ? "hidden" : "visible"}
      onAnimationComplete={() => {
        if (step >= 4) onDone();
      }}
    >
      <div className="relative flex flex-col items-center gap-4">
        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3 }}
            >
              <SpeechBubble>
                <span className="text-lg font-semibold">Hi!</span>
              </SpeechBubble>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={robotVariants}
          initial="hidden"
          animate={step >= 1 ? "emerge" : "hidden"}
        >
          <WhiteRobot
            mood="HAPPY"
            className="h-48 w-48 drop-shadow-xl sm:h-56 sm:w-56"
          />
        </motion.div>

        <AnimatePresence>
          {step >= 3 && step < 4 && (
            <motion.div
              initial={{ opacity: 0, x: 0, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <img
                src="/mascot/mentormind-logo.png"
                alt="MentorMind AI"
                className="h-16 w-16 rounded-2xl shadow-lg sm:h-20 sm:w-20"
              />
              <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                MentorMind{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, var(--brand), var(--accent))" }}>
                  AI
                </span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const noopSubscribe = () => () => {};
const getServerSnapshot = () => false;

function getSessionSnapshot() {
  try {
    return sessionStorage.getItem(SESSION_KEY) !== null;
  } catch {
    return false;
  }
}

export function RobotIntro({ children }: { children: ReactNode }) {
  const previouslySeen = useSyncExternalStore(noopSubscribe, getSessionSnapshot, getServerSnapshot);
  const [introDone, setIntroDone] = useState(previouslySeen);

  const handleDone = useCallback(() => {
    setIntroDone(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  return (
    <IntroErrorBoundary>
      {!introDone && <IntroOverlay onDone={handleDone} skip={false} />}
      {children}
    </IntroErrorBoundary>
  );
}
