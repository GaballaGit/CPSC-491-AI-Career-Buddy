"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  getCareerProfile,
  SIGN_IN_URL,
  type CareerProfile,
} from "../../lib/careerProfile";
import { EXPERIENCE_LEVELS, LEARNING_PREFERENCES } from "../onboarding/options";
import type { ExperienceLevel, LearningPreference } from "../onboarding/types";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; profile: CareerProfile | null }
  | { status: "signed-out" }
  | { status: "error"; message: string };

function experienceLabel(value: ExperienceLevel): string {
  return EXPERIENCE_LEVELS.find((level) => level.value === value)?.label ?? "";
}

function learningPreferenceLabel(value: LearningPreference): string {
  return (
    LEARNING_PREFERENCES.find((pref) => pref.value === value)?.label ?? value
  );
}

const primaryButton =
  "rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background";

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

export default function ProfilePage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const profile = await getCareerProfile();
        if (!cancelled) setState({ status: "loaded", profile });
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
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  if (state.status === "loading") {
    return <Message text="Loading your career profile..." />;
  }

  if (state.status === "signed-out") {
    return (
      <Message text="Sign in to see your career profile.">
        <a
          href={`${SIGN_IN_URL}?callbackUrl=/profile`}
          className={primaryButton}
        >
          Sign in
        </a>
      </Message>
    );
  }

  if (state.status === "error") {
    return (
      <Message text={`Couldn't load your career profile. ${state.message}`}>
        <button type="button" onClick={retry} className={primaryButton}>
          Try again
        </button>
      </Message>
    );
  }

  const { profile } = state;

  if (!profile) {
    return (
      <Message text="No career profile found yet.">
        <Link href="/onboarding" className={primaryButton}>
          Start onboarding
        </Link>
      </Message>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-xl rounded-2xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Your Career Profile
        </h1>
        <dl className="flex flex-col gap-4 text-sm">
          <div>
            <dt className="font-medium text-zinc-500">Target Career</dt>
            <dd className="text-black dark:text-zinc-50">
              {profile.target_career}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Experience Level</dt>
            <dd className="text-black dark:text-zinc-50">
              {experienceLabel(profile.experience_level)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Skills</dt>
            <dd className="text-black dark:text-zinc-50">
              {profile.skills.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Learning Preferences</dt>
            <dd className="text-black dark:text-zinc-50">
              {profile.learning_preferences
                .map(learningPreferenceLabel)
                .join(", ")}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Weekly Availability</dt>
            <dd className="text-black dark:text-zinc-50">
              {profile.weekly_availability_hours} hours/week
            </dd>
          </div>
        </dl>
        <Link href="/roadmap" className={`mt-6 inline-block ${primaryButton}`}>
          View Roadmap
        </Link>
      </div>
    </div>
  );
}
