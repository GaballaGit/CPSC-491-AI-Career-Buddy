"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getCareerProfile,
  type CareerProfile,
} from "../../lib/careerProfile";
import { getProjects } from "../../lib/projects";
import { EXPERIENCE_LEVELS } from "../onboarding/options";
import type { ExperienceLevel } from "../onboarding/types";

function experienceLabel(
  value: ExperienceLevel,
): string {
  return (
    EXPERIENCE_LEVELS.find(
      (level) => level.value === value,
    )?.label ?? "Not set"
  );
}

export default function DashboardPage() {
  const [profile, setProfile] =
    useState<CareerProfile | null>(null);
  const [profileLoading, setProfileLoading] =
    useState(true);
  const [profileUnavailable, setProfileUnavailable] =
    useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setProfile(await getCareerProfile());
      } catch {
        setProfileUnavailable(true);
      } finally {
        setProfileLoading(false);
      }
    }

    void loadProfile();
  }, []);

  const profileStatus = profileLoading
    ? "Loading..."
    : profileUnavailable
      ? "Unavailable"
      : "Not set";

  const [projectCount, setProjectCount] =
    useState<number | null>(null);
  const [projectsLoading, setProjectsLoading] =
    useState(true);
  const [projectsUnavailable, setProjectsUnavailable] =
    useState(false);

  useEffect(() => {
    async function loadProjectCount() {
      try {
        const projects = await getProjects();
        setProjectCount(projects.length);
      } catch {
        setProjectsUnavailable(true);
      } finally {
        setProjectsLoading(false);
      }
    }

    void loadProjectCount();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 dark:bg-black">
      <main className="mx-auto w-full max-w-6xl">
        <section className="mb-10">
          <p className="text-sm font-medium text-zinc-500">
            Career Buddy
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Manage your career profile, portfolio projects,
            and career-readiness tools from one place.
          </p>
        </section>

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950">
            <p className="text-sm text-zinc-500">
              Target career
            </p>

            <p className="mt-2 text-lg font-semibold text-black dark:text-zinc-50">
              {profile?.target_career ?? profileStatus}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950">
            <p className="text-sm text-zinc-500">
              Experience level
            </p>

            <p className="mt-2 text-lg font-semibold text-black dark:text-zinc-50">
              {profile
                ? experienceLabel(profile.experience_level)
                : profileStatus}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950">
            <p className="text-sm text-zinc-500">
              Profile skills
            </p>

            <p className="mt-2 text-lg font-semibold text-black dark:text-zinc-50">
              {profile
                ? profile.skills.length
                : profileLoading || profileUnavailable
                  ? profileStatus
                  : 0}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950">
            <p className="text-sm text-zinc-500">
              Portfolio projects
            </p>

            <p className="mt-2 text-lg font-semibold text-black dark:text-zinc-50">
              {projectsLoading
                ? "Loading..."
                : projectsUnavailable
                  ? "Unavailable"
                  : (projectCount ?? 0)}
            </p>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article className="flex min-h-56 flex-col rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Career Profile
            </h2>

            {profile ? (
              <div className="mt-3 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                <p>
                  Target:{" "}
                  <span className="font-medium text-black dark:text-zinc-50">
                    {profile.target_career}
                  </span>
                </p>

                <p>
                  Experience:{" "}
                  <span className="font-medium text-black dark:text-zinc-50">
                    {experienceLabel(
                      profile.experience_level,
                    )}
                  </span>
                </p>

                <p>
                  Skills:{" "}
                  <span className="font-medium text-black dark:text-zinc-50">
                    {profile.skills.length}
                  </span>
                </p>
              </div>
            ) : (
              <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {profileLoading
                  ? "Loading your career profile..."
                  : profileUnavailable
                    ? "Career profile is currently unavailable."
                    : "Complete onboarding to create your career profile."}
              </p>
            )}

            <Link
              href={profile ? "/profile" : "/onboarding"}
              className="mt-6 inline-flex w-fit rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              {profile
                ? "View profile"
                : "Start onboarding"}
            </Link>
          </article>

          <article className="flex min-h-56 flex-col rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Portfolio Projects
            </h2>

            <div className="mt-3 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {projectsLoading ? (
                <p>Loading portfolio data...</p>
              ) : projectsUnavailable ? (
                <p>
                  Project data is currently unavailable.
                </p>
              ) : (
                <p>
                  You have{" "}
                  <span className="font-medium text-black dark:text-zinc-50">
                    {projectCount ?? 0}
                  </span>{" "}
                  saved{" "}
                  {(projectCount ?? 0) === 1
                    ? "project"
                    : "projects"}{" "}
                  in your portfolio.
                </p>
              )}
            </div>

            <Link
              href="/projects"
              className="mt-6 inline-flex w-fit rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              View projects
            </Link>
          </article>

          <article className="flex min-h-56 flex-col rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Add Project
            </h2>

            <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Add another project to your portfolio and
              document the skills you used.
            </p>

            <Link
              href="/projects/new"
              className="mt-6 inline-flex w-fit rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              Add project
            </Link>
          </article>

          <article className="flex min-h-56 flex-col rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Resume
            </h2>

            <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Resume analysis and career-readiness feedback
              will appear here.
            </p>

            <span className="mt-6 inline-flex w-fit rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              Coming soon
            </span>
          </article>

          <article className="flex min-h-56 flex-col rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Jobs
            </h2>

            <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Job matching and saved job opportunities will
              appear here.
            </p>

            <span className="mt-6 inline-flex w-fit rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              Coming soon
            </span>
          </article>

          <article className="flex min-h-56 flex-col rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Roadmap
            </h2>

            <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Your personalized career roadmap and progress
              will appear here.
            </p>

            <span className="mt-6 inline-flex w-fit rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              Coming soon
            </span>
          </article>
        </section>

        <section className="mt-10 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Quick start
          </h2>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Continue building your career profile or add
            another portfolio project.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-full border border-black/[.1] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              View profile
            </Link>

            <Link
              href="/projects"
              className="rounded-full border border-black/[.1] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              View portfolio
            </Link>

            <Link
              href="/projects/new"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              Add project
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}