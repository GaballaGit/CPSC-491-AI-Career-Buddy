"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ApiError,
  getCareerProfile,
  saveCareerProfile,
  SIGN_IN_URL,
  type CareerProfile,
} from "../../../lib/careerProfile";
import { getResumeSkills } from "../../../lib/resumeSkills";
import {
  EXPERIENCE_LEVELS,
  LEARNING_PREFERENCES,
} from "../../onboarding/options";
import { LIMITS, validateNewSkill, validateStep } from "../../onboarding/validation";
import type { LearningPreference, OnboardingFormData } from "../../onboarding/types";

type LoadState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; message: string }
  | { status: "no-profile" }
  | { status: "ready" };

type FieldKey =
  | "targetCareer"
  | "experienceLevel"
  | "skills"
  | "learningPreferences"
  | "weeklyAvailabilityHours";

const FIELD_STEPS: FieldKey[] = [
  "targetCareer",
  "experienceLevel",
  "skills",
  "learningPreferences",
  "weeklyAvailabilityHours",
];

function fromProfile(profile: CareerProfile): OnboardingFormData {
  return {
    targetCareer: profile.target_career,
    experienceLevel: profile.experience_level,
    skills: profile.skills,
    learningPreferences: profile.learning_preferences,
    weeklyAvailabilityHours: profile.weekly_availability_hours,
  };
}

function validateAll(
  data: OnboardingFormData,
): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  FIELD_STEPS.forEach((field, step) => {
    const error = validateStep(step, data);
    if (error) errors[field] = error;
  });
  return errors;
}

const primaryButton =
  "rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-40";
const secondaryButton =
  "rounded-full border border-black/[.08] px-5 py-2.5 text-sm font-medium text-black dark:border-white/[.145] dark:text-zinc-50";
const inputClass =
  "rounded-lg border border-black/[.08] bg-transparent px-4 py-2.5 text-black outline-none focus:border-foreground dark:border-white/[.145] dark:text-zinc-50";

function Message({
  text,
  children,
}: {
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-16 text-center dark:bg-black">
      <p className="text-zinc-600 dark:text-zinc-400">{text}</p>
      {children}
    </div>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [formData, setFormData] = useState<OnboardingFormData>({
    targetCareer: "",
    experienceLevel: "",
    skills: [],
    learningPreferences: [],
    weeklyAvailabilityHours: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldKey, string>>
  >({});
  const [skillInput, setSkillInput] = useState("");
  const [skillError, setSkillError] = useState<string | null>(null);
  const [resumeSkills, setResumeSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const profile = await getCareerProfile();
        if (cancelled) return;
        if (!profile) {
          setState({ status: "no-profile" });
          return;
        }
        setFormData(fromProfile(profile));
        setState({ status: "ready" });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          setState({ status: "signed-out" });
        } else {
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Something went wrong.",
          });
        }
      }
    }

    void load();
    void getResumeSkills().then((skills) => {
      if (!cancelled) setResumeSkills(skills);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function update(change: (prev: OnboardingFormData) => OnboardingFormData) {
    setFormData(change);
  }

  function addSkill(rawSkill: string) {
    const error = validateNewSkill(rawSkill, formData.skills);
    if (error) return error;
    update((prev) => ({ ...prev, skills: [...prev.skills, rawSkill.trim()] }));
    return null;
  }

  function handleAddSkillInput() {
    const error = addSkill(skillInput);
    if (error) {
      setSkillError(error);
      return;
    }
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

  function importAllResumeSkills() {
    update((prev) => {
      let skills = prev.skills;
      for (const skill of importableResumeSkills) {
        if (!validateNewSkill(skill, skills)) skills = [...skills, skill];
      }
      return { ...prev, skills };
    });
  }

  async function handleSubmit() {
    const errors = validateAll(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

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

  if (state.status === "loading") {
    return <Message text="Loading your career profile..." />;
  }

  if (state.status === "signed-out") {
    return (
      <Message text="Sign in to edit your career profile.">
        <a
          href={`${SIGN_IN_URL}?callbackUrl=/profile/edit`}
          className={primaryButton}
        >
          Sign in
        </a>
      </Message>
    );
  }

  if (state.status === "error") {
    return (
      <Message
        text={`Couldn't load your career profile. ${state.message}`}
      />
    );
  }

  if (state.status === "no-profile") {
    return (
      <Message text="You haven't onboarded yet, so there's nothing to edit.">
        <Link href="/onboarding" className={primaryButton}>
          Start onboarding
        </Link>
      </Message>
    );
  }

  const importableResumeSkills = resumeSkills.filter(
    (skill) => validateNewSkill(skill, formData.skills) === null,
  );

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-xl rounded-2xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Edit Career Profile
        </h1>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="targetCareer"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Target career
            </label>
            <input
              id="targetCareer"
              type="text"
              value={formData.targetCareer}
              maxLength={LIMITS.targetCareerMaxLength}
              aria-invalid={fieldErrors.targetCareer !== undefined}
              onChange={(e) =>
                update((prev) => ({ ...prev, targetCareer: e.target.value }))
              }
              className={inputClass}
            />
            {fieldErrors.targetCareer && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {fieldErrors.targetCareer}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Experience level
            </span>
            <div className="flex flex-col gap-2">
              {EXPERIENCE_LEVELS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 ${
                    formData.experienceLevel === value
                      ? "border-foreground"
                      : "border-black/[.08] dark:border-white/[.145]"
                  }`}
                >
                  <input
                    type="radio"
                    name="experienceLevel"
                    value={value}
                    checked={formData.experienceLevel === value}
                    onChange={() =>
                      update((prev) => ({ ...prev, experienceLevel: value }))
                    }
                  />
                  <span className="text-black dark:text-zinc-50">{label}</span>
                </label>
              ))}
            </div>
            {fieldErrors.experienceLevel && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {fieldErrors.experienceLevel}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <label
              htmlFor="skillInput"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Skills
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
                    handleAddSkillInput();
                  }
                }}
                placeholder="e.g. TypeScript"
                className={`flex-1 ${inputClass}`}
              />
              <button
                type="button"
                onClick={handleAddSkillInput}
                className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background"
              >
                Add
              </button>
            </div>
            {skillError && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {skillError}
              </p>
            )}
            {fieldErrors.skills && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {fieldErrors.skills}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 rounded-full bg-black/[.06] px-3 py-1 text-sm text-black dark:bg-white/[.08] dark:text-zinc-50"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                    className="text-zinc-500 hover:text-black dark:hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {importableResumeSkills.length > 0 && (
              <div className="mt-2 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    From your resume
                  </span>
                  <button
                    type="button"
                    onClick={importAllResumeSkills}
                    className="text-sm font-medium text-foreground underline"
                  >
                    Add all
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {importableResumeSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="rounded-full border border-black/[.08] px-3 py-1 text-sm text-black dark:border-white/[.145] dark:text-zinc-50"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Learning preferences
            </span>
            {LEARNING_PREFERENCES.map(({ value, label }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 ${
                  formData.learningPreferences.includes(value)
                    ? "border-foreground"
                    : "border-black/[.08] dark:border-white/[.145]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.learningPreferences.includes(value)}
                  onChange={() => toggleLearningPreference(value)}
                />
                <span className="text-black dark:text-zinc-50">{label}</span>
              </label>
            ))}
            {fieldErrors.learningPreferences && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {fieldErrors.learningPreferences}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="availability"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Weekly availability (hours)
            </label>
            <input
              id="availability"
              type="number"
              min={LIMITS.minWeeklyHours}
              max={LIMITS.maxWeeklyHours}
              step={1}
              value={formData.weeklyAvailabilityHours}
              aria-invalid={fieldErrors.weeklyAvailabilityHours !== undefined}
              onChange={(e) =>
                update((prev) => ({
                  ...prev,
                  weeklyAvailabilityHours:
                    e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
              className={inputClass}
            />
            {fieldErrors.weeklyAvailabilityHours && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {fieldErrors.weeklyAvailabilityHours}
              </p>
            )}
          </div>
        </div>

        {submitError && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          >
            {submitError.status === 401 ? (
              <p>
                You need to sign in to save changes.{" "}
                <a
                  href={SIGN_IN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  Sign in
                </a>{" "}
                in a new tab, then press Save changes again. Your edits are
                kept.
              </p>
            ) : (
              <>
                <p>Couldn&apos;t save your changes. {submitError.message}</p>
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
          <Link href="/profile" className={secondaryButton}>
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={primaryButton}
          >
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
