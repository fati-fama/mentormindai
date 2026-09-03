"use client";

import { motion } from "framer-motion";

const ITEMS = [
  {
    label: "Laptop",
    top: "10%",
    left: "8%",
    delay: 0,
    duration: 6,
    svg: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    label: "Book",
    top: "20%",
    right: "10%",
    delay: 1.5,
    duration: 7,
    svg: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" />
      </svg>
    ),
  },
  {
    label: "Pencil",
    bottom: "25%",
    left: "12%",
    delay: 3,
    duration: 5.5,
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5z" />
      </svg>
    ),
  },
  {
    label: "Calculator",
    bottom: "20%",
    right: "8%",
    delay: 2,
    duration: 6.5,
    svg: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="8" y2="10" />
        <line x1="12" y1="10" x2="12" y2="10" />
        <line x1="16" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="8" y2="14" />
        <line x1="12" y1="14" x2="12" y2="14" />
        <line x1="16" y1="14" x2="16" y2="14" />
        <line x1="8" y1="18" x2="16" y2="18" />
      </svg>
    ),
  },
];

export function FloatingStudyItems() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {ITEMS.map((item) => (
        <motion.div
          key={item.label}
          className="absolute text-ink-faint/40"
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
          }}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {item.svg}
        </motion.div>
      ))}
    </div>
  );
}
