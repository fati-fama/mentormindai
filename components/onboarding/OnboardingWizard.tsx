"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@/components/ui";
import { EDUCATION_LEVELS, TARGET_EXAMS, STUDY_TIME_OPTIONS } from "@/lib/schemas";
import type { SubjectOption } from "@/types";
import { cn } from "@/utils";

interface WizardData {
  name: string;
  educationLevel: string;
  targetExam: string;
  examDate: string;
  targetScore: string;
  dailyStudyMinutes: number | null;
  strengths: string[];
  weaknesses: string[];
}

const STEPS = [
  { title: "About you", description: "Let's start with the basics." },
  { title: "Your goal", description: "What are you preparing for?" },
  { title: "Your time", description: "How much can you study each day?" },
  { title: "Strengths & weaknesses", description: "Where do you shine, and where do you struggle?" },
  { title: "Review", description: "Confirm your mentor setup." },
] as const;

function formatStudyTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours}h ${rest}m`;
}

export function OnboardingWizard({ subjects }: { subjects: SubjectOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    name: "",
    educationLevel: "",
    targetExam: "",
    examDate: "",
    targetScore: "",
    dailyStudyMinutes: null,
    strengths: [],
    weaknesses: [],
  });
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((current) => ({ ...current, [key]: value }));
    setStepError(null);
  }

  function toggleAssessment(subjectId: string, assessment: "strength" | "weakness") {
    setStepError(null);
    setData((current) => {
      const strengths = current.strengths.filter((id) => id !== subjectId);
      const weaknesses = current.weaknesses.filter((id) => id !== subjectId);
      if (assessment === "strength") {
        return { ...current, strengths: [...strengths, subjectId], weaknesses };
      }
      return { ...current, strengths, weaknesses: [...weaknesses, subjectId] };
    });
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (data.name.trim().length < 2) return "Please enter your name (at least 2 characters).";
    }
    if (step === 1) {
      if (!data.educationLevel) return "Please select your education level.";
      if (!data.targetExam) return "Please select your target exam.";
      if (!data.examDate) return "Please choose your exam date.";
      const examDate = new Date(data.examDate);
      if (Number.isNaN(examDate.getTime())) return "Please enter a valid exam date.";
      if (examDate.getTime() <= Date.now()) return "Exam date must be in the future.";
      if (!data.targetScore.trim()) return "Please enter your target score.";
    }
    if (step === 2 && data.dailyStudyMinutes === null) {
      return "Please select how much time you can study each day.";
    }
    return null;
  }

  function handleNext() {
    const error = validateStep();
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStepError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          educationLevel: data.educationLevel,
          targetExam: data.targetExam,
          examDate: data.examDate,
          targetScore: data.targetScore,
          dailyStudyMinutes: data.dailyStudyMinutes,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error ?? "Could not save your profile. Please try again.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentStep = STEPS[step];

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {STEPS.map((s, index) => (
            <div
              key={s.title}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                index <= step ? "bg-indigo-600" : "bg-slate-200",
              )}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-indigo-600">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{currentStep.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{currentStep.description}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {stepError && (
          <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {stepError}
          </div>
        )}
        {submitError && (
          <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {submitError}
          </div>
        )}

        {step === 0 && (
          <Input
            label="What should your mentor call you?"
            name="name"
            placeholder="Your first name"
            autoFocus
            value={data.name}
            onChange={(event) => update("name", event.target.value)}
            hint="You can change this later."
          />
        )}

        {step === 1 && (
          <div className="space-y-5">
            <Select
              label="Education level"
              name="educationLevel"
              placeholder="Select your level"
              value={data.educationLevel}
              onChange={(event) => update("educationLevel", event.target.value)}
              options={EDUCATION_LEVELS.map((level) => ({ value: level, label: level }))}
            />
            <Select
              label="Target exam"
              name="targetExam"
              placeholder="Select your exam"
              value={data.targetExam}
              onChange={(event) => update("targetExam", event.target.value)}
              options={TARGET_EXAMS.map((exam) => ({ value: exam, label: exam }))}
            />
            <Input
              label="Exam date"
              name="examDate"
              type="date"
              value={data.examDate}
              onChange={(event) => update("examDate", event.target.value)}
              hint="Your mentor uses this to pace your study plan."
            />
            <Input
              label="Target score"
              name="targetScore"
              placeholder="e.g. 1500 / 1600"
              value={data.targetScore}
              onChange={(event) => update("targetScore", event.target.value)}
            />
          </div>
        )}

        {step === 2 && (
          <fieldset>
            <legend className="mb-4 text-sm font-medium text-slate-700">
              How much time can you dedicate to studying each day?
            </legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STUDY_TIME_OPTIONS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => update("dailyStudyMinutes", minutes)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                    data.dailyStudyMinutes === minutes
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50",
                  )}
                  aria-pressed={data.dailyStudyMinutes === minutes}
                >
                  {formatStudyTime(minutes)}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <div>
            <p className="mb-4 text-sm text-slate-600">
              For each subject, mark whether it&apos;s a strength or a weakness. Your mentor adapts
              explanations and quiz difficulty accordingly. Skip subjects you don&apos;t want to track.
            </p>
            {subjects.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No subjects are available yet. Run <code className="font-mono">npm run db:seed</code> to
                load the default subject catalog, then refresh this page.
              </div>
            ) : (
              <ul className="space-y-2">
                {subjects.map((subject) => {
                  const isStrength = data.strengths.includes(subject.id);
                  const isWeakness = data.weaknesses.includes(subject.id);
                  return (
                    <li
                      key={subject.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{subject.name}</p>
                        <p className="text-xs text-slate-500">{subject.topicCount} topics</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAssessment(subject.id, "strength")}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                            isStrength
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-300 bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-700",
                          )}
                          aria-pressed={isStrength}
                        >
                          Strength
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleAssessment(subject.id, "weakness")}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                            isWeakness
                              ? "border-rose-600 bg-rose-600 text-white"
                              : "border-slate-300 bg-white text-slate-600 hover:border-rose-500 hover:text-rose-700",
                          )}
                          aria-pressed={isWeakness}
                        >
                          Weakness
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {step === 4 && (
          <dl className="space-y-4">
            <div className="flex justify-between gap-4">
              <dt className="text-sm font-medium text-slate-500">Name</dt>
              <dd className="text-sm text-slate-900">{data.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm font-medium text-slate-500">Education level</dt>
              <dd className="text-sm text-slate-900">{data.educationLevel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm font-medium text-slate-500">Target exam</dt>
              <dd className="text-sm text-slate-900">
                {data.targetExam} — {data.targetScore}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm font-medium text-slate-500">Exam date</dt>
              <dd className="text-sm text-slate-900">{data.examDate}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm font-medium text-slate-500">Daily study time</dt>
              <dd className="text-sm text-slate-900">
                {data.dailyStudyMinutes !== null ? formatStudyTime(data.dailyStudyMinutes) : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm font-medium text-slate-500">Strengths</dt>
              <dd className="text-right text-sm text-emerald-700">
                {data.strengths.length > 0
                  ? data.strengths.map((id) => subjectById.get(id)?.name).join(", ")
                  : "None selected"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm font-medium text-slate-500">Weaknesses</dt>
              <dd className="text-right text-sm text-rose-700">
                {data.weaknesses.length > 0
                  ? data.weaknesses.map((id) => subjectById.get(id)?.name).join(", ")
                  : "None selected"}
              </dd>
            </div>
          </dl>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="secondary" onClick={handleBack} disabled={step === 0 || isSubmitting}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext}>Continue</Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={isSubmitting} loadingText="Setting up your mentor…">
              Finish setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
