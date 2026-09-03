import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { RobotIntro } from "@/components/landing/RobotIntro";

const FEATURES = [
  {
    title: "Learns how you learn",
    description:
      "MentorMind builds a living profile of your level, goals, and exam timeline before it ever answers a question.",
  },
  {
    title: "Turns mistakes into lessons",
    description:
      "Every wrong answer is tracked, categorized, and fed back into your quizzes, hints, and explanations.",
  },
  {
    title: "Coaches, doesn't just answer",
    description:
      "Socratic teaching, staged hints, and adaptive quizzes keep you doing the thinking — so the learning sticks.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <RobotIntro>
      <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <img
            src="/mascot/mentormind-logo.png"
            alt=""
            aria-hidden="true"
            className="h-8 w-8 rounded-full"
          />
          <span>
            MentorMind <span className="text-[var(--brand)]">AI</span>
          </span>
        </span>
        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 text-center">
        <p className="mb-4 inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--brand)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand)_10%,white)] px-3 py-1 text-xs font-medium text-[var(--brand)]">
          Your personal AI study mentor
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Don&apos;t just ask AI.
          <span
            className="block bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, var(--brand), var(--accent))`,
            }}
          >
            Let AI understand how you learn.
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
          MentorMind AI transforms a generic AI assistant into a personalized study mentor that learns
          your strengths, identifies your weaknesses, tracks your progress, and adapts your learning
          journey.
        </p>

        {!user && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-hover)]"
            >
              Start your setup
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
            >
              I already have an account
            </Link>
          </div>
        )}

        <div className="mt-16 grid w-full gap-4 pb-16 text-left sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        MentorMind AI — a personalized intelligence layer that turns AI into an adaptive academic mentor.
      </footer>
    </div>
    </RobotIntro>
  );
}
