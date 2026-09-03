"use client";

import { Component, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Robot } from "@/components/avatar/Robot";

const SESSION_KEY = "mentormind-intro-seen";
const TOTAL_DURATION = 5000;

type Step = 1 | 2 | 3 | 4 | 5 | 6;

class IntroErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.children;
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

    schedule(() => setStep(2), 800);
    schedule(() => setStep(3), 2000);
    schedule(() => setStep(4), 2600);
    schedule(() => setStep(5), 3400);
    schedule(() => {
      setStep(6);
      onDone();
    }, TOTAL_DURATION);

    return clearTimers;
  }, [skip, prefersReduced, onDone, clearTimers]);

  if (skip) return null;

  const robotVariants = {
    hidden: { y: "110vh", opacity: 0, scale: 1, rotate: 0, x: 0 },
    emerge: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 120, damping: 14 } },
    spinLeft: {
      y: 0,
      opacity: 1,
      x: -120,
      rotate: -360,
      scale: 0.65,
      transition: { duration: 1.2, ease: "easeInOut" as const },
    },
    gone: { opacity: 0, transition: { duration: 0.6 } },
  };

  const logoVariants = {
    hidden: { opacity: 0, x: 40, scale: 0.8 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.8, ease: "easeOut" as const } },
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
      animate={step >= 6 ? "hidden" : "visible"}
      onAnimationComplete={() => {
        if (step >= 6) onDone();
      }}
    >
      <div className="relative flex items-center gap-8">
        <motion.div
          variants={robotVariants}
          initial="hidden"
          animate={
            step >= 6
              ? "gone"
              : step >= 3
                ? "spinLeft"
                : step >= 1
                  ? "emerge"
                  : "hidden"
          }
        >
          <Robot
            mood="HAPPY"
            className="h-48 w-48 drop-shadow-xl sm:h-56 sm:w-56"
            waving={step >= 2 && step < 3}
            winking={step === 5}
          />
        </motion.div>

        <AnimatePresence>
          {step >= 4 && step < 6 && (
            <motion.div
              variants={logoVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              className="flex flex-col items-center gap-2"
            >
              <img
                src="/mascot/mentormind-logo.png"
                alt="MentorMind AI"
                className="h-20 w-20 rounded-2xl shadow-lg sm:h-24 sm:w-24"
              />
              <span className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
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
