"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { loadOnboardingLocally } from "../onboarding/storage";
import { EXPERIENCE_LEVELS, LEARNING_PREFERENCES } from "../onboarding/options";
import type {
  ExperienceLevel,
  LearningPreference,
} from "../onboarding/types";

function experienceLabel(value: ExperienceLevel | ""): string {
  return EXPERIENCE_LEVELS.find((level) => level.value === value)?.label ?? "";
}

function learningPreferenceLabel(value: LearningPreference): string {
  return LEARNING_PREFERENCES.find((pref) => pref.value === value)?.label ?? value;
}

function subscribeToNothing() {
  // localStorage never changes from outside this tab during a session.
  return () => {};
}

function getServerSnapshot() {
  return null;
}

export default function ProfilePage() {
  const profile = useSyncExternalStore(
    subscribeToNothing,
    loadOnboardingLocally,
    getServerSnapshot,
  );

  if (!profile) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-16 text-center dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">
          No career profile found yet.
        </p>
        <Link
          href="/onboarding"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
        >
          Start onboarding
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-xl rounded-2xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Your Career Profile
        </h1>
        {profile && (
          <dl className="flex flex-col gap-4 text-sm">
            <div>
              <dt className="font-medium text-zinc-500">Target Career</dt>
              <dd className="text-black dark:text-zinc-50">
                {profile.targetCareer}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Experience Level</dt>
              <dd className="text-black dark:text-zinc-50">
                {experienceLabel(profile.experienceLevel)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Skills</dt>
              <dd className="text-black dark:text-zinc-50">
                {profile.skills.join(", ")}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">
                Learning Preferences
              </dt>
              <dd className="text-black dark:text-zinc-50">
                {profile.learningPreferences.map(learningPreferenceLabel).join(", ")}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">
                Weekly Availability
              </dt>
              <dd className="text-black dark:text-zinc-50">
                {profile.weeklyAvailabilityHours} hours/week
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
