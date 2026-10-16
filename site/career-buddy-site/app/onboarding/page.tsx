"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  initialOnboardingFormData,
  type LearningPreference,
  type OnboardingFormData,
  EXPERIENCE_LEVELS,
  LEARNING_PREFERENCES,
  LIMITS,
  validateNewSkill,
  validateStep,
} from "../../lib/careerProfileForm";
import {
  ApiError,
  saveCareerProfile,
  SIGN_IN_URL,
} from "../../lib/careerProfile";

const STEPS = [
  "Target Career",
  "Experience",
  "Skills",
  "Learning Preferences",
  "Availability",
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>(
    initialOnboardingFormData,
  );
  const [skillInput, setSkillInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [skillError, setSkillError] = useState<string | null>(null);

  const isLastStep = step === STEPS.length - 1;

  function update(change: (prev: OnboardingFormData) => OnboardingFormData) {
    setFormData(change);
    setStepError(null);
  }

  function goNext() {
    const error = validateStep(step, formData);
    if (error) {
      setStepError(error);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function addSkill() {
    const error = validateNewSkill(skillInput, formData.skills);
    if (error) {
      setSkillError(error);
      return;
    }
    const skill = skillInput.trim();
    update((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
    setSkillInput("");
    setSkillError(null);
  }

  function removeSkill(skill: string) {
    update((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  }

  function toggleLearningPreference(pref: LearningPreference) {
    update((prev) => ({
      ...prev,
      learningPreferences: prev.learningPreferences.includes(pref)
        ? prev.learningPreferences.filter((p) => p !== pref)
        : [...prev.learningPreferences, pref],
    }));
  }

  async function handleSubmit() {
    // Re-check every step, not just the last one, before sending.
    const firstInvalid = STEPS.findIndex((_, i) => validateStep(i, formData));
    if (firstInvalid !== -1) {
      setStep(firstInvalid);
      setStepError(validateStep(firstInvalid, formData));
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await saveCareerProfile(formData);
      router.push("/profile");
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error
          : new ApiError("Something went wrong.", 0),
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-background px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-line bg-card p-8">
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                  i <= step
                    ? "bg-foreground text-background"
                    : "bg-accent-soft text-muted"
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 ${
                    i < step
                      ? "bg-foreground"
                      : "bg-line"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
          {STEPS[step]}
        </h1>

        {step === 0 && (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="targetCareer"
              className="text-sm font-medium text-foreground"
            >
              What career are you targeting?
            </label>
            <input
              id="targetCareer"
              type="text"
              value={formData.targetCareer}
              maxLength={LIMITS.targetCareerMaxLength}
              aria-invalid={stepError !== null}
              onChange={(e) =>
                update((prev) => ({
                  ...prev,
                  targetCareer: e.target.value,
                }))}
              placeholder="e.g. Frontend Engineer"
              className="rounded-lg border border-line bg-transparent px-4 py-2.5 text-foreground outline-none focus:border-accent"
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-foreground">
              What&apos;s your current experience level?
            </span>
            <div className="flex flex-col gap-2">
              {EXPERIENCE_LEVELS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 ${
                    formData.experienceLevel === value
                      ? "border-foreground"
                      : "border-line"
                  }`}
                >
                  <input
                    type="radio"
                    name="experienceLevel"
                    value={value}
                    checked={formData.experienceLevel === value}
                    onChange={() =>
                      update((prev) => ({
                        ...prev,
                        experienceLevel: value,
                      }))}
                  />
                  <span className="text-foreground">{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <label
              htmlFor="skillInput"
              className="text-sm font-medium text-foreground"
            >
              What skills do you already have?
            </label>
            <div className="flex gap-2">
              <input
                id="skillInput"
                type="text"
                value={skillInput}
                maxLength={LIMITS.skillMaxLength}
                aria-invalid={skillError !== null}
                onChange={(e) => {
                  setSkillInput(e.target.value);
                  setSkillError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="e.g. TypeScript"
                className="flex-1 rounded-lg border border-line bg-transparent px-4 py-2.5 text-foreground outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={addSkill}
                className="rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background"
              >
                Add
              </button>
            </div>
            {skillError && (
              <p
                role="alert"
                className="text-sm text-danger"
              >
                {skillError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm text-accent"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                    className="text-muted hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              How do you prefer to learn? (select all that apply)
            </span>
            {LEARNING_PREFERENCES.map(({ value, label }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 ${
                  formData.learningPreferences.includes(value)
                    ? "border-foreground"
                    : "border-line"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.learningPreferences.includes(value)}
                  onChange={() => toggleLearningPreference(value)}
                />
                <span className="text-foreground">{label}</span>
              </label>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="availability"
              className="text-sm font-medium text-foreground"
            >
              How many hours per week can you dedicate?
            </label>
            <input
              id="availability"
              type="number"
              min={LIMITS.minWeeklyHours}
              max={LIMITS.maxWeeklyHours}
              step={1}
              value={formData.weeklyAvailabilityHours}
              aria-invalid={stepError !== null}
              onChange={(e) =>
                update((prev) => ({
                  ...prev,
                  weeklyAvailabilityHours: e.target.value === ""
                    ? ""
                    : Number(e.target.value),
                }))}
              placeholder="e.g. 10"
              className="rounded-lg border border-line bg-transparent px-4 py-2.5 text-foreground outline-none focus:border-accent"
            />
          </div>
        )}

        {stepError && (
          <p
            role="alert"
            className="mt-3 text-sm text-danger"
          >
            {stepError}
          </p>
        )}

        {submitError && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            {submitError.status === 401
              ? (
                <p>
                  You need to sign in to save your profile.{" "}
                  <a
                    href={SIGN_IN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    Sign in
                  </a>{" "}
                  in a new tab, then press Finish again. Your answers are kept.
                </p>
              )
              : (
                <>
                  <p>Couldn&apos;t save your profile. {submitError.message}</p>
                  {submitError.details.length > 0 && (
                    <ul className="mt-1 list-disc pl-5">
                      {submitError.details.map((detail) => (
                        <li key={detail.field}>{detail.message}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-foreground disabled:opacity-40"
          >
            Back
          </button>
          {isLastStep
            ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-40"
              >
                {submitting ? "Submitting..." : "Finish"}
              </button>
            )
            : (
              <button
                type="button"
                onClick={goNext}
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-40"
              >
                Next
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
