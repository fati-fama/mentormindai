import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { RobotIntro } from "@/components/landing/RobotIntro";
import { FloatingStudyItems } from "@/components/landing/FloatingStudyItems";
import { WhiteRobot } from "@/components/robot/WhiteRobot";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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
      <div className="relative flex min-h-screen flex-col">
        <FloatingStudyItems />

        {/* Nav */}
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <span className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink-strong">
            <img
              src="/mascot/mentormind-logo.png"
              alt=""
              aria-hidden="true"
              className="h-8 w-8 rounded-full"
            />
            <span>
              MentorMind <span className="text-brand">AI</span>
            </span>
          </span>
          <nav className="flex items-center gap-3 text-sm">
            <span className="hidden text-ink-muted sm:inline">Features</span>
            <span className="hidden text-ink-muted sm:inline">About</span>
            {user ? (
              <Link href="/dashboard">
                <Button variant="gradient" size="sm">
                  Go to dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 font-medium text-ink-muted transition-colors hover:text-ink"
                >
                  Sign in
                </Link>
                <Link href="/register">
                  <Button variant="gradient" size="sm">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </header>

        {/* Hero */}
        <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 text-center">
          <p className="mt-8 inline-flex items-center rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
            Your personal AI study mentor
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-ink-strong sm:text-5xl">
            Don&apos;t just ask AI.
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--grad-brand)" }}
            >
              Let AI understand how you learn.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted sm:text-lg sm:leading-8">
            Smarter Study &bull; Better Results &bull; Bigger Dreams
          </p>

          <div className="mt-6 h-64 w-64 sm:h-80 sm:w-80">
            <WhiteRobot mood="HAPPY" className="h-full w-full" />
          </div>

          {!user && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register">
                <Button variant="gradient" size="lg">
                  Start Your Journey &rarr;
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Watch Demo
                </Button>
              </Link>
            </div>
          )}

          {user && (
            <div className="mt-6">
              <Link href="/dashboard">
                <Button variant="gradient" size="lg">
                  Go to dashboard &rarr;
                </Button>
              </Link>
            </div>
          )}

          {/* Feature cards */}
          <div className="mt-16 grid w-full gap-4 pb-16 text-left sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} variant="glass" interactive>
                <h2 className="text-base font-semibold text-ink-strong">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{feature.description}</p>
              </Card>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-[var(--glass-border)] bg-[var(--glass)] py-6 text-center text-xs text-ink-faint backdrop-blur-[var(--glass-blur)]">
          MentorMind AI — a personalized intelligence layer that turns AI into an adaptive academic mentor.
        </footer>
      </div>
    </RobotIntro>
  );
}
