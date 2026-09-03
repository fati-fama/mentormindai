export function CosmicBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={
        className ??
        "fixed inset-0 z-[-1] overflow-hidden pointer-events-none"
      }
    >
      {/* Radial gradient blooms */}
      <div
        className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgb(139 92 246 / 0.15) 0%, transparent 70%)",
          animation: "mentormind-glow-pulse 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-1/4 -right-1/4 w-[50%] h-[50%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgb(34 211 238 / 0.10) 0%, transparent 70%)",
          animation: "mentormind-glow-pulse 10s ease-in-out infinite 2s",
        }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-[40%] h-[40%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgb(99 102 241 / 0.08) 0%, transparent 70%)",
          animation: "mentormind-glow-pulse 12s ease-in-out infinite 4s",
        }}
      />

      {/* CSS-only stars — hardcoded positions, no Math.random */}
      <div className="absolute inset-0">
        {STARS.map((star, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              width: star.size,
              height: star.size,
              top: star.top,
              left: star.left,
              opacity: star.opacity,
              animation: `mentormind-twinkle ${star.duration}s ease-in-out infinite ${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Floating bubbles — translucent glass circles drifting across the page */}
      {BUBBLES.map((b, i) => (
        <div
          key={`bubble-${i}`}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: `radial-gradient(circle at 35% 35%, ${b.highlight}, ${b.fill})`,
            border: `1px solid ${b.border}`,
            boxShadow: b.glow ? `0 0 ${b.glow * 2}px ${b.glowColor}, inset 0 0 ${b.glow}px ${b.glowColor}` : undefined,
            animation: `${b.animation} ${b.duration}s ease-in-out infinite ${b.delay}s`,
            willChange: "transform",
          }}
        />
      ))}

      {/* Drifting orbs */}
      {ORBS.map((o, i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: o.size,
            height: o.size,
            top: o.top,
            left: o.left,
            backgroundColor: o.color,
            animation: `mentormind-drift ${o.duration}s ease-in-out infinite ${o.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

const STARS = [
  { top: "5%", left: "12%", size: "1px", opacity: 0.6, duration: 3, delay: 0 },
  { top: "8%", left: "45%", size: "1.5px", opacity: 0.8, duration: 4, delay: 1 },
  { top: "12%", left: "78%", size: "1px", opacity: 0.5, duration: 3.5, delay: 0.5 },
  { top: "15%", left: "30%", size: "2px", opacity: 0.7, duration: 5, delay: 2 },
  { top: "20%", left: "62%", size: "1px", opacity: 0.4, duration: 3, delay: 1.5 },
  { top: "22%", left: "88%", size: "1.5px", opacity: 0.6, duration: 4.5, delay: 0 },
  { top: "28%", left: "5%", size: "1px", opacity: 0.5, duration: 3, delay: 3 },
  { top: "32%", left: "50%", size: "2px", opacity: 0.8, duration: 5, delay: 1 },
  { top: "35%", left: "22%", size: "1px", opacity: 0.4, duration: 4, delay: 2.5 },
  { top: "38%", left: "72%", size: "1.5px", opacity: 0.7, duration: 3.5, delay: 0.5 },
  { top: "42%", left: "92%", size: "1px", opacity: 0.5, duration: 4, delay: 1 },
  { top: "45%", left: "38%", size: "2px", opacity: 0.6, duration: 5, delay: 3 },
  { top: "48%", left: "8%", size: "1px", opacity: 0.4, duration: 3.5, delay: 0 },
  { top: "52%", left: "55%", size: "1.5px", opacity: 0.7, duration: 4, delay: 2 },
  { top: "55%", left: "82%", size: "1px", opacity: 0.5, duration: 3, delay: 1.5 },
  { top: "58%", left: "18%", size: "2px", opacity: 0.8, duration: 5, delay: 0.5 },
  { top: "62%", left: "68%", size: "1px", opacity: 0.4, duration: 4.5, delay: 3 },
  { top: "65%", left: "42%", size: "1.5px", opacity: 0.6, duration: 3.5, delay: 1 },
  { top: "68%", left: "95%", size: "1px", opacity: 0.5, duration: 4, delay: 2.5 },
  { top: "72%", left: "28%", size: "2px", opacity: 0.7, duration: 5, delay: 0 },
  { top: "75%", left: "58%", size: "1px", opacity: 0.4, duration: 3, delay: 1.5 },
  { top: "78%", left: "75%", size: "1.5px", opacity: 0.6, duration: 4, delay: 3 },
  { top: "82%", left: "10%", size: "1px", opacity: 0.5, duration: 3.5, delay: 0.5 },
  { top: "85%", left: "48%", size: "2px", opacity: 0.8, duration: 5, delay: 2 },
  { top: "88%", left: "85%", size: "1px", opacity: 0.4, duration: 4.5, delay: 1 },
  { top: "92%", left: "35%", size: "1.5px", opacity: 0.7, duration: 3, delay: 0 },
  { top: "95%", left: "65%", size: "1px", opacity: 0.5, duration: 4, delay: 2.5 },
] as const;

const BUBBLES = [
  { top: "8%", left: "15%", size: "36px", fill: "rgb(139 92 246 / 0.12)", border: "rgb(139 92 246 / 0.25)", highlight: "rgb(167 139 250 / 0.20)", glow: 10, glowColor: "rgb(139 92 246 / 0.30)", animation: "mentormind-bubble-drift", duration: 38, delay: 0 },
  { top: "20%", left: "75%", size: "28px", fill: "rgb(34 211 238 / 0.10)", border: "rgb(34 211 238 / 0.22)", highlight: "rgb(103 232 249 / 0.18)", glow: 8, glowColor: "rgb(34 211 238 / 0.28)", animation: "mentormind-bubble-drift", duration: 42, delay: 3 },
  { top: "45%", left: "40%", size: "48px", fill: "rgb(139 92 246 / 0.10)", border: "rgb(139 92 246 / 0.22)", highlight: "rgb(196 181 253 / 0.18)", glow: 14, glowColor: "rgb(139 92 246 / 0.25)", animation: "mentormind-bubble-drift", duration: 50, delay: 7 },
  { top: "70%", left: "60%", size: "24px", fill: "rgb(99 102 241 / 0.12)", border: "rgb(99 102 241 / 0.25)", highlight: "rgb(129 140 248 / 0.20)", glow: 0, glowColor: "", animation: "mentormind-bubble-drift", duration: 35, delay: 2 },
  { top: "85%", left: "25%", size: "32px", fill: "rgb(34 211 238 / 0.08)", border: "rgb(34 211 238 / 0.20)", highlight: "rgb(165 243 252 / 0.15)", glow: 8, glowColor: "rgb(34 211 238 / 0.22)", animation: "mentormind-bubble-drift", duration: 45, delay: 10 },
  { top: "30%", left: "88%", size: "20px", fill: "rgb(244 114 182 / 0.10)", border: "rgb(244 114 182 / 0.22)", highlight: "rgb(251 182 206 / 0.18)", glow: 0, glowColor: "", animation: "mentormind-bubble-drift", duration: 32, delay: 5 },
  { top: "55%", left: "8%", size: "42px", fill: "rgb(167 139 250 / 0.10)", border: "rgb(167 139 250 / 0.22)", highlight: "rgb(196 181 253 / 0.18)", glow: 12, glowColor: "rgb(167 139 250 / 0.28)", animation: "mentormind-bubble-drift", duration: 48, delay: 12 },
  { top: "12%", left: "52%", size: "26px", fill: "rgb(99 102 241 / 0.10)", border: "rgb(99 102 241 / 0.22)", highlight: "rgb(165 180 252 / 0.18)", glow: 0, glowColor: "", animation: "mentormind-bubble-drift", duration: 40, delay: 8 },
  { top: "90%", left: "80%", size: "22px", fill: "rgb(34 211 238 / 0.12)", border: "rgb(34 211 238 / 0.25)", highlight: "rgb(103 232 249 / 0.20)", glow: 8, glowColor: "rgb(34 211 238 / 0.25)", animation: "mentormind-bubble-drift", duration: 36, delay: 15 },
  { top: "38%", left: "5%", size: "18px", fill: "rgb(244 114 182 / 0.12)", border: "rgb(244 114 182 / 0.25)", highlight: "rgb(251 182 206 / 0.20)", glow: 0, glowColor: "", animation: "mentormind-bubble-drift", duration: 30, delay: 1 },
  { top: "100%", left: "20%", size: "30px", fill: "rgb(139 92 246 / 0.08)", border: "rgb(139 92 246 / 0.18)", highlight: "rgb(167 139 250 / 0.15)", glow: 10, glowColor: "rgb(139 92 246 / 0.22)", animation: "mentormind-bubble-float", duration: 55, delay: 0 },
  { top: "100%", left: "50%", size: "22px", fill: "rgb(34 211 238 / 0.08)", border: "rgb(34 211 238 / 0.18)", highlight: "rgb(103 232 249 / 0.15)", glow: 0, glowColor: "", animation: "mentormind-bubble-float", duration: 48, delay: 8 },
  { top: "100%", left: "72%", size: "26px", fill: "rgb(167 139 250 / 0.08)", border: "rgb(167 139 250 / 0.18)", highlight: "rgb(196 181 253 / 0.15)", glow: 8, glowColor: "rgb(167 139 250 / 0.22)", animation: "mentormind-bubble-float", duration: 52, delay: 16 },
  { top: "100%", left: "35%", size: "18px", fill: "rgb(244 114 182 / 0.08)", border: "rgb(244 114 182 / 0.18)", highlight: "rgb(251 182 206 / 0.15)", glow: 0, glowColor: "", animation: "mentormind-bubble-float", duration: 45, delay: 22 },
  { top: "100%", left: "88%", size: "34px", fill: "rgb(139 92 246 / 0.08)", border: "rgb(139 92 246 / 0.18)", highlight: "rgb(167 139 250 / 0.15)", glow: 14, glowColor: "rgb(139 92 246 / 0.25)", animation: "mentormind-bubble-float", duration: 60, delay: 5 },
] as const;

const ORBS = [
  { top: "15%", left: "20%", size: "4px", color: "rgb(139 92 246 / 0.30)", duration: 20, delay: 0 },
  { top: "60%", left: "85%", size: "3px", color: "rgb(34 211 238 / 0.25)", duration: 25, delay: 5 },
  { top: "75%", left: "40%", size: "2px", color: "rgb(139 92 246 / 0.20)", duration: 18, delay: 3 },
  { top: "25%", left: "65%", size: "3px", color: "rgb(99 102 241 / 0.28)", duration: 22, delay: 7 },
  { top: "40%", left: "92%", size: "4px", color: "rgb(34 211 238 / 0.22)", duration: 28, delay: 1 },
  { top: "50%", left: "10%", size: "2px", color: "rgb(139 92 246 / 0.25)", duration: 16, delay: 9 },
  { top: "82%", left: "55%", size: "3px", color: "rgb(167 139 250 / 0.30)", duration: 24, delay: 4 },
  { top: "10%", left: "45%", size: "2px", color: "rgb(99 102 241 / 0.22)", duration: 20, delay: 11 },
] as const;
