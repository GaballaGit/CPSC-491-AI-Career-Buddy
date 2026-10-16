"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  type CareerProfile,
  getCareerProfile,
  SIGN_IN_URL,
} from "../../lib/careerProfile";
import {
  EXPERIENCE_LEVELS,
  LEARNING_PREFERENCES,
  type ExperienceLevel,
  type LearningPreference,
} from "../../lib/careerProfileForm";

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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background px-6 py-16 text-center">
      <p className="text-muted">{text}</p>
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
            message: error instanceof Error
              ? error.message
              : "Something went wrong.",
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
    <div className="flex flex-1 flex-col items-center bg-background px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-line bg-card p-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
          Your Career Profile
        </h1>
        <dl className="flex flex-col gap-4 text-sm">
          <div>
            <dt className="font-medium text-muted">Target Career</dt>
            <dd className="text-foreground">
              {profile.target_career}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Experience Level</dt>
            <dd className="text-foreground">
              {experienceLabel(profile.experience_level)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Skills</dt>
            <dd className="text-foreground">
              {profile.skills.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Learning Preferences</dt>
            <dd className="text-foreground">
              {profile.learning_preferences
                .map(learningPreferenceLabel)
                .join(", ")}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Weekly Availability</dt>
            <dd className="text-foreground">
              {profile.weekly_availability_hours} hours/week
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex gap-3">
          <Link href="/profile/edit" className={primaryButton}>
            Edit Profile
          </Link>
          <Link
            href="/roadmap"
            className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-foreground"
          >
            View Roadmap
          </Link>
        </div>
      </div>
    </div>
  );
}
