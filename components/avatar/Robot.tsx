import { cn } from "@/utils";

export type RobotMood = "HAPPY" | "NEUTRAL" | "SAD";

type RobotProps = {
  mood?: RobotMood;
  className?: string;
  waving?: boolean;
  winking?: boolean;
  avatarColor?: string;
};

const HIGHLIGHT = "#A78BFA";
const GLOW = "#C4B5FD";
const DARK = "#3B0764";
const WHITE = "#F5F3FF";

export function Robot({
  mood = "NEUTRAL",
  className,
  waving = false,
  winking = false,
  avatarColor = "#7C3AED",
}: RobotProps) {
  const mouthPath =
    mood === "HAPPY"
      ? "M88 128 Q100 140 112 128"
      : mood === "SAD"
        ? "M88 134 Q100 124 112 134"
        : "M88 132 Q100 132 112 132";

  const leftEyePath =
    mood === "HAPPY"
      ? "M74 104 Q82 94 90 104 Q82 110 74 104 Z"
      : mood === "SAD"
        ? "M74 106 Q82 100 90 106 Q82 112 74 106 Z"
        : "M74 104 Q82 96 90 104 Q82 112 74 104 Z";

  const rightEyePath =
    mood === "HAPPY"
      ? "M110 104 Q118 94 126 104 Q118 110 110 104 Z"
      : mood === "SAD"
        ? "M110 106 Q118 100 126 106 Q118 112 110 106 Z"
        : "M110 104 Q118 96 126 104 Q118 112 110 104 Z";

  const browLeft =
    mood === "SAD"
      ? "M72 92 L90 86"
      : mood === "HAPPY"
        ? "M72 86 L90 90"
        : "M72 88 L90 88";
  const browRight =
    mood === "SAD"
      ? "M110 86 L128 92"
      : mood === "HAPPY"
        ? "M110 90 L128 86"
        : "M110 88 L128 88";

  return (
    <svg
      viewBox="0 0 200 220"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", className)}
      role="img"
      aria-label="MentorMind AI robot mascot"
    >
      <defs>
        <radialGradient id="mm-body-grad" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={HIGHLIGHT} />
          <stop offset="55%" stopColor={avatarColor} />
          <stop offset="100%" stopColor={DARK} />
        </radialGradient>
        <radialGradient id="mm-eye-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={WHITE} />
          <stop offset="60%" stopColor={GLOW} />
          <stop offset="100%" stopColor={avatarColor} stopOpacity="0.4" />
        </radialGradient>
        <filter id="mm-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* Antenna */}
      <g>
        <line x1="100" y1="28" x2="100" y2="12" stroke={avatarColor} strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="10" r="5" fill={GLOW} />
        <circle cx="100" cy="10" r="2.5" fill={WHITE} />
      </g>

      {/* Head */}
      <g>
        <rect
          x="40"
          y="30"
          width="120"
          height="120"
          rx="32"
          fill="url(#mm-body-grad)"
          stroke={DARK}
          strokeWidth="2"
        />
        {/* Cheek highlights */}
        <circle cx="58" cy="122" r="8" fill={HIGHLIGHT} opacity="0.4" filter="url(#mm-soft)" />
        <circle cx="142" cy="122" r="8" fill={HIGHLIGHT} opacity="0.4" filter="url(#mm-soft)" />

        {/* Eyebrows */}
        <path d={browLeft} stroke={DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d={browRight} stroke={DARK} strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Left eye */}
        {winking ? (
          <path d="M72 106 Q82 100 92 106" stroke={DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
        ) : (
          <g>
            <path d={leftEyePath} fill="url(#mm-eye-glow)" />
            <circle cx="82" cy="104" r="3" fill={DARK} />
            <circle cx="83" cy="102" r="1.2" fill={WHITE} />
          </g>
        )}

        {/* Right eye */}
        <g>
          <path d={rightEyePath} fill="url(#mm-eye-glow)" />
          <circle cx="118" cy="104" r="3" fill={DARK} />
          <circle cx="119" cy="102" r="1.2" fill={WHITE} />
        </g>

        {/* Mouth */}
        <path d={mouthPath} stroke={DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>

      {/* Neck */}
      <rect x="90" y="148" width="20" height="8" rx="2" fill={DARK} />

      {/* Body */}
      <g>
        <rect
          x="58"
          y="154"
          width="84"
          height="52"
          rx="18"
          fill="url(#mm-body-grad)"
          stroke={DARK}
          strokeWidth="2"
        />
        {/* Chest emblem */}
        <circle cx="100" cy="180" r="9" fill={DARK} />
        <circle cx="100" cy="180" r="6" fill={GLOW} />
        <circle cx="100" cy="180" r="2.5" fill={WHITE} />
      </g>

      {/* Left arm (static) */}
      <g>
        <rect x="40" y="162" width="16" height="32" rx="8" fill={avatarColor} stroke={DARK} strokeWidth="2" />
        <circle cx="48" cy="198" r="7" fill={HIGHLIGHT} stroke={DARK} strokeWidth="2" />
      </g>

      {/* Right arm (waving) */}
      <g style={{ transformOrigin: "152px 168px" }} className={waving ? "animate-[mentormind-wave_1.2s_ease-in-out_infinite]" : ""}>
        <g style={waving ? { transform: "rotate(-40deg)", transformOrigin: "152px 168px" } : undefined}>
          <rect x="144" y="162" width="16" height="32" rx="8" fill={avatarColor} stroke={DARK} strokeWidth="2" />
          <circle cx="152" cy="198" r="7" fill={HIGHLIGHT} stroke={DARK} strokeWidth="2" />
        </g>
      </g>
    </svg>
  );
}
