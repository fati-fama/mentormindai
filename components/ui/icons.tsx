import { cn } from "@/utils";

type IconProps = { className?: string; size?: number };

function Svg({ children, className, size = 20 }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(p: IconProps) {
  return <Svg {...p}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></Svg>;
}

export function MentorIcon(p: IconProps) {
  return <Svg {...p}><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></Svg>;
}

export function StudyPlanIcon(p: IconProps) {
  return <Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /></Svg>;
}

export function QuizIcon(p: IconProps) {
  return <Svg {...p}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></Svg>;
}

export function SubjectsIcon(p: IconProps) {
  return <Svg {...p}><path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" /></Svg>;
}

export function MistakesIcon(p: IconProps) {
  return <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></Svg>;
}

export function ProgressIcon(p: IconProps) {
  return <Svg {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></Svg>;
}

export function BooksIcon(p: IconProps) {
  return <Svg {...p}><path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" /><path d="M8 7h6" /><path d="M8 11h4" /></Svg>;
}

export function GamesIcon(p: IconProps) {
  return <Svg {...p}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 12h4" /><path d="M8 10v4" /><circle cx="17" cy="10" r="1" /><circle cx="15" cy="14" r="1" /></Svg>;
}

export function CommunityIcon(p: IconProps) {
  return <Svg {...p}><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></Svg>;
}

export function SettingsIcon(p: IconProps) {
  return <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></Svg>;
}

export function PlayIcon(p: IconProps) {
  return <Svg {...p}><polygon points="5,3 19,12 5,21" /></Svg>;
}

export function TargetIcon(p: IconProps) {
  return <Svg {...p}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></Svg>;
}

export function FlameIcon(p: IconProps) {
  return <Svg {...p}><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" /></Svg>;
}

export function ClockIcon(p: IconProps) {
  return <Svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></Svg>;
}

export function TrophyIcon(p: IconProps) {
  return <Svg {...p}><path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0012 0V2z" /></Svg>;
}

export function ChevronRightIcon(p: IconProps) {
  return <Svg {...p}><polyline points="9,6 15,12 9,18" /></Svg>;
}

export function MenuIcon(p: IconProps) {
  return <Svg {...p}><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></Svg>;
}

export function XIcon(p: IconProps) {
  return <Svg {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>;
}

export function LogOutIcon(p: IconProps) {
  return <Svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></Svg>;
}

export function SendIcon(p: IconProps) {
  return <Svg {...p}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" /></Svg>;
}

export function RobotIcon(p: IconProps) {
  return <Svg {...p}><rect x="5" y="8" width="14" height="12" rx="2" /><path d="M12 8V4" /><circle cx="12" cy="3" r="1" /><path d="M9 14h.01" /><path d="M15 14h.01" /><path d="M9 18h6" /><path d="M3 12h2" /><path d="M19 12h2" /></Svg>;
}

export function SearchIcon(p: IconProps) {
  return <Svg {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Svg>;
}

export function RefreshIcon(p: IconProps) {
  return <Svg {...p}><polyline points="23,4 23,10 17,10" /><polyline points="1,20 1,14 7,14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></Svg>;
}

export function HeartIcon(p: IconProps) {
  return <Svg {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></Svg>;
}
