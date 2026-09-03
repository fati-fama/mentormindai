import type { ReactNode } from "react";
import {
  DashboardIcon,
  MentorIcon,
  StudyPlanIcon,
  QuizIcon,
  SubjectsIcon,
  MistakesIcon,
  ProgressIcon,
  BooksIcon,
  GamesIcon,
  CommunityIcon,
  SettingsIcon,
} from "@/components/ui/icons";

export type NavStatus = "ready" | "readonly" | "soon";

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  status: NavStatus;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon />, status: "ready" },
  { label: "AI Mentor", href: "/dashboard/mentor", icon: <MentorIcon />, status: "ready" },
  { label: "Study Plan", href: "/dashboard/study-plan", icon: <StudyPlanIcon />, status: "ready" },
  { label: "Quizzes & Tests", href: "/dashboard/quizzes", icon: <QuizIcon />, status: "ready" },
  { label: "Subjects", href: "/dashboard/subjects", icon: <SubjectsIcon />, status: "readonly" },
  { label: "Mistake Bank", href: "/dashboard/mistakes", icon: <MistakesIcon />, status: "readonly" },
  { label: "Progress", href: "/dashboard/progress", icon: <ProgressIcon />, status: "readonly" },
  { label: "Book Library", href: "/dashboard/books", icon: <BooksIcon />, status: "ready" },
  { label: "Games", href: "/dashboard/games", icon: <GamesIcon />, status: "ready" },
  { label: "Community", href: "/dashboard/community", icon: <CommunityIcon />, status: "ready" },
  { label: "Settings", href: "/dashboard/settings", icon: <SettingsIcon />, status: "readonly" },
];
