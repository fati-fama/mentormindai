import { cn } from "@/utils";

export type WhiteRobotMood = "HAPPY" | "NEUTRAL" | "SAD";

type WhiteRobotProps = {
  mood?: WhiteRobotMood;
  className?: string;
  variant?: "full" | "face";
};

const WHITE = "#f0f0f5";
const WHITE_SHADE = "#d8d8e0";
const DARK = "#1a1a2e";
const CATCHLIGHT = "#ffffff";
const CHEEK = "#e8d5f5";

function getMouthPath(mood: WhiteRobotMood): string {
  if (mood === "HAPPY") return "M82 128 Q100 144 118 128";
  if (mood === "SAD") return "M84 136 Q100 124 116 136";
  return "M85 132 Q100 138 115 132";
}

function getEyeShape(mood: WhiteRobotMood, side: "left" | "right") {
  const cx = side === "left" ? 76 : 124;
  const cy = 98;

  if (mood === "HAPPY") {
    return { type: "happy" as const, cx, cy };
  }
  return { type: "normal" as const, cx, cy };
}

export function WhiteRobot({
  mood = "NEUTRAL",
  className,
  variant = "full",
}: WhiteRobotProps) {
  const mouthPath = getMouthPath(mood);
  const leftEye = getEyeShape(mood, "left");
  const rightEye = getEyeShape(mood, "right");

  if (variant === "face") {
    return (
      <svg
        viewBox="20 20 160 140"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("select-none", className)}
        role="img"
        aria-label="MentorMind AI robot face"
      >
        <defs>
          <radialGradient id="wr-head-f" cx="45%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor={WHITE} />
            <stop offset="100%" stopColor={WHITE_SHADE} />
          </radialGradient>
          <filter id="wr-shadow-f" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000020" />
          </filter>
        </defs>

        {/* Antenna */}
        <line x1="100" y1="42" x2="100" y2="24" stroke={WHITE_SHADE} strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="21" r="5.5" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />
        <circle cx="100" cy="21" r="2.5" fill="#C4B5FD" />

        {/* Head */}
        <rect x="38" y="42" width="124" height="110" rx="55" fill="url(#wr-head-f)" filter="url(#wr-shadow-f)" />

        {/* Ear bumps */}
        <circle cx="35" cy="97" r="10" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />
        <circle cx="165" cy="97" r="10" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />

        {/* Cheeks */}
        <circle cx="58" cy="118" r="8" fill={CHEEK} opacity="0.4" />
        <circle cx="142" cy="118" r="8" fill={CHEEK} opacity="0.4" />

        {/* Eyes */}
        {leftEye.type === "happy" ? (
          <path d={`M${leftEye.cx - 12} ${leftEye.cy} Q${leftEye.cx} ${leftEye.cy - 10} ${leftEye.cx + 12} ${leftEye.cy}`} stroke={DARK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        ) : (
          <g>
            <circle cx={leftEye.cx} cy={leftEye.cy} r="14" fill="white" stroke={WHITE_SHADE} strokeWidth="1" />
            <circle cx={leftEye.cx} cy={leftEye.cy} r="8" fill={DARK} />
            <circle cx={leftEye.cx + 3} cy={leftEye.cy - 3} r="3" fill={CATCHLIGHT} />
          </g>
        )}
        {rightEye.type === "happy" ? (
          <path d={`M${rightEye.cx - 12} ${rightEye.cy} Q${rightEye.cx} ${rightEye.cy - 10} ${rightEye.cx + 12} ${rightEye.cy}`} stroke={DARK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        ) : (
          <g>
            <circle cx={rightEye.cx} cy={rightEye.cy} r="14" fill="white" stroke={WHITE_SHADE} strokeWidth="1" />
            <circle cx={rightEye.cx} cy={rightEye.cy} r="8" fill={DARK} />
            <circle cx={rightEye.cx + 3} cy={rightEye.cy - 3} r="3" fill={CATCHLIGHT} />
          </g>
        )}

        {/* Mouth */}
        <path d={mouthPath} stroke={DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 200 260"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", className)}
      role="img"
      aria-label="MentorMind AI robot mascot"
    >
      <defs>
        <radialGradient id="wr-head" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor={WHITE} />
          <stop offset="100%" stopColor={WHITE_SHADE} />
        </radialGradient>
        <radialGradient id="wr-body" cx="50%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="80%" stopColor={WHITE} />
          <stop offset="100%" stopColor={WHITE_SHADE} />
        </radialGradient>
        <filter id="wr-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000020" />
        </filter>
      </defs>

      {/* Antenna */}
      <line x1="100" y1="42" x2="100" y2="22" stroke={WHITE_SHADE} strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="18" r="6" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />
      <circle cx="100" cy="18" r="3" fill="#C4B5FD" />

      {/* Head */}
      <rect x="38" y="42" width="124" height="110" rx="55" fill="url(#wr-head)" filter="url(#wr-shadow)" />

      {/* Ear bumps */}
      <circle cx="35" cy="97" r="10" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />
      <circle cx="165" cy="97" r="10" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />

      {/* Cheeks */}
      <circle cx="58" cy="118" r="8" fill={CHEEK} opacity="0.4" />
      <circle cx="142" cy="118" r="8" fill={CHEEK} opacity="0.4" />

      {/* Eyes */}
      {leftEye.type === "happy" ? (
        <path d={`M${leftEye.cx - 12} ${leftEye.cy} Q${leftEye.cx} ${leftEye.cy - 10} ${leftEye.cx + 12} ${leftEye.cy}`} stroke={DARK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      ) : (
        <g>
          <circle cx={leftEye.cx} cy={leftEye.cy} r="14" fill="white" stroke={WHITE_SHADE} strokeWidth="1" />
          <circle cx={leftEye.cx} cy={leftEye.cy} r="8" fill={DARK} />
          <circle cx={leftEye.cx + 3} cy={leftEye.cy - 3} r="3" fill={CATCHLIGHT} />
        </g>
      )}
      {rightEye.type === "happy" ? (
        <path d={`M${rightEye.cx - 12} ${rightEye.cy} Q${rightEye.cx} ${rightEye.cy - 10} ${rightEye.cx + 12} ${rightEye.cy}`} stroke={DARK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      ) : (
        <g>
          <circle cx={rightEye.cx} cy={rightEye.cy} r="14" fill="white" stroke={WHITE_SHADE} strokeWidth="1" />
          <circle cx={rightEye.cx} cy={rightEye.cy} r="8" fill={DARK} />
          <circle cx={rightEye.cx + 3} cy={rightEye.cy - 3} r="3" fill={CATCHLIGHT} />
        </g>
      )}

      {/* Mouth */}
      <path d={mouthPath} stroke={DARK} strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Neck */}
      <rect x="90" y="150" width="20" height="10" rx="4" fill={WHITE_SHADE} />

      {/* Body */}
      <rect x="58" y="158" width="84" height="56" rx="28" fill="url(#wr-body)" filter="url(#wr-shadow)" />

      {/* Left arm */}
      <rect x="38" y="166" width="18" height="32" rx="9" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />
      <circle cx="47" cy="202" r="7" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />

      {/* Right arm */}
      <rect x="144" y="166" width="18" height="32" rx="9" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />
      <circle cx="153" cy="202" r="7" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />

      {/* Left leg */}
      <rect x="72" y="212" width="16" height="24" rx="8" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />
      <rect x="68" y="232" width="24" height="12" rx="6" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />

      {/* Right leg */}
      <rect x="112" y="212" width="16" height="24" rx="8" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />
      <rect x="108" y="232" width="24" height="12" rx="6" fill={WHITE} stroke={WHITE_SHADE} strokeWidth="1.5" />
    </svg>
  );
}

export function WhiteRobotFace({
  mood = "NEUTRAL",
  className,
}: {
  mood?: WhiteRobotMood;
  className?: string;
}) {
  return <WhiteRobot mood={mood} className={className} variant="face" />;
}
